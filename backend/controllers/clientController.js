import { Op } from 'sequelize';
import { Client, Bike } from '../models/index.js';

export const createClient = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    // Validacion manual: nombre obligatorio
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
    }

    // Verificar si ya existe un cliente con el mismo nombre (case-insensitive)
    const existing = await Client.findOne({
      where: { name: { [Op.like]: name.trim() } },
    });

    if (existing) {
      return res.status(409).json({
        error: `Ya existe un cliente registrado con el nombre "${existing.name}". ID: ${existing.id}.`,
      });
    }

    const client = await Client.create({
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
    });

    return res.status(201).json(client);
  } catch (error) {
    // Capturar error de unique constraint de Sequelize/MySQL por si acaso
    if (
      error.name === 'SequelizeUniqueConstraintError' ||
      error.name === 'SequelizeValidationError'
    ) {
      const msg = error.errors?.[0]?.message || 'Ya existe un cliente con ese nombre.';
      return res.status(409).json({ error: msg });
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
      include: [{ model: Bike, as: 'bikes', attributes: ['id', 'placa', 'brand', 'model'] }],
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
      include: [{ model: Bike, as: 'bikes' }],
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    return res.json(client);
  } catch (error) {
    next(error);
  }
};