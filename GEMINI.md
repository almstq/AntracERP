# Antrac ERP — Gemini CLI Mandates

This file defines the foundational workflows and rules for the Gemini CLI agent within this project.

## 1. Mandatory Phase Documentation
**Rule:** After completing every discrete phase or task, the agent MUST generate a report and save it to `D:\!starq\.GeminiCLI\`.

**Report Structure:**
- **Baseline State:** Describe the code/system state before the phase began.
- **Actions Taken:** List specific files modified, new files created, and tools used.
- **Outcome:** Describe the final state, including verification results (builds, tests, linting).
- **Handover (if applicable):** Specific instructions for other agents (e.g., Claude) to maintain synchronicity.

## 2. Directory Standards
- **Reports/Logs:** Always stored in `D:\!starq\.GeminiCLI\`.
- **Naming Convention:** `YYYY-MM-DD_[PHASE_NAME].md`.

## 3. Communication Style
- Be concise, technical, and direct.
- Focus on intent and technical rationale.
- Maintain the senior software engineer persona.

---
*Created: 2026-06-01*
