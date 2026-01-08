import { KYCVerification, IKYCVerification } from '../models/KYCVerification';
import { setuService } from './setuService';
import { DocumentType, KYCStatus, SetuWebhookPayload } from '../types';
import { ApiError } from '../utils/ApiError';
import { Logger } from '../utils/logger';

export class KYCService {
  /**
   * Initiate KYC verification
   */
  async initiateKYC(
    userId: string,
    requestedDocuments: DocumentType[]
  ): Promise<IKYCVerification> {
    try {
      // Validate requested documents
      if (!requestedDocuments || requestedDocuments.length === 0) {
        throw new ApiError(400, 'At least one document type must be requested');
      }

      // Create DigiLocker request with SETU
      const setuResponse = await setuService.createDigiLockerRequest(requestedDocuments);

      // Create KYC verification record
      const kycVerification = await KYCVerification.create({
        userId,
        setuRequestId: setuResponse.id,
        setuUrl: setuResponse.url,
        status: KYCStatus.PENDING,
        requestedDocuments,
        validUpto: new Date(setuResponse.validUpto),
        documents: [],
      });

      Logger.info('KYC verification initiated', {
        userId,
        kycId: kycVerification._id,
        setuRequestId: setuResponse.id,
      });

      return kycVerification;
    } catch (error: any) {
      Logger.error('Failed to initiate KYC', error);
      throw error;
    }
  }

  /**
   * Get KYC verification by ID
   */
  async getKYCById(kycId: string, userId: string): Promise<IKYCVerification | null> {
    try {
      const kycVerification = await KYCVerification.findOne({
        _id: kycId,
        userId,
      });

      if (!kycVerification) {
        throw new ApiError(404, 'KYC verification not found');
      }

      return kycVerification;
    } catch (error: any) {
      Logger.error('Failed to get KYC by ID', error);
      throw error;
    }
  }

  /**
   * Get all KYC verifications for a user
   */
  async getUserKYCs(userId: string): Promise<IKYCVerification[]> {
    try {
      const kycVerifications = await KYCVerification.find({ userId }).sort({
        createdAt: -1,
      });

      return kycVerifications;
    } catch (error: any) {
      Logger.error('Failed to get user KYCs', error);
      throw error;
    }
  }

  /**
   * Update KYC status from SETU
   */
  async updateKYCStatus(setuRequestId: string): Promise<IKYCVerification> {
    try {
      const kycVerification = await KYCVerification.findOne({ setuRequestId });

      if (!kycVerification) {
        throw new ApiError(404, 'KYC verification not found');
      }

      // Fetch latest status from SETU
      const setuData = await setuService.getDigiLockerRequest(setuRequestId);

      // Update KYC record
      kycVerification.status = this.mapSetuStatusToKYCStatus(setuData.status);

      if (setuData.documents && setuData.documents.length > 0) {
        kycVerification.documents = setuData.documents.map((doc) => ({
          type: doc.type as DocumentType,
          data: doc.data,
          documentUrl: doc.documentUrl,
          fetchedAt: new Date(),
        }));
      }

      if (setuData.error) {
        kycVerification.errorCode = setuData.error.code;
        kycVerification.errorMessage = setuData.error.message;
      }

      if (kycVerification.status === KYCStatus.COMPLETED) {
        kycVerification.completedAt = new Date();
      }

      await kycVerification.save();

      Logger.info('KYC status updated', {
        setuRequestId,
        status: kycVerification.status,
      });

      return kycVerification;
    } catch (error: any) {
      Logger.error('Failed to update KYC status', error);
      throw error;
    }
  }

  /**
   * Fetch specific document for a KYC verification
   */
  async fetchDocument(
    kycId: string,
    userId: string,
    documentType: DocumentType
  ): Promise<any> {
    try {
      const kycVerification = await this.getKYCById(kycId, userId);

      if (!kycVerification) {
        throw new ApiError(404, 'KYC verification not found');
      }

      // Check if document was already fetched
      const existingDoc = kycVerification.documents.find(
        (doc) => doc.type === documentType
      );

      if (existingDoc) {
        Logger.info('Returning cached document', { kycId, documentType });
        return existingDoc;
      }

      // Fetch from SETU
      const document = await setuService.fetchDocument(
        kycVerification.setuRequestId,
        documentType
      );

      if (!document) {
        throw new ApiError(404, 'Document not found or not yet available');
      }

      // Update KYC record with fetched document
      kycVerification.documents.push({
        type: documentType,
        data: document.data,
        documentUrl: document.documentUrl,
        fetchedAt: new Date(),
      });

      await kycVerification.save();

      Logger.info('Document fetched and cached', { kycId, documentType });

      return document;
    } catch (error: any) {
      Logger.error('Failed to fetch document', error);
      throw error;
    }
  }

  /**
   * Handle webhook from SETU
   */
  async handleWebhook(payload: SetuWebhookPayload): Promise<void> {
    try {
      const kycVerification = await KYCVerification.findOne({
        setuRequestId: payload.id,
      });

      if (!kycVerification) {
        Logger.warn('KYC verification not found for webhook', {
          setuRequestId: payload.id,
        });
        return;
      }

      // Update status
      kycVerification.status = this.mapSetuStatusToKYCStatus(payload.status);

      // Update documents if available
      if (payload.documents && payload.documents.length > 0) {
        kycVerification.documents = payload.documents.map((doc) => ({
          type: doc.type as DocumentType,
          data: doc.data,
          documentUrl: doc.documentUrl,
          fetchedAt: new Date(),
        }));
      }

      // Update error if present
      if (payload.error) {
        kycVerification.errorCode = payload.error.code;
        kycVerification.errorMessage = payload.error.message;
      }

      // Set completion time
      if (kycVerification.status === KYCStatus.COMPLETED) {
        kycVerification.completedAt = new Date();
      }

      await kycVerification.save();

      Logger.info('Webhook processed successfully', {
        setuRequestId: payload.id,
        status: kycVerification.status,
      });
    } catch (error: any) {
      Logger.error('Failed to handle webhook', error);
      throw error;
    }
  }

  /**
   * Map SETU status to KYC status
   */
  private mapSetuStatusToKYCStatus(setuStatus: string): KYCStatus {
    const statusMap: Record<string, KYCStatus> = {
      pending: KYCStatus.PENDING,
      in_progress: KYCStatus.IN_PROGRESS,
      complete: KYCStatus.COMPLETED,
      completed: KYCStatus.COMPLETED,
      failed: KYCStatus.FAILED,
      expired: KYCStatus.EXPIRED,
    };

    return statusMap[setuStatus.toLowerCase()] || KYCStatus.PENDING;
  }
}

export const kycService = new KYCService();
