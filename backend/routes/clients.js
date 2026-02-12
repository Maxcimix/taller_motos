import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById,
} from '../controllers/clientController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createClient);
router.get('/', getClients);
router.get('/:id', getClientById);

export default router;
