import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  name: Joi.string().min(2).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'any.required': 'Name is required',
  }),
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Phone number must be 10 digits',
  }),
  setuCredentials: Joi.object({
    clientId: Joi.string().required().messages({
      'any.required': 'SETU Client ID is required',
    }),
    clientSecret: Joi.string().required().messages({
      'any.required': 'SETU Client Secret is required',
    }),
    productInstanceId: Joi.string().required().messages({
      'any.required': 'SETU Product Instance ID is required',
    }),
    webhookSecret: Joi.string().required().messages({
      'any.required': 'SETU Webhook Secret is required',
    }),
    baseUrl: Joi.string().uri().optional().messages({
      'string.uri': 'SETU Base URL must be a valid URI',
    }),
    redirectUrl: Joi.string().uri().required().messages({
      'string.uri': 'Redirect URL must be a valid URI',
      'any.required': 'Redirect URL is required',
    }),
  }).required().messages({
    'any.required': 'SETU credentials are required',
  }),
});
