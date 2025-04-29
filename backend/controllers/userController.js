// controllers/userController.js
const { User, WorkSchedule } = require('../models');

module.exports = {
  // Получить список всех сотрудников
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [
          {
            model: WorkSchedule,
            as: 'WorkSchedules',
            attributes: ['date', 'startTime', 'endTime'],
            separate: true, // если хочешь отдельный запрос
            order: [['date', 'DESC']]
          }
        ]
      });
      

      return res.status(200).json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
    }
  },

  // Получить информацию об одном сотруднике
  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: WorkSchedule,
            attributes: ['date', 'startTime', 'endTime'],
            order: [['date', 'DESC']]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ message: 'Ошибка при получении информации о пользователе' });
    }
  },

  // Обновить информацию о сотруднике
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { fullName, email, role, position } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Обновление пользователя
      await user.update({
        fullName,
        email,
        role,
        position
      });

      return res.status(200).json({
        message: 'Информация о пользователе обновлена',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          position: user.position
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ message: 'Ошибка при обновлении информации о пользователе' });
    }
  },

  // Удалить сотрудника
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      await user.destroy();

      return res.status(200).json({ message: 'Пользователь успешно удален' });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ message: 'Ошибка при удалении пользователя' });
    }
  }
};
