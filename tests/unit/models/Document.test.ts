/**
 * Testes unitários para a classe de modelo Document
 */

import { DocumentModel, DocumentRow } from '../../../src/models/Document';
import { CreateDocumentRequest } from '../../../src/models/interfaces';

describe('DocumentModel', () => {
  describe('fromRow', () => {
    it('should convert database row to Document interface', () => {
      const row: DocumentRow = {
        id: 1,
        client_id: 1,
        title: 'Test Document',
        content: 'This is test content',
        document_type: 'pdf',
        source_url: null,
        file_path: '/uploads/test.pdf',
        processed_at: new Date('2023-01-01T00:00:00Z'),
        created_at: new Date('2023-01-01T00:00:00Z')
      } as DocumentRow;

      const document = DocumentModel.fromRow(row);

      expect(document).toEqual({
        id: 1,
        client_id: 1,
        title: 'Test Document',
        content: 'This is test content',
        document_type: 'pdf',
        source_url: undefined,
        file_path: '/uploads/test.pdf',
        processed_at: new Date('2023-01-01T00:00:00Z'),
        created_at: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should handle web document with source_url', () => {
      const row: DocumentRow = {
        id: 2,
        client_id: 1,
        title: 'Web Document',
        content: 'Web content',
        document_type: 'web',
        source_url: 'https://example.com',
        file_path: null,
        processed_at: new Date('2023-01-01T00:00:00Z'),
        created_at: new Date('2023-01-01T00:00:00Z')
      } as DocumentRow;

      const document = DocumentModel.fromRow(row);

      expect(document.source_url).toBe('https://example.com');
      expect(document.file_path).toBeUndefined();
    });
  });

  describe('toCreateData', () => {
    it('should convert CreateDocumentRequest to database insert data', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: '  Test Document  ',
        content: 'This is test content',
        document_type: 'pdf',
        file_path: '  /uploads/test.pdf  '
      };

      const createData = DocumentModel.toCreateData(request);

      expect(createData).toEqual({
        client_id: 1,
        title: 'Test Document',
        content: 'This is test content',
        document_type: 'pdf',
        file_path: '/uploads/test.pdf'
      });
    });

    it('should handle web document data', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: '  Web Document  ',
        content: 'Web content',
        document_type: 'web',
        source_url: '  https://example.com  '
      };

      const createData = DocumentModel.toCreateData(request);

      expect(createData).toEqual({
        client_id: 1,
        title: 'Web Document',
        content: 'Web content',
        document_type: 'web',
        source_url: 'https://example.com'
      });
    });
  });

  describe('createPDFDocument', () => {
    it('should create PDF document data', () => {
      const documentData = DocumentModel.createPDFDocument(
        1,
        '  PDF Document  ',
        'PDF content',
        '  /uploads/document.pdf  '
      );

      expect(documentData).toEqual({
        client_id: 1,
        title: 'PDF Document',
        content: 'PDF content',
        document_type: 'pdf',
        source_url: undefined,
        file_path: '/uploads/document.pdf'
      });
    });
  });

  describe('createWebDocument', () => {
    it('should create web document data', () => {
      const documentData = DocumentModel.createWebDocument(
        1,
        '  Web Page  ',
        'Web page content',
        '  https://example.com/page  '
      );

      expect(documentData).toEqual({
        client_id: 1,
        title: 'Web Page',
        content: 'Web page content',
        document_type: 'web',
        source_url: 'https://example.com/page',
        file_path: undefined
      });
    });
  });

  describe('validateBusinessRules', () => {
    it('should return empty array for valid PDF document', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'Valid PDF',
        content: 'Valid content',
        document_type: 'pdf',
        file_path: '/uploads/test.pdf'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toEqual([]);
    });

    it('should return empty array for valid web document', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'Valid Web Document',
        content: 'Valid content',
        document_type: 'web',
        source_url: 'https://example.com'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toEqual([]);
    });

    it('should return error for PDF document without file path', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'PDF without path',
        content: 'Content',
        document_type: 'pdf'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toContain('PDF documents must have a file path');
    });

    it('should return error for web document without source URL', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'Web without URL',
        content: 'Content',
        document_type: 'web'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toContain('Web documents must have a source URL');
    });

    it('should return error for empty content', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'Document',
        content: '',
        document_type: 'pdf',
        file_path: '/uploads/test.pdf'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toContain('Document content cannot be empty');
    });

    it('should return error for empty title', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: '   ',
        content: 'Content',
        document_type: 'pdf',
        file_path: '/uploads/test.pdf'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toContain('Document title cannot be empty');
    });

    it('should return error for title too long', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'a'.repeat(501),
        content: 'Content',
        document_type: 'pdf',
        file_path: '/uploads/test.pdf'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toContain('Document title exceeds maximum length of 500 characters');
    });

    it('should return error for content too long', () => {
      const request: CreateDocumentRequest = {
        client_id: 1,
        title: 'Document',
        content: 'a'.repeat(1000001),
        document_type: 'pdf',
        file_path: '/uploads/test.pdf'
      };

      const errors = DocumentModel.validateBusinessRules(request);
      expect(errors).toContain('Document content exceeds maximum length');
    });
  });

  describe('sanitizeContent', () => {
    it('should remove control characters but keep newlines and tabs', () => {
      const content = 'Normal text\nWith newline\tWith tab\x00With null\x1FWith control';
      const sanitized = DocumentModel.sanitizeContent(content);
      
      expect(sanitized).toBe('Normal text\nWith newline\tWith tabWith nullWith control');
    });

    it('should handle empty content', () => {
      const sanitized = DocumentModel.sanitizeContent('');
      expect(sanitized).toBe('');
    });
  });

  describe('extractTitleFromContent', () => {
    it('should extract first line as title', () => {
      const content = 'This is the title\nThis is the content\nMore content';
      const title = DocumentModel.extractTitleFromContent(content);
      
      expect(title).toBe('This is the title');
    });

    it('should truncate long first line', () => {
      const longLine = 'a'.repeat(150);
      const content = `${longLine}\nSecond line`;
      const title = DocumentModel.extractTitleFromContent(content, 100);
      
      expect(title).toBe('a'.repeat(97) + '...');
    });

    it('should return default title for empty content', () => {
      const title = DocumentModel.extractTitleFromContent('');
      expect(title).toBe('Untitled Document');
    });

    it('should skip empty lines', () => {
      const content = '\n\n  \n\nActual title\nContent';
      const title = DocumentModel.extractTitleFromContent(content);
      
      expect(title).toBe('Actual title');
    });
  });

  describe('getDocumentTypeFromSource', () => {
    it('should return pdf for PDF file paths', () => {
      expect(DocumentModel.getDocumentTypeFromSource('/uploads/document.pdf')).toBe('pdf');
      expect(DocumentModel.getDocumentTypeFromSource('/uploads/DOCUMENT.PDF')).toBe('pdf');
    });

    it('should return pdf for sources containing pdf', () => {
      expect(DocumentModel.getDocumentTypeFromSource('https://example.com/file.pdf')).toBe('pdf');
      expect(DocumentModel.getDocumentTypeFromSource('document-pdf-file')).toBe('pdf');
    });

    it('should return web for other sources', () => {
      expect(DocumentModel.getDocumentTypeFromSource('https://example.com')).toBe('web');
      expect(DocumentModel.getDocumentTypeFromSource('/uploads/document.txt')).toBe('web');
      expect(DocumentModel.getDocumentTypeFromSource('random-string')).toBe('web');
    });
  });
});