/**
 * DocumentController - Controlador para endpoints de processamento de documentos
 * Gerencia upload de PDFs e processamento de URLs web
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DocumentService } from '../services/DocumentService';
import { ProcessPDFRequest, ProcessWebRequest, PaginationOptions } from '../models/interfaces';
import { ValidatedRequest } from '../middleware/validation';
import { ValidationError } from '../utils/errors';
import { FileCleanupService } from '../utils/fileCleanup';

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  /**
   * Configuração do multer para upload de PDFs
   */
  private static createMulterConfig() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
      },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          const error = new Error('Only PDF files are allowed');
          error.name = 'MulterError';
          cb(error);
        }
      }
    });
  }

  /**
   * Middleware do multer para upload de PDF
   */
  public static uploadPDF = DocumentController.createMulterConfig().single('pdf');

  /**
   * Processar upload de PDF
   * POST /api/documents/pdf
   */
  public processPDF = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    let tempFilePath: string | undefined;
    
    try {
      if (!req.file) {
        throw new ValidationError('PDF file is required');
      }

      // Garantir que o diretório de upload exista
      await FileCleanupService.ensureUploadDirectory();

      const validatedData = (req as ValidatedRequest<ProcessPDFRequest>).validatedData;
      const result = await this.documentService.processPDF(req.file, validatedData);

      // Armazenar o caminho do arquivo para possível limpeza
      tempFilePath = result.file_path;

      res.status(201).json({
        success: true,
        message: 'PDF processed successfully',
        data: {
          id: result.id,
          title: result.title,
          document_type: result.document_type,
          client_id: result.client_id,
          processed_at: result.processed_at,
          created_at: result.created_at
        }
      });
    } catch (error) {
      // Limpar o arquivo temporário em caso de erro se existir
      if (tempFilePath && await FileCleanupService.fileExists(tempFilePath)) {
        await FileCleanupService.cleanupFile(tempFilePath);
      }
      next(error);
    }
  };

  /**
   * Processar URL web
   * POST /api/documents/web
   */
  public processWeb = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = (req as ValidatedRequest<ProcessWebRequest>).validatedData;
      const result = await this.documentService.processWebPage(validatedData);

      res.status(201).json({
        success: true,
        message: 'Web page processed successfully',
        data: {
          id: result.id,
          title: result.title,
          document_type: result.document_type,
          client_id: result.client_id,
          source_url: result.source_url,
          processed_at: result.processed_at,
          created_at: result.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar todos os documentos com paginação
   * GET /api/documents
   */
  public getAllDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const options: PaginationOptions = {
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 10
      };

      const result = await this.documentService.getAllDocuments(options);

      res.status(200).json({
        success: true,
        message: 'Documents retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter documentos por cliente
   * GET /api/clients/:id/documents
   */
  public getDocumentsByClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const clientId = parseInt(req.params['id'] as string);
      const options: PaginationOptions = {
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 10
      };

      const result = await this.documentService.getDocumentsByClient(clientId, options);

      res.status(200).json({
        success: true,
        message: 'Client documents retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter documento por ID
   * GET /api/documents/:id
   */
  public getDocumentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const documentId = parseInt(req.params['id'] as string);
      const document = await this.documentService.getDocumentById(documentId);

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Document retrieved successfully',
        data: document
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter estatísticas de documentos
   * GET /api/documents/statistics
   */
  public getDocumentStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const statistics = await this.documentService.getDocumentStatistics();

      res.status(200).json({
        success: true,
        message: 'Document statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar status dos serviços de processamento
   * GET /api/documents/health
   */
  public getProcessingHealth = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const health = this.documentService.isProcessingServicesAvailable();

      res.status(200).json({
        success: true,
        message: 'Processing services health check',
        data: {
          services: health,
          status: health.pdfProcessing && health.webScraping ? 'healthy' : 'degraded'
        }
      });
    } catch (error) {
      next(error);
    }
  };
}