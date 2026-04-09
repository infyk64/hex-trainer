-- 002_lms.sql — Полная схема LMS

-- Удаляем старые таблицы (если есть)
DROP TABLE IF EXISTS attempt_answers CASCADE;
DROP TABLE IF EXISTS test_answers CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS test_assignments CASCADE;
DROP TABLE IF EXISTS test_questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS theory_sections CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS answer_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ═══════════════════════════════════════
-- ПОЛЬЗОВАТЕЛИ
-- ═══════════════════════════════════════
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plain_password  VARCHAR(100),
  full_name     VARCHAR(150) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin','teacher','student')),
  student_id    VARCHAR(50),              -- номер студенческого (для студентов)
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Админ по умолчанию (пароль: admin123 — bcrypt)
INSERT INTO users (login, password_hash, full_name, role)
VALUES ('admin', '$2b$10$YourHashHere', 'Администратор', 'admin');

-- ═══════════════════════════════════════
-- ГРУППЫ
-- ═══════════════════════════════════════
CREATE TABLE groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- ═══════════════════════════════════════
-- ТЕСТЫ
-- ═══════════════════════════════════════
CREATE TABLE tests (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  teacher_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  time_limit_min  INTEGER,            -- лимит в минутах (NULL = без лимита)
  max_attempts    INTEGER DEFAULT 1,  -- количество попыток
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_questions (
  id          SERIAL PRIMARY KEY,
  test_id     INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  mode        VARCHAR(30) NOT NULL,   -- hex-to-dec, addition и т.д.
  display     VARCHAR(200) NOT NULL,  -- текст задания
  correct     VARCHAR(200) NOT NULL,  -- правильный ответ
  options     JSONB NOT NULL,         -- [{id, label, isCorrect}]
  sort_order  INTEGER DEFAULT 0
);

-- Назначение теста группе
CREATE TABLE test_assignments (
  id          SERIAL PRIMARY KEY,
  test_id     INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(test_id, group_id)
);

-- Попытка прохождения теста
CREATE TABLE test_attempts (
  id          SERIAL PRIMARY KEY,
  test_id     INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  student_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score       INTEGER DEFAULT 0,
  total       INTEGER DEFAULT 0,
  started_at  TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Ответы на вопросы теста
CREATE TABLE test_answers (
  id          SERIAL PRIMARY KEY,
  attempt_id  INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES test_questions(id) ON DELETE CASCADE,
  answer      VARCHAR(200),
  is_correct  BOOLEAN NOT NULL
);

-- ═══════════════════════════════════════
-- ТЕОРИЯ (редактируемая преподавателем)
-- ═══════════════════════════════════════
CREATE TABLE theory_sections (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(50) UNIQUE NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  updated_by  INTEGER REFERENCES users(id),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Дефолтная теория
INSERT INTO theory_sections (slug, title, content, sort_order) VALUES
('intro',      'Шестнадцатеричная система счисления', 'Позиционная система счисления с основанием 16. Широко применяется в программировании для компактной записи двоичных данных.', 1),
('symbols',    'Символы системы',                     'Используются 16 символов: цифры 0–9 и буквы A–F. Буквы соответствуют числам 10–15.', 2),
('hex-to-dec', 'Перевод из 16 в 10 систему',          'Каждый разряд умножается на 16 в степени его позиции (справа налево с нуля), результаты складываются.', 3),
('hex-to-bin', 'Перевод из 16 в 2 систему',           'Каждый шестнадцатеричный символ заменяется тетрадой — группой из четырёх двоичных разрядов.', 4),
('hex-to-oct', 'Перевод из 16 в 8 систему',           'Используем двоичную систему как промежуточную — обе системы являются степенями двойки.', 5);

-- ═══════════════════════════════════════
-- ПОПЫТКИ ТРЕНАЖЁРА (свободная практика)
-- ═══════════════════════════════════════
CREATE TABLE attempts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  mode        VARCHAR(30) NOT NULL,
  display     VARCHAR(200) NOT NULL,
  correct     VARCHAR(200) NOT NULL,
  answer      VARCHAR(200) NOT NULL,
  is_correct  BOOLEAN NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- БАНК ВОПРОСОВ ПРЕПОДАВАТЕЛЯ
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS question_bank (
  id          SERIAL PRIMARY KEY,
  teacher_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mode        VARCHAR(30) NOT NULL DEFAULT 'open',
  display     VARCHAR(500) NOT NULL,
  correct     VARCHAR(200) NOT NULL,
  options     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMP DEFAULT NOW()
);
