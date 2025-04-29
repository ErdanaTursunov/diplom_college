module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      title: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      message: { 
        type: DataTypes.TEXT, 
        allowNull: false 
      },
      isRead: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
      },
      type: {
        type: DataTypes.ENUM('info', 'alert', 'schedule', 'attendance'),
        defaultValue: 'info'
      },
      createdAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
      },
      updatedAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
      }
    }, {
      tableName: 'notifications'
    });
  
    Notification.associate = (models) => {
      Notification.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return Notification;
  };