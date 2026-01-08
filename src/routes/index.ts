import { Router } from 'express';
import authRoutes from './authRoutes';
import kycRoutes from './kycRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);

export default router;
