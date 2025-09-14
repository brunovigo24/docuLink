// Arquivo de configuração de teste global
// Este arquivo é executado antes de todos os testes

process.env['NODE_ENV'] = 'test';
process.env['DB_NAME'] = 'document_processing_test';
process.env['DB_HOST'] = 'localhost';
process.env['DB_PORT'] = '3306';
process.env['DB_USER'] = 'test_user';
process.env['DB_PASSWORD'] = 'test_password';

jest.setTimeout(30000);

if (process.env['NODE_ENV'] === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}