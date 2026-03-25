import { Router } from 'express';
import { pool } from '../db/client';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/* =========================
   📘 LESSONS
========================= */

// получить все уроки пользователя по языку
router.get('/lessons', authMiddleware, async (req, res) => {
  const userId = req.user!.id;

  const result = await pool.query(
    `
    SELECT 
      l.id,
      l.title,
      l."order",
      l.locked,
      l.language_code,

      COALESCE(p.progress, 0) as progress,
      COALESCE(p.completed, false) as completed

    FROM lessons l
    LEFT JOIN user_progress p
      ON p.lesson_id = l.id AND p.user_id = $1

    WHERE l.language_code = (
      SELECT language_code FROM users WHERE id = $1
    )

    ORDER BY l."order"
    `,
    [userId]
  );

  res.json(result.rows);
});

/* =========================
   🧩 STEPS
========================= */

// получить шаги урока
router.get('/lessons/:lessonId/steps', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM steps
      WHERE lesson_id = $1
      ORDER BY "order"
      `,
      [lessonId]
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Ошибка шагов' });
  }
});

/* =========================
   🔘 OPTIONS
========================= */

// получить варианты ответа
router.get('/steps/:stepId/options', authMiddleware, async (req, res) => {
  try {
    const { stepId } = req.params;

    const result = await pool.query(
      `SELECT * FROM quiz_options WHERE step_id = $1`,
      [stepId]
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Ошибка вариантов' });
  }
});

/* =========================
   🧠 CHECK ANSWER
========================= */

router.post('/steps/:stepId/check', authMiddleware, async (req, res) => {
  try {
    const { stepId } = req.params;
    const { answer } = req.body;

    const step = await pool.query(
      `SELECT * FROM steps WHERE id = $1`,
      [stepId]
    );

    const correct = step.rows[0].correct_answer === answer;

    // можно сразу начислить XP
    if (correct) {
      await pool.query(
        `UPDATE user_stats SET xp = xp + 10 WHERE user_id = $1`,
        [req.user!.id]
      );
    }

    res.json({ correct });
  } catch {
    res.status(500).json({ message: 'Ошибка проверки' });
  }
});

/* =========================
   📊 PROGRESS
========================= */

router.post('/progress', authMiddleware, async (req, res) => {
  try {
    const user = req.user!;
    const { lesson_id, progress, completed } = req.body;

    const result = await pool.query(
      `
      INSERT INTO user_progress (user_id, lesson_id, progress, completed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET progress = EXCLUDED.progress,
                    completed = EXCLUDED.completed
      RETURNING *
      `,
      [user.id, lesson_id, progress, completed]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Ошибка прогресса' });
  }
});

router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const progress = await pool.query(
      `SELECT * FROM user_progress WHERE user_id = $1`,
      [userId]
    );

    const stats = await pool.query(
      `SELECT xp, streak FROM user_stats WHERE user_id = $1`,
      [userId]
    );

    res.json({
      lessons: progress.rows,
      stats: stats.rows[0] || { xp: 0, streak: 0 },
    });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка получения прогресса' });
  }
});

export default router;