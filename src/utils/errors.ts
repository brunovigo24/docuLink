/**
 * Custom error classes para a API de processamento de documentos
 */

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public resource?: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error, public operation?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error, public url?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class FileProcessingError extends Error {
  constructor(message: string, public originalError?: Error, public fileName?: string) {
    super(message);
    this.name = 'FileProcessingError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeout?: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}