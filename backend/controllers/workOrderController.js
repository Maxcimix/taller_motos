import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { WorkOrder, OrderItem, Bike, Client } from '../models/index.js';
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
    const { moto_id, entry_date, fault_description } = req.body;


    const bike = await Bike.findByPk(moto_id);
    if (!bike) {
      throw createError(400, 'La moto especificada no existe. Debe registrar la moto primero.');
    }

    const workOrder = await WorkOrder.create({
      moto_id,
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
    const { status, plate, page = 1, pageSize = 10 } = req.query;
    const where = {};
    const bikeWhere = {};

    if (status) {
      where.status = status;
    }

    if (plate) {
      bikeWhere.placa = { [Op.like]: `%${plate}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        {
          model: Bike,
          as: 'bike',
          where: Object.keys(bikeWhere).length > 0 ? bikeWhere : undefined,
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
          model: Bike,
          as: 'bike',
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
  try {
    const { status: newStatus } = req.body;
    const workOrder = await WorkOrder.findByPk(req.params.id);

    if (!workOrder) {
      throw createError(404, 'Orden de trabajo no encontrada.');
    }

    const currentStatus = workOrder.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw createError(
        400,
        `Transicion de estado invalida: no se puede cambiar de "${currentStatus}" a "${newStatus}". ` +
        `Transiciones permitidas desde "${currentStatus}": [${allowedTransitions.join(', ')}].`
      );
    }

    workOrder.status = newStatus;
    await workOrder.save();

    return res.json(workOrder);
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
