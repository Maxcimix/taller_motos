import { Op } from 'sequelize';
import { Bike, Client } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';

export const createBike = async (req, res, next) => {
  try {
    const { placa, brand, model, cylinder, client_id } = req.body;


    const client = await Client.findByPk(client_id);
    if (!client) {
      throw createError(400, 'El cliente especificado no existe.');
    }

    const bike = await Bike.create({ placa, brand, model, cylinder, client_id });
    return res.status(201).json(bike);
  } catch (error) {
    next(error);
  }
};


export const getBikes = async (req, res, next) => {
  try {
    const { plate } = req.query;
    const where = {};

    if (plate) {
      where.placa = { [Op.like]: `%${plate}%` };
    }

    const bikes = await Bike.findAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone'] }],
      order: [['created_at', 'DESC']],
    });

    return res.json(bikes);
  } catch (error) {
    next(error);
  }
};


export const getBikeById = async (req, res, next) => {
  try {
    const bike = await Bike.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }],
    });

    if (!bike) {
      return res.status(404).json({ error: 'Moto no encontrada.' });
    }

    return res.json(bike);
  } catch (error) {
    next(error);
  }
};
