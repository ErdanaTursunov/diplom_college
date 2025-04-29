const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Получить все уведомления для текущего пользователя
router.get('/', authenticateToken, notificationController.getUserNotifications);

// Получить одно уведомление по ID
router.get('/:id', authenticateToken, notificationController.getNotificationById);

// Создать новое уведомление (только для админов)
router.post('/', authenticateToken, isAdmin, notificationController.createNotification);

// Создать уведомление для всех пользователей (broadcast)
router.post('/broadcast', authenticateToken, isAdmin, notificationController.broadcastNotification);

// Отметить уведомление как прочитанное
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// Удалить уведомление
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

module.exports = router;