// routes/index.js
const express = require('express');
const router = express.Router();
const attendanceRoutes = require("../routes/attendanceRoutes")

// Импорт маршрутов
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const notificationRoutes = require('./notificationRouter');

// Монтирование маршрутов
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;