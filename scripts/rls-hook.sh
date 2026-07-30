#!/usr/bin/env bash
# PostToolUse hook for mcp__claude_ai_Supabase__apply_migration.
# Runs the RLS regression suite (scripts/test-rls.mjs) after every migration and
# reports failures back to Claude via the hook's decision:"block" output, so a
# broken policy (recursion, tautological with_check, missing policy...) is caught
# immediately instead of discovered later through manual testing.
cd "$(dirname "$0")/.." || exit 1

OUTPUT=$(npm run test:rls 2>&1)
CODE=$?

if [ $CODE -ne 0 ]; then
  node -e '
    const output = require("fs").readFileSync(0, "utf8");
    console.log(JSON.stringify({
      decision: "block",
      reason: "RLS regression tests FAILED after this migration:\n\n" + output,
    }));
  ' <<< "$OUTPUT"
else
  echo "RLS regression tests passed after migration."
fi
