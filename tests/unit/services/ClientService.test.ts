/**
 * Testes unitários para ClientService
 * Testes de lógica de negócio com repositórios mockados
 */

import { ClientService } from '../../../src/services/ClientService';
import { ClientRepository } from '../../../src/repositories/ClientRepository';
import { ValidationError, BusinessLogicError } from '../../../src/utils/errors';
import { Client, ClientWithDocumentCount, CreateClientRequest, UpdateClientRequest } from '../../../src/models/interfaces';

// Mock do ClientRepository
jest.mock('../../../src/repositories/ClientRepository');

describe('ClientService', () => {
  let clientService: ClientService;
  let mockClientRepository: jest.Mocked<ClientRepository>;

  // Dados de teste
  const mockClient: Client = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01')
  };

  const mockClientWithCount: ClientWithDocumentCount = {
    ...mockClient,
    document_count: 5
  };

  const validCreateRequest: CreateClientRequest = {
    name: 'John Doe',
    email: 'john@example.com'
  };

  const validUpdateRequest: UpdateClientRequest = {
    name: 'Jane Doe',
    email: 'jane@example.com'
  };

  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Criar repositório mockado
    mockClientRepository = new ClientRepository() as jest.Mocked<ClientRepository>;
    
    // Criar serviço com repositório mockado
    clientService = new ClientService(mockClientRepository);
  });

  describe('createClient', () => {
    it('should create a client successfully with valid data', async () => {
      mockClientRepository.emailExists.mockResolvedValue(false);
      mockClientRepository.create.mockResolvedValue(mockClient);

      const result = await clientService.createClient(validCreateRequest);

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.emailExists).toHaveBeenCalledWith('john@example.com');
      expect(mockClientRepository.create).toHaveBeenCalledWith(validCreateRequest);
    });

    it('should throw ValidationError for invalid name', async () => {
      const invalidRequest = { name: '', email: 'john@example.com' };

      await expect(clientService.createClient(invalidRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.emailExists).not.toHaveBeenCalled();
      expect(mockClientRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidRequest = { name: 'John Doe', email: 'invalid-email' };

      await expect(clientService.createClient(invalidRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.emailExists).not.toHaveBeenCalled();
      expect(mockClientRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing required fields', async () => {
      const invalidRequest = { name: 'John Doe' } as CreateClientRequest;

      await expect(clientService.createClient(invalidRequest))
        .rejects.toThrow(ValidationError);
    });

    it('should throw BusinessLogicError when email already exists', async () => {
      mockClientRepository.emailExists.mockResolvedValue(true);

      await expect(clientService.createClient(validCreateRequest))
        .rejects.toThrow(BusinessLogicError);
      
      expect(mockClientRepository.emailExists).toHaveBeenCalledWith('john@example.com');
      expect(mockClientRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository email duplicate error', async () => {
      mockClientRepository.emailExists.mockResolvedValue(false);
      mockClientRepository.create.mockRejectedValue(new Error('Email already exists'));

      await expect(clientService.createClient(validCreateRequest))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('getAllClients', () => {
    it('should return all clients with document counts', async () => {
      const mockClients = [mockClientWithCount];
      mockClientRepository.findAllWithDocumentCount.mockResolvedValue(mockClients);

      const result = await clientService.getAllClients();

      expect(result).toEqual(mockClients);
      expect(mockClientRepository.findAllWithDocumentCount).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no clients exist', async () => {
      mockClientRepository.findAllWithDocumentCount.mockResolvedValue([]);

      const result = await clientService.getAllClients();

      expect(result).toEqual([]);
      expect(mockClientRepository.findAllWithDocumentCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getClientById', () => {
    it('should return client when found', async () => {
      mockClientRepository.findById.mockResolvedValue(mockClient);

      const result = await clientService.getClientById(1);

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when client not found', async () => {
      mockClientRepository.findById.mockResolvedValue(null);

      const result = await clientService.getClientById(999);

      expect(result).toBeNull();
      expect(mockClientRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(clientService.getClientById(-1))
        .rejects.toThrow(ValidationError);
      
      await expect(clientService.getClientById(0))
        .rejects.toThrow(ValidationError);
      
      await expect(clientService.getClientById(1.5))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getClientWithDocumentCount', () => {
    it('should return client with document count when found', async () => {
      mockClientRepository.findByIdWithDocumentCount.mockResolvedValue(mockClientWithCount);

      const result = await clientService.getClientWithDocumentCount(1);

      expect(result).toEqual(mockClientWithCount);
      expect(mockClientRepository.findByIdWithDocumentCount).toHaveBeenCalledWith(1);
    });

    it('should return null when client not found', async () => {
      mockClientRepository.findByIdWithDocumentCount.mockResolvedValue(null);

      const result = await clientService.getClientWithDocumentCount(999);

      expect(result).toBeNull();
      expect(mockClientRepository.findByIdWithDocumentCount).toHaveBeenCalledWith(999);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(clientService.getClientWithDocumentCount(-1))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.findByIdWithDocumentCount).not.toHaveBeenCalled();
    });
  });

  describe('updateClient', () => {
    it('should update client successfully with valid data', async () => {
      const updatedClient = { ...mockClient, name: 'Jane Doe', email: 'jane@example.com' };
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockClientRepository.emailExists.mockResolvedValue(false);
      mockClientRepository.update.mockResolvedValue(updatedClient);

      const result = await clientService.updateClient(1, validUpdateRequest);

      expect(result).toEqual(updatedClient);
      expect(mockClientRepository.findById).toHaveBeenCalledWith(1);
      expect(mockClientRepository.emailExists).toHaveBeenCalledWith('jane@example.com', 1);
      expect(mockClientRepository.update).toHaveBeenCalledWith(1, validUpdateRequest);
    });

    it('should return null when client not found', async () => {
      mockClientRepository.findById.mockResolvedValue(null);

      const result = await clientService.updateClient(999, validUpdateRequest);

      expect(result).toBeNull();
      expect(mockClientRepository.findById).toHaveBeenCalledWith(999);
      expect(mockClientRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(clientService.updateClient(-1, validUpdateRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid update data', async () => {
      const invalidRequest = { name: '', email: 'invalid-email' };

      await expect(clientService.updateClient(1, invalidRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw BusinessLogicError when email already exists', async () => {
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockClientRepository.emailExists.mockResolvedValue(true);

      await expect(clientService.updateClient(1, validUpdateRequest))
        .rejects.toThrow(BusinessLogicError);
      
      expect(mockClientRepository.update).not.toHaveBeenCalled();
    });

    it('should not check email uniqueness when email is not being updated', async () => {
      const updateWithoutEmail = { name: 'Jane Doe' };
      const updatedClient = { ...mockClient, name: 'Jane Doe' };
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockClientRepository.update.mockResolvedValue(updatedClient);

      const result = await clientService.updateClient(1, updateWithoutEmail);

      expect(result).toEqual(updatedClient);
      expect(mockClientRepository.emailExists).not.toHaveBeenCalled();
      expect(mockClientRepository.update).toHaveBeenCalledWith(1, updateWithoutEmail);
    });

    it('should not check email uniqueness when email is the same', async () => {
      const updateWithSameEmail = { name: 'Jane Doe', email: 'john@example.com' };
      const updatedClient = { ...mockClient, name: 'Jane Doe' };
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockClientRepository.update.mockResolvedValue(updatedClient);

      const result = await clientService.updateClient(1, updateWithSameEmail);

      expect(result).toEqual(updatedClient);
      expect(mockClientRepository.emailExists).not.toHaveBeenCalled();
      expect(mockClientRepository.update).toHaveBeenCalledWith(1, updateWithSameEmail);
    });
  });

  describe('deleteClient', () => {
    it('should delete client successfully when no documents exist', async () => {
      const clientWithNoDocuments = { ...mockClientWithCount, document_count: 0 };
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockClientRepository.findByIdWithDocumentCount.mockResolvedValue(clientWithNoDocuments);
      mockClientRepository.delete.mockResolvedValue(true);

      const result = await clientService.deleteClient(1);

      expect(result).toBe(true);
      expect(mockClientRepository.findById).toHaveBeenCalledWith(1);
      expect(mockClientRepository.findByIdWithDocumentCount).toHaveBeenCalledWith(1);
      expect(mockClientRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return false when client not found', async () => {
      mockClientRepository.findById.mockResolvedValue(null);

      const result = await clientService.deleteClient(999);

      expect(result).toBe(false);
      expect(mockClientRepository.findById).toHaveBeenCalledWith(999);
      expect(mockClientRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(clientService.deleteClient(-1))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw BusinessLogicError when client has associated documents', async () => {
      mockClientRepository.findById.mockResolvedValue(mockClient);
      mockClientRepository.findByIdWithDocumentCount.mockResolvedValue(mockClientWithCount);

      await expect(clientService.deleteClient(1))
        .rejects.toThrow(BusinessLogicError);
      
      expect(mockClientRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateClientExists', () => {
    it('should return client when found', async () => {
      mockClientRepository.findById.mockResolvedValue(mockClient);

      const result = await clientService.validateClientExists(1);

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw BusinessLogicError when client not found', async () => {
      mockClientRepository.findById.mockResolvedValue(null);

      await expect(clientService.validateClientExists(999))
        .rejects.toThrow(BusinessLogicError);
      
      expect(mockClientRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(clientService.validateClientExists(-1))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getTotalClientCount', () => {
    it('should return total client count', async () => {
      mockClientRepository.getTotalCount.mockResolvedValue(42);

      const result = await clientService.getTotalClientCount();

      expect(result).toBe(42);
      expect(mockClientRepository.getTotalCount).toHaveBeenCalledTimes(1);
    });

    it('should return zero when no clients exist', async () => {
      mockClientRepository.getTotalCount.mockResolvedValue(0);

      const result = await clientService.getTotalClientCount();

      expect(result).toBe(0);
      expect(mockClientRepository.getTotalCount).toHaveBeenCalledTimes(1);
    });
  });
});