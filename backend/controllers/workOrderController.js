import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { WorkOrder, OrderItem, Vehicle, Client, StatusHistory, User } from '../models/index.js';
import { STATUS_TRANSITIONS } from '../models/WorkOrder.js';
import { createError } from '../middleware/errorHandler.js';


const recalculateTotal = async (workOrderId, transaction = null) => {
  const items = await OrderItem.findAll({
    where: { work_order_id: workOrderId },
    ...(transaction && { transaction }),
  });

  const total = items.reduce((sum, item) => {
    return sum + (Number(item.count) * Number(item.unit_value));
  }, 0);

  await WorkOrder.update(
    { total },
    { where: { id: workOrderId }, ...(transaction && { transaction }) }
  );

  return total;
};


export const createWorkOrder = async (req, res, next) => {
  try {
    const { vehicle_id, entry_date, fault_description } = req.body;

    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      throw createError(400, 'The specified vehicle does not exist. Please register the vehicle first.');
    }

    const workOrder = await WorkOrder.create({
      vehicle_id,
      entry_date: entry_date || new Date().toISOString().split('T')[0],
      fault_description,
      status: 'RECIBIDA',
      total: 0,
    });

    return res.status(201).json(workOrder);
  } catch (error) {
    next(error);
  }
};


export const getWorkOrders = async (req, res, next) => {
  try {
    const { status, placa, page = 1, pageSize = 10 } = req.query;
    const where = {};
    const vehicleWhere = {};

    if (status) {
      where.status = status;
    }

    if (placa) {
      vehicleWhere.placa = { [Op.like]: `%${placa.toUpperCase()}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit  = parseInt(pageSize);

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: Object.keys(vehicleWhere).length > 0 ? vehicleWhere : undefined,
          include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit,
      distinct: true,
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getWorkOrderById = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [{ model: Client, as: 'client' }],
        },
        {
          model: OrderItem,
          as: 'items',
          order: [['created_at', 'ASC']],
        },
      ],
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada.' });
    }

    return res.json(workOrder);
  } catch (error) {
    next(error);
  }
};


export const updateWorkOrderStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { toStatus, note } = req.body;

    if (!toStatus) {
      await t.rollback();
      throw createError(400, 'El campo "toStatus" es obligatorio.');
    }

    const workOrder = await WorkOrder.findByPk(req.params.id, { transaction: t });

    if (!workOrder) {
      await t.rollback();
      throw createError(404, 'Orden de trabajo no encontrada.');
    }

    const currentStatus = workOrder.status;

    if (currentStatus === toStatus) {
      await t.rollback();
      throw createError(400, `La orden ya se encuentra en estado "${currentStatus}".`);
    }

    if (currentStatus === 'ENTREGADA') {
      await t.rollback();
      throw createError(400, 'No se puede cambiar el estado de una orden ya entregada.');
    }

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(toStatus)) {
      await t.rollback();
      throw createError(
        400,
        `Transicion de estado invalida: no se puede cambiar de "${currentStatus}" a "${toStatus}". ` +
        `Transiciones permitidas desde "${currentStatus}": [${allowedTransitions.join(', ')}].`
      );
    }

    if (req.user.role === 'MECANICO') {
      const mecanicoAllowed = ['DIAGNOSTICO', 'EN_PROCESO', 'LISTA'];
      if (!mecanicoAllowed.includes(toStatus)) {
        await t.rollback();
        throw createError(403, `Un mecanico no puede cambiar el estado a "${toStatus}".`);
      }
    }

    workOrder.status = toStatus;
    await workOrder.save({ transaction: t });

    await StatusHistory.create({
      work_order_id: workOrder.id,
      from_status: currentStatus,
      to_status: toStatus,
      note: note || null,
      changed_by_user_id: req.user.id,
    }, { transaction: t });

    await t.commit();

    return res.json(workOrder);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    next(error);
  }
};


export const getStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    const workOrder = await WorkOrder.findByPk(id);
    if (!workOrder) {
      throw createError(404, 'Orden de trabajo no encontrada.');
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit  = parseInt(pageSize);

    const { count, rows } = await StatusHistory.findAndCountAll({
      where: { work_order_id: id },
      include: [{
        model: User,
        as: 'changedBy',
        attributes: ['id', 'name', 'email', 'role'],
      }],
      order: [['created_at', 'DESC']],
      offset,
      limit,
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const addOrderItem = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const workOrderId = req.params.id;
    const { type, description, count, unit_value } = req.body;

    const workOrder = await WorkOrder.findByPk(workOrderId, { transaction: t });
    if (!workOrder) {
      await t.rollback();
      throw createError(404, 'Orden de trabajo no encontrada.');
    }

    if (['ENTREGADA', 'CANCELADA'].includes(workOrder.status)) {
      await t.rollback();
      throw createError(400, `No se pueden agregar items a una orden con estado "${workOrder.status}".`);
    }

    const item = await OrderItem.create(
      { work_order_id: workOrderId, type, description, count, unit_value },
      { transaction: t }
    );

    const newTotal = await recalculateTotal(workOrderId, t);
    await t.commit();

    return res.status(201).json({ item, total: newTotal });
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    next(error);
  }
};


export const deleteOrderItem = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const item = await OrderItem.findByPk(req.params.itemId, { transaction: t });

    if (!item) {
      await t.rollback();
      throw createError(404, 'Item no encontrado.');
    }

    const workOrder = await WorkOrder.findByPk(item.work_order_id, { transaction: t });

    if (['ENTREGADA', 'CANCELADA'].includes(workOrder.status)) {
      await t.rollback();
      throw createError(400, `No se pueden eliminar items de una orden con estado "${workOrder.status}".`);
    }

    const workOrderId = item.work_order_id;
    await item.destroy({ transaction: t });

    const newTotal = await recalculateTotal(workOrderId, t);
    await t.commit();

    return res.json({ message: 'Item eliminado correctamente.', total: newTotal });
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    next(error);
  }
};