import axios, { AxiosInstance } from 'axios';
import { config } from '../config/environment';
import { ApiError } from '../utils/ApiError';
import { Logger } from '../utils/logger';
import {
  SetuTokenResponse,
  SetuCreateRequestResponse,
  SetuDocumentData,
  DocumentType,
} from '../types';

export class SetuService {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.setu.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        Logger.debug('SETU API Request', {
          url: config.url,
          method: config.method,
          data: config.data,
        });
        return config;
      },
      (error) => {
        Logger.error('SETU API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        Logger.debug('SETU API Response', {
          url: response.config.url,
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        Logger.error('SETU API Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get OAuth2 access token from SETU
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Return cached token if still valid
      if (this.accessToken && Date.now() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      Logger.info('Fetching new SETU access token');

      const response = await this.axiosInstance.post<SetuTokenResponse>(
        '/api/v2/auth/token',
        {
          clientID: config.setu.clientId,
          secret: config.setu.clientSecret,
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry with 5 minute buffer
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      Logger.info('SETU access token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      Logger.error('Failed to get SETU access token', error);
      throw new ApiError(
        500,
        `SETU authentication failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Create a DigiLocker request
   */
  async createDigiLockerRequest(
    requestedDocuments: DocumentType[],
    redirectUrl?: string
  ): Promise<SetuCreateRequestResponse> {
    try {
      const token = await this.getAccessToken();

      // Map document types to SETU format
      const documents = requestedDocuments.map((docType) => ({
        type: docType,
      }));

      const requestBody = {
        redirectUrl: redirectUrl || config.setu.redirectUrl,
        documents,
      };

      Logger.info('Creating DigiLocker request', { documents });

      const response = await this.axiosInstance.post(
        `/api/v2/digilocker/${config.setu.productInstanceId}/requests`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Logger.info('DigiLocker request created successfully', {
        requestId: response.data.id,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to create DigiLocker request', error);
      throw new ApiError(
        error.response?.status || 500,
        `Failed to create DigiLocker request: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get DigiLocker request status and documents
   */
  async getDigiLockerRequest(requestId: string): Promise<{
    id: string;
    status: string;
    documents?: SetuDocumentData[];
    validUpto?: string;
    error?: {
      code: string;
      message: string;
    };
  }> {
    try {
      const token = await this.getAccessToken();

      Logger.info('Fetching DigiLocker request status', { requestId });

      const response = await this.axiosInstance.get(
        `/api/v2/digilocker/${config.setu.productInstanceId}/requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Logger.info('DigiLocker request status fetched', {
        requestId,
        status: response.data.status,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to get DigiLocker request', error);
      throw new ApiError(
        error.response?.status || 500,
        `Failed to get DigiLocker request: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Fetch specific document from DigiLocker request
   */
  async fetchDocument(requestId: string, documentType: DocumentType): Promise<SetuDocumentData | null> {
    try {
      const requestData = await this.getDigiLockerRequest(requestId);

      if (!requestData.documents || requestData.documents.length === 0) {
        Logger.warn('No documents found in request', { requestId });
        return null;
      }

      const document = requestData.documents.find(
        (doc) => doc.type === documentType
      );

      if (!document) {
        Logger.warn('Document type not found', { requestId, documentType });
        return null;
      }

      Logger.info('Document fetched successfully', { requestId, documentType });
      return document;
    } catch (error: any) {
      Logger.error('Failed to fetch document', error);
      throw error;
    }
  }

  /**
   * Fetch all documents from DigiLocker request
   */
  async fetchAllDocuments(requestId: string): Promise<SetuDocumentData[]> {
    try {
      const requestData = await this.getDigiLockerRequest(requestId);

      if (!requestData.documents || requestData.documents.length === 0) {
        Logger.warn('No documents found in request', { requestId });
        return [];
      }

      Logger.info('All documents fetched successfully', {
        requestId,
        documentCount: requestData.documents.length,
      });

      return requestData.documents;
    } catch (error: any) {
      Logger.error('Failed to fetch all documents', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', config.setu.webhookSecret)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error: any) {
      Logger.error('Failed to verify webhook signature', error);
      return false;
    }
  }
}

export const setuService = new SetuService();
