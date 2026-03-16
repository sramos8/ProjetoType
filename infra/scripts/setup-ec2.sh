#!/bin/bash
# =============================================================================
# setup-ec2.sh — Configura o servidor EC2 do zero
# Execute como: bash setup-ec2.sh
# Testado em: Ubuntu 22.04 LTS (t2.micro)
# =============================================================================

set -e  # Para tudo se qualquer comando falhar

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   🍞  Padaria — Setup EC2            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Atualizar sistema ──────────────────────────────────────
echo "📦 [1/7] Atualizando pacotes do sistema..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ── 2. Instalar Node.js 18 ────────────────────────────────────
echo "⬢  [2/7] Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "    Node: $(node -v) | npm: $(npm -v)"

# ── 3. Instalar PM2 ───────────────────────────────────────────
echo "⚙️  [3/7] Instalando PM2..."
sudo npm install -g pm2
pm2 --version

# ── 4. Instalar Nginx ─────────────────────────────────────────
echo "🌐 [4/7] Instalando Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# ── 5. Instalar Certbot ───────────────────────────────────────
echo "🔒 [5/7] Instalando Certbot (SSL)..."
sudo apt-get install -y certbot python3-certbot-nginx

# ── 6. Instalar Git ───────────────────────────────────────────
echo "📂 [6/7] Instalando Git..."
sudo apt-get install -y git

# ── 7. Criar diretório de dados para SQLite ───────────────────
echo "🗄️  [7/7] Criando diretórios..."
mkdir -p ~/app/data
chmod 755 ~/app/data

echo ""
echo "✅ Setup concluído! Próximos passos:"
echo "   1. git clone <seu-repo> ~/app"
echo "   2. cd ~/app/backend && npm install && npm run build"
echo "   3. cp .env.example .env && nano .env"
echo "   4. pm2 start dist/server.js --name padaria-api"
echo "   5. pm2 startup && pm2 save"
echo "   6. sudo cp infra/nginx/padaria-api /etc/nginx/sites-available/"
echo "   7. sudo ln -s /etc/nginx/sites-available/padaria-api /etc/nginx/sites-enabled/"
echo "   8. sudo nginx -t && sudo systemctl reload nginx"
echo "   9. sudo certbot --nginx -d api.seudominio.com"
echo ""
