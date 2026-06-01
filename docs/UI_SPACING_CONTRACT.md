# UI_SPACING_CONTRACT.md

> **MANDATORY READ before touching any layout, component, or CSS.**
> Mustarq has corrected this multiple times. Do not make him say it again.

---

## ABSOLUTE RULES — DO NOT VIOLATE

### 1. PAGE PADDING
Every page must have **minimum 24px padding from ALL browser edges**.
Nothing touches the viewport wall. Ever.

### 2. CARD GAPS
**Minimum 16px gap between every card/panel.**
Cards never touch each other.

### 3. CARD INNER PADDING
**Every card must have minimum 20px padding on all sides.**
Content never touches a card border.

### 4. GLOBAL SPACING SCALE
| Token | Value |
|-------|-------|
| xs    | 4px   |
| sm    | 8px   |
| md    | 16px  |
| lg    | 24px  |
| xl    | 32px  |

### 5. BEFORE TOUCHING ANY COMPONENT
Check this file first.

---

## HOW TO ENFORCE

In `index.css` these must exist and be respected:

```css
.page-root  { padding: 24px; }
.card       { padding: 20px; gap: 16px; }
.grid       { gap: 16px; }
```

In Tailwind terms (what we actually use):

| Rule | Tailwind minimum |
|------|-----------------|
| Page outer padding | `px-8 py-10` (32px / 40px) |
| Card inner padding | `p-8` (32px) — exceeds 20px minimum ✓ |
| Grid / flex gap between cards | `gap-5` (20px) — exceeds 16px minimum ✓ |
| Nested surface inside card | `p-6` (24px) |

---

## CURRENT IMPLEMENTATION (antrac-erp)

| Component | File | Setting |
|-----------|------|---------|
| Page wrapper | `src/components/shared/PageContainer.tsx` | `px-8 py-12 md:px-14 lg:px-16` |
| Card inner | `src/components/ui/Card.tsx` | `p-8` body, `px-8 py-5` header |
| Stats grid | `WLIDashboard.tsx` | `gap-5` |
| Fleet grid | `WLIDashboard.tsx` | `gap-5` |
| Weather tile grid | `WeatherPanel.tsx` | `gap-5` |
| Weather tile (nested surface) | `WeatherPanel.tsx` | `p-6 gap-5` |
| Page header bar | `WLIDashboard.tsx` | `px-8 md:px-14 lg:px-16` (matches PageContainer) |

---

## WHY THIS KEEPS BREAKING

New components are written without cross-checking this contract.
Any new page, card, grid, or panel must start from these minimums — not from zero.

**When in doubt: add more space, not less.**
