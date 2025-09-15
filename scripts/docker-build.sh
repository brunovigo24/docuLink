#!/bin/bash

# Script simples para build da imagem Docker
set -e

echo "🐳 Construindo Docker image..."

docker build -t doculink-api:latest .

echo "✅ Build completo!"
echo "📊 Tamanho da imagem:"
docker images doculink-api:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"