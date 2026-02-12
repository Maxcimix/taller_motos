import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pavas_sas_default_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw createError(400, 'Nombre, email y password son obligatorios.');
    }

    if (password.length < 6) {
      throw createError(400, 'La contrasena debe tener al menos 6 caracteres.');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw createError(409, 'Ya existe un usuario con este email.');
    }

    const user = await User.create({
      name,
      email,
      password_hash: password,
      role: role || 'MECANICO',
    });

    return res.status(201).json(user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError(400, 'Email y password son obligatorios.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw createError(401, 'Credenciales invalidas.');
    }

    if (!user.active) {
      throw createError(401, 'Credenciales invalidas.');
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw createError(401, 'Credenciales invalidas.');
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw createError(404, 'Usuario no encontrado.');
    }
    return res.json(user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};
