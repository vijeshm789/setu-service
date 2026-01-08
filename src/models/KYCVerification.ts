import mongoose, { Document, Schema } from 'mongoose';
import { KYCStatus, DocumentType } from '../types';

export interface IKYCDocument {
  type: DocumentType;
  data: Record<string, any>;
  documentUrl?: string;
  fetchedAt: Date;
}

export interface IKYCVerification extends Document {
  userId: mongoose.Types.ObjectId;
  setuRequestId: string;
  setuUrl?: string;
  status: KYCStatus;
  requestedDocuments: DocumentType[];
  documents: IKYCDocument[];
  validUpto?: Date;
  completedAt?: Date;
  errorMessage?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const kycDocumentSchema = new Schema<IKYCDocument>(
  {
    type: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    documentUrl: {
      type: String,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const kycVerificationSchema = new Schema<IKYCVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    setuRequestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    setuUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
      index: true,
    },
    requestedDocuments: [
      {
        type: String,
        enum: Object.values(DocumentType),
      },
    ],
    documents: [kycDocumentSchema],
    validUpto: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
    errorCode: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
kycVerificationSchema.index({ userId: 1, status: 1 });
kycVerificationSchema.index({ createdAt: -1 });

export const KYCVerification = mongoose.model<IKYCVerification>(
  'KYCVerification',
  kycVerificationSchema
);
