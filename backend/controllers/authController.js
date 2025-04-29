// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = {
  // Регистрация нового сотрудника (только для админа)
  async register(req, res) {
    try {
      // Проверка на роль админа может быть реализована через middleware
      const { fullName, email, password, role, position } = req.body;

      // Проверка, существует ли пользователь
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }

      // Хеширование пароля
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Создание пользователя
      const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role,
        position
      });

      return res.status(201).json({
        message: 'Пользователь успешно создан',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          position: user.position
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
    }
  },

  // Авторизация сотрудника
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Поиск пользователя
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'Неверные учетные данные' });
      }

      // Проверка пароля
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Неверные учетные данные' });
      }

      // Создание JWT токена
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Успешная авторизация',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          position: user.position
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Ошибка при авторизации' });
    }
  },

  // Выход из системы (на клиенте просто удаляем токен)
  async logout(req, res) {
    return res.status(200).json({ message: 'Успешный выход из системы' });
  }
};