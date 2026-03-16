#!/bin/bash
# =============================================================================
# deploy.sh — Script de deploy manual no EC2
# Execute: bash infra/scripts/deploy.sh
# =============================================================================

set -e

APP_DIR="${APP_DIR:-$HOME/app}"
APP_NAME="padaria-api"
BRANCH="${1:-main}"

echo ""
echo "🚀 Deploy Padaria API → branch: $BRANCH"
echo "   Diretório: $APP_DIR"
echo ""

cd "$APP_DIR"

# 1. Puxar última versão
echo "📥 [1/4] git pull origin $BRANCH..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 2. Instalar dependências e buildar
echo "📦 [2/4] Instalando dependências e buildando..."
cd backend
npm ci --only=production=false
npm run build

# 3. Reiniciar com PM2
echo "♻️  [3/4] Reiniciando PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
else
    pm2 start dist/server.js --name "$APP_NAME"
fi
pm2 save

# 4. Health check
echo "🏥 [4/4] Health check..."
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/health)
if [ "$STATUS" = "200" ]; then
    echo "✅ API respondendo com HTTP $STATUS"
else
    echo "❌ Health check falhou! HTTP $STATUS"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
