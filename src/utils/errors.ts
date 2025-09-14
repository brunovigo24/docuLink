/**
 * Custom error classes para a API de processamento de documentos
 */

export class ValidationError extends Error {
  constructor(message: string) {
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
  constructor(message: string) {
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