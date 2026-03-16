#!/bin/bash
# =============================================================================
# setup-ec2.sh — Configura o servidor EC2 do zero
# Suporta: Ubuntu 20/22/24 LTS  e  Amazon Linux 2/2023
# Execute: bash setup-ec2.sh
# =============================================================================

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   🍞  Padaria — Setup EC2            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Detectar distribuição ─────────────────────────────────────
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
  else
    OS=$(uname -s)
  fi
  echo "🔍 Sistema detectado: $OS"
}
detect_os

# ── 1. Atualizar sistema ──────────────────────────────────────
echo "📦 [1/7] Atualizando pacotes do sistema..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  sudo apt-get update -y
  sudo apt-get upgrade -y
elif [[ "$OS" == "amzn" || "$OS" == "rhel" || "$OS" == "centos" ]]; then
  sudo yum update -y
else
  echo "⚠️  OS não reconhecido ($OS). Tentando yum..."
  sudo yum update -y || true
fi

# ── 2. Instalar Node.js 18 ────────────────────────────────────
echo "⬢  [2/7] Instalando Node.js 18..."
if command -v node &>/dev/null && [[ "$(node -v)" == v18* ]]; then
  echo "    Node 18 já instalado: $(node -v)"
else
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif [[ "$OS" == "amzn" ]]; then
    # Amazon Linux 2
    if grep -q "VERSION_ID=\"2\"" /etc/os-release 2>/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
      sudo yum install -y nodejs
    else
      # Amazon Linux 2023
      sudo dnf install -y nodejs18 npm --allowerasing || \
      curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash - && sudo dnf install -y nodejs
    fi
  else
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
    sudo yum install -y nodejs
  fi
fi
echo "    Node: $(node -v) | npm: $(npm -v)"

# ── 3. Instalar PM2 ───────────────────────────────────────────
echo "⚙️  [3/7] Instalando PM2..."
sudo npm install -g pm2
pm2 --version

# ── 4. Instalar Nginx ─────────────────────────────────────────
echo "🌐 [4/7] Instalando Nginx..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  sudo apt-get install -y nginx
elif [[ "$OS" == "amzn" ]]; then
  if grep -q "VERSION_ID=\"2023\"" /etc/os-release 2>/dev/null; then
    sudo dnf install -y nginx
  else
    sudo amazon-linux-extras install nginx1 -y 2>/dev/null || sudo yum install -y nginx
  fi
else
  sudo yum install -y nginx
fi
sudo systemctl enable nginx
sudo systemctl start nginx

# ── 5. Instalar Certbot ───────────────────────────────────────
echo "🔒 [5/7] Instalando Certbot (SSL)..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  sudo apt-get install -y certbot python3-certbot-nginx
elif [[ "$OS" == "amzn" ]]; then
  sudo pip3 install certbot certbot-nginx 2>/dev/null || \
  sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || \
  echo "    ⚠️  Certbot: instale manualmente após conectar ao EC2 Ubuntu"
else
  sudo yum install -y certbot python3-certbot-nginx || true
fi

# ── 6. Instalar Git ───────────────────────────────────────────
echo "📂 [6/7] Instalando Git..."
if command -v git &>/dev/null; then
  echo "    Git já instalado: $(git --version)"
else
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    sudo apt-get install -y git
  else
    sudo yum install -y git || sudo dnf install -y git
  fi
fi

# ── 7. Criar diretórios ───────────────────────────────────────
echo "🗄️  [7/7] Criando diretórios..."
mkdir -p ~/app/data ~/logs
chmod 755 ~/app/data ~/logs

echo ""
echo "✅ Setup concluído! Próximos passos:"
echo "   1. cd ~/app/backend && npm ci && npm run build"
echo "   2. cp .env.example .env && nano .env"
echo "   3. pm2 start ecosystem.config.js"
echo "   4. pm2 startup && pm2 save"
echo "   5. sudo cp infra/nginx/padaria-api /etc/nginx/sites-available/"
echo "   6. sudo ln -s /etc/nginx/sites-available/padaria-api /etc/nginx/sites-enabled/"
echo "   7. sudo nginx -t && sudo systemctl reload nginx"
echo "   8. sudo certbot --nginx -d api.seudominio.com"
echo ""
echo "⚠️  ATENÇÃO: Este script foi feito para o EC2 (Ubuntu/Amazon Linux)."
echo "   NÃO execute no CloudShell — ele não hospeda aplicações."
echo ""
