#!/usr/bin/env bash
# Stop hook : à la fin de chaque réponse, invite Claude à tenir CLAUDE.md (et le README
# côté usage) à jour avec ce qui vient de changer — nouvelle fonctionnalité, décision
# d'architecture ou de scope, schéma, etc. N'écrit rien lui-même : la décision de ce qui
# mérite une mise à jour (ou rien) revient à Claude, via le "reason" ci-dessous.
#
# Utilise stop_hook_active pour ne bloquer qu'une seule fois par tour : sans ça, chaque
# blocage relance un Stop qui redéclencherait ce même hook → boucle infinie.
cd "$(dirname "$0")/.." || exit 0

INPUT=$(cat)
ALREADY_CONTINUING=$(node -e '
  let d = "";
  process.stdin.on("data", c => d += c);
  process.stdin.on("end", () => {
    try { console.log(JSON.parse(d).stop_hook_active === true ? "1" : "0"); }
    catch { console.log("0"); }
  });
' <<< "$INPUT")

if [ "$ALREADY_CONTINUING" = "1" ]; then
  exit 0
fi

REASON=$(cat <<'EOF'
Avant de terminer ce tour : si cette réponse a ajouté une fonctionnalité, changé un
choix d'architecture ou de scope, corrigé un bug notable, ou pris une décision de
conception (RLS, schéma, permissions, UX...), mets à jour CLAUDE.md en conséquence — et
README.md si ça concerne l'usage de l'application côté utilisateur. Si rien de notable
n'a changé dans ce tour (question, petite correction locale, discussion sans impact
durable), ne fais rien de plus et termine normalement.
EOF
)

REASON="$REASON" node -e '
  console.log(JSON.stringify({ decision: "block", reason: process.env.REASON }));
'
