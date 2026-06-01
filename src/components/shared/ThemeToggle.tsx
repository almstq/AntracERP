import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

function current(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
  try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current);

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-5 py-3 w-full text-xs text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  );
}
