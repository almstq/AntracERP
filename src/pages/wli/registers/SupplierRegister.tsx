import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { Store, Plus, Search, ChevronRight } from 'lucide-react';
import { useSupplierList } from '../../../lib/hooks/useWorkflowData';
import { createSupplier } from '../../../lib/services/registry';
import { useToast } from '../../../lib/context/ToastContext';

const COLS = '2fr 0.7fr 24px';

export function SupplierRegister() {
  const { data: suppliers, loading, refresh } = useSupplierList();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', country: '', contactEmail: '', categories: '' });
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.name.trim()) { setErr('Name required'); return; }
    setBusy(true); setErr(null);
    try {
      await createSupplier({
        name: form.name, country: form.country || undefined, contactEmail: form.contactEmail || undefined,
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
      });
      toast('success', 'Supplier added');
      setForm({ name: '', country: '', contactEmail: '', categories: '' });
      setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  const q = search.trim().toLowerCase();
  const filtered = suppliers.filter((s) => !q || `${s.name} ${s.country ?? ''} ${s.categories?.join(' ') ?? ''}`.toLowerCase().includes(q));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Supplier Register</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${suppliers.length} suppliers`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Supplier</Button>
        </div>
      </div>

      {adding && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input placeholder="Country" value={form.country} onChange={(e) => set('country', e.target.value)} />
            <Input placeholder="Email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            <Input placeholder="Categories (comma)" value={form.categories} onChange={(e) => set('categories', e.target.value)} />
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Supplier</span><span>Status</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No suppliers match.' : 'No suppliers yet. Add your first one.'}</div>
        ) : filtered.map((s) => (
          <Link key={s.id} to={`/wli/suppliers/${s.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Store size={15} className="text-text-muted" />
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{s.name}</div>
                <div className="tc-desc">{s.country || '—'} · {s.categories?.join(', ') || 'no categories'}</div>
              </div>
            </div>
            <div>
              <span className={`badge ${s.active ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{s.active ? 'active' : 'inactive'}</span>
            </div>
            <ChevronRight className="tc-chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
