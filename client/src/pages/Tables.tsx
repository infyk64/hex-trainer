const NUMBER_SYSTEMS = [
  { dec: '0',  bin: '0000', oct: '0',  hex: '0' },
  { dec: '1',  bin: '0001', oct: '1',  hex: '1' },
  { dec: '2',  bin: '0010', oct: '2',  hex: '2' },
  { dec: '3',  bin: '0011', oct: '3',  hex: '3' },
  { dec: '4',  bin: '0100', oct: '4',  hex: '4' },
  { dec: '5',  bin: '0101', oct: '5',  hex: '5' },
  { dec: '6',  bin: '0110', oct: '6',  hex: '6' },
  { dec: '7',  bin: '0111', oct: '7',  hex: '7' },
  { dec: '8',  bin: '1000', oct: '10', hex: '8' },
  { dec: '9',  bin: '1001', oct: '11', hex: '9' },
  { dec: '10', bin: '1010', oct: '12', hex: 'A' },
  { dec: '11', bin: '1011', oct: '13', hex: 'B' },
  { dec: '12', bin: '1100', oct: '14', hex: 'C' },
  { dec: '13', bin: '1101', oct: '15', hex: 'D' },
  { dec: '14', bin: '1110', oct: '16', hex: 'E' },
  { dec: '15', bin: '1111', oct: '17', hex: 'F' },
];

// Таблица умножения 16СС (0-F x 0-F)
const HEX_DIGITS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];

function hexMul(a: string, b: string): string {
  return (parseInt(a, 16) * parseInt(b, 16)).toString(16).toUpperCase();
}

export function Tables() {
  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Таблицы систем счисления</h1>
        <p>Соответствие чисел в десятичной, двоичной, восьмеричной и шестнадцатеричной системах.</p>
      </div>

      {/* Таблица 1 — Системы счисления */}
      <div className="section-card">
        <h2>Таблица 1 — Системы счисления</h2>
        <div className="ns-table-wrap">
          <table className="ns-table">
            <thead>
              <tr>
                <th>Десятичная</th>
                <th>Двоичная</th>
                <th>Восьмеричная</th>
                <th>Шестнадцатеричная</th>
              </tr>
            </thead>
            <tbody>
              {NUMBER_SYSTEMS.map(row => (
                <tr key={row.dec}>
                  <td>{row.dec}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent3)' }}>{row.bin}</td>
                  <td>{row.oct}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 }}>{row.hex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 2 — Умножение */}
      <div className="section-card">
        <h2>Таблица 2 — Умножение шестнадцатеричных чисел</h2>
        <p style={{ marginBottom: '16px' }}>При вычислениях удобно пользоваться таблицей умножения 16СС.</p>
        <div className="mul-table-wrap">
          <table className="mul-table">
            <thead>
              <tr>
                <th className="mul-corner">×</th>
                {HEX_DIGITS.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {HEX_DIGITS.map(row => (
                <tr key={row}>
                  <th>{row}</th>
                  {HEX_DIGITS.map(col => (
                    <td
                      key={col}
                      className={hexMul(row, col) === '0' ? 'zero-cell' : ''}
                    >
                      {hexMul(row, col).toUpperCase()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}