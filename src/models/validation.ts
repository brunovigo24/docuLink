/**
 * Esquemas de validação Joi para entradas de API
 */

import Joi from 'joi';

export const createClientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must not be empty',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required'
    })
});

export const updateClientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Name must not be empty',
      'string.min': 'Name must not be empty',
      'string.max': 'Name must not exceed 255 characters'
    }),
  email: Joi.string()
    .email()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 255 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

  // Validação de schemas de documentos
export const processPDFSchema = Joi.object({
  client_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Client ID must be a number',
      'number.integer': 'Client ID must be an integer',
      'number.positive': 'Client ID must be positive',
      'any.required': 'Client ID is required'
    })
});

export const processWebSchema = Joi.object({
  client_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Client ID must be a number',
      'number.integer': 'Client ID must be an integer',
      'number.positive': 'Client ID must be positive',
      'any.required': 'Client ID is required'
    }),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .max(1000)
    .required()
    .messages({
      'string.uri': 'URL must be a valid HTTP or HTTPS URL',
      'string.max': 'URL must not exceed 1000 characters',
      'any.required': 'URL is required'
    })
});

// Validação de schemas comuns
export const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
});

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// Validação de tipos de arquivo
export const validateFileType = (mimetype: string): boolean => {
  return mimetype === 'application/pdf';
};

export const validateFileSize = (size: number, maxSizeInMB: number = 10): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
};

// Validação de URLs
export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};