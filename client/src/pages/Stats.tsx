import { useEffect, useState } from 'react';
import type { HistoryItem } from '../types';
import { getStats, getStatsByMode } from '../api/client';

interface StatsData {
  total: number;
  correct: number;
  success_rate: number;
}

interface ModeStats {
  mode: string;
  total: number;
  correct: number;
  success_rate: number;
}

interface Props { history: HistoryItem[]; }

const MODE_LABELS: Record<string, string> = {
  'hex-to-dec': 'Hex → Dec',
  'hex-to-oct': 'Hex → Oct',
  'hex-to-bin': 'Hex → Bin',
  'addition': 'Сложение',
  'subtraction': 'Вычитание',
  'multiplication': 'Умножение',
  'random': 'Случайный',
};

export function Stats({ history }: Props) {
  const [overallStats, setOverallStats] = useState<StatsData | null>(null);
  const [modeStats, setModeStats] = useState<ModeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getStatsByMode()])
      .then(([overall, byMode]) => {
        setOverallStats(overall);
        setModeStats(byMode);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = history.length;
  const correct = history.filter(h => h.isCorrect).length;
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;

  if (loading) {
    return (
      <div className="page-container">
        <div>Загрузка статистики...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: '24px' }}>Статистика тренажёра</h1>
      
      {/* Общая статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{overallStats?.total ?? total}</div>
          <div className="stat-label">Всего заданий</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{overallStats?.correct ?? correct}</div>
          <div className="stat-label">Правильных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent3)' }}>{overallStats?.success_rate ?? pct}%</div>
          <div className="stat-label">Успешность</div>
        </div>
      </div>

      {/* Статистика по режимам */}
      {modeStats.length > 0 && (
        <div className="section-card" style={{ marginTop: '20px' }}>
          <h2>По режимам</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {modeStats.map((stat) => (
              <div key={stat.mode} style={{ 
                padding: '12px', 
                background: 'var(--bg2)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
                  {MODE_LABELS[stat.mode] || stat.mode}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent)' }}>
                  {stat.success_rate}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                  {stat.correct} / {stat.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-card">
        <h2>Прогресс</h2>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
          Правильных: {correct} из {total}
        </div>
        <div className="progress-bar-outer">
          <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="history-table">
        <div className="history-header">
          <span>Задание</span><span>Правильный</span><span>Твой ответ</span><span>Режим</span>
        </div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}></div>
            <div>История пуста — реши несколько заданий!</div>
          </div>
        ) : (
          history.map((h, i) => (
            <div key={i} className="history-row">
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{h.display.split('=')[0].trim()}</span>
              <span>{h.correct}</span>
              <span className={h.isCorrect ? 'mark-correct' : 'mark-wrong'}>{h.answer}</span>
              <span>{MODE_LABELS[h.mode] || h.mode}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
