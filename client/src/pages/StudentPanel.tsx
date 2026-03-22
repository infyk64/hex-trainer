import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Test, TestAttempt } from "../types";

export function StudentPanel() {
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Record<number, TestAttempt[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    const { data } = await api.get("/tests");
    setTests(data);
    // Загружаем результаты для каждого теста
    for (const t of data) {
      const r = await api.get(`/tests/${t.id}/results`);
      setResults((prev) => ({ ...prev, [t.id]: r.data }));
    }
  };

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Мои курсы</h1>
        <p>Назначенные тесты и результаты.</p>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <div>Пока нет назначенных тестов</div>
        </div>
      ) : (
        tests.map((t) => {
          const myResults = results[t.id] || [];
          const bestScore =
            myResults.length > 0
              ? Math.max(...myResults.map((r) => r.score))
              : null;

          return (
            <div
              key={t.id}
              className="course-card"
              onClick={() => navigate(`/test/${t.id}`)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3>{t.title}</h3>
                  <p>
                    Преподаватель: {(t as any).teacher_name || "—"}
                    {" · "}
                    {t.time_limit_min
                      ? `⏱ ${t.time_limit_min} мин`
                      : "Без ограничения по времени"}
                    {" · "}Попытки: {myResults.length}/{t.max_attempts}
                  </p>
                </div>
                {bestScore !== null && (
                  <div
                    style={{
                      background:
                        bestScore > 0
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(239,68,68,0.1)",
                      color: bestScore > 0 ? "var(--green)" : "var(--red)",
                      padding: "6px 14px",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {bestScore}/{myResults[0]?.total}
                  </div>
                )}
              </div>
              {myResults.length > 0 && (
                <div
                  style={{ marginTop: 10, fontSize: 12, color: "var(--text2)" }}
                >
                  {myResults.map((r, i) => (
                    <span key={r.id} style={{ marginRight: 12 }}>
                      Попытка {i + 1}: {r.score}/{r.total}
                      {r.finished_at ? " ✓" : " (в процессе)"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
