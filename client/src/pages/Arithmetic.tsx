export function Arithmetic() {
  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Арифметика в 16СС</h1>
        <p>Операции сложения, вычитания и умножения в шестнадцатеричной системе счисления.</p>
      </div>

      {/* Сложение */}
      <div className="section-card">
        <h2>Сложение</h2>
        <p>Операции выполняются поразрядно, начиная с младшего разряда. Если сумма двух цифр больше 15 — записываем остаток от деления на 16 и переносим 1 в старший разряд.</p>
        <div className="formula-block">
          1F<sub>(16)</sub> + 2D<sub>(16)</sub> = 4C<sub>(16)</sub>
        </div>
        <div className="algo-steps">
          <div className="algo-step">
            <div className="algo-num">1</div>
            <div className="algo-text">
              <b>Младший разряд:</b> F + D = 15 + 13 = 28<sub>(10)</sub><br/>
              28 &gt; 16 → 28 − 16 = 12<sub>(10)</sub> = C<sub>(16)</sub>, перенос 1
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">2</div>
            <div className="algo-text">
              <b>Старший разряд:</b> 1 + 2 + 1<sub>(перенос)</sub> = 4<sub>(16)</sub>
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">3</div>
            <div className="algo-text">
              <b>Результат:</b> 4C<sub>(16)</sub>
            </div>
          </div>
        </div>
      </div>

      {/* Вычитание */}
      <div className="section-card">
        <h2>Вычитание</h2>
        <p>При вычитании, если уменьшаемое меньше вычитаемого — занимаем единицу из старшего разряда. Единица в 16СС равна 16<sub>(10)</sub>.</p>
        <div className="formula-block">
          2D<sub>(16)</sub> − 1F<sub>(16)</sub> = E<sub>(16)</sub>
        </div>
        <div className="algo-steps">
          <div className="algo-step">
            <div className="algo-num">1</div>
            <div className="algo-text">
              <b>Младший разряд:</b> D − F = 13 − 15 &lt; 0<br/>
              Занимаем 1 из старшего: (16 + 13) − 15 = 14<sub>(10)</sub> = E<sub>(16)</sub>
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">2</div>
            <div className="algo-text">
              <b>Старший разряд:</b> 2 − 1<sub>(заём)</sub> − 1 = 0<sub>(16)</sub>
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">3</div>
            <div className="algo-text">
              <b>Результат:</b> 0E → E<sub>(16)</sub>
            </div>
          </div>
        </div>
      </div>

      {/* Умножение */}
      <div className="section-card">
        <h2>Умножение</h2>
        <p>Умножение выполняется поразрядно с использованием таблицы умножения 16СС и распределительного закона.</p>
        <div className="formula-block">
          1C<sub>(16)</sub> · 2<sub>(16)</sub> = 38<sub>(16)</sub>
        </div>
        <div className="algo-steps">
          <div className="algo-step">
            <div className="algo-num">1</div>
            <div className="algo-text">
              <b>Применяем распределительный закон:</b><br/>
              (10<sub>(16)</sub> + C<sub>(16)</sub>) · 2<sub>(16)</sub>
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">2</div>
            <div className="algo-text">
              10<sub>(16)</sub> · 2<sub>(16)</sub> = 20<sub>(16)</sub>
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">3</div>
            <div className="algo-text">
              C<sub>(16)</sub> · 2<sub>(16)</sub> = 12 · 2 = 24<sub>(10)</sub> = 18<sub>(16)</sub>
            </div>
          </div>
          <div className="algo-step">
            <div className="algo-num">4</div>
            <div className="algo-text">
              <b>Результат:</b> 20<sub>(16)</sub> + 18<sub>(16)</sub> = 38<sub>(16)</sub>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}