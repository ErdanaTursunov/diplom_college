const { where } = require('sequelize');
const { WorkSchedule, User, Attendance, Notification } = require('../models');
const moment = require('moment');

function calculateDuration(start, end) {
  const startMoment = moment(start, 'HH:mm:ss');
  const endMoment = moment(end, 'HH:mm:ss');
  const duration = moment.duration(endMoment.diff(startMoment));
  const hours = duration.asHours();
  return `${hours} часов`;
}

module.exports = {
  // ✅ Создать или обновить расписание по датам
  async createOrUpdateSchedule(req, res) {
    try {
      const { userId, dates } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const createdOrUpdated = [];

      for (const entry of dates) {
        const [schedule, created] = await WorkSchedule.findOrCreate({
          where: { userId, date: entry.date },
          defaults: {
            startTime: entry.startTime,
            endTime: entry.endTime
          }
        });

        if (!created) {
          await schedule.update({
            startTime: entry.startTime,
            endTime: entry.endTime
          });
        }

        // Создание записи в Attendance, если её ещё нет
        await Attendance.findOrCreate({
          where: { userId, date: entry.date },
          defaults: {
            status: 'pending'
          }
        });

        createdOrUpdated.push({ date: entry.date, created });

        // Создаем уведомление для пользователя
        const formattedDate = moment(entry.date).format('DD.MM.YYYY');
        const notificationTitle = created
          ? 'Создано новое расписание'
          : 'Расписание изменено';
        const notificationMessage = created
          ? `Для вас создано расписание на ${formattedDate}. Время работы: с ${entry.startTime} до ${entry.endTime}.`
          : `Ваше расписание на ${formattedDate} изменено. Новое время работы: с ${entry.startTime} до ${entry.endTime}.`;

        await Notification.create({
          userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'schedule'
        });
      }

      return res.status(200).json({
        message: 'Расписание успешно сохранено',
        result: createdOrUpdated
      });
    } catch (error) {
      console.error('Create/Update schedule error:', error);
      return res.status(500).json({ message: 'Ошибка при создании/обновлении расписания' });
    }
  },


  // ✅ Получить расписание пользователя на 14 дней вперёд
  async getUserSchedule(req, res) {
    try {
      const { userId } = req.params;
      const today = moment().startOf('day');
      const endDate = today.clone().add(14, 'days').format('YYYY-MM-DD');

      const schedules = await WorkSchedule.findAll({
        where: {
          userId,
          date: {
            [require('sequelize').Op.between]: [today.format('YYYY-MM-DD'), endDate]
          }
        },
        include: [{
          model: User,
          attributes: ['id', 'fullName', 'position']
        }]
      });

      if (schedules.length === 0) {
        return res.status(200).json({ message: "Пока нету расписания!", data: [] });
      }


      return res.status(200).json(schedules);

    } catch (error) {
      console.error('Get user schedule error:', error);
      return res.status(500).json({ message: 'Ошибка при получении расписания' });
    }
  },

  // ✅ Получить расписания всех сотрудников
  async getAllSchedules(req, res) {
    try {
      const schedules = await WorkSchedule.findAll({
        include: [{
          model: User,
          attributes: ['id', 'fullName', 'position', 'role']
        }]
      });

      return res.status(200).json(schedules);
    } catch (error) {
      console.error('Get all schedules error:', error);
      return res.status(500).json({ message: 'Ошибка при получении расписаний' });
    }
  },

  // ✅ Удалить расписание по userId и дате
  async deleteSchedule(req, res) {
    try {
      const { userId, date } = req.query;

      const schedule = await WorkSchedule.findOne({ where: { userId, date } });

      if (!schedule) {
        return res.status(404).json({ message: 'Расписание не найдено' });
      }

      // Получаем данные перед удалением
      const user = await User.findByPk(userId);
      const formattedDate = moment(date).format('DD.MM.YYYY');

      await schedule.destroy();

      // Создаем уведомление об удалении
      await Notification.create({
        userId,
        title: 'Расписание отменено',
        message: `Ваша смена на ${formattedDate} была отменена.`,
        type: 'schedule'
      });

      return res.status(200).json({ message: 'Расписание успешно удалено' });
    } catch (error) {
      console.error('Delete schedule error:', error);
      return res.status(500).json({ message: 'Ошибка при удалении расписания' });
    }
  },

  async deleteScheduleById(req, res) {
    try {
      const { id } = req.params;

      const schedule = await WorkSchedule.findByPk(id);

      if (!schedule) {
        return res.status(404).json({ message: 'Расписание не найдено' });
      }

      const userId = schedule.userId;
      const date = schedule.date;
      const formattedDate = moment(date).format('DD.MM.YYYY');

      const attendance = await Attendance.findOne({ where: { userId, date } });

      if (attendance) {
        await attendance.destroy(); // ✅ можно сразу удалить
      }

      await schedule.destroy();

      // Создаем уведомление об удалении
      await Notification.create({
        userId,
        title: 'Расписание отменено',
        message: `Ваша смена на ${formattedDate} была отменена.`,
        type: 'schedule'
      });

      return res.status(200).json({ message: 'Расписание и посещаемость успешно удалены' });
    } catch (error) {
      console.error('Delete schedule error:', error);
      return res.status(500).json({ message: 'Ошибка при удалении расписания' });
    }
  },
  
  async updateSchedule(req, res) {
    try {
      const { userId, dates } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const createdOrUpdated = [];

      for (const entry of dates) {
        const [schedule, created] = await WorkSchedule.findOrCreate({
          where: { userId, date: entry.date },
          defaults: {
            startTime: entry.startTime,
            endTime: entry.endTime
          }
        });

        if (!created) {
          await schedule.update({
            startTime: entry.startTime,
            endTime: entry.endTime
          });
        }

        await Attendance.findOrCreate({
          where: { userId, date: entry.date },
          defaults: {
            status: 'pending'
          }
        });

        const formattedDate = moment(entry.date).format('DD.MM.YYYY');
        const notificationTitle = created
          ? 'Создано новое расписание'
          : 'Расписание изменено';
        const notificationMessage = created
          ? `Для вас создано расписание на ${formattedDate}. Время работы: с ${entry.startTime} до ${entry.endTime}.`
          : `Ваше расписание на ${formattedDate} изменено. Новое время работы: с ${entry.startTime} до ${entry.endTime}.`;

        await Notification.create({
          userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'schedule'
        });

        createdOrUpdated.push({ date: entry.date, created });
      }

      return res.status(200).json({
        message: 'Расписание успешно сохранено',
        result: createdOrUpdated
      });
    } catch (error) {
      console.error('Update schedule error:', error);
      return res.status(500).json({ message: 'Ошибка при обновлении расписания' });
    }
  }
};