import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Загружаем данные из localStorage при инициализации
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error);
        // При ошибке очищаем хранилище
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (token, user) => {
    if (!token || !user) {
      console.error('Ошибка авторизации: отсутствуют токен или данные пользователя');
      return;
    }
    
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    
    // Сохраняем в localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Очищаем localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Проверка срока действия токена
  const checkTokenExpiration = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        // Получаем payload из JWT токена
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        // Проверяем, не истек ли срок действия токена
        if (payload.exp * 1000 < Date.now()) {
          logout(); // Если токен истек, выходим из системы
          return false;
        }
        return true;
      } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        logout();
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      isAuthenticated, 
      login, 
      logout,
      checkTokenExpiration
    }}>
      {children}
    </AuthContext.Provider>
  );
};