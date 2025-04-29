// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Маршруты только для админов
router.post('/', isAdmin, scheduleController.createOrUpdateSchedule);
router.get('/', isAdmin, scheduleController.getAllSchedules);
router.get('/:userId', isAdmin, scheduleController.getUserSchedule);
router.delete('/:userId', isAdmin, scheduleController.deleteSchedule);
router.delete('/delete/:id', isAdmin, scheduleController.deleteScheduleById);
router.put('/', isAdmin, scheduleController.updateSchedule);


// Сотрудник может получить только свое расписание
router.get('/my/schedule', (req, res) => {
  req.params.userId = req.user.id;
  scheduleController.getUserSchedule(req, res);
});

module.exports = router;