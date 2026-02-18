const TETRAD_MAP = [
  '0→0000','1→0001','2→0010','3→0011',
  '4→0100','5→0101','6→0110','7→0111',
  '8→1000','9→1001','A→1010','B→1011',
  'C→1100','D→1101','E→1110','F→1111',
];

const STEPS = [
  { icon: '📖', title: 'Шаг 1 — Теория',      text: 'Изучи вкладку «Теория»: символы 16СС и алгоритмы перевода.' },
  { icon: '🎯', title: 'Шаг 2 — Тренажёр',    text: 'Выбери режим задания и нажми «Новое задание».' },
  { icon: '✅', title: 'Шаг 3 — Ответ',        text: 'Выбери правильный вариант. После ответа увидишь пошаговое решение.' },
  { icon: '📊', title: 'Шаг 4 — Статистика',  text: 'Отслеживай прогресс во вкладке «Статистика».' },
];

export function Instructions() {
  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Инструкция по работе</h1>
        <p>Как пользоваться тренажёром и в каком порядке изучать материал.</p>
      </div>

      <div className="instr-grid">
        {STEPS.map(s => (
          <div key={s.title} className="instr-card">
            <div className="instr-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h2>Таблица тетрад — шпаргалка</h2>
        <div className="tetrad-grid">
          {TETRAD_MAP.map(t => (
            <div key={t} className="tetrad-cell">{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}