import { Router } from 'express';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrderById,
  updateWorkOrderStatus,
  addOrderItem,
  deleteOrderItem,
} from '../controllers/workOrderController.js';

const router = Router();

router.post('/', createWorkOrder);
router.get('/', getWorkOrders);
router.get('/:id', getWorkOrderById);
router.patch('/:id/status', updateWorkOrderStatus);
router.post('/:id/items', addOrderItem);
router.delete('/items/:itemId', deleteOrderItem);

export default router;
