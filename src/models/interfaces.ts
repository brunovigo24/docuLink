/**
 * Interfaces TypeScript principais para a API de processamento de documentos
 */

export interface Client {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientWithDocumentCount extends Client {
  document_count: number;
}

export interface CreateClientRequest {
  name: string;
  email: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
}

export interface Document {
  id: number;
  client_id: number;
  title: string;
  content: string;
  document_type: 'pdf' | 'web';
  source_url?: string | undefined;
  file_path?: string | undefined;
  processed_at: Date;
  created_at: Date;
}

export interface CreateDocumentRequest {
  client_id: number;
  title: string;
  content: string;
  document_type: 'pdf' | 'web';
  source_url?: string | undefined;
  file_path?: string | undefined;
}

export interface ProcessPDFRequest {
  client_id: number;
}

export interface ProcessWebRequest {
  client_id: number;
  url: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}