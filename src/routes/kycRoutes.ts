import { Router } from 'express';
import {
  initiateKYC,
  getKYCById,
  getUserKYCs,
  updateKYCStatus,
  fetchDocument,
  handleWebhook,
} from '../controllers/kycController';
import { validate } from '../middleware/validator';
import { initiateKYCSchema, fetchDocumentSchema } from '../validators/kycValidator';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/kyc/initiate
 * @desc    Initiate KYC verification
 * @access  Private
 */
router.post('/initiate', authenticate, validate(initiateKYCSchema), initiateKYC);

/**
 * @route   GET /api/kyc
 * @desc    Get all KYC verifications for current user
 * @access  Private
 */
router.get('/', authenticate, getUserKYCs);

/**
 * @route   GET /api/kyc/:kycId
 * @desc    Get KYC verification by ID
 * @access  Private
 */
router.get('/:kycId', authenticate, getKYCById);

/**
 * @route   PUT /api/kyc/:kycId/refresh
 * @desc    Refresh KYC status from SETU
 * @access  Private
 */
router.put('/:kycId/refresh', authenticate, updateKYCStatus);

/**
 * @route   POST /api/kyc/:kycId/document
 * @desc    Fetch specific document
 * @access  Private
 */
router.post('/:kycId/document', authenticate, validate(fetchDocumentSchema), fetchDocument);

/**
 * @route   POST /api/kyc/webhook
 * @desc    Webhook handler for SETU callbacks
 * @access  Public (but verified via signature)
 */
router.post('/webhook', handleWebhook);

export default router;
