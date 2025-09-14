import { pool } from '../config/database';
import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseUtils {
  /**
   * Executar uma query com tratamento de erro
   */
  static async query<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: any[]
  ): Promise<T> {
    try {
      const [results] = await pool.execute<T>(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw new DatabaseError('Database query failed', error);
    }
  }

  /**
   * Executar múltiplas queries em uma transação
   */
  static async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error);
      throw new DatabaseError('Transaction failed', error);
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar healthCheck
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as health');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Executar arquivos de migração
   */
  static async runMigrations(): Promise<void> {
    const migrationsDir = path.join(__dirname, '../migrations');
    
    try {
      await this.ensureDatabaseExists();
      
      const files = await fs.readdir(migrationsDir);
      const sqlFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort(); // garante que as migrações sejam executadas em ordem

      console.log(`Found ${sqlFiles.length} migration files`);

      for (const file of sqlFiles) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            await this.query(statement);
          }
        }
        
        console.log(`Migration completed: ${file}`);
      }
      
      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration error details:', error);
      throw new DatabaseError('Migration failed', error);
    }
  }

  static async ensureDatabaseExists(): Promise<void> {
    try {
      const dbName = process.env['DB_NAME'] || 'docuLink';
      
      const tempConfig = {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '3306'),
        user: process.env['DB_USER'] || 'root',
        password: process.env['DB_PASSWORD'] || '123',
      };
      
      const tempPool = require('mysql2/promise').createPool(tempConfig);
      
      // Create database if it doesn't exist
      await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`Database '${dbName}' ensured to exist`);
      
      await tempPool.end();
    } catch (error) {
      console.error('Error ensuring database exists:', error);
      throw new DatabaseError('Failed to ensure database exists', error);
    }
  }

  static async dropTables(): Promise<void> {
    try {
      await this.query('SET FOREIGN_KEY_CHECKS = 0');
      
      await this.query('DROP TABLE IF EXISTS documents');
      await this.query('DROP TABLE IF EXISTS clients');
      
      await this.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Error dropping tables:', error);
      throw new DatabaseError('Failed to drop tables', error);
    }
  }
}

/**
 * Funções auxiliares para testes
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await DatabaseUtils.runMigrations();
    console.log('Test database initialized');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

export function getConnection() {
  return pool;
}