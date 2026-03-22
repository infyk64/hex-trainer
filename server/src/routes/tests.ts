import { Router } from "express";
import { pool } from "../db/pool";
import { authMiddleware, requireRole } from "../middleware/auth";
import { generateQuestion } from "../services/hexService";

const router = Router();

// === TEACHER: создание/управление тестами ===
router.post("/", authMiddleware, requireRole("teacher"), async (req, res) => {
  try {
    const { title, timeLimitMin, maxAttempts, questions, groupIds } = req.body;

    const testResult = await pool.query(
      `INSERT INTO tests (title, teacher_id, time_limit_min, max_attempts)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, req.user!.id, timeLimitMin || null, maxAttempts || 1],
    );
    const testId = testResult.rows[0].id;

    // Добавляем вопросы
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await pool.query(
          `INSERT INTO test_questions (test_id, mode, display, correct, options, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [testId, q.mode, q.display, q.correct, JSON.stringify(q.options), i],
        );
      }
    }

    // Назначаем группам
    if (groupIds && groupIds.length > 0) {
      for (const gId of groupIds) {
        await pool.query(
          "INSERT INTO test_assignments (test_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [testId, gId],
        );
      }
    }

    res.json(testResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка создания теста" });
  }
});

// GET /api/tests — тесты преподавателя
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query: string;
    let params: any[];

    if (req.user!.role === "teacher") {
      query =
        "SELECT * FROM tests WHERE teacher_id = $1 ORDER BY created_at DESC";
      params = [req.user!.id];
    } else if (req.user!.role === "student") {
      // Тесты, назначенные группам студента
      query = `SELECT DISTINCT t.*, ta.assigned_at, u.full_name as teacher_name
         FROM tests t
         JOIN test_assignments ta ON ta.test_id = t.id
         JOIN group_members gm ON gm.group_id = ta.group_id
         JOIN users u ON u.id = t.teacher_id
         WHERE gm.student_id = $1
         ORDER BY ta.assigned_at DESC`;
      params = [req.user!.id];
    } else {
      query = "SELECT * FROM tests ORDER BY created_at DESC";
      params = [];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/tests/:id — детали теста с вопросами
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const test = await pool.query("SELECT * FROM tests WHERE id = $1", [
      req.params.id,
    ]);
    if (test.rows.length === 0)
      return res.status(404).json({ error: "Тест не найден" });

    const questions = await pool.query(
      "SELECT * FROM test_questions WHERE test_id = $1 ORDER BY sort_order",
      [req.params.id],
    );

    const assignments = await pool.query(
      `SELECT g.id, g.name FROM test_assignments ta JOIN groups g ON g.id = ta.group_id WHERE ta.test_id = $1`,
      [req.params.id],
    );

    res.json({
      ...test.rows[0],
      questions: questions.rows,
      groups: assignments.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// DELETE /api/tests/:id
router.delete(
  "/:id",
  authMiddleware,
  requireRole("teacher", "admin"),
  async (req, res) => {
    try {
      await pool.query("DELETE FROM tests WHERE id = $1", [req.params.id]);
      res.json({ message: "Удалён" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка" });
    }
  },
);

// POST /api/tests/generate-question — генерация вопроса для теста
router.post(
  "/generate-question",
  authMiddleware,
  requireRole("teacher"),
  (req, res) => {
    const { mode } = req.body;
    const question = generateQuestion(mode || "random");
    res.json(question);
  },
);

// === STUDENT: прохождение тестов ===

// POST /api/tests/:id/start
router.post(
  "/:id/start",
  authMiddleware,
  requireRole("student"),
  async (req, res) => {
    try {
      const testId = req.params.id;
      const studentId = req.user!.id;

      // Проверяем кол-во попыток
      const test = await pool.query(
        "SELECT max_attempts FROM tests WHERE id = $1",
        [testId],
      );
      if (test.rows.length === 0)
        return res.status(404).json({ error: "Тест не найден" });

      const attemptsCount = await pool.query(
        "SELECT COUNT(*) FROM test_attempts WHERE test_id = $1 AND student_id = $2",
        [testId, studentId],
      );
      if (parseInt(attemptsCount.rows[0].count) >= test.rows[0].max_attempts) {
        return res.status(400).json({ error: "Исчерпаны все попытки" });
      }

      // Получаем вопросы
      const questions = await pool.query(
        "SELECT id, mode, display, correct, options FROM test_questions WHERE test_id = $1 ORDER BY sort_order",
        [testId],
      );

      // Создаём попытку
      const attempt = await pool.query(
        `INSERT INTO test_attempts (test_id, student_id, total) VALUES ($1, $2, $3) RETURNING *`,
        [testId, studentId, questions.rows.length],
      );

      res.json({ attempt: attempt.rows[0], questions: questions.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка" });
    }
  },
);

// POST /api/tests/:id/submit
router.post(
  "/:id/submit",
  authMiddleware,
  requireRole("student"),
  async (req, res) => {
    try {
      const { attemptId, answers } = req.body;
      // answers: [{questionId, answer}]

      let score = 0;
      for (const a of answers) {
        const q = await pool.query(
          "SELECT correct FROM test_questions WHERE id = $1",
          [a.questionId],
        );
        const isCorrect = q.rows[0]?.correct === a.answer;
        if (isCorrect) score++;

        await pool.query(
          `INSERT INTO test_answers (attempt_id, question_id, answer, is_correct) VALUES ($1, $2, $3, $4)`,
          [attemptId, a.questionId, a.answer, isCorrect],
        );
      }

      await pool.query(
        "UPDATE test_attempts SET score = $1, finished_at = NOW() WHERE id = $2",
        [score, attemptId],
      );

      res.json({ score, total: answers.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка" });
    }
  },
);

// GET /api/tests/:id/results — результаты студента
router.get("/:id/results", authMiddleware, async (req, res) => {
  try {
    const testId = req.params.id;
    let query: string;
    let params: any[];

    if (req.user!.role === "student") {
      query = `SELECT ta.*, u.full_name FROM test_attempts ta
               JOIN users u ON u.id = ta.student_id
               WHERE ta.test_id = $1 AND ta.student_id = $2
               ORDER BY ta.started_at DESC`;
      params = [testId, req.user!.id];
    } else {
      query = `SELECT ta.*, u.full_name FROM test_attempts ta
               JOIN users u ON u.id = ta.student_id
               WHERE ta.test_id = $1
               ORDER BY u.full_name, ta.started_at DESC`;
      params = [testId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/tests/attempt/:attemptId/details — подробное решение
router.get("/attempt/:attemptId/details", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ta.answer, ta.is_correct, tq.display, tq.correct, tq.mode, tq.options
       FROM test_answers ta
       JOIN test_questions tq ON tq.id = ta.question_id
       WHERE ta.attempt_id = $1
       ORDER BY tq.sort_order`,
      [req.params.attemptId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

export default router;
