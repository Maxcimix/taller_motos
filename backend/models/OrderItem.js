import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OrderItem = sequelize.define('OrderItem', {
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
  type: {
    type: DataTypes.ENUM('MANO_OBRA', 'REPUESTO'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['MANO_OBRA', 'REPUESTO']],
        msg: 'El tipo debe ser MANO_OBRA o REPUESTO.',
      },
    },
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La descripcion del item es obligatoria.' },
    },
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'La cantidad debe ser un numero entero.' },
      min: { args: [1], msg: 'La cantidad debe ser mayor a 0.' },
    },
  },
  unit_value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El valor unitario debe ser un numero.' },
      min: { args: [0], msg: 'El valor unitario no puede ser negativo.' },
    },
  },
}, {
  tableName: 'order_items',
});

export default OrderItem;
