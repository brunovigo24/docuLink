# API de Processamento de Documentos

<div align="center">
  <img src="DocuLink.png.png" alt="DocuLink Logo" width="200">
</div>

Uma API REST abrangente para processamento de documentos que gerencia uploads de PDF e scraping de páginas web com capacidades de gerenciamento de clientes. Construída com Node.js, Express e MariaDB.

## Funcionalidades

- **Gerenciamento de Clientes**: Operações CRUD completas para registros de clientes
- **Processamento de PDF**: Upload e extração de conteúdo de documentos PDF
- **Web Scraping**: Extração de conteúdo de páginas web via URL
- **Associação de Documentos**: Vincular documentos processados a clientes específicos
- **API Abrangente**: Endpoints RESTful com tratamento adequado de erros
- **Integração com Banco de Dados**: MariaDB com pool de conexões e migrações
- **Containerização**: Suporte Docker para deploy fácil
- **Testes**: Cobertura abrangente de testes unitários e de integração

## Início Rápido

### Pré-requisitos

- Node.js 18+
- MariaDB ou MySQL
- Docker (opcional)

### Instalação

1. **Clone o repositório**:

   ```bash
   git clone git@github.com:brunovigo24/docuLink.git
   cd docuLink
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Configure o ambiente**:

   ```bash
   cp .env.example .env
   # Edite o .env com suas credenciais do banco de dados
   ```

4. **Inicialize o banco de dados**:

   ```bash
   npm run db:init
   npm run db:seed
   ```

5. **Inicie a aplicação**:

   ```bash
   # Modo desenvolvimento
   npm run dev

   # Modo produção
   npm run build
   npm start
   ```

A API estará disponível em `http://localhost:3000`

### Setup Docker

1. **Usando Docker Compose** (recomendado):

   ```bash
   cp .env.example .env
   docker compose up -d
   ```

2. **Usando scripts Docker**:
   ```bash
   ./scripts/docker-build.sh
   ./scripts/docker-run.sh
   ```

## Documentação da API

### URL Base

```
http://localhost:3000/api
```

### Autenticação

Atualmente, a API não requer autenticação. Todos os endpoints são publicamente acessíveis.

### Formato de Resposta

Todas as respostas da API seguem esta estrutura:

**Resposta de Sucesso:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operação concluída com sucesso"
}
```

**Resposta de Erro:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro legível",
    "details": { ... }
  }
}
```

### Endpoints de Gerenciamento de Clientes

#### Criar Cliente

```bash
POST /api/clients
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao.silva@exemplo.com"
}
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao.silva@exemplo.com",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Obter Todos os Clientes

```bash
GET /api/clients
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao.silva@exemplo.com",
      "document_count": 5,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Obter Cliente por ID

```bash
GET /api/clients/1
```

#### Obter Cliente com Detalhes

```bash
GET /api/clients/1/details
```

#### Atualizar Cliente

```bash
PUT /api/clients/1
Content-Type: application/json

{
  "name": "João Santos",
  "email": "joao.santos@exemplo.com"
}
```

#### Deletar Cliente

```bash
DELETE /api/clients/1
```

### Endpoints de Processamento de Documentos

#### Processar Documento PDF

```bash
POST /api/documents/pdf
Content-Type: multipart/form-data

# Dados do formulário:
# file: [arquivo PDF]
# clientId: 1
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_id": 1,
    "title": "Documento de Exemplo",
    "content": "Conteúdo extraído do PDF...",
    "document_type": "pdf",
    "file_path": "/uploads/document_123.pdf",
    "processed_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Processar Página Web

```bash
POST /api/documents/web
Content-Type: application/json

{
  "url": "https://exemplo.com/artigo",
  "clientId": 1
}
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "client_id": 1,
    "title": "Título do Artigo",
    "content": "Conteúdo extraído da web...",
    "document_type": "web",
    "source_url": "https://exemplo.com/artigo",
    "processed_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Obter Todos os Documentos

```bash
GET /api/documents?page=1&limit=10
```

#### Obter Documento por ID

```bash
GET /api/documents/1
```

#### Obter Documentos do Cliente

```bash
GET /api/clients/1/documents?page=1&limit=10
```

### Endpoints de Saúde e Estatísticas

#### Verificação de Saúde

```bash
GET /health
```

**Exemplo de Resposta:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": { "status": "up", "responseTime": 15 },
    "fileSystem": { "status": "up" }
  }
}
```

#### Saúde do Processamento

```bash
GET /api/documents/health
```

#### Estatísticas de Documentos

```bash
GET /api/documents/statistics
```

## Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor de desenvolvimento com hot reload
npm run build        # Build para produção
npm start           # Iniciar servidor de produção

# Testes
npm test            # Executar todos os testes
npm run test:watch  # Executar testes em modo watch
npm run test:coverage # Executar testes com relatório de cobertura
npm run test:integration # Executar apenas testes de integração

# Banco de Dados
npm run db:init     # Inicializar tabelas do banco de dados
npm run db:reset    # Resetar banco de dados (dropar e recriar)
npm run db:seed     # Popular banco de dados com dados de exemplo
npm run db:clear    # Limpar todos os dados do banco de dados

# Qualidade do Código
npm run lint        # Executar ESLint
npm run lint:fix    # Corrigir problemas do ESLint
npm run format      # Formatar código com Prettier
```

### Estrutura do Projeto

```
src/
├── config/          # Arquivos de configuração
├── controllers/     # Controladores de rotas
├── middleware/      # Middleware do Express
├── models/          # Modelos de dados e interfaces
├── repositories/    # Camada de acesso ao banco de dados
├── services/        # Camada de lógica de negócio
├── utils/           # Funções utilitárias
├── migrations/      # Scripts de migração do banco de dados
└── index.ts         # Ponto de entrada da aplicação

tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── fixtures/       # Dados e arquivos de teste
└── utils/          # Utilitários de teste

docs/               # Documentação
uploads/            # Diretório de upload de arquivos
```

### Variáveis de Ambiente

Veja `.env.example` para todas as opções de configuração disponíveis:

```env
# Configuração do Servidor
NODE_ENV=development
PORT=3000

# Configuração do Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_NAME=docuLink
DB_USER=root
DB_PASSWORD=123

# Configuração de Upload de Arquivos
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=application/pdf

# Configuração de Web Scraping
WEB_SCRAPING_TIMEOUT=30000
WEB_SCRAPING_USER_AGENT=DocumentProcessingAPI/1.0

# Configuração de Segurança
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Exemplos Completos da API com curl

### Exemplos de Gerenciamento de Clientes

**Criar um novo cliente:**

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa ACME",
    "email": "contato@acme.com"
  }'
```

**Obter todos os clientes:**

```bash
curl -X GET http://localhost:3000/api/clients
```

**Obter cliente específico:**

```bash
curl -X GET http://localhost:3000/api/clients/1
```

**Atualizar cliente:**

```bash
curl -X PUT http://localhost:3000/api/clients/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa ACME Atualizada",
    "email": "info@acme.com"
  }'
```

**Deletar cliente:**

```bash
curl -X DELETE http://localhost:3000/api/clients/1
```

### Exemplos de Processamento de Documentos

**Upload e processar PDF:**

```bash
curl -X POST http://localhost:3000/api/documents/pdf \
  -F "file=@/caminho/para/documento.pdf" \
  -F "clientId=1"
```

**Processar página web:**

```bash
curl -X POST http://localhost:3000/api/documents/web \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://exemplo.com/artigo",
    "clientId": 1
  }'
```

**Obter todos os documentos com paginação:**

```bash
curl -X GET "http://localhost:3000/api/documents?page=1&limit=10"
```

**Obter documentos de cliente específico:**

```bash
curl -X GET "http://localhost:3000/api/clients/1/documents?page=1&limit=5"
```

**Obter documento específico:**

```bash
curl -X GET http://localhost:3000/api/documents/1
```

### Exemplos de Saúde e Monitoramento

**Verificação de saúde do sistema:**

```bash
curl -X GET http://localhost:3000/health
```

**Saúde dos serviços de processamento:**

```bash
curl -X GET http://localhost:3000/api/documents/health
```

**Estatísticas de documentos:**

```bash
curl -X GET http://localhost:3000/api/documents/statistics
```

### Exemplo de Processamento em Lote

**Processar múltiplos documentos para um cliente:**

```bash
#!/bin/bash
CLIENT_ID=1
BASE_URL="http://localhost:3000/api"

# Processar múltiplos PDFs
for pdf in *.pdf; do
  echo "Processando $pdf..."
  curl -X POST "$BASE_URL/documents/pdf" \
    -F "file=@$pdf" \
    -F "clientId=$CLIENT_ID"
  echo ""
done

# Processar múltiplas URLs
urls=(
  "https://exemplo.com/pagina1"
  "https://exemplo.com/pagina2"
  "https://exemplo.com/pagina3"
)

for url in "${urls[@]}"; do
  echo "Processando $url..."
  curl -X POST "$BASE_URL/documents/web" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\", \"clientId\": $CLIENT_ID}"
  echo ""
done
```

## Documentação

### Conjunto Completo de Documentação

- **[Documentação da API](./docs/api-documentation.md)** - Referência completa da API com exemplos
- **[Guia de Setup do Banco de Dados](./docs/database-setup.md)** - Configuração e gerenciamento do banco de dados
- **[Guia de Setup Docker](./docs/docker-setup.md)** - Containerização e deploy

### Teste Rápido do Banco de Dados

```bash
npx ts-node test-database.ts
```

## Testes

O projeto inclui cobertura abrangente de testes:

- **Testes Unitários**: Testam componentes individuais isoladamente
- **Testes de Integração**: Testam fluxos completos da API
- **Testes de Banco de Dados**: Testam operações e migrações do banco
- **Testes de Processamento de Arquivos**: Testam funcionalidade de PDF e web scraping

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage

# Executar apenas testes de integração
npm run test:integration
```

## Tratamento de Erros

A API usa respostas de erro padronizadas com códigos de status HTTP apropriados:

- **400 Bad Request**: Dados de entrada inválidos ou erros de validação
- **404 Not Found**: Recurso não encontrado
- **422 Unprocessable Entity**: Erros de processamento (parsing de PDF, web scraping)
- **500 Internal Server Error**: Erros do servidor

## Limitação de Taxa

A API inclui limitação de taxa para prevenir abuso:

- **Janela**: 15 minutos (configurável)
- **Máximo de Requisições**: 100 por janela (configurável)
- **Headers**: Informações de limitação de taxa incluídas nos headers de resposta

## Solução de Problemas

### Problemas Comuns

**Problemas de Conexão com o Banco de Dados:**

```bash
# Verificar se o MariaDB está rodando
sudo systemctl status mariadb

# Testar conexão com o banco de dados
npx ts-node test-database.ts
```

**Porta Já em Uso:**

```bash
# Encontrar processo usando a porta 3000
lsof -i :3000

# Matar o processo ou alterar porta no .env
PORT=3001
```

**Falhas no Processamento de PDF:**

- Certifique-se de que os arquivos PDF não estão protegidos por senha
- Verifique limites de tamanho de arquivo (padrão: 10MB)
- Verifique a integridade do arquivo PDF

**Problemas de Web Scraping:**

- Verifique acessibilidade da URL: `curl -I https://exemplo.com`
- Aumente timeout no `.env`: `WEB_SCRAPING_TIMEOUT=60000`
- Alguns sites podem bloquear requisições automatizadas

Para solução de problemas detalhada, veja o [Guia de Solução de Problemas](./docs/troubleshooting.md).

### Obtendo Ajuda

1. **Verifique os logs**: Habilite logging de debug com `LOG_LEVEL=debug`
2. **Execute diagnósticos**: Use `npx ts-node test-database.ts`
3. **Verifique configuração**: Compare seu arquivo `.env` com `.env.example`
4. **Teste endpoints**: Use os exemplos curl acima para verificar funcionalidade da API

---

Desenvolvido por [Bruno Vigo](https://www.linkedin.com/in/bruno-vigo).

