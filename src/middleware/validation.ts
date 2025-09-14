/**
 * Middleware de validação usando Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

export interface ValidatedRequest<T = any> extends Request {
  validatedData: T;
}

/**
 * Middleware genérico para validação de body
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new ValidationError(
        error.details.map(d => d.message).join(', ')
      );
      return next(validationError);
    }

    (req as ValidatedRequest).validatedData = value;
    next();
  };
};

/**
 * Middleware genérico para validação de params
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      convert: true
    });

    if (error) {
      const validationError = new ValidationError(
        error.details.map(d => d.message).join(', ')
      );
      return next(validationError);
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware genérico para validação de query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert: true
    });

    if (error) {
      const validationError = new ValidationError(
        error.details.map(d => d.message).join(', ')
      );
      return next(validationError);
    }

    req.query = value;
    next();
  };
};