import { Op } from 'sequelize';
import { Client, Vehicle } from '../models/index.js';

export const createClient = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
    }

    // Buscar si ya existe un cliente con ese nombre
    const existing = await Client.findOne({
      where: { name: { [Op.like]: name.trim() } },
    });

    // Si ya existe, devolver el cliente existente con su ID original
    if (existing) {
      return res.status(200).json({
        ...existing.toJSON(),
        _found: true,
      });
    }

    // Si no existe, crear el cliente nuevo
    const client = await Client.create({
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
    });

    return res.status(201).json({
      ...client.toJSON(),
      _found: false,
    });

  } catch (error) {
    if (
      error.name === 'SequelizeUniqueConstraintError' ||
      error.name === 'SequelizeValidationError'
    ) {
      const msg = error.errors?.[0]?.message || 'Error de validacion.';
      return res.status(400).json({ error: msg });
    }
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const clients = await Client.findAll({
      where,
      include: [{
        model: Vehicle,
        as: 'vehicles',
        attributes: ['id', 'plate', 'brand', 'model', 'type_vehicle'],
      }],
      order: [['created_at', 'DESC']],
    });

    return res.json(clients);
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: Vehicle,
        as: 'vehicles',
      }],
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    return res.json(client);
  } catch (error) {
    next(error);
  }
};