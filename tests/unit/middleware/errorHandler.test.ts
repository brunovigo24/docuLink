import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, asyncErrorHandler } from '../../../src/middleware/errorHandler';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  NetworkError,
  FileProcessingError,
  TimeoutError
} from '../../../src/utils/errors';

// Mockar métodos de console para evitar ruído nos testes
const originalConsole = console;
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      headers: {},
      ip: '127.0.0.1'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('ValidationError handling', () => {
    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid email format', 'email');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          details: { field: 'email' },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    it('should handle ValidationError without field details', () => {
      const error = new ValidationError('Invalid data');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: undefined,
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('NotFoundError handling', () => {
    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Client not found', 'client');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
          details: { resource: 'client' },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('DatabaseError handling', () => {
    it('should handle DatabaseError with 500 status in production', () => {
      process.env['NODE_ENV'] = 'production';
      const originalError = new Error('Connection timeout');
      const error = new DatabaseError('Database connection failed', originalError, 'findById');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: { operation: 'findById' },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    it('should expose database error details in development', () => {
      process.env['NODE_ENV'] = 'development';
      const originalError = new Error('Connection timeout');
      const error = new DatabaseError('Database connection failed', originalError, 'findById');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
          details: { 
            operation: 'findById',
            originalError: 'Connection timeout'
          },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('NetworkError handling', () => {
    it('should handle NetworkError with 422 status', () => {
      const originalError = new Error('ECONNREFUSED');
      const error = new NetworkError('Failed to connect to URL', originalError, 'https://example.com');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to URL',
          details: { 
            url: 'https://example.com',
            originalError: 'ECONNREFUSED'
          },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('FileProcessingError handling', () => {
    it('should handle FileProcessingError with 422 status', () => {
      const originalError = new Error('Invalid PDF format');
      const error = new FileProcessingError('Failed to process PDF', originalError, 'document.pdf');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'FILE_PROCESSING_ERROR',
          message: 'Failed to process PDF',
          details: { 
            fileName: 'document.pdf',
            originalError: 'Invalid PDF format'
          },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('TimeoutError handling', () => {
    it('should handle TimeoutError with 408 status', () => {
      const error = new TimeoutError('Request timeout', 30000);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(408);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Request timeout',
          details: { timeout: 30000 },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('MulterError handling', () => {
    it('should handle MulterError with 400 status', () => {
      const error = new Error('File too large');
      error.name = 'MulterError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: 'File upload error: File too large',
          details: undefined,
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('JSON SyntaxError handling', () => {
    it('should handle JSON SyntaxError with 400 status', () => {
      const error = new SyntaxError('Unexpected token');
      (error as any).body = true; // Simular erro de parsing JSON
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          details: undefined,
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('Generic Error handling', () => {
    it('should handle unknown errors with 500 status in production', () => {
      process.env['NODE_ENV'] = 'production';
      const error = new Error('Unknown error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: undefined,
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    it('should expose error details in development', () => {
      process.env['NODE_ENV'] = 'development';
      const error = new Error('Unknown error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: { 
            originalError: 'Unknown error',
            stack: expect.any(String)
          },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('Request ID handling', () => {
    it('should use provided request ID from headers', () => {
      mockRequest.headers = { 'x-request-id': 'test-request-123' };
      const error = new ValidationError('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test error',
          details: undefined,
          timestamp: expect.any(String),
          requestId: 'test-request-123'
        }
      });
    });
  });
});

describe('Not Found Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/nonexistent',
      headers: {},
      ip: '127.0.0.1'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should handle 404 routes correctly', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route GET /nonexistent not found',
        timestamp: expect.any(String),
        requestId: expect.any(String)
      }
    });
  });
});

describe('Async Error Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should catch async errors and pass to next', async () => {
    const asyncFunction = async () => {
      throw new Error('Async error');
    };
    
    const wrappedFunction = asyncErrorHandler(asyncFunction);
    await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle successful async functions', async () => {
    const asyncFunction = async (_req: Request, res: Response) => {
      res.json({ success: true });
    };
    
    mockResponse.json = jest.fn();
    const wrappedFunction = asyncErrorHandler(asyncFunction);
    await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
  });
});