# SOP-001: Phase Completion and Handover Process

**Status:** Approved
**Date:** 2026-06-03
**Author:** Quill (via Nexus)
**Phase:** 9A — Institutional Knowledge Production

---

## Purpose

Ensure institutional knowledge is captured at each phase transition. Without this process, every phase completion loses design rationale, architectural decisions, and interface contracts. Future workers must reverse-engineer completed phases from code alone.

---

## Scope

This SOP applies to:
- **Phase completion:** All tasks in a phase are marked 'done' in board.db
- **Major module completion:** A significant feature is completed even if the full phase is not done
- **Session end:** A worker session covers a complete module or significant work

This SOP does NOT apply to:
- Single task completion (covered by commit messages)
- Bug fixes (covered by task board)
- Documentation updates (covered by file changes)

---

## Trigger

The process starts when ANY of these conditions are met:

| Trigger | Detection Method |
|---------|-----------------|
| All tasks in a phase are 'done' | Quill scans board.db: `SELECT status FROM tasks WHERE phase=X GROUP BY status` |
| Major module completed | Quill scans task titles for module keywords + status |
| Session end packet received | Quill reads SESSION_END_*.md for module coverage |

---

## Process

### Step 1: Detection (Quill)
Quill scans board.db and progress.json on a weekly cadence (every Monday). When a phase completion is detected, Quill creates a discovery record:

```
workspaces/quill/discoveries/YYYY-MM-DD_phase-[N]-handover-recommendation.md
```

### Step 2: Recommendation (Quill)
Quill produces a handover recommendation including:
- Phase/module name and scope
- List of completed tasks
- Key architecture decisions identified
- Known limitations
- Recommended handover document structure

### Step 3: Review (Nexus)
Nexus reviews the recommendation within 48 hours:
- **Approve:** Handover production begins
- **Defer:** Queue for later (with reason)
- **Reject:** Not needed (with reason)

### Step 4: Production (Completing Worker)
The worker who completed the phase produces the handover document using the template below. The document is filed in `docs/handover/`.

### Step 5: Filing (Quill)
Quill moves the approved document to `docs/handover/` and updates the tracking inventory.

---

## Handover Template

```markdown
# HAND-[NNN]: [Phase/Module Name]

**Status:** [Draft | Review | Approved]
**Date:** [ISO date]
**Author:** [Worker who completed the phase]
**Scope:** [What was built]

---

## What Was Built
- [Module/feature 1]
- [Module/feature 2]
- [Data models created]
- [Interfaces established]

## Design Rationale
- [Why approach A was chosen over approach B]
- [Key tradeoffs and decisions]
- [Alternatives considered]

## Architecture Decisions
- [Decision 1: Context → Decision → Consequence]
- [Decision 2: Context → Decision → Consequence]

## Interfaces and Contracts
- [Data shapes (Firestore collections, TypeScript interfaces)]
- [API patterns (function signatures, event patterns)]
- [Auth/authorization decisions]

## Authentication/Authorization
- [Roles affected]
- [Access patterns]
- [Security decisions]

## Known Limitations
- [Limitation 1: Impact, planned resolution]
- [Limitation 2: Impact, planned resolution]

## Testing Gaps
- [Untested area 1: Risk level]
- [Untested area 2: Risk level]

## Future Work
- [Deferred decision 1: When to revisit]
- [Planned enhancement 1: Priority]

## Related Files
| File | Purpose |
|------|---------|
| [path] | [description] |

## Historical Context
- [When this phase was completed]
- [Key sessions/workers involved]
- [Major pivots or changes during development]
```

---

## Ownership

| Role | Responsibility |
|------|---------------|
| **Quill** | Detect phase completion, create recommendation, file approved documents |
| **Nexus** | Review and approve/reject recommendations |
| **Completing Worker** | Produce handover document using template |
| **All Workers** | Reference handover documents when working on related modules |

---

## Cadence

| Activity | Frequency |
|----------|-----------|
| Phase completion scan | Weekly (Monday) |
| Recommendation review | Within 48 hours of detection |
| Document production | Within 7 days of approval |
| Document filing | Within 24 hours of completion |

---

## Tracking

Quill maintains an inventory of completed phases vs handover docs:

```
workspaces/quill/phase-handover-inventory.md
```

| Phase | Status | Handover Doc | Date |
|-------|--------|--------------|------|
| Phase 1 Foundation | DONE | HAND-001 | 2026-06-03 |
| Phase 2A | DONE | — | MISSING |
| Phase 2B | DONE | — | MISSING |
| Phase 3 | DONE | — | MISSING |
| Phase 4 | DONE | — | MISSING |

Missing handovers are flagged in Quill's weekly digest to Nexus.

---

## Quality Standards

### Handover Document Checklist
- [ ] All completed tasks listed
- [ ] Design rationale explains WHY, not just WHAT
- [ ] Architecture decisions documented with context
- [ ] Interfaces and contracts captured (data shapes, APIs)
- [ ] Auth/authorization decisions documented
- [ ] Known limitations listed with impact
- [ ] Testing gaps identified
- [ ] Future work items captured
- [ ] Related files listed with paths
- [ ] Historical context included

### Review Criteria (Nexus)
- [ ] Document covers all major work in the phase
- [ ] Design rationale is clear and complete
- [ ] A new developer could work on this module using only this document
- [ ] No significant gaps or omissions

---

## Escalation

If a phase completion is detected but no handover is produced within 14 days:
1. Quill flags the overdue handover in the weekly digest
2. Nexus assigns the completing worker to produce the document
3. If the completing worker is unavailable, Nexus assigns Quill to produce a draft

---

## Historical Context

This SOP was created during Phase 9A after analysis revealed that STARQ had completed 44 phases with zero handover documentation. Every phase transition lost institutional knowledge. This SOP ensures future phases produce permanent records.

The first handover document produced under this SOP is HAND-001 (Phase 1 Foundation), which covers the authentication system, role model, asset data model, and design system that 43 subsequent phases were built on.

---

*End of SOP-001*
