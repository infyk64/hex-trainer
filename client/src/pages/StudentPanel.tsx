import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Test, TestAttempt } from "../types";

export function StudentPanel() {
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Record<number, TestAttempt[]>>({});
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTests = async () => {
    const { data } = await api.get("/tests");
    setTests(data as Test[]);
    const allResults: Record<number, TestAttempt[]> = {};
    for (const t of data as Test[]) {
      const r = await api.get(`/tests/${t.id}/results`);
      allResults[t.id] = r.data as TestAttempt[];
    }
    setResults(allResults);
  };

  const allAttempts = tests.flatMap(t =>
    (results[t.id] || []).map(r => ({ ...r, testTitle: t.title }))
  ).filter(r => r.finished_at);

  const totalTests = tests.length;
  const completedAttempts = allAttempts.length;
  const totalScore = allAttempts.reduce((sum, r) => sum + r.score, 0);
  const totalPossible = allAttempts.reduce((sum, r) => sum + r.total, 0);
  const avgPercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Мои курсы</h1>
        <p>Назначенные тесты и результаты.</p>
      </div>

      {completedAttempts > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            className={`mode-btn ${showStats ? "active" : ""}`}
            onClick={() => setShowStats(v => !v)}
          >
             {showStats ? "Скрыть статистику" : "Полная статистика по тестам"}
          </button>
        </div>
      )}

      {showStats && (
        <div className="section-card" style={{ marginBottom: 20 }}>
          <h2>Статистика по всем тестам</h2>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {(
              [
                { label: "Назначено тестов", value: String(totalTests) },
                { label: "Пройдено попыток", value: String(completedAttempts) },
                { label: "Средний результат", value: `${avgPercent}%` },
                { label: "Баллов набрано", value: `${totalScore} / ${totalPossible}` },
              ] as { label: string; value: string }[]
            ).map(s => (
              <div
                key={s.label}
                style={{
                  background: "var(--bg2)",
                  borderRadius: 10,
                  padding: "12px 20px",
                  flex: "1 1 130px",
                  minWidth: 120,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: "var(--mono)",
                    color: "var(--accent)",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {tests.map(t => {
            const myResults = results[t.id] || [];
            if (myResults.length === 0) return null;
            const best = Math.max(...myResults.map(r => r.score));
            const bestTotal = (myResults.find(r => r.score === best) ?? myResults[0]).total;
            const bestPct = bestTotal > 0 ? Math.round((best / bestTotal) * 100) : 0;
            return (
              <div
                key={t.id}
                style={{ marginBottom: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ fontSize: 15 }}>{t.title}</strong>
                  <span
                    style={{
                      background:
                        bestPct >= 70 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: bestPct >= 70 ? "var(--green)" : "var(--red)",
                      padding: "4px 12px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Лучший: {best}/{bestTotal} ({bestPct}%)
                  </span>
                </div>
                {myResults.map((r, i) => {
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  return (
                    <div
                      key={r.id}
                      style={{
                        fontSize: 13,
                        padding: "5px 8px",
                        background: "var(--bg2)",
                        borderRadius: 6,
                        marginBottom: 4,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "var(--text2)" }}>
                        Попытка {i + 1}
                        {r.finished_at
                          ? ` · ${new Date(r.finished_at).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : " · в процессе"}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontFamily: "var(--mono)",
                          color: pct >= 70 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {r.score}/{r.total} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <div>Пока нет назначенных тестов</div>
        </div>
      ) : (
        tests.map(t => {
          const myResults = results[t.id] || [];
          const bestScore =
            myResults.length > 0 ? Math.max(...myResults.map(r => r.score)) : null;
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
                    Преподаватель: {(t as Test & { teacher_name?: string }).teacher_name ?? "—"}
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
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text2)" }}>
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
