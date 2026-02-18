import { Router } from 'express';
import { generateQuestion } from '../services/hexService';

const router = Router();

router.get('/generate', (req, res) => {
  const mode = (req.query.mode as string) || 'random';
  console.log(`📥 Запрос: mode=${mode}`);
  const question = generateQuestion(mode);
  res.json(question);
});

export default router;