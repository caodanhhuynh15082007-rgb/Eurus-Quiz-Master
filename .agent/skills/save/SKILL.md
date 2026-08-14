---
name: save
description: Auto-Pilot Teardown - Auto-test, update active_context.md & history_archive.md, git commit & push
argument-hint: [checkpoint-note]
---

# /save Protocol v2.4 (Auto-Pilot Teardown Engine)

1. Summarize all file edits, new features, test results, and lessons learned.
2. Append checkpoint to `.agent/workflows/active_context.md` and `.agent/workflows/history_archive.md`.
3. Update `.agent/memory/active_context.md` with active git commit hash (`git rev-parse HEAD`).
4. Run fast isolated test runner (`/test`).
5. Execute automated Git pipeline:
   - `git add .`
   - `git commit -m "feat: [summary of session changes]"`
   - `git push origin main`
6. Output a crisp executive summary of modified files and feature progress for the user.
