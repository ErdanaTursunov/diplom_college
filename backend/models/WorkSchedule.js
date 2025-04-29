module.exports = (sequelize, DataTypes) => {
  const WorkSchedule = sequelize.define('WorkSchedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'users', key: 'id' }
    },
    date: { // Добавляем конкретную дату расписания
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false }
  }, {
    tableName: 'work_schedules',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date'] // Один пользователь — одно расписание на день
      }
    ]
  });

  WorkSchedule.associate = (models) => {
    WorkSchedule.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return WorkSchedule;
};
