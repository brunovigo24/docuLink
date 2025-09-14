/**
 * DocumentService - Camada de lógica de negócios para processamento de documentos
 * Coordena processamento de PDF e web scraping
 */

import { Document, ProcessPDFRequest, ProcessWebRequest, PaginationOptions, PaginatedResponse, CreateDocumentRequest } from '../models/interfaces';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { ClientService } from './ClientService';
import { processPDFSchema, processWebSchema, validateFileType, validateFileSize, validateURL } from '../models/validation';
import { ValidationError, ProcessingError } from '../utils/errors';
import { DocumentModel } from '../models/Document';

// Interfaces para os serviços de processamento
export interface PDFProcessingResult {
  title: string;
  content: string;
  filePath: string;
}

export interface WebScrapingResult {
  title: string;
  content: string;
  url: string;
}

export interface IPDFProcessingService {
  extractContent(buffer: Buffer, originalName: string): Promise<PDFProcessingResult>;
  validatePDF(buffer: Buffer): Promise<boolean>;
}

export interface IWebScrapingService {
  scrapeURL(url: string): Promise<WebScrapingResult>;
  validateURL(url: string): Promise<boolean>;
}

export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private clientService: ClientService,
    private pdfProcessingService?: IPDFProcessingService,
    private webScrapingService?: IWebScrapingService
  ) {}

  /**
   * Processar documento PDF
   */
  async processPDF(file: Express.Multer.File, request: ProcessPDFRequest): Promise<Document> {
    // Validar dados de entrada
    const { error, value } = processPDFSchema.validate(request);
    if (error) {
      throw new ValidationError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Validar arquivo primeiro (validações mais rápidas)
    if (!file) {
      throw new ValidationError('PDF file is required');
    }

    if (!validateFileType(file.mimetype)) {
      throw new ValidationError('Invalid file type. Only PDF files are allowed');
    }

    if (!validateFileSize(file.size)) {
      throw new ValidationError('File size exceeds maximum allowed size (10MB)');
    }

    // Validar cliente existe 
    await this.clientService.validateClientExists(value.client_id);

    // Verificar se serviço de processamento PDF está disponível
    if (!this.pdfProcessingService) {
      throw new ProcessingError('PDF processing service is not available');
    }

    try {
      // Validar PDF
      const isValidPDF = await this.pdfProcessingService.validatePDF(file.buffer);
      if (!isValidPDF) {
        throw new ValidationError('Invalid or corrupted PDF file');
      }

      // Extrair conteúdo do PDF
      const extractedData = await this.pdfProcessingService.extractContent(file.buffer, file.originalname);

      // Sanitizar conteúdo
      const sanitizedContent = DocumentModel.sanitizeContent(extractedData.content);
      
      // Validar conteúdo extraído
      if (!sanitizedContent || sanitizedContent.trim().length === 0) {
        throw new ProcessingError('No content could be extracted from the PDF file');
      }

      // Criar documento no banco de dados
      const documentData = DocumentModel.createPDFDocument(
        value.client_id,
        extractedData.title || DocumentModel.extractTitleFromContent(sanitizedContent),
        sanitizedContent,
        extractedData.filePath
      );

      // Validar regras de negócio
      const createRequest: CreateDocumentRequest = {
        client_id: documentData.client_id,
        title: documentData.title,
        content: documentData.content,
        document_type: documentData.document_type,
        source_url: documentData.source_url,
        file_path: documentData.file_path
      };

      const businessErrors = DocumentModel.validateBusinessRules(createRequest);

      if (businessErrors.length > 0) {
        throw new ValidationError(`Business rule validation failed: ${businessErrors.join(', ')}`);
      }

      return await this.documentRepository.create(documentData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ProcessingError) {
        throw error;
      }
      
      // Log do erro para debugging
      console.error('PDF processing error:', error);
      throw new ProcessingError('Failed to process PDF document', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Processar página web
   */
  async processWebPage(request: ProcessWebRequest): Promise<Document> {
    // Validar dados de entrada
    const { error, value } = processWebSchema.validate(request);
    if (error) {
      throw new ValidationError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Validar cliente existe
    await this.clientService.validateClientExists(value.client_id);

    // Validação adicional de URL
    if (!validateURL(value.url)) {
      throw new ValidationError('Invalid URL format');
    }

    // Verificar se serviço de web scraping está disponível
    if (!this.webScrapingService) {
      throw new ProcessingError('Web scraping service is not available');
    }

    try {
      // Validar URL acessibilidade
      const isValidURL = await this.webScrapingService.validateURL(value.url);
      if (!isValidURL) {
        throw new ValidationError('URL is not accessible or invalid');
      }

      // Extrair conteúdo da página web
      const extractedData = await this.webScrapingService.scrapeURL(value.url);

      // Sanitizar conteúdo
      const sanitizedContent = DocumentModel.sanitizeContent(extractedData.content);
      
      // Validar conteúdo extraído
      if (!sanitizedContent || sanitizedContent.trim().length === 0) {
        throw new ProcessingError('No content could be extracted from the web page');
      }

      // Criar documento no banco de dados
      const documentData = DocumentModel.createWebDocument(
        value.client_id,
        extractedData.title || DocumentModel.extractTitleFromContent(sanitizedContent),
        sanitizedContent,
        extractedData.url
      );

      // Validar regras de negócio
      const createRequest: CreateDocumentRequest = {
        client_id: documentData.client_id,
        title: documentData.title,
        content: documentData.content,
        document_type: documentData.document_type,
        source_url: documentData.source_url,
        file_path: documentData.file_path
      };

      const businessErrors = DocumentModel.validateBusinessRules(createRequest);

      if (businessErrors.length > 0) {
        throw new ValidationError(`Business rule validation failed: ${businessErrors.join(', ')}`);
      }

      return await this.documentRepository.create(documentData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ProcessingError) {
        throw error;
      }
      
      // Log do erro para debugging
      console.error('Web scraping error:', error);
      throw new ProcessingError('Failed to process web page', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Obter documentos por cliente
   */
  async getDocumentsByClient(clientId: number, options: PaginationOptions = {}): Promise<PaginatedResponse<Document>> {
    // Validar cliente existe
    await this.clientService.validateClientExists(clientId);

    try {
      return await this.documentRepository.findByClientIdWithPagination(clientId, options);
    } catch (error) {
      console.error('Error fetching documents by client:', error);
      throw new ProcessingError('Failed to fetch documents by client', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Obter todos os documentos
   */
  async getAllDocuments(options: PaginationOptions = {}): Promise<PaginatedResponse<Document>> {
    try {
      return await this.documentRepository.findAll(options);
    } catch (error) {
      console.error('Error fetching all documents:', error);
      throw new ProcessingError('Failed to fetch documents', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Obter documento por ID
   */
  async getDocumentById(id: number): Promise<Document | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Document ID must be a positive integer');
    }

    try {
      return await this.documentRepository.findById(id);
    } catch (error) {
      console.error('Error fetching document by ID:', error);
      throw new ProcessingError('Failed to fetch document', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Obter documentos por tipo
   */
  async getDocumentsByType(documentType: 'pdf' | 'web', options: PaginationOptions = {}): Promise<PaginatedResponse<Document>> {
    if (!['pdf', 'web'].includes(documentType)) {
      throw new ValidationError('Document type must be either "pdf" or "web"');
    }

    try {
      return await this.documentRepository.findByType(documentType, options);
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      throw new ProcessingError('Failed to fetch documents by type', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Deletar documento
   */
  async deleteDocument(id: number): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Document ID must be a positive integer');
    }

    // Verificar se documento existe
    const existingDocument = await this.getDocumentById(id);
    if (!existingDocument) {
      return false;
    }

    try {
      return await this.documentRepository.delete(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new ProcessingError('Failed to delete document', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Obter estatísticas de documentos
   */
  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    pdfDocuments: number;
    webDocuments: number;
  }> {
    try {
      const [total, pdfDocs, webDocs] = await Promise.all([
        this.documentRepository.getTotalCount(),
        this.documentRepository.findByType('pdf', { page: 1, limit: 1 }),
        this.documentRepository.findByType('web', { page: 1, limit: 1 })
      ]);

      return {
        totalDocuments: total,
        pdfDocuments: pdfDocs.pagination.total,
        webDocuments: webDocs.pagination.total
      };
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      throw new ProcessingError('Failed to fetch document statistics', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Validar se serviços de processamento estão disponíveis
   */
  isProcessingServicesAvailable(): {
    pdfProcessing: boolean;
    webScraping: boolean;
  } {
    return {
      pdfProcessing: !!this.pdfProcessingService,
      webScraping: !!this.webScrapingService
    };
  }
}