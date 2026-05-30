#!/usr/bin/env node
/**
 * Antrac ERP — Live Status Generator
 *
 * Scans the project filesystem and generates a status.json file
 * that is consumed by live.html and dev-index.html.
 *
 * Run: node scripts/generate-status.js
 * Watch: node scripts/generate-status.js --watch
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { watch } from 'fs';

const PROJECT_ROOT = '/mnt/d/!starq/projects/antrac-erp';
const OUTPUT_FILE = join(PROJECT_ROOT, 'public', 'status.json');
const SRC_DIR = join(PROJECT_ROOT, 'src');

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

function countLines(path) {
  const content = readFile(path);
  return content ? content.split('\n').length : 0;
}

function walkDir(dir, filterFn) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(full, filterFn));
      } else if (filterFn(full)) {
        results.push(full);
      }
    }
  } catch { /* ignore */ }
  return results;
}

function getFileStats(path) {
  try {
    const s = statSync(path);
    return { size: s.size, mtime: s.mtime.toISOString() };
  }
  catch { return { size: 0, mtime: '' }; }
}

// ─── Scanners ───────────────────────────────────────────────────────────────

function scanSourceFiles() {
  const tsxFiles = walkDir(SRC_DIR, f => f.endsWith('.tsx') || f.endsWith('.ts'));
  const cssFiles = walkDir(SRC_DIR, f => f.endsWith('.css'));

  const files = [];
  for (const f of tsxFiles) {
    const rel = relative(PROJECT_ROOT, f);
    const lines = countLines(f);
    const { size, mtime } = getFileStats(f);
    files.push({ path: rel, lines, size, mtime, type: 'source' });
  }
  for (const f of cssFiles) {
    const rel = relative(PROJECT_ROOT, f);
    const lines = countLines(f);
    const { size, mtime } = getFileStats(f);
    files.push({ path: rel, lines, size, mtime, type: 'style' });
  }

  return files;
}

function scanModules() {
  const pagesDir = join(SRC_DIR, 'pages');
  const modules = [];

  const moduleDefs = [
    { name: 'Auth & Routing', files: [
      'src/pages/Login.tsx', 'src/routes/router.tsx', 'src/components/layout/AppShell.tsx',
      'src/components/layout/Sidebar.tsx', 'src/lib/context/AuthContext.tsx',
      'src/lib/context/OrgContext.tsx', 'src/lib/firebase/client.ts', 'src/lib/firebase/auth.ts'
    ]},
    { name: 'Ticket Management', files: [
      'src/pages/wli/WLIDashboard.tsx', 'src/pages/wli/tickets/TicketList.tsx',
      'src/pages/wli/tickets/TicketDetail.tsx', 'src/lib/hooks/useTickets.ts',
      'src/lib/workflows/ticket.ts', 'src/lib/mock-data/tickets.ts'
    ]},
    { name: 'Procurement', files: [
      'src/pages/wli/procurement/PurchaseRequestList.tsx', 'src/pages/wli/procurement/PurchaseRequestDetail.tsx',
      'src/pages/wli/procurement/RFQList.tsx', 'src/pages/wli/procurement/PurchaseOrderList.tsx',
      'src/pages/wli/procurement/PurchaseOrderDetail.tsx'
    ]},
    { name: 'Inventory', files: [] },
    { name: 'CRM', files: [] },
    { name: 'Finance', files: [] },
    { name: 'Holding Dashboard', files: ['src/pages/holding/HoldingDashboard.tsx'] },
    { name: 'MPL Dashboard', files: ['src/pages/mpl/MPLDashboard.tsx'] },
    { name: 'EMS Dashboard', files: ['src/pages/ems/EMSDashboard.tsx'] },
    { name: 'Admin', files: ['src/pages/admin/UserList.tsx'] },
    { name: 'UI Components', files: [
      'src/components/ui/Badge.tsx', 'src/components/ui/Button.tsx',
      'src/components/ui/Card.tsx', 'src/components/ui/Input.tsx',
      'src/components/shared/StatusBadge.tsx', 'src/components/shared/PriorityBadge.tsx',
      'src/components/shared/EmptyState.tsx', 'src/components/shared/LoadingSpinner.tsx',
    ]},
  ];

  for (const mod of moduleDefs) {
    const existing = mod.files.filter(f => existsSync(join(PROJECT_ROOT, f)));
    const stubFiles = mod.files.filter(f => {
      const content = readFile(join(PROJECT_ROOT, f));
      return content && (content.includes('Coming Soon') || content.includes('Not Started') || countLines(join(PROJECT_ROOT, f)) < 15);
    });
    const totalLines = existing.reduce((sum, f) => sum + countLines(join(PROJECT_ROOT, f)), 0);

    let status = 'not_started';
    if (existing.length > 0 && stubFiles.length === existing.length) status = 'stub';
    else if (existing.length > 0 && stubFiles.length > 0) status = 'wip';
    else if (existing.length > 0) status = 'done';

    modules.push({
      name: mod.name,
      fileCount: existing.length,
      stubCount: stubFiles.length,
      totalLines,
      status,
    });
  }

  return modules;
}

function checkDevServer() {
  try {
    execSync('ss -tlnp | grep -q ":3000"', { timeout: 3000 });
    return { running: true, port: 3000 };
  } catch {
    return { running: false, port: null };
  }
}

function checkTypeScript() {
  try {
    execSync('cd /mnt/d/!starq/projects/antrac-erp && npx tsc --noEmit 2>&1', { timeout: 15000 });
    return { clean: true, errors: 0, warnings: 0 };
  } catch (e) {
    const output = e.stdout?.toString() || e.message || '';
    const errors = (output.match(/error TS/g) || []).length;
    return { clean: false, errors, warnings: 0 };
  }
}

function getRecentChanges() {
  try {
    const output = execSync(
      'find src -name "*.tsx" -o -name "*.ts" -o -name "*.css" | xargs ls -lt --time-style=full-iso 2>/dev/null | head -10',
      { timeout: 5000, cwd: PROJECT_ROOT }
    ).toString();

    return output.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        file: parts[parts.length - 1],
        date: parts[parts.length - 4] || '',
        time: parts[parts.length - 3] || '',
      };
    }).slice(0, 8);
  } catch { return []; }
}

// ─── Main Generator ─────────────────────────────────────────────────────────

function generate() {
  const sourceFiles = scanSourceFiles();
  const modules = scanModules();
  const devServer = checkDevServer();
  const tsStatus = checkTypeScript();
  const recentChanges = getRecentChanges();

  const totalLines = sourceFiles.reduce((s, f) => s + f.lines, 0);
  const moduleProgress = modules.filter(m => m.status === 'done').length;
  const moduleTotal = modules.length;

  const status = {
    generatedAt: new Date().toISOString(),
    devServer,
    typescript: tsStatus,
    project: {
      totalFiles: sourceFiles.length,
      totalLines,
      moduleProgress,
      moduleTotal,
      progressPercent: Math.round((moduleProgress / moduleTotal) * 100),
    },
    modules,
    recentChanges,
    files: sourceFiles.sort((a, b) => b.mtime.localeCompare(a.mtime)).slice(0, 20),
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(status, null, 2));
  console.log(`[status] Generated at ${status.generatedAt} — ${moduleProgress}/${moduleTotal} modules, ${totalLines} lines`);
  return status;
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const watchMode = process.argv.includes('--watch');

if (watchMode) {
  console.log('[status] Watching for changes... (Ctrl+C to stop)');
  generate();
  watch(SRC_DIR, { recursive: true }, () => {
    try { generate(); } catch (e) { console.error('[status]', e.message); }
  });
  // Also re-scan every 30s for server/ts changes
  setInterval(() => {
    try { generate(); } catch (e) { console.error('[status]', e.message); }
  }, 30000);
} else {
  generate();
}
