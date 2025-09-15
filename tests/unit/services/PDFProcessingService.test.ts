import { PDFProcessingService } from '../../../src/services/PDFProcessingService';
import { ValidationError, ProcessingError } from '../../../src/utils/errors';
import * as fs from 'fs/promises';

// Mock do fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PDFProcessingService', () => {
  let pdfService: PDFProcessingService;
  const testUploadDir = '/test/uploads';
  let mockPdfParse: jest.Mock;

  beforeEach(() => {
    pdfService = new PDFProcessingService(testUploadDir);
    jest.clearAllMocks();
    
    // Mock do pdf-parse
    mockPdfParse = jest.fn();
    
    // Mock do require para retornar nosso mock
    const originalRequire = require;
    require = jest.fn((id: string) => {
      if (id === 'pdf-parse') {
        return mockPdfParse;
      }
      return originalRequire(id);
    }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validatePDF', () => {
    it('should return false for empty buffer', async () => {
      const result = await pdfService.validatePDF(Buffer.alloc(0));
      expect(result).toBe(false);
    });

    it('should return false for null buffer', async () => {
      const result = await pdfService.validatePDF(null as any);
      expect(result).toBe(false);
    });

    it('should return false for buffer without PDF signature', async () => {
      const buffer = Buffer.from('not a pdf file');
      const result = await pdfService.validatePDF(buffer);
      expect(result).toBe(false);
    });

    it('should return false for oversized buffer', async () => {
      // Criar buffer maior que 10 MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      largeBuffer.write('%PDF-1.4', 0);
      
      const result = await pdfService.validatePDF(largeBuffer);
      expect(result).toBe(false);
    });

    it('should return true for valid PDF buffer', async () => {
      const buffer = Buffer.from('%PDF-1.4\nvalid pdf content');
      
      mockPdfParse.mockResolvedValue({
        text: 'Sample PDF content',
        info: { Title: 'Test PDF' }
      });

      const result = await pdfService.validatePDF(buffer);
      expect(result).toBe(true);
      expect(mockPdfParse).toHaveBeenCalledWith(buffer);
    });

    it('should return false when pdf-parse throws error', async () => {
      const buffer = Buffer.from('%PDF-1.4\ninvalid pdf content');
      
      mockPdfParse.mockRejectedValue(new Error('Invalid PDF'));

      const result = await pdfService.validatePDF(buffer);
      expect(result).toBe(false);
    });
  });

  describe('extractContent', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should throw ValidationError for empty buffer', async () => {
      await expect(
        pdfService.extractContent(Buffer.alloc(0), 'test.pdf')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for oversized buffer', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      await expect(
        pdfService.extractContent(largeBuffer, 'test.pdf')
      ).rejects.toThrow(ValidationError);
    });

    it('should extract content successfully with title from metadata', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const mockPdfData = {
        text: 'This is the extracted PDF content',
        info: { Title: 'Document Title from Metadata' }
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await pdfService.extractContent(buffer, 'original.pdf');

      expect(result).toEqual({
        title: 'Document Title from Metadata',
        content: 'This is the extracted PDF content',
        filePath: expect.stringMatching(/uploads\/\d+_[a-z0-9]+_original/)
      });

      expect(mockPdfParse).toHaveBeenCalledWith(buffer);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should extract title from content when metadata title is missing', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const mockPdfData = {
        text: 'First Line Title\nThis is the rest of the content',
        info: {}
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await pdfService.extractContent(buffer, 'original.pdf');

      expect(result.title).toBe('First Line Title');
      expect(result.content).toBe('First Line Title\nThis is the rest of the content');
    });

    it('should use filename as title when no other title found', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const mockPdfData = {
        text: 'a\nb\nc', 
        info: {}
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await pdfService.extractContent(buffer, 'my-document.pdf');

      expect(result.title).toBe('my-document');
      expect(result.content).toBe('a\nb\nc');
    });

    it('should clean content properly', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const mockPdfData = {
        text: '  Title  \n\n\n\nContent with   multiple   spaces\n\n\n  ',
        info: { Title: 'Clean Title' }
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await pdfService.extractContent(buffer, 'test.pdf');

      expect(result.content).toBe('Title\n\nContent with multiple spaces');
    });

    it('should throw ProcessingError when no text content found', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const mockPdfData = {
        text: '',
        info: {}
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      await expect(
        pdfService.extractContent(buffer, 'test.pdf')
      ).rejects.toThrow(ProcessingError);
    });

    it('should handle pdf-parse errors appropriately', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');

      mockPdfParse.mockRejectedValue(new Error('Invalid PDF'));

      await expect(
        pdfService.extractContent(buffer, 'test.pdf')
      ).rejects.toThrow(ValidationError);
    });

    it('should handle password-protected PDFs', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');

      mockPdfParse.mockRejectedValue(new Error('Password required'));

      await expect(
        pdfService.extractContent(buffer, 'test.pdf')
      ).rejects.toThrow(ValidationError);
    });

    it('should handle encrypted PDFs', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');

      mockPdfParse.mockRejectedValue(new Error('Encrypted PDF'));

      await expect(
        pdfService.extractContent(buffer, 'test.pdf')
      ).rejects.toThrow(ValidationError);
    });

    it('should create upload directory if it does not exist', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const mockPdfData = {
        text: 'Test content',
        info: { Title: 'Test' }
      };

      mockPdfParse.mockResolvedValue(mockPdfData);
      mockFs.access.mockRejectedValue(new Error('Directory not found'));
      mockFs.mkdir.mockResolvedValue(undefined);

      await pdfService.extractContent(buffer, 'test.pdf');

      expect(mockFs.mkdir).toHaveBeenCalledWith(testUploadDir, { recursive: true });
    });

    it('should truncate very long content', async () => {
      const buffer = Buffer.from('%PDF-1.4\ntest content');
      const longContent = 'a'.repeat(1000001); // Mais de 1 MB
      const mockPdfData = {
        text: longContent,
        info: { Title: 'Test' }
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await pdfService.extractContent(buffer, 'test.pdf');

      expect(result.content).toHaveLength(1000000 + '... [content truncated]'.length);
      expect(result.content).toMatch(/\.\.\. \[content truncated\]$/);
    });
  });

  describe('getServiceInfo', () => {
    it('should return service configuration', () => {
      const info = pdfService.getServiceInfo();

      expect(info).toEqual({
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf'],
        uploadDir: testUploadDir
      });
    });
  });

  describe('cleanupOldFiles', () => {
    it('should delete old files successfully', async () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      mockFs.readdir.mockResolvedValue(['old-file.pdf', 'recent-file.pdf'] as any);
      mockFs.stat
        .mockResolvedValueOnce({ mtime: oldDate } as any)
        .mockResolvedValueOnce({ mtime: recentDate } as any);
      mockFs.unlink.mockResolvedValue(undefined);

      const deletedCount = await pdfService.cleanupOldFiles(30);

      expect(deletedCount).toBe(1);
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(testUploadDir, 'old-file.pdf'));
      expect(mockFs.unlink).not.toHaveBeenCalledWith(path.join(testUploadDir, 'recent-file.pdf'));
    });

    it('should handle cleanup errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const deletedCount = await pdfService.cleanupOldFiles(30);

      expect(deletedCount).toBe(0);
    });
  });
});