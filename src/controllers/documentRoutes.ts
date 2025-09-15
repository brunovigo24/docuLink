/**
 * Rotas para endpoints de processamento de documentos
 */

import { Router } from 'express';
import { DocumentController } from './DocumentController';
import { DocumentService } from '../services/DocumentService';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { ClientService } from '../services/ClientService';
import { ClientRepository } from '../repositories/ClientRepository';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { processPDFSchema, processWebSchema, idParamSchema, paginationSchema } from '../models/validation';

const clientRepository = new ClientRepository();
const documentRepository = new DocumentRepository();
const clientService = new ClientService(clientRepository);
const documentService = new DocumentService(documentRepository, clientService);
const documentController = new DocumentController(documentService);

const router = Router();

/**
 * @swagger
 * /api/documents/health:
 *   get:
 *     summary: Obtenha o status de saúde do processamento de documentos
 *     description: Retorna o status de saúde dos serviços de processamento de documentos
 *     tags: [Documents, Health]
 *     responses:
 *       200:
 *         description: Processing services health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 services:
 *                   type: object
 *                   properties:
 *                     pdf_processing:
 *                       type: string
 *                       enum: [available, unavailable]
 *                     web_scraping:
 *                       type: string
 *                       enum: [available, unavailable]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               status: "healthy"
 *               services:
 *                 pdf_processing: "available"
 *                 web_scraping: "available"
 *               timestamp: "2023-12-01T10:00:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/health', documentController.getProcessingHealth);

/**
 * @swagger
 * /api/documents/statistics:
 *   get:
 *     summary: Obtenha estatísticas de documentos
 *     description: Retorna estatísticas sobre documentos processados
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Document statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_documents:
 *                   type: integer
 *                 pdf_documents:
 *                   type: integer
 *                 web_documents:
 *                   type: integer
 *                 total_clients:
 *                   type: integer
 *                 processing_stats:
 *                   type: object
 *             example:
 *               total_documents: 150
 *               pdf_documents: 90
 *               web_documents: 60
 *               total_clients: 25
 *               processing_stats:
 *                 avg_processing_time: "2.5s"
 *                 success_rate: "98.5%"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics', documentController.getDocumentStatistics);

/**
 * @swagger
 * /api/documents/pdf:
 *   post:
 *     summary: Upload e processa documento PDF
 *     description: Uploada um arquivo PDF, extrai seu conteúdo e associa-o a um cliente
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, client_id]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload
 *               client_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the client to associate with this document
 *                 example: 1
 *     responses:
 *       201:
 *         description: PDF processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *             example:
 *               id: 1
 *               client_id: 1
 *               title: "Sample PDF Document"
 *               content: "This is the extracted content from the PDF..."
 *               document_type: "pdf"
 *               source_url: null
 *               file_path: "/uploads/document_123.pdf"
 *               processed_at: "2023-12-01T10:00:00.000Z"
 *               created_at: "2023-12-01T10:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 code: "CLIENT_NOT_FOUND"
 *                 message: "Client with ID 1 not found"
 *                 timestamp: "2023-12-01T10:00:00.000Z"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/pdf',
  DocumentController.uploadPDF,
  validateBody(processPDFSchema),
  documentController.processPDF
);

/**
 * @swagger
 * /api/documents/web:
 *   post:
 *     summary: Processa conteúdo de página web
 *     description: Extrai conteúdo de uma página web e associa-o a um cliente
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessWebRequest'
 *           example:
 *             client_id: 1
 *             url: "https://example.com/article"
 *     responses:
 *       201:
 *         description: Web page processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *             example:
 *               id: 2
 *               client_id: 1
 *               title: "Example Article Title"
 *               content: "This is the scraped content from the web page..."
 *               document_type: "web"
 *               source_url: "https://example.com/article"
 *               file_path: null
 *               processed_at: "2023-12-01T10:00:00.000Z"
 *               created_at: "2023-12-01T10:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Client not found or URL not accessible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 code: "CLIENT_NOT_FOUND"
 *                 message: "Client with ID 1 not found"
 *                 timestamp: "2023-12-01T10:00:00.000Z"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/web',
  validateBody(processWebSchema),
  documentController.processWeb
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Obtenha todos os documentos com paginação
 *     description: Recupera uma lista paginada de todos os documentos
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of documents per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *             example:
 *               data:
 *                 - id: 1
 *                   client_id: 1
 *                   title: "Sample PDF Document"
 *                   content: "This is the extracted content..."
 *                   document_type: "pdf"
 *                   source_url: null
 *                   file_path: "/uploads/document_123.pdf"
 *                   processed_at: "2023-12-01T10:00:00.000Z"
 *                   created_at: "2023-12-01T10:00:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 50
 *                 totalPages: 5
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/',
  validateQuery(paginationSchema),
  documentController.getAllDocuments
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Obtenha documento por ID
 *     description: Recupera um documento específico pelo seu ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Document ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *             example:
 *               id: 1
 *               client_id: 1
 *               title: "Sample PDF Document"
 *               content: "This is the extracted content from the document..."
 *               document_type: "pdf"
 *               source_url: null
 *               file_path: "/uploads/document_123.pdf"
 *               processed_at: "2023-12-01T10:00:00.000Z"
 *               created_at: "2023-12-01T10:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id',
  validateParams(idParamSchema),
  documentController.getDocumentById
);

export const documentRoutes = router;

export const createDocumentRoutes = (customDocumentController: DocumentController): Router => {
  const customRouter = Router();

  // Rota para verificar saúde dos serviços de processamento
  customRouter.get('/health', customDocumentController.getProcessingHealth);

  // Rota para estatísticas de documentos
  customRouter.get('/statistics', customDocumentController.getDocumentStatistics);

  // Rota para processar PDF
  customRouter.post('/pdf',
    DocumentController.uploadPDF,
    validateBody(processPDFSchema),
    customDocumentController.processPDF
  );

  // Rota para processar URL web
  customRouter.post('/web',
    validateBody(processWebSchema),
    customDocumentController.processWeb
  );

  // Rota para listar todos os documentos
  customRouter.get('/',
    validateQuery(paginationSchema),
    customDocumentController.getAllDocuments
  );

  // Rota para obter documento por ID
  customRouter.get('/:id',
    validateParams(idParamSchema),
    customDocumentController.getDocumentById
  );

  return customRouter;
};

export const createClientDocumentRoutes = (customDocumentController: DocumentController): Router => {
  const customRouter = Router();

  /**
   * @swagger
   * /api/clients/{id}/documents:
   *   get:
   *     summary: Obtenha documentos por ID de cliente
   *     description: Recupera todos os documentos associados a um cliente específico
   *     tags: [Clients, Documents]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Client ID
   *         example: 1
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *         example: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of documents per page
   *         example: 10
   *     responses:
   *       200:
   *         description: Client documents retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/PaginatedResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Document'
   *             example:
   *               data:
   *                 - id: 1
   *                   client_id: 1
   *                   title: "Sample PDF Document"
   *                   content: "This is the extracted content..."
   *                   document_type: "pdf"
   *                   source_url: null
   *                   file_path: "/uploads/document_123.pdf"
   *                   processed_at: "2023-12-01T10:00:00.000Z"
   *                   created_at: "2023-12-01T10:00:00.000Z"
   *               pagination:
   *                 page: 1
   *                 limit: 10
   *                 total: 5
   *                 totalPages: 1
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  customRouter.get('/:id/documents',
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    customDocumentController.getDocumentsByClient
  );

  return customRouter;
};