import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/toggle-active', toggleUserActive);

export default router;
