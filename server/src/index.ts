import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import questionsRouter from './routes/questions';
import attemptsRouter from './routes/attempts';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import groupsRouter from './routes/groups';
import testsRouter from './routes/tests';
import theoryRouter from './routes/theory';
import statsRouter from './routes/stats';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Роуты
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/theory', theoryRouter);
app.use('/api/stats', statsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/attempts', attemptsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running 🟢' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
