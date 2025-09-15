# DocuLink - Setup Docker

Guia básico para executar o projeto DocuLink usando Docker.

## Pré-requisitos

- Docker
- Docker Compose

## Como executar

1. **Clone o projeto e configure**:
   ```bash
   git clone <repository-url>
   cd docuLink
   cp .env.example .env
   ```

2. **Inicie os serviços**:
   ```bash
   docker compose up -d
   ```

3. **Acesse a aplicação**:
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/health

## Comandos úteis

```bash
# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down

# Reiniciar serviços
docker-compose restart
```

## Scripts auxiliares

O projeto inclui scripts para facilitar o desenvolvimento:

```bash
# Construir a imagem Docker
./scripts/docker-build.sh

# Executar a aplicação (cria .env se não existir)
./scripts/docker-run.sh
```

## Estrutura

- **API**: Node.js na porta 3000
- **Database**: MariaDB na porta 3306
- **Volumes**: Dados persistentes do banco