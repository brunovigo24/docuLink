import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
    acquireTimeout: number;
    timeout: number;
}

const databaseConfig: DatabaseConfig = {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    database: process.env['DB_NAME'] || 'document_processing',
    connectionLimit: parseInt(process.env['DB_CONNECTION_LIMIT'] || '10'),
    acquireTimeout: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
    timeout: parseInt(process.env['DB_TIMEOUT'] || '60000'),
};

// Remove invalid MySQL2 options e cria pool com configuração válida
const { acquireTimeout, timeout, ...validConfig } = databaseConfig;
export const pool = mysql.createPool(validConfig);

// Testar conexão com database
export const testConnection = async (): Promise<boolean> => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};

export const closePool = async (): Promise<void> => {
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error);
    }
};