import { pool } from './db/client';

async function seed() {
  try {
    console.log('🌱 Seeding started...');

    // -------------------------
    // LANGUAGES
    // -------------------------
    await pool.query(`
      INSERT INTO languages (code, label)
      VALUES 
      ('en', 'English'),
      ('es', 'Spanish')
      ON CONFLICT (code) DO NOTHING;
    `);

    // -------------------------
    // LESSONS (EN)
    // -------------------------
    const enLessons = [
      'Greetings',
      'Basics',
      'Food',
      'Phrases',
    ];

    const enLessonIds: number[] = [];

    for (let i = 0; i < enLessons.length; i++) {
      const res = await pool.query(
        `
        INSERT INTO lessons (title, "order", locked, language_code)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [enLessons[i], i + 1, false, 'en']
      );

      enLessonIds.push(res.rows[0].id);
    }

    // -------------------------
    // LESSON 1 EN
    // -------------------------
    const lesson1 = enLessonIds[0];

    const steps1 = [
      ['flashcard', 'Hello', 'Привет'],
      ['flashcard', 'Hi', 'Привет'],
      ['flashcard', 'Good morning', 'Доброе утро'],
    ];

    for (let i = 0; i < steps1.length; i++) {
      await pool.query(
        `
        INSERT INTO steps (lesson_id, type, word, translation, "order")
        VALUES ($1, $2, $3, $4, $5)
        `,
        [lesson1, steps1[i][0], steps1[i][1], steps1[i][2], i + 1]
      );
    }

    // quiz step
    const quiz1 = await pool.query(
      `
      INSERT INTO steps (lesson_id, type, question, correct_answer, "order")
      VALUES ($1, 'quiz', $2, $3, $4)
      RETURNING id
      `,
      [lesson1, 'Как сказать "Привет"?', 'Hello', 4]
    );

    const quizStep1 = quiz1.rows[0].id;

    await pool.query(
      `INSERT INTO quiz_options (step_id, text) VALUES ($1, $2), ($1, $3), ($1, $4)`,
      [quizStep1, 'Hello', 'Bye', 'Thanks']
    );

    // -------------------------
    // LESSON 2 EN
    // -------------------------
    const lesson2 = enLessonIds[1];

    const steps2 = [
      ['flashcard', 'Yes', 'Да'],
      ['flashcard', 'No', 'Нет'],
      ['flashcard', 'Please', 'Пожалуйста'],
    ];

    for (let i = 0; i < steps2.length; i++) {
      await pool.query(
        `
        INSERT INTO steps (lesson_id, type, word, translation, "order")
        VALUES ($1, $2, $3, $4, $5)
        `,
        [lesson2, steps2[i][0], steps2[i][1], steps2[i][2], i + 1]
      );
    }

    const quiz2 = await pool.query(
      `
      INSERT INTO steps (lesson_id, type, question, correct_answer, "order")
      VALUES ($1, 'quiz', $2, $3, $4)
      RETURNING id
      `,
      [lesson2, 'Как сказать "Пожалуйста"?', 'Please', 4]
    );

    const quizStep2 = quiz2.rows[0].id;

    await pool.query(
      `INSERT INTO quiz_options (step_id, text) VALUES ($1, $2), ($1, $3), ($1, $4)`,
      [quizStep2, 'Please', 'Thanks', 'Hello']
    );

    // -------------------------
    // LESSONS (ES)
    // -------------------------
    const esLessons = [
      'Saludos',
      'Básico',
      'Comida',
      'Frases',
    ];

    const esLessonIds: number[] = [];

    for (let i = 0; i < esLessons.length; i++) {
      const res = await pool.query(
        `
        INSERT INTO lessons (title, "order", locked, language_code)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [esLessons[i], i + 1, false, 'es']
      );

      esLessonIds.push(res.rows[0].id);
    }

    // -------------------------
    // LESSON 1 ES
    // -------------------------
    const esLesson1 = esLessonIds[0];

    await pool.query(
      `
      INSERT INTO steps (lesson_id, type, word, translation, "order")
      VALUES
      ($1, 'flashcard', 'Hola', 'Привет', 1),
      ($1, 'flashcard', 'Adiós', 'Пока', 2),
      ($1, 'flashcard', 'Buenos días', 'Доброе утро', 3)
      `,
      [esLesson1]
    );

    const esQuiz1 = await pool.query(
      `
      INSERT INTO steps (lesson_id, type, question, correct_answer, "order")
      VALUES ($1, 'quiz', $2, $3, $4)
      RETURNING id
      `,
      [esLesson1, 'Как сказать "Привет"?', 'Hola', 4]
    );

    const esQuizStep1 = esQuiz1.rows[0].id;

    await pool.query(
      `INSERT INTO quiz_options (step_id, text) VALUES ($1, $2), ($1, $3), ($1, $4)`,
      [esQuizStep1, 'Hola', 'Adiós', 'Gracias']
    );

    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();