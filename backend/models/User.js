module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fullName: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },

      role: {
        type: DataTypes.ENUM("user", "admin"), // Только для контроля доступа
        defaultValue: "user",
      },

      position: {
        type: DataTypes.ENUM(
          "Бариста",
          "Повар",
          "Официант",
          "Менеджер",
          "Кассир",
          "admin",
        ), // Должность внутри школы
        allowNull: false,
      },

      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "users",
    },
  );

  User.associate = (models) => {
    User.hasMany(models.Attendance, { foreignKey: "userId" });
    User.hasMany(models.WorkSchedule, {
      foreignKey: "userId",
      as: "WorkSchedules",
    });
  };

  return User;
};
