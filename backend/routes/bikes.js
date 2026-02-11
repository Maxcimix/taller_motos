import { Router } from 'express';
import {
  createBike,
  getBikes,
  getBikeById,
} from '../controllers/bikeController.js';

const router = Router();

router.post('/', createBike);
router.get('/', getBikes);
router.get('/:id', getBikeById);

export default router;
