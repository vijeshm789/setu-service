import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export enum KYCStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum DocumentType {
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  DRIVING_LICENSE = 'DL',
  VOTER_ID = 'VOTERID',
  PASSPORT = 'PASSPORT',
}

export interface SetuTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface SetuCreateRequestResponse {
  id: string;
  url: string;
  validUpto: string;
  status: string;
}

export interface SetuDocumentData {
  type: string;
  data: {
    name?: string;
    dob?: string;
    gender?: string;
    address?: string;
    photo?: string;
    uid?: string;
    careOf?: string;
    [key: string]: any;
  };
  documentUrl?: string;
}

export interface SetuWebhookPayload {
  id: string;
  traceId: string;
  status: string;
  documents?: SetuDocumentData[];
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
