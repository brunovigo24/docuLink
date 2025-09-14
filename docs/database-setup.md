# Guia de Configuração do Banco de Dados

Este guia explica como configurar e gerenciar o banco de dados MariaDB para a API de Processamento de Documentos.

## Pré-requisitos

- Servidor MariaDB ou MySQL instalado e em execução
- Node.js e npm instalados
- Variáveis de ambiente configuradas (veja `.env.example`)

## Configuração do Ambiente

Copie `.env.example` para `.env` e configure suas configurações de banco de dados:

```bash
cp .env.example .env
```

Atualize a configuração do banco de dados no `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=docuLink
DB_USER=root
DB_PASSWORD=123
DB_CONNECTION_LIMIT=10
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
```

## Comandos de Configuração do Banco de Dados

### Inicializar Banco de Dados
Cria as tabelas do banco de dados usando scripts de migração:

```bash
npm run db:init
```

### Resetar Banco de Dados
Remove todas as tabelas e as recria:

```bash
npm run db:reset
```

### Popular Banco de Dados
Preenche o banco de dados com dados de exemplo para desenvolvimento:

```bash
npm run db:seed
```

### Limpar Banco de Dados
Remove todos os dados do banco de dados:

```bash
npm run db:clear
```

### Testar Conexão do Banco de Dados
Executa testes abrangentes da funcionalidade do banco de dados:

```bash
npx ts-node test-database.ts
```

Este script testa:
- Conexão com o banco de dados
- Verificação de saúde (health check)
- Execução de queries
- Transações e rollback

## Schema do Banco de Dados

### Tabela de Clientes
```sql
CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabela de Documentos
```sql
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  document_type ENUM('pdf', 'web') NOT NULL,
  source_url VARCHAR(1000),
  file_path VARCHAR(500),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

## Pool de Conexões

A aplicação usa pool de conexões MySQL2 com a seguinte configuração:

- **Limite de Conexões**: 10 conexões (configurável via `DB_CONNECTION_LIMIT`)
- **Timeout de Aquisição**: 60 segundos (configurável via `DB_ACQUIRE_TIMEOUT`)
- **Timeout de Query**: 60 segundos (configurável via `DB_TIMEOUT`)

## Tratamento de Erros

Os utilitários do banco de dados incluem tratamento abrangente de erros:

- **Erros de conexão**: Retry automático e degradação graciosa
- **Erros de query**: Log detalhado de erros e tipos de erro personalizados
- **Erros de transação**: Rollback automático em caso de falha
- **Erros de migração**: Relatório detalhado de erros com contexto do arquivo

## Verificações de Saúde

O sistema inclui monitoramento de saúde do banco de dados:

```typescript
import { HealthChecker } from './utils/health';

const health = await HealthChecker.checkHealth();
console.log(health.services.database.status); // 'up' ou 'down'
```

## Fluxo de Desenvolvimento

1. **Configuração inicial**:
   ```bash
   npm run db:init
   npm run db:seed
   ```

2. **Reset para estado limpo**:
   ```bash
   npm run db:reset
   npm run db:seed
   ```

3. **Limpar apenas dados**:
   ```bash
   npm run db:clear
   ```

