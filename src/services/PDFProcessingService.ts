/**
 * PDFProcessingService - Serviço para processamento de arquivos PDF
 * Extrai conteúdo, título e metadados de documentos PDF
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { IPDFProcessingService, PDFProcessingResult } from './DocumentService';
import { ProcessingError, ValidationError } from '../utils/errors';

export class PDFProcessingService implements IPDFProcessingService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private pdfParse: any;

  constructor(uploadDir: string = '/app/uploads') {
    this.uploadDir = uploadDir;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = ['application/pdf'];
  }

  /**
   * Carrega o módulo pdf-parse de forma lazy
   */
  private async loadPdfParse(): Promise<any> {
    if (!this.pdfParse) {
      this.pdfParse = require('pdf-parse');
    }
    return this.pdfParse;
  }

  /**
   * Extrai conteúdo de um buffer PDF
   */
  async extractContent(buffer: Buffer, originalName: string): Promise<PDFProcessingResult> {
    try {
      // Validar buffer
      if (!buffer || buffer.length === 0) {
        throw new ValidationError('PDF buffer is empty or invalid');
      }

      // Validar tamanho do arquivo
      if (buffer.length > this.maxFileSize) {
        throw new ValidationError(`PDF file size exceeds maximum allowed size (${this.maxFileSize / (1024 * 1024)}MB)`);
      }

      // Extrair dados do PDF
      const pdfParseModule = await this.loadPdfParse();
      const pdfData = await pdfParseModule(buffer);

      // Validar se conseguiu extrair dados
      if (!pdfData) {
        throw new ProcessingError('Failed to parse PDF data');
      }

      // Extrair título do PDF
      const title = this.extractTitle(pdfData, originalName);

      // Extrair e limpar conteúdo
      const content = this.extractAndCleanContent(pdfData);

      // Salvar arquivo no sistema de arquivos
      const filePath = await this.saveFile(buffer, originalName);

      return {
        title,
        content,
        filePath
      };

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ProcessingError) {
        throw error;
      }

      // Log do erro para debugging
      console.error('PDF extraction error:', error);
      
      if (error instanceof Error) {
        // Verificar tipos específicos de erro do pdf-parse
        if (error.message.includes('Invalid PDF')) {
          throw new ValidationError('Invalid or corrupted PDF file');
        }
        if (error.message.includes('Password')) {
          throw new ValidationError('Password-protected PDFs are not supported');
        }
        if (error.message.includes('Encrypted')) {
          throw new ValidationError('Encrypted PDFs are not supported');
        }
      }

      throw new ProcessingError('Failed to extract content from PDF', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Valida se o buffer contém um PDF válido
   */
  async validatePDF(buffer: Buffer): Promise<boolean> {
    try {
      // Verificar se buffer não está vazio
      if (!buffer || buffer.length === 0) {
        return false;
      }

      // Verificar tamanho do arquivo
      if (buffer.length > this.maxFileSize) {
        return false;
      }

      // Verificar assinatura PDF (magic bytes)
      if (!this.hasPDFSignature(buffer)) {
        return false;
      }

      // Tentar fazer parse básico do PDF
      const pdfParseModule = await this.loadPdfParse();
      const pdfData = await pdfParseModule(buffer);
      
      // Verificar se conseguiu extrair pelo menos algumas informações
      return !!(pdfData && (pdfData.text || pdfData.info));

    } catch (error) {
      console.error('PDF validation error:', error);
      return false;
    }
  }

  /**
   * Verifica se o buffer tem a assinatura de um arquivo PDF
   */
  private hasPDFSignature(buffer: Buffer): boolean {
    // PDF files start with %PDF-
    const pdfSignature = Buffer.from('%PDF-');
    return buffer.subarray(0, 5).equals(pdfSignature);
  }

  /**
   * Extrai título do PDF
   */
  private extractTitle(pdfData: any, originalName: string): string {
    // Tentar extrair título dos metadados
    if (pdfData.info && pdfData.info.Title && typeof pdfData.info.Title === 'string') {
      const title = pdfData.info.Title.trim();
      if (title.length > 0 && title.length <= 500) {
        return title;
      }
    }

    // Tentar extrair título das primeiras linhas do conteúdo
    if (pdfData.text) {
      const titleFromContent = this.extractTitleFromContent(pdfData.text);
      if (titleFromContent) {
        return titleFromContent;
      }
    }

    // Usar nome do arquivo como fallback
    return this.sanitizeFileName(originalName);
  }

  /**
   * Extrai título das primeiras linhas do conteúdo
   */
  private extractTitleFromContent(text: string): string | null {
    if (!text || typeof text !== 'string') {
      return null;
    }

    // Pegar as primeiras linhas não vazias
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return null;
    }

    // Usar a primeira linha como título se for razoável
    const firstLine = lines[0];
    if (firstLine && firstLine.length >= 5 && firstLine.length <= 200) {
      return firstLine;
    }

    return null;
  }

  /**
   * Extrai e limpa o conteúdo do PDF
   */
  private extractAndCleanContent(pdfData: any): string {
    if (!pdfData.text || typeof pdfData.text !== 'string') {
      throw new ProcessingError('No text content found in PDF');
    }

    let content = pdfData.text;

    // Limpar conteúdo
    content = content
      // Remover múltiplas quebras de linha
      .replace(/\n{3,}/g, '\n\n')
      // Remover espaços em excesso
      .replace(/[ \t]{2,}/g, ' ')
      // Remover caracteres de controle (exceto quebras de linha e tabs)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim geral
      .trim();

    if (content.length === 0) {
      throw new ProcessingError('PDF content is empty after processing');
    }

    // Limitar tamanho do conteúdo se necessário
    const maxContentLength = 1000000; // 1MB de texto
    if (content.length > maxContentLength) {
      content = content.substring(0, maxContentLength) + '... [content truncated]';
    }

    return content;
  }

  /**
   * Salva o arquivo PDF no sistema de arquivos
   */
  private async saveFile(buffer: Buffer, originalName: string): Promise<string> {
    try {
      // Garantir que o diretório existe
      await this.ensureUploadDirectory();

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedName = this.sanitizeFileName(originalName);
      const fileName = `${timestamp}_${randomSuffix}_${sanitizedName}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Salvar arquivo
      await fs.writeFile(filePath, buffer);

      // Retornar caminho relativo
      return path.relative('/app', filePath);

    } catch (error) {
      console.error('File save error:', error);
      throw new ProcessingError('Failed to save PDF file', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Garante que o diretório de upload existe
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      // Diretório não existe, criar
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Sanitiza nome do arquivo
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'document.pdf';
    }

    // Remover extensão se presente
    const nameWithoutExt = fileName.replace(/\.pdf$/i, '');

    // Sanitizar nome
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remover caracteres especiais
      .replace(/\s+/g, '_') // Substituir espaços por underscore
      .substring(0, 100) // Limitar tamanho
      .trim();

    return sanitized || 'document';
  }

  /**
   * Obtém informações sobre o serviço
   */
  getServiceInfo(): {
    maxFileSize: number;
    allowedMimeTypes: string[];
    uploadDir: string;
  } {
    return {
      maxFileSize: this.maxFileSize,
      allowedMimeTypes: [...this.allowedMimeTypes],
      uploadDir: this.uploadDir
    };
  }

  /**
   * Limpa arquivos antigos (utilitário para manutenção)
   */
  async cleanupOldFiles(maxAgeInDays: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // em milliseconds
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}