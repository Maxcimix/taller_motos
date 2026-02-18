import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const VALID_STATUSES = [
  'RECIBIDA',
  'DIAGNOSTICO',
  'EN_PROCESO',
  'LISTA',
  'ENTREGADA',
  'CANCELADA',
];

export const STATUS_TRANSITIONS = {
  RECIBIDA: ['DIAGNOSTICO', 'CANCELADA'],
  DIAGNOSTICO: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['LISTA', 'CANCELADA'],
  LISTA: ['ENTREGADA', 'CANCELADA'],
  ENTREGADA: [],
  CANCELADA: [],
};

const WorkOrder = sequelize.define('WorkOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id',
    },
  },
  entry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fault_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La descripcion de la falla es obligatoria.' },
    },
  },
  status: {
    type: DataTypes.ENUM(...VALID_STATUSES),
    allowNull: false,
    defaultValue: 'RECIBIDA',
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'work_orders',
});

export default WorkOrder;
