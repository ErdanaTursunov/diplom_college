// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получение информации о себе
router.get('/me', (req, res) => {
  // req.user установлен в middleware authenticateToken
  req.params.id = req.user.id;
  userController.getUser(req, res);
});

// Маршруты только для админа
router.get('/', isAdmin, userController.getAllUsers);
router.get('/:id', isAdmin, userController.getUser);
router.put('/:id', isAdmin, userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);

module.exports = router;