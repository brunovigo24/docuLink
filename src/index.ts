import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { clientRoutes, documentRoutes, createClientDocumentRoutes } from './controllers';
import { DocumentController } from './controllers/DocumentController';
import { DocumentService } from './services/DocumentService';
import { DocumentRepository } from './repositories/DocumentRepository';
import { ClientService } from './services/ClientService';
import { ClientRepository } from './repositories/ClientRepository';
import { errorHandler, notFoundHandler } from './middleware';
import { DatabaseUtils, closeDatabase } from './utils/database';

const app = express();

// Segurança e configuração de CORS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}));

// Parsing de requests com limites de tamanho
app.use(express.json({ 
  limit: `${Math.floor(config.UPLOAD_MAX_SIZE / 1024 / 1024)}mb`
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: `${Math.floor(config.UPLOAD_MAX_SIZE / 1024 / 1024)}mb`
}));

// Middleware de ID de request para tracking
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      }
    });
  }
});

// Aplicar rate limiting a todas as rotas da API
app.use('/api', limiter);

// Rate limiting mais estrito para endpoints de upload de arquivos
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 upload requests per windowMs
  message: {
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    }
  }
});

app.use('/api/documents/pdf', uploadLimiter);
app.use('/api/documents/web', uploadLimiter);

// Endpoint de health check para monitoramento
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    const dbHealthy = await DatabaseUtils.healthCheck();
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        api: 'running'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: config.NODE_ENV
      },
      responseTime: `${responseTime}ms`
    };
    
    res.status(dbHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

// Endpoint de readiness probe
app.get('/ready', async (_req, res) => {
  try {
    const dbHealthy = await DatabaseUtils.healthCheck();
    if (dbHealthy) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'health check failed' });
  }
});

// Inicializar serviços e controladores
const clientRepository = new ClientRepository();
const documentRepository = new DocumentRepository();
const clientService = new ClientService(clientRepository);
const documentService = new DocumentService(documentRepository, clientService);
const documentController = new DocumentController(documentService);

// Rotas da API
app.use('/api/clients', clientRoutes);
app.use('/api/clients', createClientDocumentRoutes(documentController));
app.use('/api/documents', documentRoutes);

// Middleware de tratamento de erros
app.use(notFoundHandler);
app.use(errorHandler);

// Instância do servidor para shutdowngraceful
let server: any;

// Inicializar servidor
const startServer = async () => {
  try {
    console.log('🚀 Starting Document Processing API...');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🔧 Node.js version: ${process.version}`);
    
    // Verificar conexão com o banco de dados antes de iniciar o servidor
    console.log('🔍 Checking database connection...');
    const dbHealthy = await DatabaseUtils.healthCheck();
    if (!dbHealthy) {
      console.error('❌ Database connection failed - cannot start server');
      process.exit(1);
    }
    console.log('✅ Database connection successful');

    // Iniciar servidor HTTP
    server = app.listen(config.PORT, () => {
      console.log('✅ Document Processing API started successfully');
      console.log(`🌐 Server running on port: ${config.PORT}`);
      console.log(`🏥 Health check: http://localhost:${config.PORT}/health`);
      console.log(`🔄 Readiness probe: http://localhost:${config.PORT}/ready`);
      console.log(`📝 API endpoints available at: http://localhost:${config.PORT}/api`);
      
      if (config.NODE_ENV === 'development') {
        console.log('🔧 Development mode - additional logging enabled');
      }
    });

    // Configurar timeouts do servidor
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Tratamento de shutdown graceful
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received - initiating graceful shutdown...`);
  
  if (server) {
    console.log('🔄 Closing HTTP server...');
    server.close(async (err: any) => {
      if (err) {
        console.error('❌ Error closing HTTP server:', err);
      } else {
        console.log('✅ HTTP server closed');
      }
      
      try {
        console.log('🔄 Closing database connections...');
        await closeDatabase();
        console.log('✅ Database connections closed');
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Forçar shutdown após 10 segundos
    setTimeout(() => {
      console.error('⚠️  Forced shutdown - graceful shutdown took too long');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Tratamento de sinais de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratamento de exceções não capturadas e rejeições não tratadas
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Exportar o app para testes
export { app };

// Iniciar o servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

