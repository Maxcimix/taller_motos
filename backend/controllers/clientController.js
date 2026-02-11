import { Op } from 'sequelize';
import { Client, Bike } from '../models/index.js';


export const createClient = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const client = await Client.create({ name, phone, email });
    return res.status(201).json(client);
  } catch (error) {
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
