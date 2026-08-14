---
name: init
description: Onboard project adapting to 3 Project Lifecycle States & hydrate ROADMAP.md + active_context.md
argument-hint: []
---

# /init Protocol v2.4 (3-State Onboarding Adapter)

1. Detect Project Lifecycle State:
   - **State 1 (Brand New)**: Auto-scaffold `.agent/`, `active_context.md`, `ROADMAP.md`.
   - **State 2 (Ongoing Plug & Play)**: Onboard tree without touching existing user code; populate `active_context.md`.
   - **State 3 (Completed / Fork)**: Archive legacy specs to `specs/archive/`, log history, and open new Phase.
2. Hydrate `.agent/docs/ROADMAP.md` and `.agent/docs/ARCHITECTURE.md`.
3. Update `.agent/workflows/active_context.md` with system architecture & status.
4. Report system health, active checkpoint, and readiness for task.
