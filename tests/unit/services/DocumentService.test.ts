/**
 * Testes unitários para DocumentService
 */

import { DocumentService, IPDFProcessingService, IWebScrapingService, PDFProcessingResult, WebScrapingResult } from '../../../src/services/DocumentService';
import { DocumentRepository } from '../../../src/repositories/DocumentRepository';
import { ClientService } from '../../../src/services/ClientService';
import { ValidationError, ProcessingError } from '../../../src/utils/errors';
import { Document, ProcessPDFRequest, ProcessWebRequest, PaginationOptions, PaginatedResponse } from '../../../src/models/interfaces';

// Mock dos repositórios e serviços
jest.mock('../../../src/repositories/DocumentRepository');
jest.mock('../../../src/services/ClientService');

describe('DocumentService', () => {
  let documentService: DocumentService;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;
  let mockClientService: jest.Mocked<ClientService>;
  let mockPDFProcessingService: jest.Mocked<IPDFProcessingService>;
  let mockWebScrapingService: jest.Mocked<IWebScrapingService>;

  // Dados de teste
  const mockClient = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01')
  };

  const mockDocument: Document = {
    id: 1,
    client_id: 1,
    title: 'Test Document',
    content: 'This is test content',
    document_type: 'pdf',
    source_url: undefined,
    file_path: '/uploads/test.pdf',
    processed_at: new Date('2023-01-01'),
    created_at: new Date('2023-01-01')
  };

  const mockPaginatedResponse: PaginatedResponse<Document> = {
    data: [mockDocument],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('mock pdf content'),
    destination: '',
    filename: '',
    path: '',
    stream: {} as any
  };

  const validPDFRequest: ProcessPDFRequest = {
    client_id: 1
  };

  const validWebRequest: ProcessWebRequest = {
    client_id: 1,
    url: 'https://example.com'
  };

  const mockPDFResult: PDFProcessingResult = {
    title: 'Extracted PDF Title',
    content: 'Extracted PDF content',
    filePath: '/uploads/test.pdf'
  };

  const mockWebResult: WebScrapingResult = {
    title: 'Web Page Title',
    content: 'Web page content',
    url: 'https://example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Criar mocks
    mockDocumentRepository = new DocumentRepository() as jest.Mocked<DocumentRepository>;
    mockClientService = new ClientService({} as any) as jest.Mocked<ClientService>;
    
    mockPDFProcessingService = {
      extractContent: jest.fn(),
      validatePDF: jest.fn()
    };
    
    mockWebScrapingService = {
      scrapeURL: jest.fn(),
      validateURL: jest.fn()
    };
    
    // Criar serviço com mocks
    documentService = new DocumentService(
      mockDocumentRepository,
      mockClientService,
      mockPDFProcessingService,
      mockWebScrapingService
    );
  });

  describe('processPDF', () => {
    it('should process PDF successfully with valid data', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockPDFProcessingService.validatePDF.mockResolvedValue(true);
      mockPDFProcessingService.extractContent.mockResolvedValue(mockPDFResult);
      mockDocumentRepository.create.mockResolvedValue(mockDocument);

      const result = await documentService.processPDF(mockFile, validPDFRequest);

      expect(result).toEqual(mockDocument);
      expect(mockClientService.validateClientExists).toHaveBeenCalledWith(1);
      expect(mockPDFProcessingService.validatePDF).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockPDFProcessingService.extractContent).toHaveBeenCalledWith(mockFile.buffer, mockFile.originalname);
      expect(mockDocumentRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid client_id', async () => {
      const invalidRequest = { client_id: -1 };

      await expect(documentService.processPDF(mockFile, invalidRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientService.validateClientExists).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when file is missing', async () => {
      await expect(documentService.processPDF(null as any, validPDFRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientService.validateClientExists).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(documentService.processPDF(invalidFile, validPDFRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientService.validateClientExists).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for file size too large', async () => {
      const largeFile = { ...mockFile, size: 20 * 1024 * 1024 }; // 20MB

      await expect(documentService.processPDF(largeFile, validPDFRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientService.validateClientExists).not.toHaveBeenCalled();
    });

    it('should throw ProcessingError when PDF processing service is not available', async () => {
      const serviceWithoutPDF = new DocumentService(
        mockDocumentRepository,
        mockClientService,
        undefined, // No PDF service
        mockWebScrapingService
      );

      await expect(serviceWithoutPDF.processPDF(mockFile, validPDFRequest))
        .rejects.toThrow(ProcessingError);
    });

    it('should throw ValidationError when PDF validation fails', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockPDFProcessingService.validatePDF.mockResolvedValue(false);

      await expect(documentService.processPDF(mockFile, validPDFRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockPDFProcessingService.extractContent).not.toHaveBeenCalled();
    });

    it('should throw ProcessingError when no content is extracted', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockPDFProcessingService.validatePDF.mockResolvedValue(true);
      mockPDFProcessingService.extractContent.mockResolvedValue({
        ...mockPDFResult,
        content: ''
      });

      await expect(documentService.processPDF(mockFile, validPDFRequest))
        .rejects.toThrow(ProcessingError);
      
      expect(mockDocumentRepository.create).not.toHaveBeenCalled();
    });

    it('should handle PDF processing service errors', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockPDFProcessingService.validatePDF.mockResolvedValue(true);
      mockPDFProcessingService.extractContent.mockRejectedValue(new Error('PDF processing failed'));

      await expect(documentService.processPDF(mockFile, validPDFRequest))
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('processWebPage', () => {
    it('should process web page successfully with valid data', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockWebScrapingService.validateURL.mockResolvedValue(true);
      mockWebScrapingService.scrapeURL.mockResolvedValue(mockWebResult);
      mockDocumentRepository.create.mockResolvedValue({
        ...mockDocument,
        document_type: 'web',
        source_url: 'https://example.com',
        file_path: undefined
      });

      const result = await documentService.processWebPage(validWebRequest);

      expect(result.document_type).toBe('web');
      expect(mockClientService.validateClientExists).toHaveBeenCalledWith(1);
      expect(mockWebScrapingService.validateURL).toHaveBeenCalledWith('https://example.com');
      expect(mockWebScrapingService.scrapeURL).toHaveBeenCalledWith('https://example.com');
      expect(mockDocumentRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid client_id', async () => {
      const invalidRequest = { client_id: -1, url: 'https://example.com' };

      await expect(documentService.processWebPage(invalidRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientService.validateClientExists).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid URL format', async () => {
      const invalidRequest = { client_id: 1, url: 'invalid-url' };

      await expect(documentService.processWebPage(invalidRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockClientService.validateClientExists).not.toHaveBeenCalled();
    });

    it('should throw ProcessingError when web scraping service is not available', async () => {
      const serviceWithoutWeb = new DocumentService(
        mockDocumentRepository,
        mockClientService,
        mockPDFProcessingService,
        undefined // No web service
      );

      await expect(serviceWithoutWeb.processWebPage(validWebRequest))
        .rejects.toThrow(ProcessingError);
    });

    it('should throw ValidationError when URL validation fails', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockWebScrapingService.validateURL.mockResolvedValue(false);

      await expect(documentService.processWebPage(validWebRequest))
        .rejects.toThrow(ValidationError);
      
      expect(mockWebScrapingService.scrapeURL).not.toHaveBeenCalled();
    });

    it('should throw ProcessingError when no content is extracted', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockWebScrapingService.validateURL.mockResolvedValue(true);
      mockWebScrapingService.scrapeURL.mockResolvedValue({
        ...mockWebResult,
        content: ''
      });

      await expect(documentService.processWebPage(validWebRequest))
        .rejects.toThrow(ProcessingError);
      
      expect(mockDocumentRepository.create).not.toHaveBeenCalled();
    });

    it('should handle web scraping service errors', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockWebScrapingService.validateURL.mockResolvedValue(true);
      mockWebScrapingService.scrapeURL.mockRejectedValue(new Error('Web scraping failed'));

      await expect(documentService.processWebPage(validWebRequest))
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('getDocumentsByClient', () => {
    it('should return documents for valid client', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockDocumentRepository.findByClientIdWithPagination.mockResolvedValue(mockPaginatedResponse);

      const result = await documentService.getDocumentsByClient(1);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockClientService.validateClientExists).toHaveBeenCalledWith(1);
      expect(mockDocumentRepository.findByClientIdWithPagination).toHaveBeenCalledWith(1, {});
    });

    it('should pass pagination options correctly', async () => {
      const paginationOptions: PaginationOptions = { page: 2, limit: 5 };
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockDocumentRepository.findByClientIdWithPagination.mockResolvedValue(mockPaginatedResponse);

      await documentService.getDocumentsByClient(1, paginationOptions);

      expect(mockDocumentRepository.findByClientIdWithPagination).toHaveBeenCalledWith(1, paginationOptions);
    });

    it('should handle repository errors', async () => {
      mockClientService.validateClientExists.mockResolvedValue(mockClient);
      mockDocumentRepository.findByClientIdWithPagination.mockRejectedValue(new Error('Database error'));

      await expect(documentService.getDocumentsByClient(1))
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('getAllDocuments', () => {
    it('should return all documents', async () => {
      mockDocumentRepository.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await documentService.getAllDocuments();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should pass pagination options correctly', async () => {
      const paginationOptions: PaginationOptions = { page: 2, limit: 5 };
      mockDocumentRepository.findAll.mockResolvedValue(mockPaginatedResponse);

      await documentService.getAllDocuments(paginationOptions);

      expect(mockDocumentRepository.findAll).toHaveBeenCalledWith(paginationOptions);
    });

    it('should handle repository errors', async () => {
      mockDocumentRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(documentService.getAllDocuments())
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('getDocumentById', () => {
    it('should return document when found', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument);

      const result = await documentService.getDocumentById(1);

      expect(result).toEqual(mockDocument);
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when document not found', async () => {
      mockDocumentRepository.findById.mockResolvedValue(null);

      const result = await documentService.getDocumentById(999);

      expect(result).toBeNull();
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(documentService.getDocumentById(-1))
        .rejects.toThrow(ValidationError);
      
      await expect(documentService.getDocumentById(0))
        .rejects.toThrow(ValidationError);
      
      await expect(documentService.getDocumentById(1.5))
        .rejects.toThrow(ValidationError);
      
      expect(mockDocumentRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockDocumentRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(documentService.getDocumentById(1))
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('getDocumentsByType', () => {
    it('should return documents by type', async () => {
      mockDocumentRepository.findByType.mockResolvedValue(mockPaginatedResponse);

      const result = await documentService.getDocumentsByType('pdf');

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockDocumentRepository.findByType).toHaveBeenCalledWith('pdf', {});
    });

    it('should throw ValidationError for invalid document type', async () => {
      await expect(documentService.getDocumentsByType('invalid' as any))
        .rejects.toThrow(ValidationError);
      
      expect(mockDocumentRepository.findByType).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockDocumentRepository.findByType.mockRejectedValue(new Error('Database error'));

      await expect(documentService.getDocumentsByType('pdf'))
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully when it exists', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockDocumentRepository.delete.mockResolvedValue(true);

      const result = await documentService.deleteDocument(1);

      expect(result).toBe(true);
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockDocumentRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return false when document not found', async () => {
      mockDocumentRepository.findById.mockResolvedValue(null);

      const result = await documentService.deleteDocument(999);

      expect(result).toBe(false);
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(999);
      expect(mockDocumentRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(documentService.deleteDocument(-1))
        .rejects.toThrow(ValidationError);
      
      expect(mockDocumentRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockDocumentRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(documentService.deleteDocument(1))
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('getDocumentStatistics', () => {
    it('should return document statistics', async () => {
      mockDocumentRepository.getTotalCount.mockResolvedValue(10);
      mockDocumentRepository.findByType.mockResolvedValueOnce({
        ...mockPaginatedResponse,
        pagination: { ...mockPaginatedResponse.pagination, total: 6 }
      });
      mockDocumentRepository.findByType.mockResolvedValueOnce({
        ...mockPaginatedResponse,
        pagination: { ...mockPaginatedResponse.pagination, total: 4 }
      });

      const result = await documentService.getDocumentStatistics();

      expect(result).toEqual({
        totalDocuments: 10,
        pdfDocuments: 6,
        webDocuments: 4
      });
      expect(mockDocumentRepository.getTotalCount).toHaveBeenCalledTimes(1);
      expect(mockDocumentRepository.findByType).toHaveBeenCalledWith('pdf', { page: 1, limit: 1 });
      expect(mockDocumentRepository.findByType).toHaveBeenCalledWith('web', { page: 1, limit: 1 });
    });

    it('should handle repository errors', async () => {
      mockDocumentRepository.getTotalCount.mockRejectedValue(new Error('Database error'));

      await expect(documentService.getDocumentStatistics())
        .rejects.toThrow(ProcessingError);
    });
  });

  describe('isProcessingServicesAvailable', () => {
    it('should return true for both services when available', () => {
      const result = documentService.isProcessingServicesAvailable();

      expect(result).toEqual({
        pdfProcessing: true,
        webScraping: true
      });
    });

    it('should return false for missing services', () => {
      const serviceWithoutServices = new DocumentService(
        mockDocumentRepository,
        mockClientService,
        undefined,
        undefined
      );

      const result = serviceWithoutServices.isProcessingServicesAvailable();

      expect(result).toEqual({
        pdfProcessing: false,
        webScraping: false
      });
    });

    it('should return mixed availability', () => {
      const serviceWithOnlyPDF = new DocumentService(
        mockDocumentRepository,
        mockClientService,
        mockPDFProcessingService,
        undefined
      );

      const result = serviceWithOnlyPDF.isProcessingServicesAvailable();

      expect(result).toEqual({
        pdfProcessing: true,
        webScraping: false
      });
    });
  });
});