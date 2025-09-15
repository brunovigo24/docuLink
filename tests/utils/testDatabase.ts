import { pool } from '../../src/config/database';
import { DatabaseUtils } from '../../src/utils/database';

export class TestDatabaseUtils {
  /**
   * Configurar banco de dados de teste
   */
  static async setup(): Promise<void> {
    await DatabaseUtils.ensureDatabaseExists();
    await DatabaseUtils.runMigrations();
  }

  /**
   * Limpar todos os dados de teste
   */
  static async cleanAllData(): Promise<void> {
    await DatabaseUtils.query('SET FOREIGN_KEY_CHECKS = 0');
    await DatabaseUtils.query('DELETE FROM documents');
    await DatabaseUtils.query('DELETE FROM clients');
    await DatabaseUtils.query('ALTER TABLE clients AUTO_INCREMENT = 1');
    await DatabaseUtils.query('ALTER TABLE documents AUTO_INCREMENT = 1');
    await DatabaseUtils.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  /**
   * Fechar conexão com o banco de dados
   */
  static async closeConnection(): Promise<void> {
    await pool.end();
  }
}