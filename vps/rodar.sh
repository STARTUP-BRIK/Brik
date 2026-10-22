#!/usr/bin/env bash
# Roda uma tarefa do Brik na VPS, no lugar dos workflows do GitHub Actions.
# Chamado pelo cron (vps/crontab) como o usuário brik:
#
#   bash ~/Brik/vps/rodar.sh completa              (= scrape.yml com ciclo completo)
#   bash ~/Brik/vps/rodar.sh recentes              (= scrape-recentes.yml)
#   bash ~/Brik/vps/rodar.sh verificar             (= verificar-strikes.yml)
#   bash ~/Brik/vps/rodar.sh completa --dry-run    (argumentos extras vão pro worker)
#
# Antes de rodar, atualiza o código pela main (é o "deploy"). Uma tarefa por vez:
# a VPS pequena só aguenta os 2 Chromes de um worker (CHROMES_MAX). A completa e a
# verificação esperam a vez; a de recentes desiste se outra estiver rodando (a
# próxima vem em 20 min). Log em ~/logs/<tarefa>-<data>.log, guardado por 14 dias.
set -uo pipefail

TAREFA="${1:-}"
shift || true
PASTA="$HOME/Brik"
LOGS="$HOME/logs"
TRAVA="/tmp/brik-worker.lock"

case "$TAREFA" in
    completa)  ARGS=();                         ESPERA=(-w 10800); HC_VAR=HEALTHCHECK_COMPLETA ;;
    recentes)  ARGS=(--ate-conhecido 10);       ESPERA=(-n);       HC_VAR=HEALTHCHECK_RECENTES ;;
    verificar) ARGS=(--verificar-strikes);      ESPERA=(-w 10800); HC_VAR=HEALTHCHECK_VERIFICAR ;;
    *) echo "Uso: rodar.sh completa|recentes|verificar [args extras do worker]"; exit 2 ;;
esac
ARGS+=("$@")

mkdir -p "$LOGS"
LOG="$LOGS/$TAREFA-$(date +%Y-%m-%d_%H%M).log"

# URL do healthchecks.io da tarefa (opcional), lida do .env sem carregar o resto.
HC_URL="$(grep -E "^${HC_VAR}=" "$PASTA/.env" 2>/dev/null | cut -d= -f2- || true)"
avisar() { [ -n "$HC_URL" ] && curl -fsS -m 10 --retry 3 -o /dev/null "$HC_URL$1" || true; }

exec 9>"$TRAVA"
if ! flock "${ESPERA[@]}" 9; then
    echo "$(date '+%F %T') $TAREFA pulada: outra tarefa ainda está rodando." >> "$LOGS/puladas.log"
    exit 0
fi

{
    echo "=== $(date '+%F %T') $TAREFA ${ARGS[*]}"
    avisar /start
    cd "$PASTA" || exit 1

    # Deploy: só avança se a main andou pra frente (nada de editar código na VPS).
    git fetch -q origin main && git merge -q --ff-only origin/main || echo "⚠ não consegui atualizar o código; rodando a versão atual."
    (cd worker && npm install --no-audit --no-fund --silent) || echo "⚠ npm install falhou"
    .venv/bin/pip install -q -r scraper/requirements.txt || echo "⚠ pip install falhou"

    # Mesma tela virtual do Actions: o OLX barra o Chrome headless.
    xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" node worker/worker.js "${ARGS[@]}"
    RC=$?
    echo "=== $(date '+%F %T') fim ($TAREFA, código $RC)"
    avisar "/$RC"

    # Faxina: JSONs de raspagem com mais de 2 dias e logs com mais de 14. Só os
    # JSONs que o git ignora: há 46 antigos versionados que precisam ficar.
    find scraper -maxdepth 1 -name '*.json' -mtime +2 -print0 2>/dev/null |
        while IFS= read -r -d '' f; do
            git ls-files --error-unmatch "$f" >/dev/null 2>&1 || rm -f "$f"
        done
    find "$LOGS" -name '*.log' -mtime +14 -delete 2>/dev/null
    exit $RC
} >> "$LOG" 2>&1
