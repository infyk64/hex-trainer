import axios from 'axios';
import type { Mode, Question, SolutionStep } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function fetchQuestion(mode: Mode): Promise<Question> {
  const { data } = await api.get<Question>(`/questions/generate?mode=${mode}`);
  return data;
}

// buildSolution остаётся на клиенте
export function buildSolution(q: Question): string[] {
  const hex = q.display.split('(16)')[0].trim();

  if (q.mode === 'hex-to-dec') {
    const digits = hex.split('');
    const steps = [`Разложение: ${digits.map((d, i) =>
      `${parseInt(d,16)}·16^${digits.length-1-i}`).join(' + ')}`];
    let sum = 0;
    digits.forEach((d, i) => {
      const val = parseInt(d, 16) * Math.pow(16, digits.length - 1 - i);
      sum += val;
      steps.push(`${parseInt(d,16)} × ${Math.pow(16, digits.length-1-i)} = ${val}`);
    });
    steps.push(`Итого: ${sum}(10)`);
    return steps;
  }

  if (q.mode === 'hex-to-bin') {
    const steps = ['Заменяем каждый символ тетрадой (4 бита):'];
    hex.split('').forEach(c => {
      steps.push(`${c} → ${parseInt(c,16).toString(2).padStart(4,'0')}`);
    });
    steps.push(`Результат: ${q.correct}(2)`);
    return steps;
  }

  if (q.mode === 'hex-to-oct') {
    const n = parseInt(hex, 16);
    const bin = n.toString(2);
    const padded = bin.padStart(Math.ceil(bin.length / 3) * 3, '0');
    const triads = padded.match(/.{3}/g) || [];
    return [
      `Шаг 1: ${hex}(16) → двоичный: ${bin}(2)`,
      `Шаг 2: Дополняем до кратности 3: ${padded}`,
      `Шаг 3: Группируем по 3: ${triads.join(' | ')}`,
      `Шаг 4: ${triads.map(t => `${t}→${parseInt(t,2)}`).join(', ')}`,
      `Результат: ${q.correct}(8)`,
    ];
  }

  if (q.mode === 'addition') {
    const [hexA, hexB] = q.display.replace(' = ?(16)', '').split(' + ');
    const a = parseInt(hexA, 16);
    const b = parseInt(hexB, 16);
    return [
      `${hexA}(16) = ${a}(10)`,
      `${hexB}(16) = ${b}(10)`,
      `${a} + ${b} = ${a + b}(10)`,
      `${a + b}(10) = ${q.correct}(16)`,
    ];
  }

  if (q.mode === 'subtraction') {
    const [hexA, hexB] = q.display.replace(' = ?(16)', '').split(' − ');
    const a = parseInt(hexA, 16);
    const b = parseInt(hexB, 16);
    return [
      `${hexA}(16) = ${a}(10)`,
      `${hexB}(16) = ${b}(10)`,
      `${a} − ${b} = ${a - b}(10)`,
      `${a - b}(10) = ${q.correct}(16)`,
    ];
  }

  if (q.mode === 'multiplication') {
    const [hexA, hexB] = q.display.replace(' = ?(16)', '').split(' × ');
    const a = parseInt(hexA, 16);
    const b = parseInt(hexB, 16);
    return [
      `${hexA}(16) = ${a}(10)`,
      `${hexB}(16) = ${b}(10)`,
      `${a} × ${b} = ${a * b}(10)`,
      `${a * b}(10) = ${q.correct}(16)`,
    ];
  }

  return [];
}