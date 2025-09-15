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
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Criar um novo cliente
 *     description: Cria um novo cliente com o nome e email fornecidos
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *           example:
 *             name: "João Silva"
 *             email: "joao.silva@exemplo.com"
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: "João Silva"
 *                 email: "joao.silva@exemplo.com"
 *                 created_at: "2023-12-01T10:00:00.000Z"
 *                 updated_at: "2023-12-01T10:00:00.000Z"
 *               message: "Cliente criado com sucesso"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Conflict - Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 code: "EMAIL_ALREADY_EXISTS"
 *                 message: "A client with this email already exists"
 *                 timestamp: "2023-12-01T10:00:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  validateBody(createClientSchema),
  clientController.createClient
);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Obtenha todos os clientes com contagens de documentos
 *     description: Recupera uma lista de todos os clientes incluindo suas contagens de documentos
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Lista de clientes recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ClientWithDocumentCount'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   created_at: "2023-12-01T10:00:00.000Z"
 *                   updated_at: "2023-12-01T10:00:00.000Z"
 *                   document_count: 5
 *                 - id: 2
 *                   name: "Jane Smith"
 *                   email: "jane.smith@example.com"
 *                   created_at: "2023-12-01T11:00:00.000Z"
 *                   updated_at: "2023-12-01T11:00:00.000Z"
 *                   document_count: 3
 *               message: "Clients retrieved successfully"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  clientController.getAllClients
);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Obtenha um cliente por ID
 *     description: Recupera um cliente específico pelo seu ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Cliente recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *             example:
 *               id: 1
 *               name: "John Doe"
 *               email: "john.doe@example.com"
 *               created_at: "2023-12-01T10:00:00.000Z"
 *               updated_at: "2023-12-01T10:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id',
  validateParams(idParamSchema),
  clientController.getClientById
);

/**
 * @swagger
 * /api/clients/{id}/details:
 *   get:
 *     summary: Obtenha um cliente com contagens de documentos
 *     description: Recupera um cliente específico com sua contagem de documentos
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Client with document count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientWithDocumentCount'
 *             example:
 *               id: 1
 *               name: "John Doe"
 *               email: "john.doe@example.com"
 *               created_at: "2023-12-01T10:00:00.000Z"
 *               updated_at: "2023-12-01T10:00:00.000Z"
 *               document_count: 5
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id/details',
  validateParams(idParamSchema),
  clientController.getClientWithDocumentCount
);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Atualize o cliente
 *     description: Atualiza as informações de um cliente existente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClientRequest'
 *           example:
 *             name: "John Doe Updated"
 *             email: "john.updated@example.com"
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *             example:
 *               id: 1
 *               name: "John Doe Updated"
 *               email: "john.updated@example.com"
 *               created_at: "2023-12-01T10:00:00.000Z"
 *               updated_at: "2023-12-01T12:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflict - Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 code: "EMAIL_ALREADY_EXISTS"
 *                 message: "A client with this email already exists"
 *                 timestamp: "2023-12-01T10:00:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateClientSchema),
  clientController.updateClient
);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete cliente
 *     description: Deleta um cliente e lida com as relações de documentos associados
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client ID
 *         example: 1
 *     responses:
 *       204:
 *         description: Client deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:id',
  validateParams(idParamSchema),
  clientController.deleteClient
);

export { router as clientRoutes };