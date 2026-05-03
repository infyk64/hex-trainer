import { Router } from "express";
import { pool } from "../db/pool";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();
router.use(authMiddleware, requireRole("admin"));

// GET /api/admin/stats — агрегированная статистика для карточек
router.get("/stats", async (_req, res) => {
  try {
    const usersRes = await pool.query("SELECT COUNT(*)::int AS total FROM users");
    const testsRes = await pool.query("SELECT COUNT(*)::int AS total FROM tests");
    const attemptsRes = await pool.query(`
      SELECT
        ROUND(AVG(score::numeric / NULLIF(total, 0) * 100))::int AS avg_success
      FROM test_attempts
      WHERE finished_at IS NOT NULL AND total > 0
    `);
    res.json({
      totalUsers: usersRes.rows[0].total,
      totalTests: testsRes.rows[0].total,
      avgSuccess: attemptsRes.rows[0].avg_success ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка" });
  }
});

export default router;
