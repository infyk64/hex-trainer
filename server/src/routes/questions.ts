import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, requireRole } from '../middleware/auth';
import { generateQuestion } from '../services/hexService';

const router = Router();

// GET /api/questions/generate (old endpoint kept)
router.get('/generate', (req, res) => {
  const mode = (req.query.mode as string) || 'random';
  const question = generateQuestion(mode);
  res.json(question);
});

// GET /api/questions — все вопросы преподавателя из банка
router.get('/', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM question_bank WHERE teacher_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

// POST /api/questions — добавить вопрос в банк
router.post('/', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { display, correct, mode, options } = req.body;
    const result = await pool.query(
      `INSERT INTO question_bank (teacher_id, display, correct, mode, options)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.id, display, correct, mode, JSON.stringify(options || [])]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания вопроса' });
  }
});

// PUT /api/questions/:id
router.put('/:id', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { display, correct, mode, options } = req.body;
    const result = await pool.query(
      `UPDATE question_bank SET display=$1, correct=$2, mode=$3, options=$4
       WHERE id=$5 AND teacher_id=$6 RETURNING *`,
      [display, correct, mode, JSON.stringify(options || []), req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найдено' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM question_bank WHERE id=$1 AND teacher_id=$2', [req.params.id, req.user!.id]);
    res.json({ message: 'Удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

export default router;
