import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del cliente es obligatorio.' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El telefono es obligatorio.' },
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: { msg: 'El email debe tener un formato valido.' },
    },
  },
}, {
  tableName: 'clients',
});

export default Client;
