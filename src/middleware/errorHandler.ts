/**
 * Middleware de tratamento de erros para respostas consistentes
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError, BusinessLogicError, NotFoundError, ProcessingError } from '../utils/errors';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  
  // Log do erro para debugging
  console.error(`[${timestamp}] Error in ${req.method} ${req.path}:`, error);

  let statusCode: number;
  let errorCode: string;
  let message: string;
  let details: any = undefined;

  // Determinar tipo de erro e resposta apropriada
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error instanceof BusinessLogicError) {
    statusCode = 422;
    errorCode = 'BUSINESS_LOGIC_ERROR';
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = error.message;
  } else if (error instanceof ProcessingError) {
    statusCode = 422;
    errorCode = 'PROCESSING_ERROR';
    message = error.message;
    if (error.originalError) {
      details = { originalError: error.originalError.message };
    }
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    message = `File upload error: ${error.message}`;
  } else {
    // Erro interno do servidor
    statusCode = 500;
    errorCode = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected error occurred';
    
    // Em produção, não expor detalhes do erro interno
    if (process.env['NODE_ENV'] !== 'production') {
      details = { originalError: error.message, stack: error.stack };
    }
  }

  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message,
      details,
      timestamp
    }
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    }
  };

  res.status(404).json(errorResponse);
};