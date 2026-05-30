# Antrac ERP — Documentation (canonical home)

**This folder is the single source of truth for everything about Antrac ERP.**
Per the starqOS organising principle: each project is self-contained under
`projects/<name>/`; the starqOS processor *indexes/visualises* this — it does not
hold project content.

## Structure

```
docs/
├── workflows/        # The authoritative workflow specs (from Mustarq)
│   ├── WLI_WORKFLOW_TICKETS.md        # Issue → Closure (maintenance)
│   ├── WLI_MPL_FUEL_WORKFLOW.md       # WLI ↔ MPL fuel/water
│   └── WLI_CRM_SALES_WORKFLOW.md      # CRM & Sales (revenue)
├── management/       # Strategic/coordination docs
│   ├── MASTER_TIMELINE.md             # canonical project timeline
│   └── MASTER_ARCHITECTURE.md         # module architecture + schema
└── CRM_PLAN.md       # proposed CRM build plan
```
Plus `../PROGRESS.md` (live tracker), `../CHANGELOG.md`, `../README.md`.

## Doc policy
- **Claude Code writes all project docs here** — never into the starqOS
  processor area (`starqos/`, `workspaces/`, `02_ANTRAC_NEXUS`, etc.).
- `MASTER_TIMELINE.md` / `MASTER_ARCHITECTURE.md` here are the **canonical**
  copies. The copies under `starqos/content/nexus/` are the Nexus/Hermes mirror
  (the live agent system still reads those) — keep them in sync until migrated.

## Deferred consolidation (next session — needs care)
The following antrac content still lives in the starqOS processor because the
**running** system reads those paths; relocating them requires updating
Hermes/VOID DECK references + testing:
- `workspaces/{nexus,lens,quill,vector,cipher,grid}/…` — agent work products
- `starqos/content/nexus/antrac-erp-*.md` — Nexus mirror
- `starqos-mission-control/docs/antrac-erp-*.html` — VOID DECK rendered docs
- `.claude_code_sync/ANTRAC_ERP_*.md`, `_system/sessions/*ANTRAC*`, `02_ANTRAC_NEXUS/`

**Plan:** move/copy each into `docs/` here, then update the indexer + VOID DECK
+ any cron paths to read from the project folder, then retire the old copies to
`_recyclebin/` (never delete). Do this when there's time to test the processor.
