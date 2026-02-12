import { User } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';

export const getUsers = async (_req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    return res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw createError(400, 'Nombre, email y password son obligatorios.');
    }

    if (password.length < 6) {
      throw createError(400, 'La contrasena debe tener al menos 6 caracteres.');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
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

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'MECANICO'].includes(role)) {
      throw createError(400, 'El rol debe ser ADMIN o MECANICO.');
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw createError(404, 'Usuario no encontrado.');
    }

    user.role = role;
    await user.save();

    return res.json(user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

export const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw createError(404, 'Usuario no encontrado.');
    }

    user.active = !user.active;
    await user.save();

    return res.json(user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};
