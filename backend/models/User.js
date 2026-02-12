import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es obligatorio.' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' },
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: { msg: 'Ya existe un usuario con este email.' },
    validate: {
      notEmpty: { msg: 'El email es obligatorio.' },
      isEmail: { msg: 'El email debe tener un formato valido.' },
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'MECANICO'),
    allowNull: false,
    defaultValue: 'MECANICO',
    validate: {
      isIn: {
        args: [['ADMIN', 'MECANICO']],
        msg: 'El rol debe ser ADMIN o MECANICO.',
      },
    },
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, SALT_ROUNDS);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, SALT_ROUNDS);
      }
    },
  },
});

User.prototype.validatePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

User.prototype.toSafeJSON = function () {
  const values = this.toJSON();
  delete values.password_hash;
  return values;
};

export default User;
