import { ResultSetHeader } from 'mysql2/promise';
import { DatabaseUtils, DatabaseError } from '../utils/database';
import { Document, CreateDocumentRequest, PaginationOptions, PaginatedResponse } from '../models/interfaces';
import { DocumentRow, DocumentModel } from '../models/Document';

export class DocumentRepository {
  /**
   * Criar novo documento
   */
  async create(documentData: CreateDocumentRequest): Promise<Document> {
    try {
      const createData = DocumentModel.toCreateData(documentData);
      
      const sql = `
        INSERT INTO documents (client_id, title, content, document_type, source_url, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await DatabaseUtils.query<ResultSetHeader>(
        sql,
        [
          createData.client_id,
          createData.title,
          createData.content,
          createData.document_type,
          createData.source_url || null,
          createData.file_path || null
        ]
      );

      if (result.affectedRows === 0) {
        throw new DatabaseError('Failed to create document');
      }

      const createdDocument = await this.findById(result.insertId);
      if (!createdDocument) {
        throw new DatabaseError('Failed to retrieve created document');
      }

      return createdDocument;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      // Lidar com erro de chave estrangeira
      if ((error as any)?.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new DatabaseError('Client not found');
      }
      
      throw new DatabaseError('Failed to create document', error);
    }
  }

  /**
   * Encontrar documento por ID
   */
  async findById(id: number): Promise<Document | null> {
    try {
      const sql = `
        SELECT id, client_id, title, content, document_type, source_url, file_path, processed_at, created_at
        FROM documents
        WHERE id = ?
      `;
      
      const rows = await DatabaseUtils.query<DocumentRow[]>(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return DocumentModel.fromRow(rows[0]!);
    } catch (error) {
      throw new DatabaseError('Failed to fetch document', error);
    }
  }

  /**
   * Encontrar documentos por ID de cliente
   */
  async findByClientId(clientId: number): Promise<Document[]> {
    try {
      const sql = `
        SELECT id, client_id, title, content, document_type, source_url, file_path, processed_at, created_at
        FROM documents
        WHERE client_id = ?
        ORDER BY processed_at DESC, created_at DESC
      `;
      
      const rows = await DatabaseUtils.query<DocumentRow[]>(sql, [clientId]);
      return rows.map(row => DocumentModel.fromRow(row));
    } catch (error) {
      throw new DatabaseError('Failed to fetch documents by client ID', error);
    }
  }

  /**
   * Encontrar todos os documentos com suporte para paginação
   */
  async findAll(options: PaginationOptions = {}): Promise<PaginatedResponse<Document>> {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 10));
      const offset = (page - 1) * limit;

      // Obter total de documentos para paginação
      const countSql = `SELECT COUNT(*) as total FROM documents`;
      const countRows = await DatabaseUtils.query<any[]>(countSql);
      const total = countRows[0].total;

      // Obter documentos paginados
      const sql = `
        SELECT id, client_id, title, content, document_type, source_url, file_path, processed_at, created_at
        FROM documents
        ORDER BY processed_at DESC, created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await DatabaseUtils.query<DocumentRow[]>(sql, [limit, offset]);
      const documents = rows.map(row => DocumentModel.fromRow(row));

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch documents with pagination', error);
    }
  }

  /**
   * Encontrar documentos por ID de cliente com suporte para paginação
   */
  async findByClientIdWithPagination(
    clientId: number, 
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<Document>> {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 10));
      const offset = (page - 1) * limit;

      // Obter total de documentos para paginação
      const countSql = `SELECT COUNT(*) as total FROM documents WHERE client_id = ?`;
      const countRows = await DatabaseUtils.query<any[]>(countSql, [clientId]);
      const total = countRows[0].total;

      // Obter documentos paginados
      const sql = `
        SELECT id, client_id, title, content, document_type, source_url, file_path, processed_at, created_at
        FROM documents
        WHERE client_id = ?
        ORDER BY processed_at DESC, created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await DatabaseUtils.query<DocumentRow[]>(sql, [clientId, limit, offset]);
      const documents = rows.map(row => DocumentModel.fromRow(row));

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch documents by client ID with pagination', error);
    }
  }

  /**
   * Obter total de documentos
   * Método auxiliar para paginação
   */
  async getTotalCount(): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM documents`;
      const rows = await DatabaseUtils.query<any[]>(sql);
      return rows[0].count;
    } catch (error) {
      throw new DatabaseError('Failed to get document count', error);
    }
  }

  /**
   * Obter total de documentos por ID de cliente
   */
  async getCountByClientId(clientId: number): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM documents WHERE client_id = ?`;
      const rows = await DatabaseUtils.query<any[]>(sql, [clientId]);
      return rows[0].count;
    } catch (error) {
      throw new DatabaseError('Failed to get document count by client ID', error);
    }
  }

  /**
   * Encontrar documentos por tipo
   */
  async findByType(documentType: 'pdf' | 'web', options: PaginationOptions = {}): Promise<PaginatedResponse<Document>> {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 10));
      const offset = (page - 1) * limit;

      // Obter total de documentos para paginação
      const countSql = `SELECT COUNT(*) as total FROM documents WHERE document_type = ?`;
      const countRows = await DatabaseUtils.query<any[]>(countSql, [documentType]);
      const total = countRows[0].total;

      // Obter documentos paginados
      const sql = `
        SELECT id, client_id, title, content, document_type, source_url, file_path, processed_at, created_at
        FROM documents
        WHERE document_type = ?
        ORDER BY processed_at DESC, created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await DatabaseUtils.query<DocumentRow[]>(sql, [documentType, limit, offset]);
      const documents = rows.map(row => DocumentModel.fromRow(row));

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch documents by type', error);
    }
  }

  /**
   * Deletar documento por ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const sql = `DELETE FROM documents WHERE id = ?`;
      
      const result = await DatabaseUtils.query<ResultSetHeader>(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new DatabaseError('Failed to delete document', error);
    }
  }

  /**
   * Deletar todos os documentos por ID de cliente
   */
  async deleteByClientId(clientId: number): Promise<number> {
    try {
      const sql = `DELETE FROM documents WHERE client_id = ?`;
      
      const result = await DatabaseUtils.query<ResultSetHeader>(sql, [clientId]);
      
      return result.affectedRows;
    } catch (error) {
      throw new DatabaseError('Failed to delete documents by client ID', error);
    }
  }
}