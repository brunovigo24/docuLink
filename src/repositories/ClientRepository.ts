import { ResultSetHeader } from 'mysql2/promise';
import { DatabaseUtils, DatabaseError } from '../utils/database';
import { Client, ClientWithDocumentCount, CreateClientRequest, UpdateClientRequest } from '../models/interfaces';
import { ClientRow, ClientWithCountRow, ClientModel } from '../models/Client';

export class ClientRepository {
  /**
   * Criar um novo cliente
   */
  async create(clientData: CreateClientRequest): Promise<Client> {
    try {
      const createData = ClientModel.toCreateData(clientData);
      
      const sql = `
        INSERT INTO clients (name, email)
        VALUES (?, ?)
      `;
      
      const result = await DatabaseUtils.query<ResultSetHeader>(
        sql,
        [createData.name, createData.email]
      );

      if (result.affectedRows === 0) {
        throw new DatabaseError('Failed to create client');
      }

      const createdClient = await this.findById(result.insertId);
      if (!createdClient) {
        throw new DatabaseError('Failed to retrieve created client');
      }

      return createdClient;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      // Lidar com erro de email duplicado
      if ((error as any)?.code === 'ER_DUP_ENTRY') {
        throw new DatabaseError('Email already exists');
      }
      
      throw new DatabaseError('Failed to create client', error);
    }
  }

  /**
   * Encontrar todos os clientes
   */
  async findAll(): Promise<Client[]> {
    try {
      const sql = `
        SELECT id, name, email, created_at, updated_at
        FROM clients
        ORDER BY created_at DESC
      `;
      
      const rows = await DatabaseUtils.query<ClientRow[]>(sql);
      return rows.map(row => ClientModel.fromRow(row));
    } catch (error) {
      throw new DatabaseError('Failed to fetch clients', error);
    }
  }

  /**
   * Encontrar cliente por ID
   */
  async findById(id: number): Promise<Client | null> {
    try {
      const sql = `
        SELECT id, name, email, created_at, updated_at
        FROM clients
        WHERE id = ?
      `;
      
      const rows = await DatabaseUtils.query<ClientRow[]>(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return ClientModel.fromRow(rows[0]!);
    } catch (error) {
      throw new DatabaseError('Failed to fetch client', error);
    }
  }

  /**
   * Atualizar cliente por ID
   */
  async update(id: number, clientData: UpdateClientRequest): Promise<Client | null> {
    try {
      const updateData = ClientModel.toUpdateData(clientData);
      
      // Construir query de atualização dinâmica
      const updateFields = Object.keys(updateData);
      if (updateFields.length === 0) {
        // Nenhum campo para atualizar, retornar cliente atual
        return await this.findById(id);
      }
      
      const setClause = updateFields.map(field => `${field} = ?`).join(', ');
      const values = Object.values(updateData);
      
      const sql = `
        UPDATE clients 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = await DatabaseUtils.query<ResultSetHeader>(
        sql,
        [...values, id]
      );

      if (result.affectedRows === 0) {
        return null; // Cliente não encontrado
      }

      // Retornar cliente atualizado
      return await this.findById(id);
    } catch (error) {
      if ((error as any)?.code === 'ER_DUP_ENTRY') {
        throw new DatabaseError('Email already exists');
      }
      
      throw new DatabaseError('Failed to update client', error);
    }
  }

  /**
   * Deletar cliente por ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const sql = `DELETE FROM clients WHERE id = ?`;
      
      const result = await DatabaseUtils.query<ResultSetHeader>(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new DatabaseError('Failed to delete client', error);
    }
  }

  /**
   * Encontrar todos os clientes com contagem de documentos usando JOIN queries
   */
  async findAllWithDocumentCount(): Promise<ClientWithDocumentCount[]> {
    try {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.created_at,
          c.updated_at,
          COALESCE(COUNT(d.id), 0) as document_count
        FROM clients c
        LEFT JOIN documents d ON c.id = d.client_id
        GROUP BY c.id, c.name, c.email, c.created_at, c.updated_at
        ORDER BY c.created_at DESC
      `;
      
      const rows = await DatabaseUtils.query<ClientWithCountRow[]>(sql);
      return rows.map(row => ClientModel.fromRowWithCount(row));
    } catch (error) {
      throw new DatabaseError('Failed to fetch clients with document count', error);
    }
  }

  /**
   * Encontrar cliente por ID com contagem de documentos
   */
  async findByIdWithDocumentCount(id: number): Promise<ClientWithDocumentCount | null> {
    try {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.created_at,
          c.updated_at,
          COALESCE(COUNT(d.id), 0) as document_count
        FROM clients c
        LEFT JOIN documents d ON c.id = d.client_id
        WHERE c.id = ?
        GROUP BY c.id, c.name, c.email, c.created_at, c.updated_at
      `;
      
      const rows = await DatabaseUtils.query<ClientWithCountRow[]>(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return ClientModel.fromRowWithCount(rows[0]!);
    } catch (error) {
      throw new DatabaseError('Failed to fetch client with document count', error);
    }
  }

  /**
   * Verificar se o email existe (excluindo ID específico)
    * Método auxiliar para validação
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM clients WHERE email = ?`;
      const params: any[] = [email.trim().toLowerCase()];
      
      if (excludeId) {
        sql += ` AND id != ?`;
        params.push(excludeId);
      }
      
      const rows = await DatabaseUtils.query<any[]>(sql, params);
      return rows[0].count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check email existence', error);
    }
  }

  /**
   * Obter total de clientes
    * Método auxiliar para paginação
   */
  async getTotalCount(): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM clients`;
      const rows = await DatabaseUtils.query<any[]>(sql);
      return rows[0].count;
    } catch (error) {
      throw new DatabaseError('Failed to get client count', error);
    }
  }
}