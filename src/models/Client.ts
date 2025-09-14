import { RowDataPacket } from 'mysql2';
import { Client, ClientWithDocumentCount, CreateClientRequest, UpdateClientRequest } from './interfaces';

export interface ClientRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientWithCountRow extends ClientRow {
  document_count: number;
}

export class ClientModel {
  static fromRow(row: ClientRow): Client {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  static fromRowWithCount(row: ClientWithCountRow): ClientWithDocumentCount {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      created_at: row.created_at,
      updated_at: row.updated_at,
      document_count: row.document_count
    };
  }

  static toCreateData(clientData: CreateClientRequest): Omit<Client, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: clientData.name.trim(),
      email: clientData.email.trim().toLowerCase()
    };
  }

  static toUpdateData(clientData: UpdateClientRequest): Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>> {
    const updateData: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>> = {};
    
    if (clientData.name !== undefined) {
      updateData.name = clientData.name.trim();
    }
    
    if (clientData.email !== undefined) {
      updateData.email = clientData.email.trim().toLowerCase();
    }
    
    return updateData;
  }

  static validateBusinessRules(_clientData: CreateClientRequest | UpdateClientRequest): string[] {
    const errors: string[] = [];

    return errors;
  }

  static isEmailUnique(email: string, existingClients: Client[], excludeId?: number): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    return !existingClients.some(client => 
      client.email.toLowerCase() === normalizedEmail && client.id !== excludeId
    );
  }
}