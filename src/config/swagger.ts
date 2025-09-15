/**
 * Swagger/OpenAPI 3.0 configuration for Document Processing API
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './environment';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de Processamento de Documentos',
    version: '1.0.0',
    description: 'Uma API abrangente para gerenciar clientes e processar documentos (upload de PDFs e extração de conteúdo de páginas web)',
    contact: {
      name: 'Suporte da API',
      email: 'suporte@processamentodocumentos.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Servidor de desenvolvimento'
    },
    {
      url: 'https://api.processamentodocumentos.com',
      description: 'Servidor de produção'
    }
  ],
  components: {
    schemas: {
      Client: {
        type: 'object',
        required: ['id', 'name', 'email', 'created_at', 'updated_at'],
        properties: {
          id: {
            type: 'integer',
            description: 'Identificador único do cliente',
            example: 1
          },
          name: {
            type: 'string',
            maxLength: 255,
            description: 'Nome do cliente',
            example: 'João Silva'
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'Endereço de email do cliente',
            example: 'joao.silva@exemplo.com'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Data e hora de criação do cliente',
            example: '2023-12-01T10:00:00.000Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Data e hora da última atualização do cliente',
            example: '2023-12-01T10:00:00.000Z'
          }
        }
      },
      ClientWithDocumentCount: {
        allOf: [
          { $ref: '#/components/schemas/Client' },
          {
            type: 'object',
            required: ['document_count'],
            properties: {
              document_count: {
                type: 'integer',
                minimum: 0,
                description: 'Número de documentos associados a este cliente',
                example: 5
              }
            }
          }
        ]
      },
      CreateClientRequest: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Nome do cliente',
            example: 'João Silva'
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'Endereço de email do cliente',
            example: 'joao.silva@exemplo.com'
          }
        }
      },
      UpdateClientRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Nome do cliente',
            example: 'João Silva Atualizado'
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'Endereço de email do cliente',
            example: 'joao.atualizado@exemplo.com'
          }
        }
      },
      Document: {
        type: 'object',
        required: ['id', 'client_id', 'title', 'content', 'document_type', 'processed_at', 'created_at'],
        properties: {
          id: {
            type: 'integer',
            description: 'Identificador único do documento',
            example: 1
          },
          client_id: {
            type: 'integer',
            description: 'ID do cliente proprietário deste documento',
            example: 1
          },
          title: {
            type: 'string',
            maxLength: 500,
            description: 'Título do documento',
            example: 'Documento PDF de Exemplo'
          },
          content: {
            type: 'string',
            description: 'Conteúdo extraído do documento',
            example: 'Este é o conteúdo extraído do documento...'
          },
          document_type: {
            type: 'string',
            enum: ['pdf', 'web'],
            description: 'Tipo do documento',
            example: 'pdf'
          },
          source_url: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'URL de origem para documentos web',
            example: 'https://exemplo.com/pagina'
          },
          file_path: {
            type: 'string',
            nullable: true,
            maxLength: 500,
            description: 'Caminho do arquivo para documentos PDF enviados',
            example: '/uploads/documento_123.pdf'
          },
          processed_at: {
            type: 'string',
            format: 'date-time',
            description: 'Data e hora do processamento do documento',
            example: '2023-12-01T10:00:00.000Z'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Data e hora de criação do documento',
            example: '2023-12-01T10:00:00.000Z'
          }
        }
      },
      ProcessPDFRequest: {
        type: 'object',
        required: ['client_id'],
        properties: {
          client_id: {
            type: 'integer',
            minimum: 1,
            description: 'ID do cliente para associar a este documento',
            example: 1
          }
        }
      },
      ProcessWebRequest: {
        type: 'object',
        required: ['client_id', 'url'],
        properties: {
          client_id: {
            type: 'integer',
            minimum: 1,
            description: 'ID do cliente para associar a este documento',
            example: 1
          },
          url: {
            type: 'string',
            format: 'uri',
            maxLength: 1000,
            description: 'URL da página web para extrair conteúdo',
            example: 'https://exemplo.com/artigo'
          }
        }
      },
      PaginationQuery: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Page number for pagination',
            example: 1
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            description: 'Number of items per page',
            example: 10
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
          data: {
            type: 'array',
            description: 'Array of data items'
          },
          pagination: {
            type: 'object',
            required: ['page', 'limit', 'total', 'totalPages'],
            properties: {
              page: {
                type: 'integer',
                description: 'Current page number',
                example: 1
              },
              limit: {
                type: 'integer',
                description: 'Items per page',
                example: 10
              },
              total: {
                type: 'integer',
                description: 'Total number of items',
                example: 50
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages',
                example: 5
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        required: ['success', 'data', 'message'],
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful',
            example: true
          },
          data: {
            description: 'Response data'
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Operation completed successfully'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'timestamp'],
            properties: {
              code: {
                type: 'string',
                description: 'Error code',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                description: 'Error message',
                example: 'Invalid input data'
              },
              details: {
                type: 'object',
                description: 'Additional error details',
                example: { field: 'email', issue: 'Invalid email format' }
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Error timestamp',
                example: '2023-12-01T10:00:00.000Z'
              },
              requestId: {
                type: 'string',
                description: 'Request ID for tracking',
                example: 'req_1701423600000_abc123'
              }
            }
          }
        }
      },
      HealthStatus: {
        type: 'object',
        required: ['status', 'timestamp', 'services'],
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Overall health status',
            example: 'healthy'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Health check timestamp',
            example: '2023-12-01T10:00:00.000Z'
          },
          requestId: {
            type: 'string',
            description: 'Request ID for tracking',
            example: 'req_1701423600000_abc123'
          },
          services: {
            type: 'object',
            required: ['database', 'api'],
            properties: {
              database: {
                type: 'string',
                enum: ['connected', 'disconnected'],
                description: 'Database connection status',
                example: 'connected'
              },
              api: {
                type: 'string',
                enum: ['running'],
                description: 'API service status',
                example: 'running'
              }
            }
          },
          system: {
            type: 'object',
            properties: {
              uptime: {
                type: 'number',
                description: 'System uptime in seconds',
                example: 3600
              },
              memory: {
                type: 'object',
                description: 'Memory usage information'
              },
              nodeVersion: {
                type: 'string',
                description: 'Node.js version',
                example: 'v18.19.1'
              },
              environment: {
                type: 'string',
                description: 'Environment name',
                example: 'development'
              }
            }
          },
          responseTime: {
            type: 'string',
            description: 'Response time for health check',
            example: '15ms'
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Requisição Inválida - Dados de entrada inválidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: { field: 'email', issue: 'Invalid email format' },
                timestamp: '2023-12-01T10:00:00.000Z',
                requestId: 'req_1701423600000_abc123'
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Não Encontrado - Recurso não encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'Client not found',
                timestamp: '2023-12-01T10:00:00.000Z',
                requestId: 'req_1701423600000_abc123'
              }
            }
          }
        }
      },
      UnprocessableEntity: {
        description: 'Entidade Não Processável - Falha no processamento',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'PROCESSING_ERROR',
                message: 'Failed to process document',
                details: { reason: 'Invalid PDF format' },
                timestamp: '2023-12-01T10:00:00.000Z',
                requestId: 'req_1701423600000_abc123'
              }
            }
          }
        }
      },
      TooManyRequests: {
        description: 'Muitas Requisições - Limite de taxa excedido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests from this IP, please try again later.',
                timestamp: '2023-12-01T10:00:00.000Z',
                requestId: 'req_1701423600000_abc123'
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Erro Interno do Servidor - Erro inesperado do servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
                timestamp: '2023-12-01T10:00:00.000Z',
                requestId: 'req_1701423600000_abc123'
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Clients',
      description: 'Operações de gerenciamento de clientes'
    },
    {
      name: 'Documents',
      description: 'Operações de processamento e recuperação de documentos'
    },
    {
      name: 'Health',
      description: 'Endpoints de saúde e monitoramento do sistema'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/controllers/*.ts',
    './src/controllers/clientRoutes.ts',
    './src/controllers/documentRoutes.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);