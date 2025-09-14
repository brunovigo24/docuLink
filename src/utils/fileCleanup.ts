/**
 * Utilitários para limpeza e gerenciamento de arquivos
 */

import fs from 'fs/promises';
import path from 'path';

export class FileCleanupService {
  private static readonly UPLOAD_DIR = process.env['UPLOAD_DIR'] || 'uploads';
  private static readonly MAX_FILE_AGE_HOURS = 24; // 24 horas

  /**
   * Limpar arquivo específico
   */
  static async cleanupFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      console.log(`File cleaned up: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Limpar arquivos antigos do diretório de upload
   */
  static async cleanupOldFiles(): Promise<number> {
    try {
      const uploadPath = path.resolve(this.UPLOAD_DIR);
      const files = await fs.readdir(uploadPath);
      const now = Date.now();
      const maxAge = this.MAX_FILE_AGE_HOURS * 60 * 60 * 1000; // em milliseconds
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadPath, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          const success = await this.cleanupFile(filePath);
          if (success) {
            cleanedCount++;
          }
        }
      }

      console.log(`Cleaned up ${cleanedCount} old files`);
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
      return 0;
    }
  }

  /**
   * Garantir que o diretório de upload existe
   */
  static async ensureUploadDirectory(): Promise<void> {
    try {
      const uploadPath = path.resolve(this.UPLOAD_DIR);
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw error;
    }
  }

  /**
   * Obter informações sobre uso de espaço em disco
   */
  static async getStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const uploadPath = path.resolve(this.UPLOAD_DIR);
      const files = await fs.readdir(uploadPath);
      let totalSize = 0;
      let oldestFile: Date | undefined;
      let newestFile: Date | undefined;

      for (const file of files) {
        const filePath = path.join(uploadPath, file);
        const stats = await fs.stat(filePath);
        
        totalSize += stats.size;
        
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }
        
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        ...(oldestFile && { oldestFile }),
        ...(newestFile && { newestFile })
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalFiles: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Validar se um arquivo existe
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mover arquivo para diretório de backup antes de deletar
   */
  static async backupAndCleanup(filePath: string): Promise<boolean> {
    try {
      const backupDir = path.join(path.dirname(filePath), 'backup');
      await fs.mkdir(backupDir, { recursive: true });
      
      const fileName = path.basename(filePath);
      const backupPath = path.join(backupDir, `${Date.now()}_${fileName}`);
      
      await fs.rename(filePath, backupPath);
      console.log(`File backed up and moved: ${filePath} -> ${backupPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to backup and cleanup file ${filePath}:`, error);
      return false;
    }
  }
}