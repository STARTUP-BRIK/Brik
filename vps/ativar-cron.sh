#!/usr/bin/env bash
# Liga o agendamento do Brik na VPS (vps/crontab no crontab do usuário brik).
# Rodar como root, SÓ depois de:
#   1. o teste em dry-run ter passado (sudo -u brik bash ~brik/Brik/vps/rodar.sh completa --dry-run);
#   2. os jobs raspagem-completa, raspagem-recentes e verificar-strikes do pg_cron
#      terem sido desligados (senão o Actions e a VPS raspam ao mesmo tempo).
# Para desligar de novo: crontab -u brik -r
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Rode como root."; exit 1; }

read -r -p "Os disparos do pg_cron para o GitHub já foram desligados? (s/N) " resposta
[ "$resposta" = "s" ] || { echo "Desligue primeiro (ver comentário no topo deste arquivo)."; exit 1; }

crontab -u brik /home/brik/Brik/vps/crontab
echo "Agendamento ligado:"
crontab -u brik -l | grep -v '^#' | grep -v '^$'
