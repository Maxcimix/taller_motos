import { Router } from 'express';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrderById,
  updateWorkOrderStatus,
  getStatusHistory,
  addOrderItem,
  deleteOrderItem,
} from '../controllers/workOrderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createWorkOrder);
router.get('/', getWorkOrders);
router.get('/:id', getWorkOrderById);
router.patch('/:id/status', updateWorkOrderStatus);
router.get('/:id/history', getStatusHistory);
router.post('/:id/items', addOrderItem);
router.delete('/items/:itemId', deleteOrderItem);

export default router;
