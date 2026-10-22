#!/usr/bin/env bash
# Prepara a VPS do Brik (Ubuntu 24.04, x86) para rodar o scraper + worker sem o
# GitHub Actions. Rodar como root, quantas vezes precisar (cada passo confere se
# já foi feito):
#
#   curl -fsSL https://raw.githubusercontent.com/STARTUP-BRIK/Brik/main/vps/instalar.sh -o instalar.sh
#   bash instalar.sh
#
# (com o repositório privado, copie o arquivo do seu PC: scp vps/instalar.sh root@IP:)
#
# O que faz: fuso de Recife, atualizações automáticas de segurança, firewall,
# SSH só por chave, swap de 4 GB, Node 24, Python + venv, Google Chrome, Xvfb,
# usuário "brik", chave de deploy pro GitHub, clone do repositório, dependências
# e um .env para preencher. NÃO liga o agendamento: isso é o vps/ativar-cron.sh,
# depois do teste e de desligar os disparos do pg_cron (senão raspa em dobro).
set -euo pipefail

REPO_SSH="git@github.com:STARTUP-BRIK/Brik.git"
USUARIO="brik"
CASA="/home/$USUARIO"
PASTA="$CASA/Brik"

passo() { printf '\n==> %s\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "Rode como root."; exit 1; }
[ "$(dpkg --print-architecture)" = "amd64" ] || { echo "Precisa de x86 (amd64): o Google Chrome não tem versão ARM."; exit 1; }

passo "Fuso horário de Recife (o cron e os logs seguem o horário do Brik)"
timedatectl set-timezone America/Recife

passo "Pacotes do sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q git curl ca-certificates gnupg xvfb fonts-liberation \
    python3 python3-venv python3-pip unattended-upgrades ufw util-linux

passo "Atualizações automáticas de segurança"
dpkg-reconfigure -f noninteractive unattended-upgrades

passo "Firewall: só SSH entra"
ufw allow OpenSSH >/dev/null
ufw --force enable >/dev/null

passo "SSH só por chave (a senha de root continua valendo no console da Hetzner)"
cat > /etc/ssh/sshd_config.d/99-brik.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
systemctl reload ssh || systemctl reload sshd

passo "Swap de 4 GB (folga para os picos de memória dos Chromes)"
if ! swapon --show | grep -q '/swapfile'; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-brik.conf
sysctl -q --system

passo "Node 24"
if ! node --version 2>/dev/null | grep -q '^v24\.'; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y -q nodejs
fi

passo "Google Chrome (o mesmo navegador do Actions; o OLX barra o headless)"
if ! command -v google-chrome >/dev/null; then
    curl -fsSL -o /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    apt-get install -y -q /tmp/chrome.deb
    rm -f /tmp/chrome.deb
fi

passo "Usuário $USUARIO (roda o scraper; root fica só para administrar)"
id "$USUARIO" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$USUARIO"

passo "Chave de deploy do GitHub (só leitura do repositório)"
CHAVE="$CASA/.ssh/id_ed25519"
if [ ! -f "$CHAVE" ]; then
    sudo -u "$USUARIO" mkdir -p "$CASA/.ssh"
    sudo -u "$USUARIO" ssh-keygen -q -t ed25519 -N '' -C "brik-vps-deploy" -f "$CHAVE"
fi
sudo -u "$USUARIO" bash -c "ssh-keyscan -H github.com >> '$CASA/.ssh/known_hosts' 2>/dev/null; sort -u -o '$CASA/.ssh/known_hosts' '$CASA/.ssh/known_hosts'"

passo "Repositório"
if [ ! -d "$PASTA/.git" ]; then
    if ! sudo -u "$USUARIO" git clone -q "$REPO_SSH" "$PASTA" 2>/dev/null; then
        echo
        echo "O GitHub ainda não aceitou a chave desta VPS. Cadastre-a em:"
        echo "  github.com/STARTUP-BRIK/Brik -> Settings -> Deploy keys -> Add deploy key"
        echo "  (título: vps-brik; NÃO marque 'Allow write access')"
        echo
        cat "$CHAVE.pub"
        echo
        echo "Depois rode este script de novo."
        exit 1
    fi
fi

passo "Dependências do worker (Node) e do scraper (Python, num venv)"
sudo -u "$USUARIO" bash -c "cd '$PASTA/worker' && npm install --no-audit --no-fund --silent"
sudo -u "$USUARIO" bash -c "cd '$PASTA' && python3 -m venv .venv && .venv/bin/pip install -q -r scraper/requirements.txt"

passo "Pastas de log"
sudo -u "$USUARIO" mkdir -p "$CASA/logs"

passo ".env (o worker lê da raiz do repositório)"
ENV="$PASTA/.env"
if [ ! -f "$ENV" ]; then
    sudo -u "$USUARIO" install -m 600 /dev/null "$ENV"
    cat > "$ENV" <<EOF
# Preencha com os mesmos valores dos secrets do GitHub Actions.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
# LLM_CADEIA=gemini,groq,anthropic

PYTHON_EXECUTABLE=$PASTA/.venv/bin/python
PYTHON_SCRIPT_PATH=$PASTA/scraper/app.py

# VPS pequena (Hetzner CX23, 2 vCPU / 4 GB): 2 Chromes no total, Chrome leve.
SCRAPER_PARALELO=2
CHROMES_MAX=2
CHROME_LEVE=true

# Opcional: aviso quando uma tarefa falhar ou não rodar (healthchecks.io, grátis).
# Um check por tarefa; o vps/rodar.sh avisa início, fim e falha.
# HEALTHCHECK_COMPLETA=https://hc-ping.com/...
# HEALTHCHECK_RECENTES=https://hc-ping.com/...
# HEALTHCHECK_VERIFICAR=https://hc-ping.com/...
EOF
    chown "$USUARIO:$USUARIO" "$ENV"
fi

echo
echo "Pronto. Próximos passos:"
echo "  1. nano $ENV   (preencha as chaves)"
echo "  2. teste:  sudo -u $USUARIO bash $PASTA/vps/rodar.sh completa --dry-run"
echo "  3. só depois de desligar os disparos do pg_cron:  bash $PASTA/vps/ativar-cron.sh"
