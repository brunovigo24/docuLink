/**
 * Testes unitários para classe de modelo Cliente
 */

import { ClientModel, ClientRow, ClientWithCountRow } from '../../../src/models/Client';
import { Client, CreateClientRequest, UpdateClientRequest } from '../../../src/models/interfaces';

describe('ClientModel', () => {
  describe('fromRow', () => {
    it('should convert database row to Client interface', () => {
      const row: ClientRow = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-02T00:00:00Z')
      } as ClientRow;

      const client = ClientModel.fromRow(row);

      expect(client).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-02T00:00:00Z')
      });
    });
  });

  describe('fromRowWithCount', () => {
    it('should convert database row with count to ClientWithDocumentCount interface', () => {
      const row: ClientWithCountRow = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-02T00:00:00Z'),
        document_count: 5
      } as ClientWithCountRow;

      const client = ClientModel.fromRowWithCount(row);

      expect(client).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-02T00:00:00Z'),
        document_count: 5
      });
    });
  });

  describe('toCreateData', () => {
    it('should convert CreateClientRequest to database insert data', () => {
      const request: CreateClientRequest = {
        name: '  John Doe  ',
        email: '  JOHN.DOE@EXAMPLE.COM  '
      };

      const createData = ClientModel.toCreateData(request);

      expect(createData).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com'
      });
    });

    it('should trim whitespace and normalize email', () => {
      const request: CreateClientRequest = {
        name: '\t\n  Jane Smith  \t\n',
        email: '\t\n  JANE.SMITH@EXAMPLE.COM  \t\n'
      };

      const createData = ClientModel.toCreateData(request);

      expect(createData.name).toBe('Jane Smith');
      expect(createData.email).toBe('jane.smith@example.com');
    });
  });

  describe('toUpdateData', () => {
    it('should convert UpdateClientRequest with name only', () => {
      const request: UpdateClientRequest = {
        name: '  Jane Doe  '
      };

      const updateData = ClientModel.toUpdateData(request);

      expect(updateData).toEqual({
        name: 'Jane Doe'
      });
    });

    it('should convert UpdateClientRequest with email only', () => {
      const request: UpdateClientRequest = {
        email: '  JANE.DOE@EXAMPLE.COM  '
      };

      const updateData = ClientModel.toUpdateData(request);

      expect(updateData).toEqual({
        email: 'jane.doe@example.com'
      });
    });

    it('should convert UpdateClientRequest with both fields', () => {
      const request: UpdateClientRequest = {
        name: '  Jane Doe  ',
        email: '  JANE.DOE@EXAMPLE.COM  '
      };

      const updateData = ClientModel.toUpdateData(request);

      expect(updateData).toEqual({
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
      });
    });

    it('should handle empty update request', () => {
      const request: UpdateClientRequest = {};

      const updateData = ClientModel.toUpdateData(request);

      expect(updateData).toEqual({});
    });
  });

  describe('validateBusinessRules', () => {
    it('should return empty array for valid create request', () => {
      const request: CreateClientRequest = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      const errors = ClientModel.validateBusinessRules(request);

      expect(errors).toEqual([]);
    });

    it('should return empty array for valid update request', () => {
      const request: UpdateClientRequest = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
      };

      const errors = ClientModel.validateBusinessRules(request);

      expect(errors).toEqual([]);
    });
  });

  describe('isEmailUnique', () => {
    const existingClients: Client[] = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    it('should return true for unique email', () => {
      const isUnique = ClientModel.isEmailUnique('new.user@example.com', existingClients);
      expect(isUnique).toBe(true);
    });

    it('should return false for existing email', () => {
      const isUnique = ClientModel.isEmailUnique('john.doe@example.com', existingClients);
      expect(isUnique).toBe(false);
    });

    it('should return false for existing email with different case', () => {
      const isUnique = ClientModel.isEmailUnique('JOHN.DOE@EXAMPLE.COM', existingClients);
      expect(isUnique).toBe(false);
    });

    it('should return true when excluding the same client ID', () => {
      const isUnique = ClientModel.isEmailUnique('john.doe@example.com', existingClients, 1);
      expect(isUnique).toBe(true);
    });

    it('should return false when excluding different client ID', () => {
      const isUnique = ClientModel.isEmailUnique('john.doe@example.com', existingClients, 2);
      expect(isUnique).toBe(false);
    });

    it('should handle email with whitespace', () => {
      const isUnique = ClientModel.isEmailUnique('  john.doe@example.com  ', existingClients);
      expect(isUnique).toBe(false);
    });
  });
});