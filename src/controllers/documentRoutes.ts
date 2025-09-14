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

// Rota para verificar saúde dos serviços de processamento
router.get('/health', documentController.getProcessingHealth);

// Rota para estatísticas de documentos
router.get('/statistics', documentController.getDocumentStatistics);

// Rota para processar PDF
router.post('/pdf',
  DocumentController.uploadPDF,
  validateBody(processPDFSchema),
  documentController.processPDF
);

// Rota para processar URL web
router.post('/web',
  validateBody(processWebSchema),
  documentController.processWeb
);

// Rota para listar todos os documentos
router.get('/',
  validateQuery(paginationSchema),
  documentController.getAllDocuments
);

// Rota para obter documento por ID
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

  // Rota para obter documentos de um cliente específico
  customRouter.get('/:id/documents',
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    customDocumentController.getDocumentsByClient
  );

  return customRouter;
};