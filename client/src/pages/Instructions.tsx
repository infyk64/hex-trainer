import { useAuth } from '../context/AuthContext';

export function Instructions() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Инструкция по работе</h1>
        <p>Как пользоваться системой в зависимости от вашей роли.</p>
      </div>

      {/* Общая инструкция */}
      <div className="section-card">
        <h2>Общие сведения</h2>
        <p>Тренажёр 16СС — учебная платформа для изучения шестнадцатеричной системы счисления. Включает теоретический материал, таблицы, интерактивный тренажёр и систему тестирования.</p>
      </div>

      {/* Инструкция для студента */}
      {(!user || user.role === 'student') && (
        <div className="section-card">
          <h2>Инструкция для студента</h2>
          <div className="algo-steps">
            <div className="algo-step"><div className="algo-num">1</div><div className="algo-text">Изучи вкладку «Теория»: символы 16СС и алгоритмы перевода. Используй боковую навигацию для перехода между разделами.</div></div>
            <div className="algo-step"><div className="algo-num">2</div><div className="algo-text">Перейди в «Тренажёр»: выбери режим задания и нажми «Новое задание». После ответа увидишь пошаговое решение.</div></div>
            <div className="algo-step"><div className="algo-num">3</div><div className="algo-text">Отслеживай прогресс во вкладке «Статистика».</div></div>
            <div className="algo-step"><div className="algo-num">4</div><div className="algo-text">В разделе «Мои курсы» ты увидишь назначенные преподавателем тесты. Проходи их в указанное время и с ограниченным количеством попыток.</div></div>
            <div className="algo-step"><div className="algo-num">5</div><div className="algo-text">После прохождения теста можно посмотреть результаты и подробное решение каждого задания.</div></div>
          </div>
        </div>
      )}

      {/* Инструкция для преподавателя */}
      {user?.role === 'teacher' && (
        <div className="section-card">
          <h2>Инструкция для преподавателя</h2>
          <div className="algo-steps">
            <div className="algo-step"><div className="algo-num">1</div><div className="algo-text">В «Панели преподавателя» создавай группы и добавляй в них студентов.</div></div>
            <div className="algo-step"><div className="algo-num">2</div><div className="algo-text">Создавай тесты: выбирай режим вопроса, генерируй задания, задавай таймер и количество попыток.</div></div>
            <div className="algo-step"><div className="algo-num">3</div><div className="algo-text">Назначай тесты группам — студенты увидят их в своих курсах.</div></div>
            <div className="algo-step"><div className="algo-num">4</div><div className="algo-text">Редактируй теоретический материал во вкладке «Теория» панели преподавателя.</div></div>
            <div className="algo-step"><div className="algo-num">5</div><div className="algo-text">Ты также можешь пользоваться тренажёром и таблицами как студент.</div></div>
          </div>
        </div>
      )}

      {/* Инструкция для админа */}
      {user?.role === 'admin' && (
        <div className="section-card">
          <h2>Инструкция для администратора</h2>
          <div className="algo-steps">
            <div className="algo-step"><div className="algo-num">1</div><div className="algo-text">В «Панели админа» управляй пользователями: создавай преподавателей и студентов.</div></div>
            <div className="algo-step"><div className="algo-num">2</div><div className="algo-text">Для преподавателей — логин: ФИО, пароль генерируется автоматически (преподаватель может сменить его позже).</div></div>
            <div className="algo-step"><div className="algo-num">3</div><div className="algo-text">Для студентов — логин: ФИО, пароль: номер студенческого билета.</div></div>
            <div className="algo-step"><div className="algo-num">4</div><div className="algo-text">Можно редактировать и удалять любых пользователей, а также сбрасывать пароли.</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
