import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, currentTheme, type Theme } from '../../lib/prefs';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-6 py-3 w-full text-xs text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  );
}
