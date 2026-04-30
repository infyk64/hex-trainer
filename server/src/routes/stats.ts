import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_correct)::int AS correct,
        ROUND(COUNT(*) FILTER (WHERE is_correct)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS success_rate
      FROM attempts WHERE user_id = $1
    `, [userId]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

router.get('/by-mode', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(`
      SELECT
        mode,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_correct)::int AS correct,
        ROUND(COUNT(*) FILTER (WHERE is_correct)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS success_rate
      FROM attempts 
      WHERE user_id = $1
      GROUP BY mode
      ORDER BY mode
    `, [userId]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

export default router;
