import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { mode, display, correct, answer, isCorrect } = req.body;
    const result = await pool.query(
      `INSERT INTO attempts (user_id, mode, display, correct, answer, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user!.id, mode, display, correct, answer, isCorrect]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка сохранения попытки:', err);
    res.status(500).json({ error: 'Не удалось сохранить' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

export default router;
