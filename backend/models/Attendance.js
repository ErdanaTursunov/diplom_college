// models/attendance.js
module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    checkInTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    checkOutTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'pending',     // Ожидается (по умолчанию)
        'upcoming',    // Скоро начнется смена (за 30 минут)
        'active',      // Активная смена (отметился, но еще не ушел)
        'late',        // Опоздание (отметился позже начала смены)
        'finishing',   // Пора уходить (смена закончилась, но нет отметки ухода)
        'completed',   // Завершено (отметился и ушел)
        'missed',      // Пропущено (не отметился)
        'early_leave'  // Ранний уход (ушел до окончания смены)
      ),
      defaultValue: 'pending'
    },
    lateMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'attendances'
  });

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Attendance;
};