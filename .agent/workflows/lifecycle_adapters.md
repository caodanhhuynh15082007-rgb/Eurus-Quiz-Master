# 🏛️ 3 PROJECT LIFECYCLE ADAPTERS — Eurus Agent v2.4

This document governs how `eurus-agent` adapts seamlessly to any codebase lifecycle state without breaking existing work.

---

## 🟢 State 1: Brand New Project (Dự Án Mới / Ít File)
- **Detection:** Zero code files or initial repository.
- **Protocol:**
  1. Auto-scaffold `.agent/` folder structure, `AGENTS.md`, `active_context.md`, `ROADMAP.md`.
  2. Create initial baseline test runner and `.gitignore`.
  3. Break down initial user prompt into Phase 1 Features in `ROADMAP.md`.

## 🟡 State 2: Ongoing Project (Dự Án Đang Làm Dở Dạng - Plug & Play)
- **Detection:** Existing codebase with code files, manifests, and git history.
- **Protocol:**
  1. Onboard without modifying or destroying any existing user code.
  2. Scan directory tree and package manifests to populate `.agent/docs/ARCHITECTURE.md` and `.agent/workflows/active_context.md`.
  3. Seamlessly resume active work items in 0.5s with zero token bloat.

## 🔴 State 3: Completed / Fork Project (Dự Án Đã Xong Muốn Fork / Nâng Cấp)
- **Detection:** Completed repository with existing production tag/specs.
- **Protocol:**
  1. Archive legacy feature specs to `.agent/specs/archive/` and log history to `history_archive.md`.
  2. Create new Git branch or add new Phase in `ROADMAP.md` for new feature ideas.
  3. Preserve 100% historical context while isolating new feature work.
