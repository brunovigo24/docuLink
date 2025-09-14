import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/ClientService';
import { NotFoundError } from '../utils/errors';
import { ValidatedRequest } from '../middleware/validation';
import { CreateClientRequest, UpdateClientRequest } from '../models/interfaces';

export class ClientController {
  constructor(private clientService: ClientService) {}

  /**
   * POST /api/clients - Criar novo cliente
   */
  createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedReq = req as ValidatedRequest<CreateClientRequest>;
      const client = await this.clientService.createClient(validatedReq.validatedData);
      res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/clients - Listar todos os clientes com contagem de documentos
   */
  getAllClients = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clients = await this.clientService.getAllClients();
      res.status(200).json({
        success: true,
        data: clients,
        message: 'Clients retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/clients/:id - Obter cliente específico por ID
   */
  getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = parseInt(req.params['id'] || '0');
      const client = await this.clientService.getClientById(clientId);
      
      if (!client) {
        throw new NotFoundError(`Client with ID ${clientId} not found`);
      }

      res.status(200).json({
        success: true,
        data: client,
        message: 'Client retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/clients/:id/details - Obter cliente com contagem de documentos
   */
  getClientWithDocumentCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = parseInt(req.params['id'] || '0');
      const client = await this.clientService.getClientWithDocumentCount(clientId);
      
      if (!client) {
        throw new NotFoundError(`Client with ID ${clientId} not found`);
      }

      res.status(200).json({
        success: true,
        data: client,
        message: 'Client details retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/clients/:id - Atualizar cliente
   */
  updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedReq = req as ValidatedRequest<UpdateClientRequest>;
      const clientId = parseInt(req.params['id'] || '0');
      const updatedClient = await this.clientService.updateClient(clientId, validatedReq.validatedData);
      
      if (!updatedClient) {
        throw new NotFoundError(`Client with ID ${clientId} not found`);
      }

      res.status(200).json({
        success: true,
        data: updatedClient,
        message: 'Client updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/clients/:id - Deletar cliente
   */
  deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = parseInt(req.params['id'] || '0');
      const deleted = await this.clientService.deleteClient(clientId);
      
      if (!deleted) {
        throw new NotFoundError(`Client with ID ${clientId} not found`);
      }

      res.status(200).json({
        success: true,
        message: 'Client deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}