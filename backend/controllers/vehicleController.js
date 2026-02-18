import { Op } from 'sequelize';
import { Vehicle, Client } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';

// POST /api/vehicles
export const createVehicle = async (req, res, next) => {
  try {
    const { plate, type_vehicle, brand, model, cylinder, operating_hours, client_id } = req.body;

    // Validar que el cliente existe
    const client = await Client.findByPk(client_id);
    if (!client) {
      throw createError(400, 'No existe un cliente con el ID proporcionado.');
    }

    // Verificar plate duplicada
    const existing = await Vehicle.findOne({ where: { plate: plate?.toUpperCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: `El vehículo con plate "${plate}" ya está registrado.` });
    }

    const vehicle = await Vehicle.create({
      plate: plate?.toUpperCase().trim(),
      type_vehicle,
      brand,
      model,
      cylinder: cylinder ? parseInt(cylinder) : null,
      operating_hours: operating_hours ? parseFloat(operating_hours) : 0,
      client_id,
    });

    return res.status(201).json(vehicle);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Un vehículo con esta plate ya está registrado.' });
    }
    next(error);
  }
};

// GET /api/vehicles
export const getVehicles = async (req, res, next) => {
  try {
    const { plate, type_vehicle } = req.query;
    const where = {};

    if (plate) {
      where.plate = { [Op.like]: `%${plate.toUpperCase()}%` };
    }

    if (type_vehicle) {
      where.type_vehicle = type_vehicle;
    }

    const vehicles = await Vehicle.findAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone'] }],
      order: [['created_at', 'DESC']],
    });

    return res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/:id
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }],
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    return res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/client/:clientId
export const getVehiclesByClient = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { client_id: req.params.clientId },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone'] }],
      order: [['created_at', 'DESC']],
    });

    return res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/vehicles/:id
export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    const { plate, type_vehicle, brand, model, cylinder, operating_hours } = req.body;

    await vehicle.update({
      plate: plate ? plate.toUpperCase().trim() : vehicle.plate,
      type_vehicle: type_vehicle || vehicle.type_vehicle,
      brand: brand || vehicle.brand,
      model: model || vehicle.model,
      cylinder: cylinder !== undefined ? (cylinder ? parseInt(cylinder) : null) : vehicle.cylinder,
      operating_hours: operating_hours !== undefined ? parseFloat(operating_hours) : vehicle.operating_hours,
    });

    return res.json(vehicle);
  } catch (error) {
    next(error);
  }
};