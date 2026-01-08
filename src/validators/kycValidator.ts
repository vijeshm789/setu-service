import Joi from 'joi';
import { DocumentType } from '../types';

export const initiateKYCSchema = Joi.object({
  documents: Joi.array()
    .items(
      Joi.string().valid(
        ...Object.values(DocumentType)
      )
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one document type is required',
      'any.required': 'Documents array is required',
      'any.only': 'Invalid document type',
    }),
});

export const fetchDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(...Object.values(DocumentType))
    .required()
    .messages({
      'any.required': 'Document type is required',
      'any.only': 'Invalid document type',
    }),
});
