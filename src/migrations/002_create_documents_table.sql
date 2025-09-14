-- Migration: Create documents table
-- Created: 2024-01-01
-- Description: Creates the documents table with foreign key relationship to clients

CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  document_type ENUM('pdf', 'web') NOT NULL,
  source_url VARCHAR(1000),
  file_path VARCHAR(500),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  
  INDEX idx_client_id (client_id),
  INDEX idx_document_type (document_type),
  INDEX idx_processed_at (processed_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;