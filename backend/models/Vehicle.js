import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  plate: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: { msg: 'La placa ya está registrada.' },
    validate: {
      notEmpty: { msg: 'La placa es requerida.' },
    },
  },
  type_vehicle: {
    type: DataTypes.ENUM('MOTORCYCLE', 'CAR', 'TRUCK', 'VAN', 'BUS', 'OTHER'),
    allowNull: false,
    defaultValue: 'MOTORCYCLE',
    validate: {
      notEmpty: { msg: 'El tipo de vehículo es requerido.' },
    },
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La marca es requerida.' },
    },
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El modelo es requerido.' },
    },
  },
  cylinder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: { msg: 'El cilindraje debe ser un número entero.' },
      min: { args: [1], msg: 'El cilindraje debe ser mayor a 0.' },
    },
  },
  operating_hours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      isDecimal: { msg: 'Las horas de operación deben ser un número.' },
      min: { args: [0], msg: 'Las horas de operación no pueden ser negativas.' },
    },
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id',
    },
  },
}, {
  tableName: 'vehicles',
});

export default Vehicle;