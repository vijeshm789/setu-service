import { Router } from 'express';
import { register, getProfile } from '../controllers/authController';
import { validate } from '../middleware/validator';
import { registerSchema } from '../validators/authValidator';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with SETU credentials and get authentication token
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

export default router;
