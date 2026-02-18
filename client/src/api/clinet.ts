import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

export async function saveAttempt(data: {
  mode: string;
  display: string;
  correct: string;
  answer: string;
  isCorrect: boolean;
}) {
  const { data: result } = await api.post('/attempts', data);
  return result;
}