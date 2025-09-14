#!/usr/bin/env ts-node

import { testConnection, closePool } from '../config/database';
import { DatabaseUtils } from '../utils/database';

/**
 * Inicializar database com tabelas
 */
async function initializeDatabase(): Promise<void> {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Testar conexão primeiro
    console.log('📡 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    // Executar migrações
    console.log('📋 Running database migrations...');
    await DatabaseUtils.runMigrations();

    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

/**
 * Resetar database (drop e recriar tabelas)
 */
async function resetDatabase(): Promise<void> {
  console.log('🔄 Starting database reset...');
  
  try {
    // Testar conexão primeiro
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    // Dropar tabelas existentes
    console.log('🗑️  Dropping existing tables...');
    await DatabaseUtils.dropTables();

    // Executar migrações
    console.log('📋 Running database migrations...');
    await DatabaseUtils.runMigrations();

    console.log('✅ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

const command = process.argv[2];

switch (command) {
  case 'init':
    initializeDatabase();
    break;
  case 'reset':
    resetDatabase();
    break;
  default:
    console.log('Usage: ts-node init-database.ts [init|reset]');
    console.log('  init  - Initialize database with migrations');
    console.log('  reset - Drop all tables and reinitialize');
    process.exit(1);
}