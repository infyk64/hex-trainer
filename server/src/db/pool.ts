import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'hex_trainer',
  user:     process.env.DB_USER     || 'hex_user',
  password: process.env.DB_PASSWORD || 'hex_password',
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL подключён');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err.message);
});