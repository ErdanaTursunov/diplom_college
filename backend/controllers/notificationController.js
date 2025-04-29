const { User, Notification } = require('../models');

// Получить все уведомления для текущего пользователя
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось получить уведомления',
      error: error.message
    });
  }
};

// Получить одно уведомление по ID
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      where: { id, userId }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось получить уведомление',
      error: error.message
    });
  }
};

// Создать новое уведомление для конкретного пользователя
exports.createNotification = async (req, res) => {
  try {
    // Проверка прав доступа выполняется middleware isAdmin
    
    const { userId, title, message, type } = req.body;
    
    // Проверка существования пользователя
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Создание уведомления
    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'info'
    });
    
    return res.status(201).json({
      success: true,
      message: 'Уведомление успешно создано',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось создать уведомление',
      error: error.message
    });
  }
};

// Отправить уведомление всем пользователям
exports.broadcastNotification = async (req, res) => {
  try {
    // Проверка прав доступа выполняется middleware isAdmin
    
    const { title, message, type, targetPosition } = req.body;
    
    // Получение всех пользователей (с фильтрацией по должности, если указана)
    const whereClause = targetPosition ? { position: targetPosition } : {};
    const users = await User.findAll({ where: whereClause });
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователи не найдены'
      });
    }
    
    // Создание уведомлений для каждого пользователя
    const notificationPromises = users.map(user => {
      return Notification.create({
        userId: user.id,
        title,
        message,
        type: type || 'info'
      });
    });
    
    await Promise.all(notificationPromises);
    
    return res.status(201).json({
      success: true,
      message: `Уведомление успешно отправлено ${users.length} пользователям`,
      recipientCount: users.length
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось отправить массовое уведомление',
      error: error.message
    });
  }
};

// Отметить уведомление как прочитанное
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      where: { id, userId }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Уведомление отмечено как прочитанное',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось отметить уведомление как прочитанное',
      error: error.message
    });
  }
};

// Удалить уведомление
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Проверяем, существует ли уведомление и принадлежит ли оно текущему пользователю
    const notification = await Notification.findOne({
      where: { id, userId }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено'
      });
    }
    
    await notification.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Уведомление успешно удалено'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось удалить уведомление',
      error: error.message
    });
  }
};