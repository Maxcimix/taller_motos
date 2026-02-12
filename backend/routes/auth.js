import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authenticate, authorize('ADMIN'), register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, me);

export default router;
