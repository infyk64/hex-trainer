import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { userId, mode, display, correct, answer, isCorrect } = req.body;

    const result = await pool.query(
      `INSERT INTO attempts (user_id, mode, display, correct, answer, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId || null, mode, display, correct, answer, isCorrect]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка сохранения попытки:', err);
    res.status(500).json({ error: 'Не удалось сохранить попытку' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM attempts ORDER BY created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения истории:', err);
    res.status(500).json({ error: 'Не удалось получить историю' });
  }
});

export default router;