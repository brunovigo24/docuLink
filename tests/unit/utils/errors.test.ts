import {
  ValidationError,
  BusinessLogicError,
  NotFoundError,
  ProcessingError,
  DatabaseError,
  NetworkError,
  FileProcessingError,
  TimeoutError
} from '../../../src/utils/errors';

describe('Custom Error Classes', () => {
  describe('ValidationError', () => {
    it('should create ValidationError with message only', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBeUndefined();
      expect(error instanceof Error).toBe(true);
    });

    it('should create ValidationError with field information', () => {
      const error = new ValidationError('Invalid email format', 'email');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid email format');
      expect(error.field).toBe('email');
    });
  });

  describe('BusinessLogicError', () => {
    it('should create BusinessLogicError correctly', () => {
      const error = new BusinessLogicError('Business rule violation');
      
      expect(error.name).toBe('BusinessLogicError');
      expect(error.message).toBe('Business rule violation');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with message only', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Resource not found');
      expect(error.resource).toBeUndefined();
    });

    it('should create NotFoundError with resource information', () => {
      const error = new NotFoundError('Client not found', 'client');
      
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Client not found');
      expect(error.resource).toBe('client');
    });
  });

  describe('ProcessingError', () => {
    it('should create ProcessingError with message only', () => {
      const error = new ProcessingError('Processing failed');
      
      expect(error.name).toBe('ProcessingError');
      expect(error.message).toBe('Processing failed');
      expect(error.originalError).toBeUndefined();
    });

    it('should create ProcessingError with original error', () => {
      const originalError = new Error('Original error');
      const error = new ProcessingError('Processing failed', originalError);
      
      expect(error.name).toBe('ProcessingError');
      expect(error.message).toBe('Processing failed');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with all parameters', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database operation failed', originalError, 'findById');
      
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Database operation failed');
      expect(error.originalError).toBe(originalError);
      expect(error.operation).toBe('findById');
    });

    it('should create DatabaseError with minimal parameters', () => {
      const error = new DatabaseError('Database error');
      
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Database error');
      expect(error.originalError).toBeUndefined();
      expect(error.operation).toBeUndefined();
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with all parameters', () => {
      const originalError = new Error('ECONNREFUSED');
      const error = new NetworkError('Network request failed', originalError, 'https://example.com');
      
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network request failed');
      expect(error.originalError).toBe(originalError);
      expect(error.url).toBe('https://example.com');
    });

    it('should create NetworkError with minimal parameters', () => {
      const error = new NetworkError('Network error');
      
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network error');
      expect(error.originalError).toBeUndefined();
      expect(error.url).toBeUndefined();
    });
  });

  describe('FileProcessingError', () => {
    it('should create FileProcessingError with all parameters', () => {
      const originalError = new Error('Invalid format');
      const error = new FileProcessingError('File processing failed', originalError, 'document.pdf');
      
      expect(error.name).toBe('FileProcessingError');
      expect(error.message).toBe('File processing failed');
      expect(error.originalError).toBe(originalError);
      expect(error.fileName).toBe('document.pdf');
    });

    it('should create FileProcessingError with minimal parameters', () => {
      const error = new FileProcessingError('File error');
      
      expect(error.name).toBe('FileProcessingError');
      expect(error.message).toBe('File error');
      expect(error.originalError).toBeUndefined();
      expect(error.fileName).toBeUndefined();
    });
  });

  describe('TimeoutError', () => {
    it('should create TimeoutError with timeout value', () => {
      const error = new TimeoutError('Request timed out', 30000);
      
      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Request timed out');
      expect(error.timeout).toBe(30000);
    });

    it('should create TimeoutError without timeout value', () => {
      const error = new TimeoutError('Timeout occurred');
      
      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Timeout occurred');
      expect(error.timeout).toBeUndefined();
    });
  });

  describe('Error inheritance', () => {
    it('should properly inherit from Error class', () => {
      const errors = [
        new ValidationError('test'),
        new BusinessLogicError('test'),
        new NotFoundError('test'),
        new ProcessingError('test'),
        new DatabaseError('test'),
        new NetworkError('test'),
        new FileProcessingError('test'),
        new TimeoutError('test')
      ];

      errors.forEach(error => {
        expect(error instanceof Error).toBe(true);
        expect(error.stack).toBeDefined();
      });
    });
  });
});