import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { clientRoutes } from './controllers';
import { errorHandler, notFoundHandler } from './middleware';
import { DatabaseUtils } from './utils/database';

const app = express();

// Middleware de segurança e parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbHealthy = await DatabaseUtils.healthCheck();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/clients', clientRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Inicializar servidor
const startServer = async () => {
  try {
    // Verificar conexão com banco de dados
    const dbHealthy = await DatabaseUtils.healthCheck();
    if (!dbHealthy) {
      console.error('Database connection failed');
      process.exit(1);
    }

    app.listen(config.PORT, () => {
      console.log('Document Processing API');
      console.log(`Environment: ${config.NODE_ENV}`);
      console.log(`Server running on port: ${config.PORT}`);
      console.log(`Health check: http://localhost:${config.PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  process.exit(0);
});

startServer();

