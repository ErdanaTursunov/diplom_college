// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Маршруты для отметки прихода и ухода (доступны всем сотрудникам)
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// Проверка возможности ухода
router.get('/can-leave/:userId', attendanceController.canUserLeave);

// Добавление заметки к посещению
router.put('/note/:attendanceId', attendanceController.addAttendanceNote);

// Статистика посещаемости
router.get('/stats', attendanceController.getAttendanceStats);

// Маршруты для администраторов
router.get('/date/:date', isAdmin, attendanceController.getAttendanceByDate);
router.get('/period/:startDate/:endDate', isAdmin, attendanceController.getAttendanceByPeriod);
router.get('/user/:userId', isAdmin, attendanceController.getUserAttendance);

// Сотрудник может получить только свои посещения
router.get('/my-attendance', (req, res) => {
  const { startDate, endDate } = req.query;
  req.params.userId = req.user.id;
  
  // Передаем параметры запроса
  req.query.startDate = startDate;
  req.query.endDate = endDate;
  
  attendanceController.getUserAttendance(req, res);
});

// Получение своей статистики посещаемости
router.get('/my-stats', (req, res) => {
  req.query.userId = req.user.id;
  attendanceController.getAttendanceStats(req, res);
});

module.exports = router;