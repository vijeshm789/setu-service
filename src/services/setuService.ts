import axios, { AxiosInstance } from 'axios';
import { ApiError } from '../utils/ApiError';
import { Logger } from '../utils/logger';
import { ISetuCredentials } from '../models/User';
import {
  SetuTokenResponse,
  SetuCreateRequestResponse,
  SetuDocumentData,
  DocumentType,
} from '../types';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

export class SetuService {
  private tokenCache: Map<string, TokenCache> = new Map();

  /**
   * Get cache key for user credentials
   */
  private getCacheKey(credentials: ISetuCredentials): string {
    return `${credentials.clientId}:${credentials.productInstanceId}`;
  }

  /**
   * Create axios instance for SETU API
   */
  private createAxiosInstance(baseUrl: string): AxiosInstance {
    const axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    axiosInstance.interceptors.request.use(
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
    axiosInstance.interceptors.response.use(
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

    return axiosInstance;
  }

  /**
   * Get OAuth2 access token from SETU
   */
  private async getAccessToken(credentials: ISetuCredentials): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(credentials);
      const cached = this.tokenCache.get(cacheKey);

      // Return cached token if still valid
      if (cached && Date.now() < cached.expiresAt) {
        return cached.accessToken;
      }

      Logger.info('Fetching new SETU access token', { clientId: credentials.clientId });

      const baseUrl = credentials.baseUrl || 'https://dg-sandbox.setu.co';
      const axiosInstance = this.createAxiosInstance(baseUrl);

      const response = await axiosInstance.post<SetuTokenResponse>(
        '/api/v2/auth/token',
        {
          clientID: credentials.clientId,
          secret: credentials.clientSecret,
        }
      );

      const accessToken = response.data.access_token;
      // Set expiry with 5 minute buffer
      const expiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      // Cache the token
      this.tokenCache.set(cacheKey, { accessToken, expiresAt });

      Logger.info('SETU access token obtained successfully');
      return accessToken;
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
    credentials: ISetuCredentials,
    requestedDocuments: DocumentType[]
  ): Promise<SetuCreateRequestResponse> {
    try {
      const token = await this.getAccessToken(credentials);
      const baseUrl = credentials.baseUrl || 'https://dg-sandbox.setu.co';
      const axiosInstance = this.createAxiosInstance(baseUrl);

      // Map document types to SETU format
      const documents = requestedDocuments.map((docType) => ({
        type: docType,
      }));

      const requestBody = {
        redirectUrl: credentials.redirectUrl,
        documents,
      };

      Logger.info('Creating DigiLocker request', { documents });

      const response = await axiosInstance.post(
        `/api/v2/digilocker/${credentials.productInstanceId}/requests`,
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
  async getDigiLockerRequest(
    credentials: ISetuCredentials,
    requestId: string
  ): Promise<{
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
      const token = await this.getAccessToken(credentials);
      const baseUrl = credentials.baseUrl || 'https://dg-sandbox.setu.co';
      const axiosInstance = this.createAxiosInstance(baseUrl);

      Logger.info('Fetching DigiLocker request status', { requestId });

      const response = await axiosInstance.get(
        `/api/v2/digilocker/${credentials.productInstanceId}/requests/${requestId}`,
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
  async fetchDocument(
    credentials: ISetuCredentials,
    requestId: string,
    documentType: DocumentType
  ): Promise<SetuDocumentData | null> {
    try {
      const requestData = await this.getDigiLockerRequest(credentials, requestId);

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
  async fetchAllDocuments(
    credentials: ISetuCredentials,
    requestId: string
  ): Promise<SetuDocumentData[]> {
    try {
      const requestData = await this.getDigiLockerRequest(credentials, requestId);

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
  verifyWebhookSignature(
    credentials: ISetuCredentials,
    payload: string,
    signature: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', credentials.webhookSecret)
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
