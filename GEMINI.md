# GEMINI.md — Conventions for Antrac ERP

You are working in the Antrac ERP codebase. Claude Code built this; you're handling one
self-contained task. **Follow these conventions exactly** — consistency matters more than
cleverness here.

## Stack
React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS 4 · Firebase (Firestore + Storage).
Build/verify with `npm run build` (runs `tsc -b && vite build`). It MUST be clean (0 errors)
before you consider the task done.

## Hard rules
1. **Stay in your lane.** Only touch the files named in your task spec. Do not refactor
   unrelated code, rename things, or "improve" other files.
2. **No new dependencies** unless the spec says so. Use what's installed (lucide-react for
   icons, native fetch, React hooks).
3. **TypeScript strict** — no `any` unless unavoidable (and comment why). No `@ts-ignore`.
4. **Match the existing pattern.** Your spec names a reference component — read it first and
   mirror its structure, naming, error handling, and styling approach.

## Styling — use ONLY these design tokens (defined in `src/index.css`)
Backgrounds: `bg-bg-base` `bg-bg-panel` `bg-bg-surface` `bg-bg-card` `bg-bg-overlay` `bg-bg-input`
Borders: `border-border` `border-border-soft` `border-border-hover`
Text: `text-text-primary` `text-text-secondary` `text-text-muted`
Accents: `text-blue` `text-teal` `text-amber` `text-red` (and `bg-…/10`, `bg-…/15` tints)
**Never invent a token** (e.g. `bg-card-2`). Tailwind 4 silently renders nothing for undefined
color utilities — it won't error, it'll just be invisible. Stick to the list above.
Typography is small/dense: titles `text-sm`/`text-base`, body `text-xs`, meta `text-[10px]`.
Cards use the shared `<Card header={…}>` component from `src/components/ui/Card.tsx`.

## Env vars
Client env vars must be prefixed `VITE_` and read via `import.meta.env.VITE_NAME`. They live in
`.env.local` (gitignored — never commit it). If a key is missing, render a graceful fallback
panel with setup instructions (see `FleetMapView.tsx` for the exact pattern), do NOT crash.

## Responsiveness
Mobile-first-friendly: use responsive grids (`grid-cols-1 md:grid-cols-3`). Don't assume desktop
width. The app is being made fully mobile-responsive in a later phase, so don't fight it.

## Git
Local git only. Do NOT push. Do NOT commit unless told. Leave changes in the working tree for
review. (Bare remote exists but Claude Code handles integration.)

## What "done" means
- The spec's acceptance criteria are met
- `npm run build` is clean
- You changed only the files in scope
- You leave a short note listing exactly what files you created/edited and any assumptions
