import { Response } from 'express';
import { kycService } from '../services/kycService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse, AuthRequest, DocumentType } from '../types';
import { ApiError } from '../utils/ApiError';

/**
 * Initiate KYC verification
 */
export const initiateKYC = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { documents } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const kycVerification = await kycService.initiateKYC(userId, documents);

  const response: ApiResponse = {
    success: true,
    message: 'KYC verification initiated successfully',
    data: {
      kycId: kycVerification._id,
      setuRequestId: kycVerification.setuRequestId,
      url: kycVerification.setuUrl,
      status: kycVerification.status,
      requestedDocuments: kycVerification.requestedDocuments,
      validUpto: kycVerification.validUpto,
      createdAt: kycVerification.createdAt,
    },
  };

  res.status(201).json(response);
});

/**
 * Get KYC verification by ID
 */
export const getKYCById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { kycId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const kycVerification = await kycService.getKYCById(kycId, userId);

  const response: ApiResponse = {
    success: true,
    message: 'KYC verification fetched successfully',
    data: {
      kycId: kycVerification._id,
      setuRequestId: kycVerification.setuRequestId,
      status: kycVerification.status,
      requestedDocuments: kycVerification.requestedDocuments,
      documents: kycVerification.documents,
      validUpto: kycVerification.validUpto,
      completedAt: kycVerification.completedAt,
      errorMessage: kycVerification.errorMessage,
      errorCode: kycVerification.errorCode,
      createdAt: kycVerification.createdAt,
      updatedAt: kycVerification.updatedAt,
    },
  };

  res.status(200).json(response);
});

/**
 * Get all KYC verifications for current user
 */
export const getUserKYCs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const kycVerifications = await kycService.getUserKYCs(userId);

  const response: ApiResponse = {
    success: true,
    message: 'KYC verifications fetched successfully',
    data: {
      count: kycVerifications.length,
      verifications: kycVerifications.map((kyc) => ({
        kycId: kyc._id,
        setuRequestId: kyc.setuRequestId,
        status: kyc.status,
        requestedDocuments: kyc.requestedDocuments,
        documentsCount: kyc.documents.length,
        validUpto: kyc.validUpto,
        completedAt: kyc.completedAt,
        createdAt: kyc.createdAt,
      })),
    },
  };

  res.status(200).json(response);
});

/**
 * Update KYC status (manually refresh from SETU)
 */
export const updateKYCStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { kycId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // First verify ownership
  const kyc = await kycService.getKYCById(kycId, userId);

  // Update status from SETU
  const updatedKYC = await kycService.updateKYCStatus(kyc.setuRequestId, userId);

  const response: ApiResponse = {
    success: true,
    message: 'KYC status updated successfully',
    data: {
      kycId: updatedKYC._id,
      status: updatedKYC.status,
      documents: updatedKYC.documents,
      completedAt: updatedKYC.completedAt,
      errorMessage: updatedKYC.errorMessage,
      updatedAt: updatedKYC.updatedAt,
    },
  };

  res.status(200).json(response);
});

/**
 * Fetch specific document
 */
export const fetchDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { kycId } = req.params;
  const { documentType } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const document = await kycService.fetchDocument(kycId, userId, documentType as DocumentType);

  const response: ApiResponse = {
    success: true,
    message: 'Document fetched successfully',
    data: {
      document,
    },
  };

  res.status(200).json(response);
});

/**
 * Webhook handler for SETU callbacks
 */
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-setu-signature'] as string;
  const payload = req.body;

  if (!signature) {
    throw new ApiError(401, 'Missing webhook signature');
  }

  // Extract webhook secret from payload and verify
  // Note: The webhook secret will be verified inside kycService.handleWebhook
  // after finding the associated user
  await kycService.handleWebhook(payload, signature);

  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
  });
});
