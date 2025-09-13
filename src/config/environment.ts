import dotenv from 'dotenv';

// Carregar variáveis ​​de ambiente
dotenv.config();

interface EnvironmentConfig {
  // Configuração do servidor
  NODE_ENV: string;
  PORT: number;

  // Configuração do Database 
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_CONNECTION_LIMIT: number;

  // Configuração de upload de arquivo
  UPLOAD_MAX_SIZE: number;
  UPLOAD_ALLOWED_TYPES: string;

  // Configuração do Web Scraping 
  WEB_SCRAPING_TIMEOUT: number;
  WEB_SCRAPING_USER_AGENT: string;

  // Configuração de segurança
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Configuração de Logging 
  LOG_LEVEL: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  // Verifica as variáveis ​​de ambiente necessárias
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    // Configuração do Server 
    NODE_ENV: process.env['NODE_ENV'] || 'development',
    PORT: parseInt(process.env['PORT'] || '3000', 10),

    // Configuração do Database
    DB_HOST: process.env['DB_HOST']!,
    DB_PORT: parseInt(process.env['DB_PORT'] || '3306', 10),
    DB_NAME: process.env['DB_NAME']!,
    DB_USER: process.env['DB_USER']!,
    DB_PASSWORD: process.env['DB_PASSWORD']!,
    DB_CONNECTION_LIMIT: parseInt(process.env['DB_CONNECTION_LIMIT'] || '10', 10),

    // Configuração de upload de arquivo
    UPLOAD_MAX_SIZE: parseInt(process.env['UPLOAD_MAX_SIZE'] || '10485760', 10), // 10MB
    UPLOAD_ALLOWED_TYPES: process.env['UPLOAD_ALLOWED_TYPES'] || 'application/pdf',

    // Configuração do Web Scraping 
    WEB_SCRAPING_TIMEOUT: parseInt(process.env['WEB_SCRAPING_TIMEOUT'] || '30000', 10),
    WEB_SCRAPING_USER_AGENT: process.env['WEB_SCRAPING_USER_AGENT'] || 'DocumentProcessingAPI/1.0',

    // Configuração de segurança
    CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),

    // Configuração de Logging 
    LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  };
};

export const config = getEnvironmentConfig();