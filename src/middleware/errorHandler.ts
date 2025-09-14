/**
 * Middleware de tratamento de erros para respostas consistentes
 */

import { Request, Response, NextFunction } from 'express';
import { 
  ValidationError, 
  BusinessLogicError, 
  NotFoundError, 
  ProcessingError,
  DatabaseError,
  NetworkError,
  FileProcessingError,
  TimeoutError
} from '../utils/errors';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Utilitário de registro para diferentes níveis de erro
 */
class ErrorLogger {
  static logError(level: 'error' | 'warn' | 'info', message: string, error?: Error, context?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      context
    };

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, logEntry);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, logEntry);
        break;
      case 'info':
        console.info(`[${timestamp}] INFO:`, logEntry);
        break;
    }
  }
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
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
  
  let statusCode: number;
  let errorCode: string;
  let message: string;
  let details: any = undefined;
  let logLevel: 'error' | 'warn' | 'info' = 'error';

  // Determinar o tipo de erro e a resposta apropriada
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
    logLevel = 'warn';
    if (error.field) {
      details = { field: error.field };
    }
  } else if (error instanceof BusinessLogicError) {
    statusCode = 422;
    errorCode = 'BUSINESS_LOGIC_ERROR';
    message = error.message;
    logLevel = 'warn';
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = error.message;
    logLevel = 'info';
    if (error.resource) {
      details = { resource: error.resource };
    }
  } else if (error instanceof ProcessingError) {
    statusCode = 422;
    errorCode = 'PROCESSING_ERROR';
    message = error.message;
    if (error.originalError) {
      details = { originalError: error.originalError.message };
    }
  } else if (error instanceof DatabaseError) {
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = 'Database operation failed';
    if (error.operation) {
      details = { operation: error.operation };
    }
    // Não expor erros internos do banco de dados em produção
    if (process.env['NODE_ENV'] !== 'production') {
      message = error.message;
      if (error.originalError) {
        details = { ...details, originalError: error.originalError.message };
      }
    }
  } else if (error instanceof NetworkError) {
    statusCode = 422;
    errorCode = 'NETWORK_ERROR';
    message = error.message;
    if (error.url) {
      details = { url: error.url };
    }
    if (error.originalError) {
      details = { ...details, originalError: error.originalError.message };
    }
  } else if (error instanceof FileProcessingError) {
    statusCode = 422;
    errorCode = 'FILE_PROCESSING_ERROR';
    message = error.message;
    if (error.fileName) {
      details = { fileName: error.fileName };
    }
    if (error.originalError) {
      details = { ...details, originalError: error.originalError.message };
    }
  } else if (error instanceof TimeoutError) {
    statusCode = 408;
    errorCode = 'TIMEOUT_ERROR';
    message = error.message;
    if (error.timeout) {
      details = { timeout: error.timeout };
    }
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    message = `File upload error: ${error.message}`;
    logLevel = 'warn';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
    logLevel = 'warn';
  } else {
    // Erro interno do servidor
    statusCode = 500;
    errorCode = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected error occurred';
    
    // Não expor detalhes de erro interno em produção
    if (process.env['NODE_ENV'] !== 'production') {
      details = { originalError: error.message, stack: error.stack };
    }
  }

  // Registrar erro com nível apropriado e contexto
  ErrorLogger.logError(logLevel, `${req.method} ${req.path}`, error, {
    requestId,
    statusCode,
    errorCode,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message,
      ...(details !== undefined && { details }),
      timestamp,
      requestId
    }
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para lidar com rotas 404
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
  
  ErrorLogger.logError('info', `Route not found: ${req.method} ${req.path}`, undefined, {
    requestId,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  const errorResponse: ErrorResponse = {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  res.status(404).json(errorResponse);
};

/**
 * Wrapper assíncrono de erro para capturar erros em handlers de rotas assíncronas
 */
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};