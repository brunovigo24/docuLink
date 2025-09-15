#!/bin/bash

# Script simples para executar a aplicação
set -e

echo "🚀 Iniciando a API de processamento de documentos..."

# Verificar se existe .env
if [ ! -f .env ]; then
  echo "⚠️  Copiando .env.example para .env"
  cp .env.example .env
fi

# Iniciar serviços
docker compose up -d

echo "⏳ Esperando services..."
sleep 15

# Mostrar status
echo "📊 Service status:"
docker compose ps

echo "✅ Serviços iniciados!"
echo "🌐 API: http://localhost:3000"
echo "🏥 Health: http://localhost:3000/health"