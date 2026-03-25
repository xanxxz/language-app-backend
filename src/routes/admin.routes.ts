// routes/admin.routes.ts
import { Router } from 'express';
import { pool } from '../db/client';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/* =========================
   📘 CREATE LESSON
========================= */
router.post('/admin/lessons', authMiddleware, async (req, res) => {
  try {
    const { title, language_code, locked } = req.body;

    // берём максимальный order для этого языка
    const orderRes = await pool.query(
      `
      SELECT COALESCE(MAX("order"), 0) + 1 as next_order
      FROM lessons
      WHERE language_code = $1
      `,
      [language_code]
    );

    const nextOrder = orderRes.rows[0].next_order;

    const result = await pool.query(
      `
      INSERT INTO lessons (title, "order", language_code, locked)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [title, nextOrder, language_code, locked ?? true]
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Error creating lesson' });
  }
});

/* =========================
   🧠 CREATE STEP
========================= */
router.post('/admin/steps', authMiddleware, async (req, res) => {
  try {
    const {
      lesson_id,
      type,
      word,
      translation,
      question,
      correct_answer,
    } = req.body;

    // берём следующий order внутри урока
    const orderRes = await pool.query(
      `
      SELECT COALESCE(MAX("order"), 0) + 1 as next_order
      FROM steps
      WHERE lesson_id = $1
      `,
      [lesson_id]
    );

    const nextOrder = orderRes.rows[0].next_order;

    const result = await pool.query(
      `
      INSERT INTO steps (
        lesson_id,
        type,
        word,
        translation,
        question,
        correct_answer,
        "order"
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        lesson_id,
        type,
        word || null,
        translation || null,
        question || null,
        correct_answer || null,
        nextOrder,
      ]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Error creating step' });
  }
});
/* =========================
   🔘 CREATE OPTIONS
========================= */
router.post('/admin/options', authMiddleware, async (req, res) => {
  try {
    const { step_id, options } = req.body;

    if (!step_id || !options?.length) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const values = options
      .map((opt: string, i: number) => `($1, $${i + 2})`)
      .join(',');

    const flatValues = [step_id, ...options];

    await pool.query(
      `
      INSERT INTO quiz_options (step_id, text)
      VALUES ${values}
      `,
      flatValues
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Error creating options' });
  }
});

router.post('/admin/full-lesson', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { title, language_code, locked, steps } = req.body;

    await client.query('BEGIN');

    // 1. создаём урок (с авто order)
    const orderRes = await client.query(
      `
      SELECT COALESCE(MAX("order"), 0) + 1 as next_order
      FROM lessons
      WHERE language_code = $1
      `,
      [language_code]
    );

    const lessonRes = await client.query(
      `
      INSERT INTO lessons (title, "order", language_code, locked)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        title,
        orderRes.rows[0].next_order,
        language_code,
        locked ?? true,
      ]
    );

    const lesson = lessonRes.rows[0];

    // 2. создаём шаги
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      const stepRes = await client.query(
        `
        INSERT INTO steps (
          lesson_id,
          type,
          word,
          translation,
          question,
          correct_answer,
          "order"
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          lesson.id,
          step.type,
          step.word || null,
          step.translation || null,
          step.question || null,
          step.correct_answer || null,
          i + 1, // авто порядок
        ]
      );

      const createdStep = stepRes.rows[0];

      // 3. если quiz → создаём options
      if (step.type === 'quiz' && step.options?.length) {
        for (const opt of step.options) {
          await client.query(
            `
            INSERT INTO quiz_options (step_id, text)
            VALUES ($1, $2)
            `,
            [createdStep.id, opt]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.json({ success: true, lesson });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating full lesson' });
  } finally {
    client.release();
  }
});

router.delete('/admin/lessons/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. удалить options
    await client.query(
      `
      DELETE FROM options
      WHERE step_id IN (
        SELECT id FROM steps WHERE lesson_id = $1
      )
      `,
      [id]
    );

    // 2. удалить steps
    await client.query(
      'DELETE FROM steps WHERE lesson_id = $1',
      [id]
    );

    // 3. удалить lesson
    await client.query(
      'DELETE FROM lessons WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted with all relations',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('DELETE lesson error:', error);

    return res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;