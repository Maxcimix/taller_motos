import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const StatusHistory = sequelize.define('StatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  work_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'work_orders',
      key: 'id',
    },
  },
  from_status: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  to_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  changed_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'work_order_status_history',
  updatedAt: false,
  indexes: [
    {
      fields: ['work_order_id', 'created_at'],
    },
  ],
});

export default StatusHistory;
