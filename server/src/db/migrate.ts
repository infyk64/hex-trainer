import { pool } from './pool';

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        username   VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attempts (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id),
        mode        VARCHAR(30) NOT NULL,
        display     VARCHAR(100) NOT NULL,
        correct     VARCHAR(100) NOT NULL,
        answer      VARCHAR(100) NOT NULL,
        is_correct  BOOLEAN NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Таблицы созданы');
  } catch (err) {
    console.error('❌ Ошибка миграции:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();