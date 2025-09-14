import { Router } from 'express';
import { ClientController } from './ClientController';
import { ClientService } from '../services/ClientService';
import { ClientRepository } from '../repositories/ClientRepository';
import { validateBody, validateParams } from '../middleware/validation';
import { createClientSchema, updateClientSchema, idParamSchema } from '../models/validation';

// Criar instâncias das dependências
const clientRepository = new ClientRepository();
const clientService = new ClientService(clientRepository);
const clientController = new ClientController(clientService);

const router = Router();

/**
 * POST /api/clients - Criar novo cliente
 */
router.post(
  '/',
  validateBody(createClientSchema),
  clientController.createClient
);

/**
 * GET /api/clients - Listar todos os clientes com contagem de documentos
 */
router.get(
  '/',
  clientController.getAllClients
);

/**
 * GET /api/clients/:id - Obter cliente específico por ID
 */
router.get(
  '/:id',
  validateParams(idParamSchema),
  clientController.getClientById
);

/**
 * GET /api/clients/:id/details - Obter cliente com contagem de documentos
 */
router.get(
  '/:id/details',
  validateParams(idParamSchema),
  clientController.getClientWithDocumentCount
);

/**
 * PUT /api/clients/:id - Atualizar cliente
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateClientSchema),
  clientController.updateClient
);

/**
 * DELETE /api/clients/:id - Deletar cliente
 */
router.delete(
  '/:id',
  validateParams(idParamSchema),
  clientController.deleteClient
);

export { router as clientRoutes };