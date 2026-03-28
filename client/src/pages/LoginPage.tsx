import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [loginStr, setLoginStr] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginStr, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>ТРЕНАЖЁР 16СС</h1>
        <p className="subtitle">Шестнадцатеричная система счисления</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input
              className="form-input"
              type="text"
              value={loginStr}
              onChange={e => setLoginStr(e.target.value)}
              placeholder="Введите логин"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text2)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={loading || !loginStr || !password}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}