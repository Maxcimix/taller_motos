import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById,
} from '../controllers/clientController.js';

const router = Router();

router.post('/', createClient);
router.get('/', getClients);
router.get('/:id', getClientById);

export default router;
