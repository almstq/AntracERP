# Handover Document Catalog

**Status:** Active
**Last Updated:** 2026-06-03

---

## Active Handover Docs

| ID | Title | Date | Summary |
|----|-------|------|---------|
| [HAND-001](HAND-001-phase-1-foundation.md) | Phase 1 Foundation — Authentication and Role Architecture | 2026-06-03 | Documents authentication flow, 8-role model, asset data model, site scoping model, design system (Helix), Firestore security. 43 subsequent phases built on this foundation. |

---

## How to Read a Handover Doc

Each handover doc follows this structure:
1. **What Was Built** — Modules, features, data models
2. **Design Rationale** — Why decisions were made
3. **Architecture Decisions** — Key choices and tradeoffs
4. **Interfaces and Contracts** — Data shapes, APIs, auth patterns
5. **Known Limitations** — What's not yet done
6. **Testing Gaps** — What's not tested
7. **Future Work** — Deferred decisions and planned enhancements

---

## When to Create a New Handover Doc

Create a handover doc when:
- A phase is completed (all tasks marked 'done')
- A major module is completed (even if phase is not fully done)
- A worker session covers complete module work

Handover docs are produced by the completing worker, triggered by Quill detection, reviewed by Nexus.

---

## Coverage Gaps

These phases are complete but lack handover docs:

| Phase | Priority |
|-------|----------|
| Phase 2A (Scaffold, Auth, Routing) | HIGH |
| Phase 2B (CRM, Asset Utilization) | HIGH |
| Phase 3 (Finance) | HIGH |
| Phase 4 (Logistics) | MEDIUM |

---

## Related Documents

- [KNOWLEDGE_INDEX.md](../../docs/KNOWLEDGE_INDEX.md) — Master index
- [ADR_CATALOG.md](ADR_CATALOG.md) — ADR catalog
- [SOP_CATALOG.md](SOP_CATALOG.md) — SOP catalog

---

*Maintained by Nexus. Updated when new handover docs are approved.*
