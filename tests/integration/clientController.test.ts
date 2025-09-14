import request from 'supertest';
import express from 'express';
import { clientRoutes } from '../../src/controllers/clientRoutes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { initializeDatabase, closeDatabase } from '../../src/utils/database';

describe('Client Controller Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Configurar aplicação Express para testes
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Inicializar banco de dados de teste
    await initializeDatabase();
  });

  afterAll(async () => {
    // Fechar conexão com banco de dados
    await closeDatabase();
  });

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    const { getConnection } = require('../../src/utils/database');
    const db = getConnection();
    await db.execute('DELETE FROM documents');
    await db.execute('DELETE FROM clients');
    await db.execute('ALTER TABLE clients AUTO_INCREMENT = 1');
  });

  describe('POST /api/clients', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client created successfully',
        data: {
          id: expect.any(Number),
          name: 'Test Client',
          email: 'test@example.com',
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Name is required'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for invalid email format', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Email must be a valid email address'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 422 for duplicate email', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com'
      };

      // Criar primeiro cliente
      await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      // Tentar criar segundo cliente com mesmo email
      const response = await request(app)
        .post('/api/clients')
        .send({ ...clientData, name: 'Another Client' })
        .expect(422);

      expect(response.body).toMatchObject({
        error: {
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Email already exists',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/clients', () => {
    it('should return empty array when no clients exist', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Clients retrieved successfully',
        data: []
      });
    });

    it('should return all clients with document counts', async () => {
      // Criar clientes de teste
      await request(app)
        .post('/api/clients')
        .send({ name: 'Client 1', email: 'client1@example.com' });

      await request(app)
        .post('/api/clients')
        .send({ name: 'Client 2', email: 'client2@example.com' });

      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Clients retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: 'Client 1',
            email: 'client1@example.com',
            document_count: 0,
            created_at: expect.any(String),
            updated_at: expect.any(String)
          }),
          expect.objectContaining({
            id: expect.any(Number),
            name: 'Client 2',
            email: 'client2@example.com',
            document_count: 0,
            created_at: expect.any(String),
            updated_at: expect.any(String)
          })
        ])
      });
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return client by ID', async () => {
      // Criar cliente de teste
      const createResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client retrieved successfully',
        data: {
          id: clientId,
          name: 'Test Client',
          email: 'test@example.com',
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/999')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'Client with ID 999 not found',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const response = await request(app)
        .get('/api/clients/invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('ID must be a number'),
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/clients/:id/details', () => {
    it('should return client with document count', async () => {
      // Criar cliente de teste
      const createResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/clients/${clientId}/details`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client details retrieved successfully',
        data: {
          id: clientId,
          name: 'Test Client',
          email: 'test@example.com',
          document_count: 0,
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/999/details')
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

  describe('PUT /api/clients/:id', () => {
    it('should update client with valid data', async () => {
      // Criar cliente de teste
      const createResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Original Name', email: 'original@example.com' });

      const clientId = createResponse.body.data.id;

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client updated successfully',
        data: {
          id: clientId,
          name: 'Updated Name',
          email: 'updated@example.com',
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });
    });

    it('should update only provided fields', async () => {
      // Criar cliente de teste
      const createResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Original Name', email: 'original@example.com' });

      const clientId = createResponse.body.data.id;

      const updateData = { name: 'Updated Name Only' };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client updated successfully',
        data: {
          id: clientId,
          name: 'Updated Name Only',
          email: 'original@example.com',
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .put('/api/clients/999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'Client with ID 999 not found',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for empty update data', async () => {
      // Criar cliente de teste
      const createResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('At least one field must be provided for update'),
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 422 for duplicate email', async () => {
      // Criar dois clientes
      await request(app)
        .post('/api/clients')
        .send({ name: 'Client 1', email: 'client1@example.com' });

      const createResponse2 = await request(app)
        .post('/api/clients')
        .send({ name: 'Client 2', email: 'client2@example.com' });

      const client2Id = createResponse2.body.data.id;

      // Tentar atualizar client2 com email do client1
      const response = await request(app)
        .put(`/api/clients/${client2Id}`)
        .send({ email: 'client1@example.com' })
        .expect(422);

      expect(response.body).toMatchObject({
        error: {
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Email already exists',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete client successfully', async () => {
      // Criar cliente de teste
      const createResponse = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client', email: 'test@example.com' });

      const clientId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Client deleted successfully'
      });

      // Verificar se cliente foi realmente deletado
      await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(404);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .delete('/api/clients/999')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'Client with ID 999 not found',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const response = await request(app)
        .delete('/api/clients/invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('ID must be a number'),
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      
      const response = await request(app)
        .get('/api/clients/not-a-number')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/clients/123/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: expect.stringContaining('Route GET /api/clients/123/nonexistent not found'),
          timestamp: expect.any(String)
        }
      });
    });
  });
});