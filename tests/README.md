# API de Processamento de Documentos - Testes

## Executando testes

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage

# Executar testes de integração
npm run test:integration
```

## Estrutura dos testes

- `tests/integration/` - API endpoint tests
- `tests/unit/` - Unit tests for services, models, etc.
- `tests/fixtures/` - Test data files
- `tests/utils/` - Test utilities

## Testes chave

- **basic-workflow.test.ts** - Fluxo completo de cliente e documento
- **clientController.test.ts** - Operações CRUD de cliente  
- **documentController.test.ts** - Processamento de documento
- **errorHandling.test.ts** - Cenários de erro

## Pré-requisitos

1. MariaDB em execução
2. Variáveis de ambiente configuradas
3. `npm install` completado