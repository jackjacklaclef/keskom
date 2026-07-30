#!/usr/bin/env bash
# Stop hook: at the end of each response, commit any pending changes and push to
# origin/main automatically. Never pushes broken code — if `npm run build` fails,
# the commit stays local only and the user is told to look at it.
cd "$(dirname "$0")/.." || exit 0

# Rien à synchroniser : sortir sans bruit.
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain --untracked-files=all)" ]; then
  exit 0
fi

git add -A

# Si rien n'est réellement resté après l'ajout (ex: uniquement des fichiers ignorés), sortir.
if git diff --cached --quiet; then
  exit 0
fi

STAT=$(git diff --cached --stat | tail -1)
git commit -q -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')" -m "$STAT" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

BUILD_LOG="/tmp/keskom-autosync-build.log"
if npm run build > "$BUILD_LOG" 2>&1; then
  if git push origin main >> "$BUILD_LOG" 2>&1; then
    node -e 'console.log(JSON.stringify({ systemMessage: "Auto-sync : commit + push OK." }))'
  else
    node -e 'console.log(JSON.stringify({ systemMessage: "Auto-sync : commit local OK, mais le push a échoué (voir '"$BUILD_LOG"')." }))'
  fi
else
  node -e 'console.log(JSON.stringify({ systemMessage: "Auto-sync : commit local OK, mais le build a échoué — PUSH ANNULÉ pour ne pas casser le déploiement (voir '"$BUILD_LOG"')." }))'
fi
