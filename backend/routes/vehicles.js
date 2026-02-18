import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  getVehiclesByClient,
  updateVehicle,
} from '../controllers/vehicleController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/',          createVehicle);
router.get('/',           getVehicles);
router.get('/:id',        getVehicleById);
router.get('/client/:clientId', getVehiclesByClient);
router.patch('/:id',      updateVehicle);

export default router;