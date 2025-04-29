import { useContext, useState, useEffect } from 'react';
import "../styles/Login.css";
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AppleLogin = () => {
  const { login, isAuthenticated } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Перенаправление, если пользователь уже аутентифицирован
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateInputs = () => {
    if (!email.trim()) {
      setError('Введите адрес электронной почты');
      return false;
    }
    if (!password) {
      setError('Введите пароль');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          // Если включено "Запомнить меня", сохраняем данные на более длительный срок
          withCredentials: rememberMe
        }
      );

      const { token, user, message } = response.data;

      if (token && user) {
        login(token, user);
        if (message) {
          setTimeout(() => navigate("/admin"), 100);
        } else {
          navigate("/admin");
        }
        
      } else {
        setError(message || 'Данные авторизации не получены');
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);

      const errorMessage = error.response?.data?.message ||
        'Не удалось подключиться к серверу. Проверьте соединение с интернетом.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="app-container">
      {/* Шапка */}
      <header className="header">
        <div className="header-container">
          <div className="apple-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09998 22C7.78998 22.05 6.79998 20.68 5.95998 19.47C4.24998 17 2.93998 12.45 4.69998 9.39C5.56998 7.87 7.12998 6.91 8.81998 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.09 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="main-content">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">Вход</h1>
              <p className="login-subtitle">Используйте свою почту для входа</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Почта
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="Электронная почта или номер телефона"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="form-extra">
                <div className="checkbox-group">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="form-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="checkbox-label">
                    Запомнить меня
                  </label>
                </div>
                <a href="/forgot-password" className="forgot-password">
                  Забыли пароль?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            <div className="divider">
              <span className="divider-text">Или войти через</span>
            </div>

            <div className="social-buttons">
              <button className="social-btn" type="button" aria-label="Войти через Facebook">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.0003 2C6.47731 2 2.00031 6.477 2.00031 12C2.00031 16.991 5.65731 21.128 10.4393 21.878V14.891H7.89831V12H10.4393V9.797C10.4393 7.291 11.9323 5.907 14.2153 5.907C15.3103 5.907 16.4543 6.102 16.4543 6.102V8.562H15.1923C13.9503 8.562 13.5613 9.333 13.5613 10.124V12H16.3363L15.8933 14.89H13.5613V21.878C18.3433 21.128 22.0003 16.991 22.0003 12C22.0003 6.477 17.5233 2 12.0003 2Z" />
                </svg>
              </button>
              <button className="social-btn" type="button" aria-label="Войти через Google">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.8,10h-2V8h-2v2h-2v2h2v2h2v-2h2V10z M9.9,12c-0.5,0-0.9-0.4-0.9-1s0.4-1,0.9-1c0.5,0,0.9,0.4,0.9,1S10.4,12,9.9,12z M13.9,12c-0.5,0-0.9-0.4-0.9-1s0.4-1,0.9-1c0.5,0,0.9,0.4,0.9,1S14.4,12,13.9,12z M18,12c0,0.6,0.1,1.1,0.2,1.6c-0.8,0.7-1.9,1.1-3.2,1.1H8c-3.1,0-5-2.4-5-5c0-2.8,2.2-5,5-5h7c2.8,0,5,2.2,5,5V12z M10.6,15c2.5,0,3.8,1.6,3.9,1.6l1-1.4c-0.1-0.1-1.9-2.2-4.9-2.2c-2.6,0-4.9,0.9-4.9,3H7C7,14.7,9,15,10.6,15z" />
                </svg>
              </button>
              <button className="social-btn" type="button" aria-label="Войти через Instagram">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.9997 2C17.5227 2 21.9997 6.477 21.9997 12C21.9997 17.523 17.5227 22 11.9997 22C6.47673 22 1.99973 17.523 1.99973 12C1.99973 6.477 6.47673 2 11.9997 2ZM11.9997 9C9.79073 9 7.99973 10.791 7.99973 13C7.99973 15.209 9.79073 17 11.9997 17C14.2087 17 15.9997 15.209 15.9997 13C15.9997 10.791 14.2087 9 11.9997 9ZM11.9997 10.5C13.3807 10.5 14.4997 11.619 14.4997 13C14.4997 14.381 13.3807 15.5 11.9997 15.5C10.6187 15.5 9.49973 14.381 9.49973 13C9.49973 11.619 10.6187 10.5 11.9997 10.5ZM17.9997 7C17.4477 7 16.9997 7.448 16.9997 8C16.9997 8.552 17.4477 9 17.9997 9C18.5517 9 18.9997 8.552 18.9997 8C18.9997 7.448 18.5517 7 17.9997 7Z" />
                </svg>
              </button>
            </div>

            <div className="register-link">
              <p>Нет аккаунта? <a href="/register">Зарегистрироваться</a></p>
            </div>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="footer">
        <div className="footer-container">
          <p className="footer-copyright">
            Copyright © 2025. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppleLogin;