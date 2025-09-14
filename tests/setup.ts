// Arquivo de configuração de teste global
// Este arquivo é executado antes de todos os testes

process.env['NODE_ENV'] = 'test';
process.env['DB_NAME'] = 'docuLink';
process.env['DB_HOST'] = 'localhost';
process.env['DB_PORT'] = '3306';
process.env['DB_USER'] = 'root';
process.env['DB_PASSWORD'] = '123';

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