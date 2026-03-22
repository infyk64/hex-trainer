import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware, requireRole('teacher', 'admin'));

router.get('/', async (req, res) => {
  try {
    const teacherId = req.user!.role === 'admin' ? null : req.user!.id;
    const query = teacherId
      ? 'SELECT * FROM groups WHERE teacher_id = $1 ORDER BY name'
      : 'SELECT * FROM groups ORDER BY name';
    const params = teacherId ? [teacherId] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO groups (name, teacher_id) VALUES ($1, $2) RETURNING *',
      [name, req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка создания' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
    res.json({ message: 'Удалена' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

// Участники группы
router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.login, gm.joined_at
       FROM group_members gm JOIN users u ON u.id = gm.student_id
       WHERE gm.group_id = $1 ORDER BY u.full_name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

router.post('/:id/members', async (req, res) => {
  try {
    const { studentId } = req.body;
    await pool.query(
      'INSERT INTO group_members (group_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, studentId]
    );
    res.json({ message: 'Добавлен' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

router.delete('/:groupId/members/:studentId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND student_id = $2',
      [req.params.groupId, req.params.studentId]
    );
    res.json({ message: 'Удалён' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

// Список студентов (для добавления в группу)
router.get('/students/all', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, login FROM users WHERE role = 'student' ORDER BY full_name`
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Ошибка' }); }
});

export default router;
