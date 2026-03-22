import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { pool } from './pool';

dotenv.config();

async function migrate() {
  const client = await pool.connect();

  try {
    const sqlPath = path.join(__dirname, 'migrations', '002_lms.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(sql);
    console.log('✅ Таблицы созданы');

    const adminHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `UPDATE users SET password_hash = $1 WHERE login = 'admin'`,
      [adminHash]
    );
    console.log('✅ Админ создан (login: admin, password: admin123)');
  } catch (err) {
    console.error('❌ Ошибка миграции:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
