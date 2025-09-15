import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../../src/index';
import { TestDatabaseUtils } from '../utils/testDatabase';

describe('Basic Integration Tests', () => {
    let samplePDFBuffer: Buffer;

    beforeAll(async () => {
        await TestDatabaseUtils.setup();

        // Carregar PDF de exemplo para testes
        const samplePDFPath = path.join(__dirname, '../fixtures/sample.pdf');
        samplePDFBuffer = fs.readFileSync(samplePDFPath);
    });

    afterAll(async () => {
        await TestDatabaseUtils.closeConnection();
    });

    beforeEach(async () => {
        await TestDatabaseUtils.cleanAllData();
    });

    describe('Complete Workflow', () => {
        it('should handle complete client and document workflow', async () => {
            // 1. Criar cliente
            const clientResponse = await request(app)
                .post('/api/clients')
                .send({ name: 'Test Client', email: 'test@example.com' })
                .expect(201);

            const clientId = clientResponse.body.data.id;

            // 2. Upload de PDF
            const pdfResponse = await request(app)
                .post('/api/documents/pdf')
                .field('client_id', clientId.toString())
                .attach('pdf', samplePDFBuffer, 'test.pdf')
                .expect(201);

            // 3. Processar página web
            await request(app)
                .post('/api/documents/web')
                .send({ client_id: clientId, url: 'https://example.com' })
                .expect(201);

            // 4. Verificar se o cliente tem documentos
            const clientDocsResponse = await request(app)
                .get(`/api/clients/${clientId}/documents`)
                .expect(200);

            expect(clientDocsResponse.body.data).toHaveLength(2);
            expect(clientDocsResponse.body.pagination.total).toBe(2);

            // 5. Obter detalhes do documento
            const pdfDocId = pdfResponse.body.data.id;
            const docResponse = await request(app)
                .get(`/api/documents/${pdfDocId}`)
                .expect(200);

            expect(docResponse.body.data).toMatchObject({
                id: pdfDocId,
                client_id: clientId,
                document_type: 'pdf',
                title: expect.any(String),
                content: expect.any(String)
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle basic error scenarios', async () => {
            // Cliente não existente
            await request(app)
                .get('/api/clients/999')
                .expect(404);

            // Email inválido
            await request(app)
                .post('/api/clients')
                .send({ name: 'Test', email: 'invalid-email' })
                .expect(400);

            // Arquivo PDF ausente
            await request(app)
                .post('/api/documents/pdf')
                .field('client_id', '1')
                .expect(400);

            // URL inválida
            await request(app)
                .post('/api/documents/web')
                .send({ client_id: 1, url: 'not-a-url' })
                .expect(400);
        });
    });

    describe('Processamento de arquivos', () => {
        let clientId: number;

        beforeEach(async () => {
            const clientResponse = await request(app)
                .post('/api/clients')
                .send({ name: 'File Test Client', email: 'file@test.com' });
            clientId = clientResponse.body.data.id;
        });

        it('deve processar arquivos PDF', async () => {
            const response = await request(app)
                .post('/api/documents/pdf')
                .field('client_id', clientId.toString())
                .attach('pdf', samplePDFBuffer, 'test.pdf')
                .expect(201);

            expect(response.body.data).toMatchObject({
                client_id: clientId,
                document_type: 'pdf',
                title: expect.any(String)
            });
        });

        it('should process web pages', async () => {
            const response = await request(app)
                .post('/api/documents/web')
                .send({ client_id: clientId, url: 'https://example.com' })
                .expect(201);

            expect(response.body.data).toMatchObject({
                client_id: clientId,
                document_type: 'web',
                source_url: 'https://example.com'
            });
        });
    });

    describe('System Health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'healthy',
                services: expect.any(Object)
            });
        });

        it('should return document statistics', async () => {
            const response = await request(app)
                .get('/api/documents/statistics')
                .expect(200);

            expect(response.body.data).toMatchObject({
                totalDocuments: expect.any(Number),
                pdfDocuments: expect.any(Number),
                webDocuments: expect.any(Number)
            });
        });
    });
});