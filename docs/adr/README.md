# ADR Catalog

**Status:** Active
**Last Updated:** 2026-06-03

---

## Active ADRs

| ID | Title | Date | Summary |
|----|-------|------|---------|
| [ADR-001](ADR-001-workflow-engine-pure-functions.md) | Workflow Engine Pure Function Architecture | 2026-06-03 | Separates pure transition logic (engine.ts) from Firebase integration (Phase 3). 6 workflow types, 17 side-effects, 100+ transitions. Cannot be reversed without rewriting all workflow logic. |
| [ADR-002](ADR-002-auth-user-site-scoping.md) | Auth User Site-Scoped Territory Model | 2026-06-03 | Stores siteIds on AuthUser document. Empty array = global access (finance, HQ). Affects every Firestore query and security rule. Includes Act-As impersonation pattern. |

---

## How to Read an ADR

Each ADR follows this structure:
1. **Context** — What problem were we solving?
2. **Decision** — What did we choose and why?
3. **Alternatives Considered** — What else did we evaluate?
4. **Consequences** — What are the tradeoffs?
5. **Impact Scope** — What modules/workers are affected?
6. **Related Files** — What code implements this?

---

## When to Create a New ADR

Create an ADR when ALL of these are true:
- Involves a **choice between alternatives** (not a bug fix)
- Has **lasting impact** on system design (>6 months)
- Affects **multiple modules or workers**
- **Cannot be easily reversed** without significant rework
- Makes sense to a **new developer 6 months from now**

Do NOT create an ADR for:
- Bug fixes (use task board)
- Engineering tasks (use task board)
- Feature requests (use backlog)
- User documentation (use help system)

---

## ADR Status Definitions

| Status | Meaning |
|--------|---------|
| Draft | Produced by Quill, pending Nexus review |
| Approved | Reviewed by Nexus, filed in docs/adr/ |
| Superseded | Replaced by a newer ADR |
| Deprecated | No longer relevant but preserved for history |

---

## Related Documents

- [KNOWLEDGE_INDEX.md](../KNOWLEDGE_INDEX.md) — Master index of all knowledge assets
- [HANDOVER_INDEX.md](HANDOVER_INDEX.md) — Handover document catalog
- [SOP_INDEX.md](SOP_INDEX.md) — SOP catalog
- [WORKER_KNOWLEDGE_CONSUMPTION_MODEL.md](WORKER_KNOWLEDGE_CONSUMPTION_MODEL.md) — How workers use ADRs
- [PRE_WORK_CHECKLIST.md](PRE_WORK_CHECKLIST.md) — Checklist before starting work

---

*Maintained by Nexus. Updated when new ADRs are approved.*
