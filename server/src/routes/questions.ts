import { Router } from 'express';
import { generateQuestion } from '../services/hexService';

const router = Router();

router.get('/generate', (req, res) => {
  const mode = (req.query.mode as string) || 'random';
  const question = generateQuestion(mode);
  res.json(question);
});

export default router;
