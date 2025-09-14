import { RowDataPacket } from 'mysql2';
import { Document, CreateDocumentRequest } from './interfaces';

export interface DocumentRow extends RowDataPacket {
  id: number;
  client_id: number;
  title: string;
  content: string;
  document_type: 'pdf' | 'web';
  source_url?: string | null;
  file_path?: string | null;
  processed_at: Date;
  created_at: Date;
}

export class DocumentModel {
  static fromRow(row: DocumentRow): Document {
    return {
      id: row.id,
      client_id: row.client_id,
      title: row.title,
      content: row.content,
      document_type: row.document_type,
      source_url: row.source_url || undefined,
      file_path: row.file_path || undefined,
      processed_at: row.processed_at,
      created_at: row.created_at
    };
  }
  
  static toCreateData(documentData: CreateDocumentRequest): Omit<Document, 'id' | 'processed_at' | 'created_at'> {
    return {
      client_id: documentData.client_id,
      title: documentData.title.trim(),
      content: documentData.content,
      document_type: documentData.document_type,
      source_url: documentData.source_url?.trim(),
      file_path: documentData.file_path?.trim()
    };
  }

   
  static createPDFDocument(
    clientId: number,
    title: string,
    content: string,
    filePath: string
  ): Omit<Document, 'id' | 'processed_at' | 'created_at'> {
    return {
      client_id: clientId,
      title: title.trim(),
      content: content,
      document_type: 'pdf',
      source_url: undefined,
      file_path: filePath.trim()
    };
  }

   
  static createWebDocument(
    clientId: number,
    title: string,
    content: string,
    sourceUrl: string
  ): Omit<Document, 'id' | 'processed_at' | 'created_at'> {
    return {
      client_id: clientId,
      title: title.trim(),
      content: content,
      document_type: 'web',
      source_url: sourceUrl.trim(),
      file_path: undefined
    };
  }

   
  static validateBusinessRules(documentData: CreateDocumentRequest): string[] {
    const errors: string[] = [];

    if (documentData.document_type === 'pdf' && !documentData.file_path) {
      errors.push('PDF documents must have a file path');
    }

    if (documentData.document_type === 'web' && !documentData.source_url) {
      errors.push('Web documents must have a source URL');
    }

    if (documentData.content.length === 0) {
      errors.push('Document content cannot be empty');
    }

    if (documentData.content.length > 1000000) { // 1MB de limite de texto
      errors.push('Document content exceeds maximum length');
    }

    if (documentData.title.trim().length === 0) {
      errors.push('Document title cannot be empty');
    }

    if (documentData.title.length > 500) {
      errors.push('Document title exceeds maximum length of 500 characters');
    }

    return errors;
  }

  static sanitizeContent(content: string): string {
    return content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  static extractTitleFromContent(content: string, maxLength: number = 100): string {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return 'Untitled Document';
    }

    const firstLine = lines[0]?.trim();
    if (!firstLine) {
      return 'Untitled Document';
    }

    if (firstLine.length <= maxLength) {
      return firstLine;
    }

    return firstLine.substring(0, maxLength - 3) + '...';
  }

  static getDocumentTypeFromSource(source: string): 'pdf' | 'web' {
    if (source.toLowerCase().endsWith('.pdf') || source.includes('pdf')) {
      return 'pdf';
    }
    return 'web';
  }
}