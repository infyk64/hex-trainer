import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { buildSolution } from "../api/trainer";
import type { TestQuestion, Question } from "../types";

interface TestDetail {
  id: number;
  title: string;
  time_limit_min: number | null;
  max_attempts: number;
}

interface AttemptDetail {
  display: string;
  mode: string;
  correct: string;
  answer: string;
  is_correct: boolean;
  options: { id: number; label: string }[];
}

export function TestTake() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null,
  );
  const [details, setDetails] = useState<AttemptDetail[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const handleSubmit = useCallback(async () => {
    if (!attemptId) return;
    clearInterval(timerRef.current);
    const ansArray = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));
    const { data } = await api.post(`/tests/${testId}/submit`, {
      attemptId,
      answers: ansArray,
    });
    setResult(data as { score: number; total: number });
    setSubmitted(true);
    const det = await api.get(`/tests/attempt/${attemptId}/details`);
    setDetails(det.data as AttemptDetail[]);
  }, [attemptId, answers, questions, testId]);

  const loadTest = useCallback(async () => {
    const { data } = await api.get(`/tests/${testId}`);
    setTest(data as TestDetail);
  }, [testId]);

  useEffect(() => {
    loadTest();
    return () => clearInterval(timerRef.current);
  }, [loadTest]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, handleSubmit]);

  const startTest = async () => {
    try {
      const { data } = await api.post(`/tests/${testId}/start`);
      const d = data as { attempt: { id: number }; questions: TestQuestion[] };
      setAttemptId(d.attempt.id);
      setQuestions(d.questions);
      if (test?.time_limit_min) setTimeLeft(test.time_limit_min * 60);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setStartError(e.response?.data?.error ?? "Не удалось начать тест");
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!test)
    return (
      <div className="page-container">
        <p>Загрузка...</p>
      </div>
    );

  if (startError) {
    return (
      <div className="page-container">
        <div className="theory-hero">
          <h1>{test.title}</h1>
        </div>
        <div
          className="section-card"
          style={{ textAlign: "center", padding: "40px 24px" }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {startError}
          </div>
          <div
            style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}
          >
            Обратитесь к преподавателю, чтобы он увеличил количество попыток.
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate("/student")}
          >
            ← К моим курсам
          </button>
        </div>
      </div>
    );
  }

  if (!attemptId && !submitted) {
    return (
      <div className="page-container">
        <div className="theory-hero">
          <h1>{test.title}</h1>
          <p>
            {test.time_limit_min
              ? `Время: ${test.time_limit_min} мин`
              : "Без ограничения по времени"}
            {" · "}Попытки: {test.max_attempts}
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ maxWidth: 300 }}
          onClick={startTest}
        >
          Начать тест
        </button>
        <button
          className="btn-secondary"
          style={{ maxWidth: 300 }}
          onClick={() => navigate("/student")}
        >
          ← Назад
        </button>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="page-container">
        <div className="theory-hero">
          <h1>
            Результат: {result.score} / {result.total}
          </h1>
          <p>
            {result.score === result.total
              ? "Отлично! Всё верно!"
              : "Посмотри подробное решение ниже."}
          </p>
        </div>
        {details.map((d, i) => {
          const fakeQ: Question = {
            id: i,
            display: d.display,
            mode: d.mode as Question["mode"],
            correct: d.correct,
            options: d.options,
          };
          const steps = buildSolution(fakeQ);
          return (
            <div key={i} className="section-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <code style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
                  {d.display}
                </code>
                <span
                  style={{
                    color: d.is_correct ? "var(--green)" : "var(--red)",
                    fontWeight: 700,
                  }}
                >
                  {d.is_correct ? "✓ Верно" : "✗ Неверно"}
                </span>
              </div>
              {!d.is_correct && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text2)",
                    marginBottom: 8,
                  }}
                >
                  Твой ответ:{" "}
                  <span style={{ color: "var(--red)" }}>{d.answer}</span> ·
                  Правильный:{" "}
                  <span style={{ color: "var(--green)" }}>{d.correct}</span>
                </div>
              )}
              {steps.length > 0 && (
                <div className="solution-block">
                  <div className="sol-title">Решение</div>
                  {steps.map((s, j) => (
                    <div key={j} className="sol-step">
                      <span>
                        {j + 1}. {s}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <button className="btn-secondary" onClick={() => navigate("/student")}>
          ← К моим курсам
        </button>
      </div>
    );
  }

  const q = questions[currentIdx];
  const opts: { id: number; label: string }[] =
    typeof q?.options === "string"
      ? (JSON.parse(q.options) as { id: number; label: string }[])
      : (q?.options ?? []);

  return (
    <div className="page-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text2)" }}>
          Вопрос {currentIdx + 1} из {questions.length}
        </span>
        {timeLeft !== null && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 16,
              fontWeight: 700,
              color: timeLeft < 60 ? "var(--red)" : "var(--accent)",
            }}
          >
            ⏱ {formatTime(timeLeft)}
          </span>
        )}
      </div>

      <div className="question-card">
        <div className="question-label">{q?.mode}</div>
        <div className="question-value">
          {q?.display?.split("=")[0]?.trim()}
        </div>
        <div className="question-hint">{q?.display}</div>
      </div>

      {opts.length === 0 ? (
        <div style={{ marginBottom: 16 }}>
          <input
            className="form-input"
            style={{
              fontSize: 18,
              fontFamily: "var(--mono)",
              textAlign: "center",
            }}
            placeholder="Введите ваш ответ..."
            value={answers[q.id] ?? ""}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
            autoFocus
          />
        </div>
      ) : (
        <div className="options-grid">
          {opts.map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${answers[q.id] === opt.label ? "selected" : ""}`}
              onClick={() => handleAnswer(q.id, opt.label)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {currentIdx > 0 && (
          <button
            className="btn-secondary"
            onClick={() => setCurrentIdx((i) => i - 1)}
          >
            ← Назад
          </button>
        )}
        {currentIdx < questions.length - 1 ? (
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            Далее →
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={handleSubmit}
          >
            Завершить тест
          </button>
        )}
      </div>
    </div>
  );
}
