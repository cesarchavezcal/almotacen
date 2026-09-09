# Walkthrough: Conductor-Style Git Worktrees with cmux Browser Integration & Per-Group Toggles

## Summary
Configured `cmux` so that clicking the `+` button in any group header automatically provisions a new Git worktree at `<parent>/<repo>-worktrees/scratch-<timestamp>`, complete with `.worktreeinclude` / `.env` syncing, automatic tab renaming, instant atomic renaming via `cwr`, embedded cmux browser split integration, and granular per-group enable/disable controls via `cwt` and `.noworktree`.

---

## What Was Built

### 1. Core Executables (`~/.config/cmux/bin/` & `~/.local/bin/`)
- [cmux-worktree-manager.py](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cmux-worktree-manager.py): Core engine providing worktree provisioning, `.worktreeinclude` / `.env` syncing, browser splitting, and atomic renaming.
- [cmux-worktree-daemon.py](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cmux-worktree-daemon.py): Unbuffered event daemon listening to `cmux events` over pseudo-terminal (`pty`) to catch `workspace.created` instantly.
- [cmux-worktree-daemon](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cmux-worktree-daemon): CLI supervisor supporting `status`, `start`, `stop`, and `restart`.
- [cwt](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cwt) (`cmux-worktree-toggle`): CLI command to toggle or check worktree status per group (`cwt on`, `cwt off`, `cwt status`, `cwt mode [auto|prompt]`).
- [cwr](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cwr) (`cmux-worktree-rename`): Atomic rename utility that updates the Git branch (`git branch -m`), moves the worktree directory (`git worktree move`), renames the cmux workspace title, and opens/navigates the browser split if an issue URL is provided.
- [cmux-group-worktree](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cmux-group-worktree): CLI / action runner for manual invocation.
- [cmux-init-worktree](file:///Users/cesaradalbertochavezcalderon/.config/cmux/bin/cmux-init-worktree): Interactive terminal prompt runner (used in `prompt` mode).

### 2. cmux Configuration (`~/.config/cmux/cmux.json`)
- Registered `new-worktree` action.
- Configured `workspaceGroups.byCwd` context menu for `+` button in `Personal` and `Projects` groups.
- Added auto-start check to `~/.zshrc` so the daemon is always running seamlessly inside cmux.

---

## Verified End-to-End Test

1. **Daemon Auto-Detection on `+` Button**:
   - Created workspace in `💵 Almotacen` group:
     ```text
     [2026-09-09 14:41:40] cmux-worktree-daemon starting...
     [2026-09-09 14:41:47] Workspace 0067028E-... belongs to group '💵 Almotacen'
     [2026-09-09 14:41:47] Auto-creating worktree for group '💵 Almotacen': branch=chore/CCH/scratch-0909-1441, path=~/Personal/almotacen-worktrees/scratch-0909-1441
     [2026-09-09 14:41:47] ✅ Successfully provisioned worktree for workspace 0067028E-... (chore/CCH/scratch-0909-1441)
     ```
2. **Atomic Renaming (`cwr`)**:
   - Verified dry-run & execution: renames git branch, moves directory, and updates cmux workspace title.
3. **Per-Group Toggle (`cwt`)**:
   - `cwt status` -> `🌿 Worktrees for group '💵 Almotacen': ENABLED`
   - `cwt off` -> Disables worktrees; `+` button creates normal terminal without worktrees.
   - `cwt on` -> Re-enables worktrees.

---

## Daily Workflow Guide

1. **Click `+` on any group header** (e.g. `💵 Almotacen`):
   - A new workspace tab opens immediately on branch `chore/CCH/scratch-<MMDD-HHMM>`.
   - Your shell starts directly inside `~/Personal/<repo>-worktrees/scratch-<MMDD-HHMM>`.
   - All `.env`, `.env.local`, and `.worktreeinclude` files are pre-copied.
2. **Once you have your ticket/issue details**:
   - Run `cwr <ticket-or-url>`:
     ```bash
     cwr ALM-101-add-wallet-pass
     # OR with URL (automatically opens browser split):
     cwr https://github.com/cesarchavezcal/almotacen/issues/42
     ```
   - Branch, directory, and workspace tab title are atomically updated.
3. **To disable worktrees for a specific repo**:
   - Run `cwt off` inside that group, OR
   - Create a `.noworktree` file in the repo root.
