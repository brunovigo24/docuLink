import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createDocumentRoutes, createClientDocumentRoutes } from '../../src/controllers/documentRoutes';
import { clientRoutes } from '../../src/controllers/clientRoutes';
import { DocumentController } from '../../src/controllers/DocumentController';
import { DocumentService } from '../../src/services/DocumentService';
import { DocumentRepository } from '../../src/repositories/DocumentRepository';
import { ClientService } from '../../src/services/ClientService';
import { ClientRepository } from '../../src/repositories/ClientRepository';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { initializeDatabase, closeDatabase } from '../../src/utils/database';

// Mockar services para processamento de PDF e web scraping
class MockPDFProcessingService {
  async extractContent(_buffer: Buffer, originalName: string) {
    return {
      title: 'Sample PDF Document',
      content: 'This is sample PDF content extracted from the document.',
      filePath: `/uploads/${originalName}`
    };
  }

  async validatePDF(buffer: Buffer): Promise<boolean> {
    // Validação simples - verificar se o buffer começa com o cabeçalho PDF
    return buffer.toString('ascii', 0, 4) === '%PDF';
  }
}

class MockWebScrapingService {
  async scrapeURL(url: string) {
    return {
      title: 'Sample Web Page',
      content: 'This is sample web content scraped from the URL.',
      url: url
    };
  }

  async validateURL(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

describe('Document Controller Integration Tests', () => {
  let app: express.Application;
  let documentController: DocumentController;
  let samplePDFBuffer: Buffer;

  beforeAll(async () => {
    await initializeDatabase();

    const samplePDFPath = path.join(__dirname, '../fixtures/sample.pdf');
    samplePDFBuffer = fs.readFileSync(samplePDFPath);

    // Criar services com mocks
    const clientRepository = new ClientRepository();
    const documentRepository = new DocumentRepository();
    const clientService = new ClientService(clientRepository);
    const mockPDFService = new MockPDFProcessingService();
    const mockWebService = new MockWebScrapingService();
    
    const documentService = new DocumentService(
      documentRepository,
      clientService,
      mockPDFService as any,
      mockWebService as any
    );

    documentController = new DocumentController(documentService);

    // Configurar Express app
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRoutes);
    app.use('/api/clients', createClientDocumentRoutes(documentController));
    app.use('/api/documents', createDocumentRoutes(documentController));
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    const { getConnection } = require('../../src/utils/database');
    const db = getConnection();
    await db.execute('DELETE FROM documents');
    await db.execute('DELETE FROM clients');
    await db.execute('ALTER TABLE clients AUTO_INCREMENT = 1');
    await db.execute('ALTER TABLE documents AUTO_INCREMENT = 1');
  });

  describe('POST /api/documents/pdf', () => {
    it('should process PDF upload successfully', async () => {
      // Criar um cliente de teste primeiro
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const response = await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .attach('pdf', samplePDFBuffer, 'sample.pdf')
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'PDF processed successfully',
        data: {
          id: expect.any(Number),
          title: 'Sample PDF Document',
          document_type: 'pdf',
          client_id: clientId,
          processed_at: expect.any(String),
          created_at: expect.any(String)
        }
      });
    });

    it('should return 400 when PDF file is missing', async () => {
      // Criar um cliente de teste primeiro
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const response = await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'PDF file is required',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when client_id is missing', async () => {
      const response = await request(app)
        .post('/api/documents/pdf')
        .attach('pdf', samplePDFBuffer, 'sample.pdf')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Client ID is required'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for invalid file type', async () => {
      // Criar um cliente de teste primeiro
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const textBuffer = Buffer.from('This is not a PDF file');

      const response = await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .attach('pdf', textBuffer, 'sample.txt')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: expect.stringContaining('Only PDF files are allowed'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .post('/api/documents/pdf')
        .field('client_id', '999')
        .attach('pdf', samplePDFBuffer, 'sample.pdf')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'Client with ID 999 not found',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('POST /api/documents/web', () => {
    it('should process web URL successfully', async () => {
      // Criar um cliente de teste primeiro
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const webData = {
        client_id: clientId,
        url: 'https://example.com'
      };

      const response = await request(app)
        .post('/api/documents/web')
        .send(webData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Web page processed successfully',
        data: {
          id: expect.any(Number),
          title: 'Sample Web Page',
          document_type: 'web',
          client_id: clientId,
          source_url: 'https://example.com',
          processed_at: expect.any(String),
          created_at: expect.any(String)
        }
      });
    });

    it('should return 400 for missing client_id', async () => {
      const webData = {
        url: 'https://example.com'
      };

      const response = await request(app)
        .post('/api/documents/web')
        .send(webData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Client ID is required'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for missing URL', async () => {
      // Criar um cliente de teste primeiro
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const webData = {
        client_id: clientId
      };

      const response = await request(app)
        .post('/api/documents/web')
        .send(webData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('URL is required'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for invalid URL format', async () => {
      // Criar um cliente de teste primeiro
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const webData = {
        client_id: clientId,
        url: 'invalid-url'
      };

      const response = await request(app)
        .post('/api/documents/web')
        .send(webData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('must be a valid uri'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent client', async () => {
      const webData = {
        client_id: 999,
        url: 'https://example.com'
      };

      const response = await request(app)
        .post('/api/documents/web')
        .send(webData)
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'Client with ID 999 not found',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/documents', () => {
    it('should return empty array when no documents exist', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Documents retrieved successfully',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    });

    it('should return all documents with pagination', async () => {
      // Criar um cliente de teste
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      // Create test documents
      await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .attach('pdf', samplePDFBuffer, 'sample1.pdf');

      await request(app)
        .post('/api/documents/web')
        .send({ client_id: clientId, url: 'https://example.com' });

      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Documents retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            client_id: clientId,
            title: expect.any(String),
            document_type: expect.stringMatching(/^(pdf|web)$/),
            processed_at: expect.any(String),
            created_at: expect.any(String)
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/documents?page=2&limit=5')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Documents retrieved successfully',
        data: [],
        pagination: {
          page: 2,
          limit: 5,
          total: 0,
          totalPages: 0
        }
      });
    });
  });

  describe('GET /api/clients/:id/documents', () => {
    it('should return documents for specific client', async () => {
      // Create test client
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      // Criar documentos de teste
      await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .attach('pdf', samplePDFBuffer, 'sample.pdf');

      await request(app)
        .post('/api/documents/web')
        .send({ client_id: clientId, url: 'https://example.com' });

      const response = await request(app)
        .get(`/api/clients/${clientId}/documents`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client documents retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            client_id: clientId,
            title: expect.any(String),
            document_type: expect.stringMatching(/^(pdf|web)$/),
            processed_at: expect.any(String),
            created_at: expect.any(String)
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should return empty array for client with no documents', async () => {
      // Criar um cliente de teste
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      const response = await request(app)
        .get(`/api/clients/${clientId}/documents`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client documents retrieved successfully',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/999/documents')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'Client with ID 999 not found',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return document by ID', async () => {
      // Criar um cliente de teste
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      // Criar um documento de teste
      const docResponse = await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .attach('pdf', samplePDFBuffer, 'sample.pdf')
        .expect(201);

      const documentId = docResponse.body.data.id;

      const response = await request(app)
        .get(`/api/documents/${documentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Document retrieved successfully',
        data: {
          id: documentId,
          client_id: clientId,
          title: 'Sample PDF Document',
          content: expect.any(String),
          document_type: 'pdf',
          processed_at: expect.any(String),
          created_at: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .get('/api/documents/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Document not found'
      });
    });
  });

  describe('GET /api/documents/statistics', () => {
    it('should return document statistics', async () => {
      const response = await request(app)
        .get('/api/documents/statistics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Document statistics retrieved successfully',
        data: {
          totalDocuments: expect.any(Number),
          pdfDocuments: expect.any(Number),
          webDocuments: expect.any(Number)
        }
      });
    });
  });

  describe('GET /api/documents/health', () => {
    it('should return processing services health status', async () => {
      const response = await request(app)
        .get('/api/documents/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Processing services health check',
        data: {
          services: {
            pdfProcessing: true,
            webScraping: true
          },
          status: 'healthy'
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file size limit exceeded', async () => {
      // Criar um cliente de teste
      const clientResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = clientResponse.body.data.id;

      // Criar um buffer grande (maior que o limite de 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/documents/pdf')
        .field('client_id', clientId.toString())
        .attach('pdf', largeBuffer, 'large.pdf')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: expect.stringContaining('File too large'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/documents?page=invalid&limit=invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Page must be a number'),
          timestamp: expect.any(String)
        }
      });
    });
  });
});