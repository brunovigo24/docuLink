# Documentação da API

Este documento fornece documentação abrangente para todos os endpoints da API com exemplos detalhados, formatos de requisição/resposta e tratamento de erros.

## Informações Básicas

- **URL Base**: `http://localhost:3000/api`
- **Content-Type**: `application/json` 
- **Formato de Resposta**: JSON

## Estrutura de Resposta

Todas as respostas da API seguem uma estrutura consistente:

### Resposta de Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação concluída com sucesso"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro legível",
    "details": { ... },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## API de Gerenciamento de Clientes

### Criar Cliente

Cria um novo registro de cliente no sistema.

**Endpoint**: `POST /api/clients`

**Corpo da Requisição**:
```json
{
  "name": "João Silva",
  "email": "joao.silva@exemplo.com"
}
```

**Regras de Validação**:
- `name`: Obrigatório, string, 1-255 caracteres
- `email`: Obrigatório, formato de email válido, único

**Exemplo de Requisição**:
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao.silva@exemplo.com"
  }'
```

**Resposta de Sucesso** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao.silva@exemplo.com",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Cliente criado com sucesso"
}
```

**Respostas de Erro**:

*Erro de Validação* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "email": "Email é obrigatório"
    }
  }
}
```

*Email Duplicado* (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email já existe"
  }
}
```

### Obter Todos os Clientes

Recupera todos os clientes com suas contagens de documentos.

**Endpoint**: `GET /api/clients`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/api/clients
```

**Resposta de Sucesso** (200 OK):
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
    },
    {
      "id": 2,
      "name": "Maria Santos",
      "email": "maria.santos@exemplo.com",
      "document_count": 3,
      "created_at": "2024-01-15T11:00:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  ],
  "message": "Clientes recuperados com sucesso"
}
```

### Obter Cliente por ID

Recupera um cliente específico pelo seu ID.

**Endpoint**: `GET /api/clients/:id`

**Parâmetros**:
- `id`: ID do Cliente (inteiro)

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/api/clients/1
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao.silva@exemplo.com",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Cliente recuperado com sucesso"
}
```

**Resposta de Erro** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_NOT_FOUND",
    "message": "Cliente não encontrado"
  }
}
```

### Obter Cliente com Detalhes

Recupera um cliente com sua contagem de documentos e detalhes adicionais.

**Endpoint**: `GET /api/clients/:id/details`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/api/clients/1/details
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao.silva@exemplo.com",
    "document_count": 5,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Detalhes do cliente recuperados com sucesso"
}
```

### Atualizar Cliente

Atualiza as informações de um cliente existente.

**Endpoint**: `PUT /api/clients/:id`

**Corpo da Requisição**:
```json
{
  "name": "João Santos",
  "email": "joao.santos@exemplo.com"
}
```

**Exemplo de Requisição**:
```bash
curl -X PUT http://localhost:3000/api/clients/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Santos",
    "email": "joao.santos@exemplo.com"
  }'
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Santos",
    "email": "joao.santos@exemplo.com",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  },
  "message": "Cliente atualizado com sucesso"
}
```

### Excluir Cliente

Exclui um cliente e todos os documentos associados.

**Endpoint**: `DELETE /api/clients/:id`

**Exemplo de Requisição**:
```bash
curl -X DELETE http://localhost:3000/api/clients/1
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "message": "Cliente excluído com sucesso"
}
```

## API de Processamento de Documentos

### Processar Documento PDF

Faz upload e processa um documento PDF, extraindo seu conteúdo.

**Endpoint**: `POST /api/documents/pdf`

**Content-Type**: `multipart/form-data`

**Campos do Formulário**:
- `file`: Arquivo PDF (obrigatório)
- `clientId`: ID do Cliente (obrigatório, inteiro)

**Restrições de Arquivo**:
- Tamanho máximo: 10MB
- Tipos permitidos: `application/pdf`

**Exemplo de Requisição**:
```bash
curl -X POST http://localhost:3000/api/documents/pdf \
  -F "file=@documento.pdf" \
  -F "clientId=1"
```

**Resposta de Sucesso** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_id": 1,
    "title": "Documento de Exemplo",
    "content": "Este é o conteúdo extraído do documento PDF...",
    "document_type": "pdf",
    "file_path": "/uploads/documento_1642248600000.pdf",
    "processed_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "PDF processado com sucesso"
}
```

**Respostas de Erro**:

*Tipo de Arquivo Inválido* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Apenas arquivos PDF são permitidos"
  }
}
```

*Arquivo Muito Grande* (413 Payload Too Large):
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Tamanho do arquivo excede o limite máximo de 10MB"
  }
}
```

*Erro de Processamento PDF* (422 Unprocessable Entity):
```json
{
  "success": false,
  "error": {
    "code": "PDF_PROCESSING_ERROR",
    "message": "Falha ao extrair conteúdo do PDF",
    "details": "PDF corrompido ou protegido por senha"
  }
}
```

### Processar Página Web

Extrai conteúdo de uma URL de página web.

**Endpoint**: `POST /api/documents/web`

**Corpo da Requisição**:
```json
{
  "url": "https://exemplo.com/artigo",
  "clientId": 1
}
```

**Regras de Validação**:
- `url`: Obrigatório, formato de URL válido
- `clientId`: Obrigatório, inteiro, deve existir

**Exemplo de Requisição**:
```bash
curl -X POST http://localhost:3000/api/documents/web \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://exemplo.com/artigo",
    "clientId": 1
  }'
```

**Resposta de Sucesso** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "client_id": 1,
    "title": "Título do Artigo",
    "content": "Este é o conteúdo extraído da página web...",
    "document_type": "web",
    "source_url": "https://exemplo.com/artigo",
    "processed_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Página web processada com sucesso"
}
```

**Respostas de Erro**:

*URL Inválida* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Formato de URL inválido"
  }
}
```

*Erro de Extração Web* (422 Unprocessable Entity):
```json
{
  "success": false,
  "error": {
    "code": "WEB_SCRAPING_ERROR",
    "message": "Falha ao extrair página web",
    "details": "Timeout de rede ou URL inacessível"
  }
}
```

### Obter Todos os Documentos

Recupera todos os documentos com suporte à paginação.

**Endpoint**: `GET /api/documents`

**Parâmetros de Consulta**:
- `page`: Número da página (opcional, padrão: 1)
- `limit`: Itens por página (opcional, padrão: 10, máximo: 100)

**Exemplo de Requisição**:
```bash
curl -X GET "http://localhost:3000/api/documents?page=1&limit=10"
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "client_id": 1,
        "title": "Documento de Exemplo",
        "content": "Conteúdo extraído...",
        "document_type": "pdf",
        "file_path": "/uploads/documento_1642248600000.pdf",
        "processed_at": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Documentos recuperados com sucesso"
}
```

### Obter Documento por ID

Recupera um documento específico pelo seu ID.

**Endpoint**: `GET /api/documents/:id`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/api/documents/1
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_id": 1,
    "title": "Documento de Exemplo",
    "content": "Este é o conteúdo extraído...",
    "document_type": "pdf",
    "file_path": "/uploads/documento_1642248600000.pdf",
    "source_url": null,
    "processed_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Documento recuperado com sucesso"
}
```

### Obter Documentos do Cliente

Recupera todos os documentos de um cliente específico com paginação.

**Endpoint**: `GET /api/clients/:id/documents`

**Parâmetros de Consulta**:
- `page`: Número da página (opcional, padrão: 1)
- `limit`: Itens por página (opcional, padrão: 10, máximo: 100)

**Exemplo de Requisição**:
```bash
curl -X GET "http://localhost:3000/api/clients/1/documents?page=1&limit=5"
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "client": {
      "id": 1,
      "name": "João Silva",
      "email": "joao.silva@exemplo.com"
    },
    "documents": [
      {
        "id": 1,
        "title": "Documento de Exemplo",
        "content": "Conteúdo extraído...",
        "document_type": "pdf",
        "processed_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "Documentos do cliente recuperados com sucesso"
}
```

## API de Saúde e Monitoramento

### Verificação de Saúde

Fornece o status geral de saúde do sistema.

**Endpoint**: `GET /health`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/health
```

**Resposta de Sucesso** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "up",
      "responseTime": 15
    },
    "fileSystem": {
      "status": "up"
    }
  },
  "version": "1.0.0"
}
```

### Verificação de Prontidão

Verifica se a aplicação está pronta para atender requisições.

**Endpoint**: `GET /ready`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/ready
```

**Resposta de Sucesso** (200 OK):
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Saúde do Processamento

Verifica a saúde dos serviços de processamento de documentos.

**Endpoint**: `GET /api/documents/health`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/api/documents/health
```

**Resposta de Sucesso** (200 OK):
```json
{
  "status": "healthy",
  "services": {
    "pdfProcessing": {
      "status": "up",
      "lastProcessed": "2024-01-15T10:25:00.000Z"
    },
    "webScraping": {
      "status": "up",
      "lastProcessed": "2024-01-15T10:28:00.000Z"
    }
  }
}
```

### Estatísticas de Documentos

Fornece estatísticas sobre documentos processados.

**Endpoint**: `GET /api/documents/statistics`

**Exemplo de Requisição**:
```bash
curl -X GET http://localhost:3000/api/documents/statistics
```

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "documentsByType": {
      "pdf": 90,
      "web": 60
    },
    "documentsToday": 12,
    "documentsThisWeek": 45,
    "documentsThisMonth": 150,
    "averageProcessingTime": {
      "pdf": 2.5,
      "web": 1.8
    }
  },
  "message": "Estatísticas recuperadas com sucesso"
}
```

## Referência de Códigos de Erro

| Código | Status HTTP | Descrição |
|--------|-------------|-----------|
| `VALIDATION_ERROR` | 400 | Dados de entrada inválidos ou falha na validação |
| `CLIENT_NOT_FOUND` | 404 | Cliente solicitado não existe |
| `DOCUMENT_NOT_FOUND` | 404 | Documento solicitado não existe |
| `DUPLICATE_EMAIL` | 409 | Endereço de email já existe |
| `INVALID_FILE_TYPE` | 400 | Arquivo enviado não é um PDF válido |
| `FILE_TOO_LARGE` | 413 | Arquivo enviado excede o limite de tamanho |
| `PDF_PROCESSING_ERROR` | 422 | Falha ao processar documento PDF |
| `WEB_SCRAPING_ERROR` | 422 | Falha ao extrair página web |
| `INVALID_URL` | 400 | Formato de URL inválido |
| `DATABASE_ERROR` | 500 | Operação de banco de dados falhou |
| `INTERNAL_ERROR` | 500 | Erro interno inesperado do servidor |

## Limitação de Taxa

A API implementa limitação de taxa para prevenir abuso:

- **Janela**: 15 minutos
- **Máximo de Requisições**: 100 por janela por IP
- **Cabeçalhos**: Informações de limitação de taxa são incluídas nos cabeçalhos de resposta

**Cabeçalhos de Limitação de Taxa**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642249200
```

Quando o limite de taxa é excedido (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições, tente novamente mais tarde",
    "retryAfter": 900
  }
}
```

## Configuração CORS

A API suporta Compartilhamento de Recursos de Origem Cruzada (CORS) com a seguinte configuração:

- **Origens Permitidas**: Configurável via variável de ambiente `CORS_ORIGIN`
- **Métodos Permitidos**: GET, POST, PUT, DELETE, OPTIONS
- **Cabeçalhos Permitidos**: Content-Type, Authorization, X-Request-ID

## Exemplos de Requisições/Respostas

### Fluxo Completo do Cliente

1. **Criar um cliente**:
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "Cliente Teste", "email": "teste@exemplo.com"}'
```

2. **Fazer upload de um PDF para o cliente**:
```bash
curl -X POST http://localhost:3000/api/documents/pdf \
  -F "file=@exemplo.pdf" \
  -F "clientId=1"
```

3. **Processar uma página web para o cliente**:
```bash
curl -X POST http://localhost:3000/api/documents/web \
  -H "Content-Type: application/json" \
  -d '{"url": "https://exemplo.com", "clientId": 1}'
```

4. **Obter todos os documentos do cliente**:
```bash
curl -X GET http://localhost:3000/api/clients/1/documents
```

### Exemplo de Operações em Lote

Processar múltiplos documentos para um cliente usando script shell:

```bash
#!/bin/bash
CLIENT_ID=1
BASE_URL="http://localhost:3000/api"

# Processar múltiplos PDFs
for pdf in *.pdf; do
  curl -X POST "$BASE_URL/documents/pdf" \
    -F "file=@$pdf" \
    -F "clientId=$CLIENT_ID"
done

# Processar múltiplas URLs
urls=("https://exemplo1.com" "https://exemplo2.com" "https://exemplo3.com")
for url in "${urls[@]}"; do
  curl -X POST "$BASE_URL/documents/web" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\", \"clientId\": $CLIENT_ID}"
done
```