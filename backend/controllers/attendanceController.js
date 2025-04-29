// controllers/attendanceController.js
const { Attendance, User, WorkSchedule } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Вспомогательные функции
const calculateLateMinutes = (scheduledStart, actualCheckIn) => {
  const start = moment(scheduledStart, 'HH:mm:ss');
  const checkIn = moment(actualCheckIn, 'HH:mm:ss');
  return checkIn.isAfter(start) ? checkIn.diff(start, 'minutes') : 0;
};

const isEarlyLeave = (scheduledEnd, actualCheckOut) => {
  const end = moment(scheduledEnd, 'HH:mm:ss');
  const checkOut = moment(actualCheckOut, 'HH:mm:ss');
  return checkOut.isBefore(end);
};

module.exports = {
  // Отметить приход сотрудника
  async checkIn(req, res) {
    try {
      const { userId } = req.body;
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      const currentTime = currentDate.toTimeString().split(' ')[0];

      // Проверяем, отмечался ли сотрудник сегодня
      let attendance = await Attendance.findOne({
        where: {
          userId,
          date: today
        }
      });

      if (attendance && attendance.checkInTime) {
        return res.status(400).json({ message: 'Вы уже отметили своё прибытие сегодня' });
      }

      // Получаем расписание на сегодня
      const workSchedule = await WorkSchedule.findOne({
        where: {
          userId,
          date: today
        }
      });

      // Проверяем опоздание
      let status = 'active';
      let lateMinutes = 0;

      if (workSchedule) {
        lateMinutes = calculateLateMinutes(workSchedule.startTime, currentTime);
        if (lateMinutes > 0) {
          status = 'late';
        }
      }

      // Если записи нет, создаем новую
      if (!attendance) {
        attendance = await Attendance.create({
          userId,
          date: today,
          checkInTime: currentTime,
          status,
          lateMinutes
        });
      } else {
        // Иначе обновляем существующую запись
        await attendance.update({
          checkInTime: currentTime,
          status,
          lateMinutes
        });
      }

      const responseMessage = lateMinutes > 0 ?
        `Отмечено опоздание на ${lateMinutes} минут` :
        'Вы успешно отметились';

      return res.status(200).json({
        message: responseMessage,
        attendance
      });
    } catch (error) {
      console.error('Check-in error:', error);
      return res.status(500).json({ message: 'Ошибка при отметке прихода' });
    }
  },

  // Отметить уход сотрудника
  async checkOut(req, res) {
    try {
      const { userId } = req.body;
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      const currentTime = currentDate.toTimeString().split(' ')[0];

      // Проверяем, отмечался ли сотрудник сегодня
      const attendance = await Attendance.findOne({
        where: {
          userId,
          date: today
        }
      });

      if (!attendance || !attendance.checkInTime) {
        return res.status(400).json({ message: 'Сначала необходимо отметить приход' });
      }

      if (attendance.checkOutTime) {
        return res.status(400).json({ message: 'Вы уже отметили свой уход сегодня' });
      }

      // Проверяем расписание
      const workSchedule = await WorkSchedule.findOne({
        where: {
          userId,
          date: today
        }
      });

      let status = 'completed';
      let message = 'Вы можете уходить. До свидания!';

      // Проверка на ранний уход
      if (workSchedule && isEarlyLeave(workSchedule.endTime, currentTime)) {
        status = 'early_leave';
        message = 'Вы уходите раньше окончания смены. Причина записана.';
      }

      // Обновляем запись о посещении
      await attendance.update({
        checkOutTime: currentTime,
        status
      });

      return res.status(200).json({
        message,
        attendance
      });
    } catch (error) {
      console.error('Check-out error:', error);
      return res.status(500).json({ message: 'Ошибка при отметке ухода' });
    }
  },

  // Получить посещаемость всех сотрудников за конкретный день
  async getAttendanceByDate(req, res) {
    try {
      const { date } = req.params;

      const attendances = await Attendance.findAll({
        where: { date },
        include: [{
          model: User,
          attributes: ['id', 'fullName', 'position', 'role']
        }],
        order: [['status', 'ASC']]
      });

      // Получаем расписания для всех этих сотрудников
      const userIds = [...new Set(attendances.map(a => a.userId))];

      const schedules = await WorkSchedule.findAll({
        where: {
          userId: { [Op.in]: userIds },
          date
        }
      });

      // Формируем расширенные данные
      const scheduleMap = schedules.reduce((acc, schedule) => {
        acc[schedule.userId] = schedule;
        return acc;
      }, {});

      const enrichedAttendances = attendances.map(att => {
        const schedule = scheduleMap[att.userId];
        return {
          ...att.toJSON(),
          scheduledStartTime: schedule ? schedule.startTime : null,
          scheduledEndTime: schedule ? schedule.endTime : null
        };
      });

      return res.status(200).json(enrichedAttendances);
    } catch (error) {
      console.error('Get attendance by date error:', error);
      return res.status(500).json({ message: 'Ошибка при получении данных о посещаемости' });
    }
  },

  // Получить посещаемость за период (неделю, месяц и т.д.)
  async getAttendanceByPeriod(req, res) {
    try {
      const { startDate, endDate } = req.params;

      const attendances = await Attendance.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: User,
          attributes: ['id', 'fullName', 'position', 'role']
        }],
        order: [['date', 'ASC'], ['userId', 'ASC']]
      });

      // Получаем расписания для этого периода
      const schedules = await WorkSchedule.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      // Формируем map для быстрого доступа
      const scheduleMap = {};
      schedules.forEach(schedule => {
        const key = `${schedule.userId}-${schedule.date}`;
        scheduleMap[key] = schedule;
      });

      // Обогащаем данные
      const enrichedAttendances = attendances.map(att => {
        const attJson = att.toJSON();
        const key = `${att.userId}-${att.date}`;
        const schedule = scheduleMap[key];

        return {
          ...attJson,
          scheduledStartTime: schedule ? schedule.startTime : null,
          scheduledEndTime: schedule ? schedule.endTime : null
        };
      });

      return res.status(200).json(enrichedAttendances);
    } catch (error) {
      console.error('Get attendance by period error:', error);
      return res.status(500).json({ message: 'Ошибка при получении данных о посещаемости' });
    }
  },

  // Получить историю посещений конкретного сотрудника
  async getUserAttendance(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const whereClause = { userId };
      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [startDate, endDate]
        };
      }

      const attendances = await Attendance.findAll({
        where: whereClause,
        order: [['date', 'DESC']],
        raw: true
      });

      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

      const updatedAttendances = await Promise.all(attendances.map(async (att) => {
        const schedule = await WorkSchedule.findOne({
          where: {
            userId: att.userId,
            date: att.date
          },
          raw: true
        });

        if (!schedule) {
          return { ...att, status: 'pending' };
        }

        // Parse date and time properly
        const start = new Date(`${att.date}T${schedule.startTime}`);
        const end = new Date(`${att.date}T${schedule.endTime}`);

        // Calculate status based on current time and check-in/out times
        let status = att.status;

        // Если статус уже установлен как completed или early_leave, оставляем его
        if (status === 'completed' || status === 'early_leave') {
          return {
            ...att,
            scheduledStartTime: schedule.startTime,
            scheduledEndTime: schedule.endTime
          };
        }

        // Обновляем статус исходя из текущего времени и отметок
        const isDatePast = att.date < today;
        const isAfterEndTime = now > end;

        if (isDatePast || isAfterEndTime) {
          if (att.checkOutTime) {
            status = 'completed';
          } else if (att.checkInTime) {
            status = 'finishing';
          } else {
            status = 'missed';
          }
        } else {
          const minutesToStart = (start - now) / 1000 / 60;

          if (att.checkInTime) {
            status = 'active';
            // Проверка на опоздание
            if (att.lateMinutes > 0) {
              status = 'late';
            }
          } else if (minutesToStart <= 30 && minutesToStart > 0) {
            status = 'upcoming';
          } else if (now >= start && now <= end) {
            status = 'active';
          } else {
            status = 'pending';
          }
        }

        return {
          ...att,
          status,
          scheduledStartTime: schedule.startTime,
          scheduledEndTime: schedule.endTime
        };
      }));

      return res.status(200).json(updatedAttendances);
    } catch (error) {
      console.error('Get user attendance error:', error);
      return res.status(500).json({ message: 'Ошибка при получении истории посещений' });
    }
  },

  // Добавление заметки к посещению
  async addAttendanceNote(req, res) {
    try {
      const { attendanceId } = req.params;
      const { notes } = req.body;

      const attendance = await Attendance.findByPk(attendanceId);

      if (!attendance) {
        return res.status(404).json({ message: 'Запись о посещении не найдена' });
      }

      await attendance.update({ notes });

      return res.status(200).json({
        message: 'Заметка добавлена успешно',
        attendance
      });
    } catch (error) {
      console.error('Add attendance note error:', error);
      return res.status(500).json({ message: 'Ошибка при добавлении заметки' });
    }
  },

  // Проверка возможности ухода на основе расписания
  async canUserLeave(req, res) {
    try {
      const { userId } = req.params;
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0];
      const currentTime = currentDate.toTimeString().split(' ')[0];

      // Проверяем текущего пользователя
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Проверяем, отмечался ли сотрудник сегодня
      const attendance = await Attendance.findOne({
        where: {
          userId,
          date: today
        }
      });

      if (!attendance || !attendance.checkInTime) {
        return res.status(200).json({
          canLeave: false,
          message: 'Сначала необходимо отметить приход',
          code: 'NO_CHECK_IN'
        });
      }

      if (attendance.checkOutTime) {
        return res.status(200).json({
          canLeave: false,
          message: 'Вы уже отметили свой уход сегодня',
          code: 'ALREADY_CHECKED_OUT'
        });
      }

      // Проверяем рабочее расписание
      const workSchedule = await WorkSchedule.findOne({
        where: {
          userId,
          date: today
        }
      });

      if (workSchedule) {
        const endTime = workSchedule.endTime;
        const endTimeMoment = moment(endTime, 'HH:mm:ss');
        const currentTimeMoment = moment(currentTime, 'HH:mm:ss');

        // Сравниваем текущее время с временем окончания работы
        if (currentTimeMoment.isBefore(endTimeMoment)) {
          const minutesLeft = endTimeMoment.diff(currentTimeMoment, 'minutes');

          return res.status(200).json({
            canLeave: false,
            message: `Ваш рабочий день еще не окончен. Осталось ${minutesLeft} минут.`,
            code: 'BEFORE_END_TIME',
            minutesLeft,
            endTime: workSchedule.endTime
          });
        }
      }

      return res.status(200).json({
        canLeave: true,
        message: 'Вы можете уходить',
        code: 'CAN_LEAVE'
      });
    } catch (error) {
      console.error('Can user leave error:', error);
      return res.status(500).json({
        message: 'Ошибка при проверке расписания',
        code: 'ERROR'
      });
    }
  },

  // Получить статистику посещаемости
  async getAttendanceStats(req, res) {
    try {
      const { userId, period } = req.query;
      const now = new Date();

      // Рассчитываем даты для запроса в зависимости от периода
      let startDate, endDate;

      switch (period) {
        case 'week':
          startDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
          endDate = moment().format('YYYY-MM-DD');
          break;
        case 'month':
          startDate = moment().startOf('month').format('YYYY-MM-DD');
          endDate = moment().format('YYYY-MM-DD');
          break;
        case 'quarter':
          startDate = moment().subtract(3, 'months').format('YYYY-MM-DD');
          endDate = moment().format('YYYY-MM-DD');
          break;
        default:
          startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
          endDate = moment().format('YYYY-MM-DD');
      }

      const whereClause = {
        date: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (userId) {
        whereClause.userId = userId;
      }

      // Получаем все записи за период
      const attendances = await Attendance.findAll({
        where: whereClause,
        include: [{
          model: User,
          attributes: ['id', 'fullName', 'position', 'role']
        }],
        raw: true,
        nest: true
      });

      // Готовим статистику
      const stats = {
        total: attendances.length,
        onTime: attendances.filter(a => a.checkInTime && a.lateMinutes === 0).length,
        late: attendances.filter(a => a.lateMinutes > 0).length,
        missed: attendances.filter(a => a.status === 'missed').length,
        earlyLeave: attendances.filter(a => a.status === 'early_leave').length,
        avgLateMinutes: 0,
        byEmployee: {}
      };

      // Расчет средних минут опоздания
      const lateEntries = attendances.filter(a => a.lateMinutes > 0);
      if (lateEntries.length > 0) {
        stats.avgLateMinutes = lateEntries.reduce((sum, a) => sum + a.lateMinutes, 0) / lateEntries.length;
      }

      // Группировка по сотрудникам
      attendances.forEach(att => {
        const employeeId = att.userId;
        const employeeName = att.User.fullName;

        if (!stats.byEmployee[employeeId]) {
          stats.byEmployee[employeeId] = {
            id: employeeId,
            name: employeeName,
            position: att.User.position,
            total: 0,
            onTime: 0,
            late: 0,
            missed: 0,
            earlyLeave: 0,
            avgLateMinutes: 0,
            lateMinutesTotal: 0
          };
        }

        const empStats = stats.byEmployee[employeeId];
        empStats.total++;

        if (att.status === 'missed') {
          empStats.missed++;
        } else if (att.status === 'early_leave') {
          empStats.earlyLeave++;
        } else if (att.lateMinutes > 0) {
          empStats.late++;
          empStats.lateMinutesTotal += att.lateMinutes;
        } else if (att.checkInTime) {
          empStats.onTime++;
        }
      });

      // Расчет средних опозданий для каждого сотрудника
      Object.keys(stats.byEmployee).forEach(empId => {
        const emp = stats.byEmployee[empId];
        if (emp.late > 0) {
          emp.avgLateMinutes = emp.lateMinutesTotal / emp.late;
        }
        delete emp.lateMinutesTotal; // Удаляем временное поле
      });

      // Преобразуем объект в массив для возврата
      stats.byEmployee = Object.values(stats.byEmployee);

      return res.status(200).json({
        period: {
          start: startDate,
          end: endDate
        },
        stats
      });

    } catch (error) {
      console.error('Get attendance stats error:', error);
      return res.status(500).json({ message: 'Ошибка при получении статистики посещаемости' });
    }
  }
};