import { useState } from 'react';
import { Sun, Moon, LogOut, Eye } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { ROLE_LABELS } from '../lib/permissions/roles';
import {
  applyTheme, applyDensity, currentDensity, type Density,
} from '../lib/prefs';

const DENSITIES: { value: Density; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'comfortable', label: 'Comfortable' },
];

export function Settings() {
  const { user, actingRole, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'),
  );
  const [density, setDensity] = useState<Density>(() => currentDensity());

  const setThemePref = (t: 'light' | 'dark') => { applyTheme(t); setTheme(t); };
  const setDensityPref = (d: Density) => { applyDensity(d); setDensity(d); };

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : '';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">
            <span>Preferences &amp; account</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="section">
        <div className="section-head"><h2>Appearance</h2></div>
        <div className="card">
          <div className="dcard-b">
            <div className="kv" style={{ gridTemplateColumns: '1fr', gap: 18 }}>
              <div>
                <div className="k">Theme</div>
                <div className="chips" style={{ marginTop: 8 }}>
                  <button className={`chip${theme === 'light' ? ' on' : ''}`} onClick={() => setThemePref('light')}>
                    <Sun size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />Light
                  </button>
                  <button className={`chip${theme === 'dark' ? ' on' : ''}`} onClick={() => setThemePref('dark')}>
                    <Moon size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />Dark
                  </button>
                </div>
              </div>
              <div>
                <div className="k">Density</div>
                <div className="chips" style={{ marginTop: 8 }}>
                  {DENSITIES.map((d) => (
                    <button key={d.value} className={`chip${density === d.value ? ' on' : ''}`} onClick={() => setDensityPref(d.value)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="section">
        <div className="section-head"><h2>Account</h2></div>
        <div className="card">
          <div className="dcard-b">
            <div className="kv">
              <div><div className="k">Name</div><div className="v">{user?.displayName || '—'}</div></div>
              <div><div className="k">Email</div><div className="v">{user?.email || '—'}</div></div>
              <div><div className="k">Role</div><div className="v">{roleLabel}</div></div>
              <div><div className="k">Organisation</div><div className="v">{user?.orgName || '—'}</div></div>
              {user?.siteIds && user.siteIds.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="k">Sites</div>
                  <div className="v">{user.siteIds.join(', ')}</div>
                </div>
              )}
            </div>

            {actingRole && (
              <div className="act-hint" style={{ marginTop: 16 }}>
                <Eye />
                <span>Previewing as <strong>{ROLE_LABELS[actingRole] ?? actingRole}</strong>. Clear it from the sidebar “Act as” selector to return to your own view.</span>
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <button className="btn btn-danger" onClick={() => logout()}><LogOut /> Sign out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
