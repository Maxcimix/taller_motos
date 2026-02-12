import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { createError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pavas_sas_default_secret_change_me';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw createError(401, 'Acceso no autorizado. Token no proporcionado.');
    }

    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      throw createError(401, 'Token invalido o expirado.');
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.active) {
      throw createError(401, 'Usuario no encontrado o desactivado.');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(createError(401, 'Acceso no autorizado.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'No tiene permisos para realizar esta accion.'));
    }
    next();
  };
};
