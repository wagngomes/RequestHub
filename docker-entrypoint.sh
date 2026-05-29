#!/bin/sh
set -e

echo "🔄 Executando migrations do banco de dados..."
npx prisma migrate deploy

echo "🚀 Iniciando aplicação..."
exec node server.js
