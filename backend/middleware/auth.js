// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware для проверки авторизации
const authenticateToken = async (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Проверяем токен
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Недействительный или истекший токен' });
      }
      
      // Проверяем существование пользователя
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      
      // Добавляем данные пользователя в объект запроса
      req.user = {
        id: user.id,
        role: user.role
      };
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Ошибка аутентификации' });
  }
};

// Middleware для проверки роли админа
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin' || req.user.role === 'director') {
    return next();
  }
  
  return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
};

module.exports = {
  authenticateToken,
  isAdmin
};