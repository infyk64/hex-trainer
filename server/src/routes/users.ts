import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();
router.use(authMiddleware, requireRole("admin"));

function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// GET /api/users — список пользователей
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, login, full_name, role, student_id, plain_password, created_at FROM users ORDER BY role, full_name`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/users — создание пользователя
router.post("/", async (req, res) => {
  try {
    const { fullName, role, studentId } = req.body;
    if (!fullName || !role)
      return res.status(400).json({ error: "Укажите ФИО и роль" });

    let login: string;
    let plainPassword: string;

    if (role === "student") {
      login = fullName;
      plainPassword = studentId || generatePassword();
    } else if (role === "teacher") {
      login = fullName;
      plainPassword = generatePassword();
    } else {
      login = fullName.toLowerCase().replace(/\s+/g, "_");
      plainPassword = generatePassword();
    }

    // Проверка уникальности логина
    const exists = await pool.query("SELECT id FROM users WHERE login = $1", [
      login,
    ]);
    if (exists.rows.length > 0)
      return res
        .status(400)
        .json({ error: "Пользователь с таким логином уже существует" });

    const hash = await bcrypt.hash(plainPassword, 10);
    const result = await pool.query(
      `INSERT INTO users (login, password_hash, plain_password, full_name, role, student_id)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, login, full_name, role, student_id, plain_password`,
      [login, hash, plainPassword, fullName, role, studentId || null],
    );

    res.json({ ...result.rows[0], generatedPassword: plainPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка создания" });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req, res) => {
  try {
    const { fullName, role, studentId, newPassword } = req.body;
    const { id } = req.params;

    let query =
      "UPDATE users SET full_name = $1, role = $2, student_id = $3, updated_at = NOW()";
    const params: any[] = [fullName, role, studentId || null];

    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      query +=
        ", password_hash = $4, plain_password = $5 WHERE id = $6 RETURNING id, login, full_name, role, student_id, plain_password";
      params.push(hash, newPassword, id);
    } else {
      query +=
        " WHERE id = $4 RETURNING id, login, full_name, role, student_id, plain_password";
      params.push(id);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Пользователь не найден" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка обновления" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "Удалён" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка удаления" });
  }
});

export default router;
