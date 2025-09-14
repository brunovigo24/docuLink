import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler, asyncErrorHandler } from '../../src/middleware/errorHandler';
import { ValidationError, DatabaseError, NetworkError } from '../../src/utils/errors';

// Criar app de teste
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Rotas de teste que lançam diferentes tipos de erros
  app.get('/validation-error', (_req, _res, next) => {
    next(new ValidationError('Invalid email format', 'email'));
  });

  app.get('/database-error', (_req, _res, next) => {
    const originalError = new Error('Connection timeout');
    next(new DatabaseError('Database connection failed', originalError, 'findById'));
  });

  app.get('/network-error', (_req, _res, next) => {
    const originalError = new Error('ECONNREFUSED');
    next(new NetworkError('Failed to connect to URL', originalError, 'https://example.com'));
  });

  app.get('/generic-error', (_req, _res, next) => {
    next(new Error('Something went wrong'));
  });

  app.get('/async-error', asyncErrorHandler(async (_req: express.Request, _res: express.Response, _next: express.NextFunction) => {
    throw new ValidationError('Async validation error');
  }));

  app.post('/invalid-json', (_req, res) => {
    res.json({ message: 'Should not reach here' });
  }); 

  // Aplicar middleware de tratamento de erros
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('Error Handling Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('ValidationError responses', () => {
    it('should return 400 with proper error structure for validation errors', async () => {
      const response = await request(app)
        .get('/validation-error')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          details: { field: 'email' },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('DatabaseError responses', () => {
    it('should return 500 with masked error in production', async () => {
      process.env['NODE_ENV'] = 'production';
      
      const response = await request(app)
        .get('/database-error')
        .expect(500);

      expect(response.body).toMatchObject({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: { operation: 'findById' },
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    it('should return 500 with detailed error in development', async () => {
      process.env['NODE_ENV'] = 'development';
      
      const response = await request(app)
        .get('/database-error')
        .expect(500);

      expect(response.body).toMatchObject({
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

  describe('NetworkError responses', () => {
    it('should return 422 with network error details', async () => {
      const response = await request(app)
        .get('/network-error')
        .expect(422);

      expect(response.body).toMatchObject({
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

  describe('Generic error responses', () => {
    it('should return 500 with masked error in production', async () => {
      process.env['NODE_ENV'] = 'production';
      
      const response = await request(app)
        .get('/generic-error')
        .expect(500);

      expect(response.body).toMatchObject({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
      
      // Ensure details field is not present in production
      expect(response.body.error).not.toHaveProperty('details');
    });
  });

  describe('Async error handling', () => {
    it('should handle async errors properly', async () => {
      const response = await request(app)
        .get('/async-error')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Async validation error',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route GET /non-existent-route not found',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('Invalid JSON handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/invalid-json')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

  describe('Request ID handling', () => {
    it('should use custom request ID when provided', async () => {
      const customRequestId = 'test-request-123';
      
      const response = await request(app)
        .get('/validation-error')
        .set('x-request-id', customRequestId)
        .expect(400);

      expect(response.body.error.requestId).toBe(customRequestId);
    });

    it('should generate request ID when not provided', async () => {
      const response = await request(app)
        .get('/validation-error')
        .expect(400);

      expect(response.body.error.requestId).toMatch(/^req_\d+$/);
    });
  });

  describe('Error response structure', () => {
    it('should always include required error fields', async () => {
      const response = await request(app)
        .get('/validation-error')
        .expect(400);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
      expect(typeof response.body.error.timestamp).toBe('string');
      expect(typeof response.body.error.requestId).toBe('string');
    });

    it('should have valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/validation-error')
        .expect(400);

      const timestamp = response.body.error.timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});