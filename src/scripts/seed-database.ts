#!/usr/bin/env ts-node

import { testConnection, closePool } from '../config/database';
import { DatabaseUtils } from '../utils/database';


const sampleClients = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com'
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com'
  },
  {
    name: 'Alice Brown',
    email: 'alice.brown@example.com'
  }
];

const sampleDocuments = [
  {
    client_id: 1,
    title: 'Sample PDF Document',
    content: 'This is sample content extracted from a PDF document for testing purposes.',
    document_type: 'pdf',
    file_path: '/uploads/sample.pdf'
  },
  {
    client_id: 1,
    title: 'Web Page Content',
    content: 'This is sample content scraped from a web page for testing purposes.',
    document_type: 'web',
    source_url: 'https://example.com/sample-page'
  },
  {
    client_id: 2,
    title: 'Another PDF Document',
    content: 'This is another sample PDF content for the second client.',
    document_type: 'pdf',
    file_path: '/uploads/another-sample.pdf'
  },
  {
    client_id: 3,
    title: 'News Article',
    content: 'This is sample content from a news article scraped from the web.',
    document_type: 'web',
    source_url: 'https://news.example.com/article-1'
  }
];


async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');
  
  try {
    console.log('📡 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    console.log('👥 Inserting sample clients...');
    for (const client of sampleClients) {
      await DatabaseUtils.query(
        'INSERT INTO clients (name, email) VALUES (?, ?)',
        [client.name, client.email]
      );
    }
    console.log(`✅ Inserted ${sampleClients.length} clients`);

    console.log('📄 Inserting sample documents...');
    for (const document of sampleDocuments) {
      await DatabaseUtils.query(
        'INSERT INTO documents (client_id, title, content, document_type, source_url, file_path) VALUES (?, ?, ?, ?, ?, ?)',
        [
          document.client_id,
          document.title,
          document.content,
          document.document_type,
          document.source_url || null,
          document.file_path || null
        ]
      );
    }
    console.log(`✅ Inserted ${sampleDocuments.length} documents`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

async function clearDatabase(): Promise<void> {
  console.log('🧹 Starting database cleanup...');
  
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    console.log('🗑️  Clearing documents...');
    await DatabaseUtils.query('DELETE FROM documents');
    
    console.log('🗑️  Clearing clients...');
    await DatabaseUtils.query('DELETE FROM clients');

    await DatabaseUtils.query('ALTER TABLE documents AUTO_INCREMENT = 1');
    await DatabaseUtils.query('ALTER TABLE clients AUTO_INCREMENT = 1');

    console.log('✅ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

const command = process.argv[2];

switch (command) {
  case 'seed':
    seedDatabase();
    break;
  case 'clear':
    clearDatabase();
    break;
  default:
    console.log('Usage: ts-node seed-database.ts [seed|clear]');
    console.log('  seed  - Inserir dados de amostra no banco de dados');
    console.log('  clear - Remover todos os dados do banco de dados');
    process.exit(1);
}