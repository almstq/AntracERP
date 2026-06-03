/**
 * UI preferences — theme + Helix density. Applied to <html> and persisted to
 * localStorage (read pre-paint in main.tsx to avoid a flash). Kept out of any
 * component file so React Fast Refresh stays happy.
 */
export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'default' | 'comfortable';

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.setAttribute('data-theme', theme); // Helix shell tokens
  try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Helix density scales the --d multiplier in shell.css. 'default' clears the attribute. */
export function applyDensity(d: Density) {
  if (d === 'default') document.documentElement.removeAttribute('data-density');
  else document.documentElement.setAttribute('data-density', d);
  try { localStorage.setItem('density', d); } catch { /* ignore */ }
}

export function currentDensity(): Density {
  const d = document.documentElement.getAttribute('data-density');
  return d === 'compact' || d === 'comfortable' ? d : 'default';
}
