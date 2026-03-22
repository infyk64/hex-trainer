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
