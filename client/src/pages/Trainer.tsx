import { useState } from 'react';
import { ModeSelector } from '../components/ModeSelector';
import { AnswerOptions } from '../components/AnswerOptions';
import { Solution }      from '../components/Solution';
import { fetchQuestion, buildSolution } from '../api/trainer';
import type { Mode, Question, HistoryItem, SolutionStep } from '../types';

const MODE_LABELS: Record<Mode, string> = {
  'hex-to-dec':     '16 → 10',
  'hex-to-oct':     '16 → 8',
  'hex-to-bin':     '16 → 2',
  'addition':       'Сложение',
  'subtraction':    'Вычитание',
  'multiplication': 'Умножение',
  'random':         'Случайные',
};

interface Props {
  onAttempt: (item: HistoryItem) => void;
}

export function Trainer({ onAttempt }: Props) {
  const [mode, setMode]           = useState<Mode>('hex-to-dec');
  const [question, setQuestion]   = useState<Question | null>(null);
  const [selected, setSelected]   = useState<number | null>(null);
  const [checked, setChecked]     = useState(false);
  const [solution, setSolution]   = useState<SolutionStep[]>([]);
  const [score, setScore]         = useState({ correct: 0, wrong: 0 });

  const loadQuestion = async () => {
    const q = await fetchQuestion(mode);
    setQuestion(q);
    setSelected(null);
    setChecked(false);
    setSolution([]);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setQuestion(null);
    setSelected(null);
    setChecked(false);
    setSolution([]);
  };

  const checkAnswer = () => {
    if (!question || selected === null) return;

    const selectedOpt = question.options.find(o => o.id === selected);
    const isCorrect = selectedOpt?.isCorrect ?? false;

    const steps = buildSolution(question).map((desc, i) => ({
      step: i + 1,
      description: desc,
      value: '',
    }));

    setSolution(steps);
    setChecked(true);
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong:   s.wrong   + (isCorrect ? 0 : 1),
    }));

    onAttempt({
      display:   question.display,
      correct:   question.correct,
      answer:    selectedOpt?.label ?? '',
      isCorrect,
      mode:      MODE_LABELS[question.mode],
    });
  };

  const isCorrectAnswer = checked && question?.options
    .filter(o => o.isCorrect)
    .every(o => o.id === selected || question.options.find(x => x.id === selected)?.isCorrect);

  return (
    <div className="page-container">
      <div className="trainer-header">
        <h1>Тренажёр</h1>
        <div className="score-badge">
          <span>✓ <span className="good">{score.correct}</span></span>
          <span>✗ <span className="bad">{score.wrong}</span></span>
        </div>
      </div>

      <ModeSelector mode={mode} onChange={handleModeChange} />

      <div className="question-card">
        <div className="question-label">
          {question ? MODE_LABELS[question.mode] : 'Выбери режим и начни'}
        </div>
        <div className="question-value">
          {question ? question.display.split('=')[0].trim() : '—'}
        </div>
        <div className="question-hint">
          {question ? question.display : 'Нажми «Новое задание»'}
        </div>
      </div>

      {question && (
        <AnswerOptions
          options={question.options}
          selected={selected}
          onChange={setSelected}
          disabled={checked}
        />
      )}

      {checked && (
        <div className={`result-bar ${
          question?.options.find(o => o.id === selected)?.isCorrect
            ? 'correct' : 'wrong'
        }`}>
          {question?.options.find(o => o.id === selected)?.isCorrect
            ? '✓ Верно!'
            : `✗ Неверно. Правильный ответ: ${question?.correct}`
          }
        </div>
      )}

      {checked && solution.length > 0 && (
        <Solution steps={solution} />
      )}

      {!checked ? (
        <button
          className="btn-primary"
          onClick={question ? checkAnswer : loadQuestion}
          disabled={question !== null && selected === null}
        >
          {question ? 'Проверить' : 'Новое задание'}
        </button>
      ) : (
        <button className="btn-primary" onClick={loadQuestion}>
          Следующее →
        </button>
      )}
    </div>
  );
}