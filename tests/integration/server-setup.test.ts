import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../../src/config/environment';

describe('Server Setup Configuration', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();

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

        app.use(express.json({
            limit: `${Math.floor(config.UPLOAD_MAX_SIZE / 1024 / 1024)}mb`
        }));
        app.use(express.urlencoded({
            extended: true,
            limit: `${Math.floor(config.UPLOAD_MAX_SIZE / 1024 / 1024)}mb`
        }));

        // Middleware de ID de request
        app.use((req, _res, next) => {
            req.headers['x-request-id'] = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            next();
        });

        // Rate limiting
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
            legacyHeaders: false
        });

        app.use('/api', limiter);

        // Endpoint de health check
        app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    api: 'running'
                },
                system: {
                    environment: config.NODE_ENV
                }
            });
        });

        // Rotas da API (para testar rate limiting)
        app.use('/api', (_req, res) => {
            res.status(404).json({
                error: {
                    code: 'ROUTE_NOT_FOUND',
                    message: 'API route not found',
                    timestamp: new Date().toISOString()
                }
            });
        });

        // Handler de 404 para rotas não API
        app.use((_req, res) => {
            res.status(404).json({
                error: {
                    code: 'ROUTE_NOT_FOUND',
                    message: 'Route not found',
                    timestamp: new Date().toISOString()
                }
            });
        });
    });

    describe('Health Check Endpoint', () => {
        it('should return healthy status', async () => {
            const request = require('supertest');
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'healthy',
                services: {
                    database: 'connected',
                    api: 'running'
                },
                system: {
                    environment: config.NODE_ENV
                }
            });

            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('Security Headers', () => {
        it('should include security headers in responses', async () => {
            const request = require('supertest');
            const response = await request(app)
                .get('/health')
                .expect(200);

            // Verificar headers de segurança do helmet
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
            expect(response.headers['x-xss-protection']).toBe('0');
        });
    });

    describe('CORS Configuration', () => {
        it('should handle CORS preflight requests', async () => {
            const request = require('supertest');
            const response = await request(app)
                .options('/api/test')
                .set('Origin', config.CORS_ORIGIN)
                .set('Access-Control-Request-Method', 'POST')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBe(config.CORS_ORIGIN);
            expect(response.headers['access-control-allow-methods']).toContain('POST');
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limiting headers to API requests', async () => {
            const request = require('supertest');
            const response = await request(app)
                .get('/api/test')
                .expect(404);

            // Verificar headers de rate limit  
            expect(response.headers['x-ratelimit-limit'] || response.headers['ratelimit-limit']).toBeDefined();
            expect(response.headers['x-ratelimit-remaining'] || response.headers['ratelimit-remaining']).toBeDefined();
            expect(response.headers['x-ratelimit-reset'] || response.headers['ratelimit-reset']).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const request = require('supertest');
            const response = await request(app)
                .get('/non-existent-route')
                .expect(404);

            expect(response.body).toMatchObject({
                error: {
                    code: 'ROUTE_NOT_FOUND',
                    message: 'Route not found'
                }
            });

            expect(response.body.error.timestamp).toBeDefined();
        });
    });

    describe('Request Size Limits', () => {
        it('should accept JSON payloads within size limits', async () => {
            const request = require('supertest');
            const smallPayload = { test: 'data' };

            const response = await request(app)
                .post('/api/test')
                .send(smallPayload)
                .expect(404);

            // Não deve obter um erro 413 (Payload Too Large)
            expect(response.status).not.toBe(413);
        });
    });
});