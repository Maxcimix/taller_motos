import { Router } from 'express';
import {
  createBike,
  getBikes,
  getBikeById,
} from '../controllers/bikeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createBike);
router.get('/', getBikes);
router.get('/:id', getBikeById);

export default router;
