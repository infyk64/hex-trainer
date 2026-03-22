import { useState } from 'react';

const HEX_SYMBOLS = [
  { sym: '0', dec: '0' }, { sym: '1', dec: '1' },
  { sym: '2', dec: '2' }, { sym: '3', dec: '3' },
  { sym: '4', dec: '4' }, { sym: '5', dec: '5' },
  { sym: '6', dec: '6' }, { sym: '7', dec: '7' },
  { sym: '8', dec: '8' }, { sym: '9', dec: '9' },
  { sym: 'A', dec: '10', special: true },
  { sym: 'B', dec: '11', special: true },
  { sym: 'C', dec: '12', special: true },
  { sym: 'D', dec: '13', special: true },
  { sym: 'E', dec: '14', special: true },
  { sym: 'F', dec: '15', special: true },
];

const TETRAD_MAP = [
  '0→0000','1→0001','2→0010','3→0011',
  '4→0100','5→0101','6→0110','7→0111',
  '8→1000','9→1001','A→1010','B→1011',
  'C→1100','D→1101','E→1110','F→1111',
];

const SECTIONS = [
  { id: 'intro', label: 'Введение' },
  { id: 'symbols', label: 'Символы' },
  { id: 'hex-dec', label: '16 → 10' },
  { id: 'hex-bin', label: '16 → 2' },
  { id: 'hex-oct', label: '16 → 8' },
  { id: 'tetrad', label: 'Тетрады-шпаргалка' },
  { id: 'tables', label: '→ Таблицы' },
  { id: 'arithmetic', label: '→ Арифметика' },
];

export function Theory() {
  const [active, setActive] = useState('intro');

  const scrollTo = (id: string) => {
    if (id === 'tables') { window.location.href = '/tables'; return; }
    if (id === 'arithmetic') { window.location.href = '/arithmetic'; return; }
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="theory-layout">
      <div className="theory-sidebar">
        <div className="theory-sidebar-card">
          {SECTIONS.map(s => (
            <div
              key={s.id}
              className={`sidebar-link ${active === s.id ? 'active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="theory-main">
        <div className="theory-hero" id="intro">
          <h1>Шестнадцатеричная система счисления</h1>
          <p>Позиционная система счисления с основанием 16. Широко применяется в программировании для компактной записи двоичных данных.</p>
        </div>

        <div className="section-card" id="symbols">
          <h2>Символы системы</h2>
          <p>Используются 16 символов: цифры 0–9 и буквы A–F. Буквы соответствуют числам 10–15.</p>
          <div className="hex-table">
            {HEX_SYMBOLS.map(h => (
              <div key={h.sym} className={`hex-cell ${h.special ? 'special' : ''}`}>
                <span className="hex-sym">{h.sym}</span>
                <span className="hex-dec">{h.dec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card" id="hex-dec">
          <h2>Перевод из 16 в 10 систему</h2>
          <p>Каждый разряд умножается на 16 в степени его позиции (справа налево с нуля), результаты складываются.</p>
          <div className="formula-block">
            1F4<sub>(16)</sub> = 1·(16²) + F·(16¹) + 4·(16⁰)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 1·256 + 15·16 + 4·1<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 256 + 240 + 4{' '}
            <span className="comment">= 500(10)</span>
          </div>
        </div>

        <div className="section-card" id="hex-bin">
          <h2>Перевод из 16 в 2 систему</h2>
          <p>Каждый шестнадцатеричный символ заменяется тетрадой — группой из четырёх двоичных разрядов.</p>
          <div className="formula-block">
            1F4<sub>(16)</sub> → 0001 | 1111 | 0100<br/>
            <span className="comment">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 → F → 4</span>
          </div>
          <div className="algo-steps">
            {['Разбить число на отдельные символы', 'Каждый символ заменить 4-битной тетрадой', 'Записать тетрады подряд'].map((text, i) => (
              <div key={i} className="algo-step">
                <div className="algo-num">{i + 1}</div>
                <div className="algo-text">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card" id="hex-oct">
          <h2>Перевод из 16 в 8 систему</h2>
          <p>Используем двоичную систему как промежуточную — обе системы являются степенями двойки.</p>
          <div className="algo-steps">
            {[
              'Перевести из 16СС → 2СС (каждую цифру в тетраду)',
              'Сгруппировать двоичные разряды по три справа налево',
              'Каждую триаду перевести в восьмеричную цифру',
            ].map((text, i) => (
              <div key={i} className="algo-step">
                <div className="algo-num">{i + 1}</div>
                <div className="algo-text">{text}</div>
              </div>
            ))}
          </div>
          <div className="formula-block">
            A7<sub>(16)</sub> → 1010 0111<sub>(2)</sub><br/>
            → 010 | 100 | 111<br/>
            <span className="comment">→ 2 | 4 | 7 = 247(8)</span>
          </div>
        </div>

        <div className="section-card" id="tetrad">
          <h2>Таблица тетрад — шпаргалка</h2>
          <div className="tetrad-grid">
            {TETRAD_MAP.map(t => (
              <div key={t} className="tetrad-cell">{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
