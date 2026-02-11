import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Bike = sequelize.define('Bike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  placa: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: { msg: 'Ya existe una moto registrada con esta placa.' },
    validate: {
      notEmpty: { msg: 'La placa es obligatoria.' },
    },
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La marca es obligatoria.' },
    },
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El modelo es obligatorio.' },
    },
  },
  cylinder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: { msg: 'El cilindraje debe ser un numero entero.' },
      min: { args: [1], msg: 'El cilindraje debe ser mayor a 0.' },
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
  tableName: 'bikes',
});

export default Bike;
