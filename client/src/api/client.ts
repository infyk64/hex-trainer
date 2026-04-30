import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Добавляем токен из localStorage при старте
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

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

export async function getStats() {
  const { data } = await api.get('/stats');
  return data;
}

export async function getStatsByMode() {
  const { data } = await api.get('/stats/by-mode');
  return data;
}
