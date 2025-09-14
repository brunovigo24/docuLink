#!/usr/bin/env ts-node

import { testConnection, closePool } from './src/config/database';
import { DatabaseUtils } from './src/utils/database';
import { HealthChecker } from './src/utils/health';

async function testDatabase() {
  console.log('🧪 Testing database functionality...\n');

  try {
    // Test 1: Connection
    console.log('1. Testing database connection...');
    const isConnected = await testConnection();
    console.log(`   Connection: ${isConnected ? '✅ Success' : '❌ Failed'}\n`);

    // Test 2: Health check
    console.log('2. Testing health check...');
    const health = await HealthChecker.checkHealth();
    console.log(`   Database status: ${health.services.database.status}`);
    console.log(`   Response time: ${health.services.database.responseTime}ms\n`);

    // Test 3: Query execution
    console.log('3. Testing query execution...');
    const clients = await DatabaseUtils.query('SELECT COUNT(*) as count FROM clients');
    console.log(`   Clients count: ${(clients as any)[0].count}\n`);

    // Test 4: Transaction
    console.log('4. Testing transaction...');
    try {
      await DatabaseUtils.transaction(async (connection) => {
        await connection.execute('INSERT INTO clients (name, email) VALUES (?, ?)', 
          ['Test Client', 'test@example.com']);
        console.log('   Transaction: ✅ Success');
        
        throw new Error('Intentional rollback for testing');
      });
    } catch (transactionError) {
      if (transactionError instanceof Error && transactionError.message === 'Transaction failed') {
        console.log('   Rollback: ✅ Success\n');
      } else {
        throw transactionError;
      }
    }

  } catch (error) {
    console.error('   Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await closePool();
    console.log('🏁 Database testing completed!');
  }
}

testDatabase();