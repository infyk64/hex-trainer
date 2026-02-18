import type { HistoryItem } from '../types';

interface Props {
  history: HistoryItem[];
}

export function Stats({ history }: Props) {
  const total   = history.length;
  const correct = history.filter(h => h.isCorrect).length;
  const pct     = total > 0 ? Math.round(correct / total * 100) : 0;

  return (
    <div className="page-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Всего заданий</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{correct}</div>
          <div className="stat-label">Правильных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent3)' }}>{pct}%</div>
          <div className="stat-label">Успешность</div>
        </div>
      </div>

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
          <span>Задание</span>
          <span>Правильный</span>
          <span>Твой ответ</span>
          <span>Режим</span>
        </div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <div>История пуста — реши несколько заданий!</div>
          </div>
        ) : (
          history.map((h, i) => (
            <div key={i} className="history-row">
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                {h.display.split('=')[0].trim()}
              </span>
              <span>{h.correct}</span>
              <span className={h.isCorrect ? 'mark-correct' : 'mark-wrong'}>
                {h.answer}
              </span>
              <span>{h.mode}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}