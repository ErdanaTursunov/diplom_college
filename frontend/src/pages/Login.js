import { useContext, useState, useEffect } from "react";
import "../styles/Login.css";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AppleLogin = () => {
  const { login, isAuthenticated } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Перенаправление, если пользователь уже аутентифицирован
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateInputs = () => {
    if (!email.trim()) {
      setError("Введите адрес электронной почты");
      return false;
    }
    if (!password) {
      setError("Введите пароль");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          // Если включено "Запомнить меня", сохраняем данные на более длительный срок
          withCredentials: rememberMe,
        },
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
        setError(message || "Данные авторизации не получены");
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Не удалось подключиться к серверу. Проверьте соединение с интернетом.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="app-container">
      {/* Шапка */}
      <header className="header">
        <div className="header-container">
          <div className="apple-logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09998 22C7.78998 22.05 6.79998 20.68 5.95998 19.47C4.24998 17 2.93998 12.45 4.69998 9.39C5.56998 7.87 7.12998 6.91 8.81998 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.09 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
                fill="currentColor"
              />
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`btn btn-primary ${isLoading ? "btn-loading" : ""}`}
              >
                {isLoading ? <div className="spinner"></div> : "Войти"}
              </button>
            </form>

            <div className="register-link">
              <p>
                Нет аккаунта? <a href="/register">Зарегистрироваться</a>
              </p>
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
