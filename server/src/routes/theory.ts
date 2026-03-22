import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/theory — все разделы (публичный)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM theory_sections ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

// PUT /api/theory/:id — редактирование (только преподаватель/админ)
router.put('/:id', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const result = await pool.query(
      `UPDATE theory_sections SET title = $1, content = $2, updated_by = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, content, req.user!.id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка обновления' }); }
});

// POST /api/theory — добавление раздела
router.post('/', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { slug, title, content, sortOrder } = req.body;
    const result = await pool.query(
      `INSERT INTO theory_sections (slug, title, content, sort_order, updated_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [slug, title, content, sortOrder || 99, req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

export default router;
