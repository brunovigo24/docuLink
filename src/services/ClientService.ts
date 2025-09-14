/**
 * ClientService - Camada de lógica de negócios para gerenciamento de clientes
 */

import { Client, ClientWithDocumentCount, CreateClientRequest, UpdateClientRequest } from '../models/interfaces';
import { ClientRepository } from '../repositories/ClientRepository';
import { createClientSchema, updateClientSchema } from '../models/validation';
import { ValidationError, BusinessLogicError, NotFoundError } from '../utils/errors';

export class ClientService {
  constructor(private clientRepository: ClientRepository) {}

  /**
   * Criar novo cliente com validação
   */
  async createClient(clientData: CreateClientRequest): Promise<Client> {
    // Validar dados de entrada
    const { error, value } = createClientSchema.validate(clientData);
    if (error) {
      throw new ValidationError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Verificar email único
    const emailExists = await this.clientRepository.emailExists(value.email);
    if (emailExists) {
      throw new BusinessLogicError('Email already exists');
    }

    try {
      return await this.clientRepository.create(value);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Email already exists')) {
        throw new BusinessLogicError('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Obter todos os clientes com contagem de documentos
   */
  async getAllClients(): Promise<ClientWithDocumentCount[]> {
    return await this.clientRepository.findAllWithDocumentCount();
  }

  /**
   * Obter cliente específico por ID
   */
  async getClientById(id: number): Promise<Client | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Client ID must be a positive integer');
    }

    return await this.clientRepository.findById(id);
  }

  /**
   * Obter cliente específico por ID com contagem de documentos
   */
  async getClientWithDocumentCount(id: number): Promise<ClientWithDocumentCount | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Client ID must be a positive integer');
    }

    return await this.clientRepository.findByIdWithDocumentCount(id);
  }

  /**
   * Update cliente com validação
   */
  async updateClient(id: number, clientData: UpdateClientRequest): Promise<Client | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Client ID must be a positive integer');
    }

    // Validar dados de entrada
    const { error, value } = updateClientSchema.validate(clientData);
    if (error) {
      throw new ValidationError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Verificar se cliente existe
    const existingClient = await this.clientRepository.findById(id);
    if (!existingClient) {
      return null;
    }

    // Verificar email único se email está sendo atualizado
    if (value.email && value.email !== existingClient.email) {
      const emailExists = await this.clientRepository.emailExists(value.email, id);
      if (emailExists) {
        throw new BusinessLogicError('Email already exists');
      }
    }

    try {
      return await this.clientRepository.update(id, value);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Email already exists')) {
        throw new BusinessLogicError('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Delete cliente com gerenciamento de relacionamento de documentos
   */
  async deleteClient(id: number): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Client ID must be a positive integer');
    }

    // Verificar se cliente existe
    const existingClient = await this.clientRepository.findById(id);
    if (!existingClient) {
      return false;
    }

    // Verificar se cliente tem documentos associados
    const clientWithCount = await this.clientRepository.findByIdWithDocumentCount(id);
    if (clientWithCount && clientWithCount.document_count > 0) {
      throw new BusinessLogicError(
        `Cannot delete client with ${clientWithCount.document_count} associated documents. ` +
        'Please delete or reassign documents first.'
      );
    }

    return await this.clientRepository.delete(id);
  }

  /**
   * Validar se cliente existe (método auxiliar para outros serviços)
   */
  async validateClientExists(clientId: number): Promise<Client> {
    if (!Number.isInteger(clientId) || clientId <= 0) {
      throw new ValidationError('Client ID must be a positive integer');
    }

    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new NotFoundError(`Client with ID ${clientId} not found`);
    }

    return client;
  }

  /**
   * Obter total de clientes (método auxiliar para paginação)
   */
  async getTotalClientCount(): Promise<number> {
    return await this.clientRepository.getTotalCount();
  }
}