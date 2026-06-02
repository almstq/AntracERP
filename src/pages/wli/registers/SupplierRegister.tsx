import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { Store, Plus } from 'lucide-react';
import { useSupplierList } from '../../../lib/hooks/useWorkflowData';
import { createSupplier } from '../../../lib/services/registry';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

export function SupplierRegister() {
  const { data: suppliers, loading, refresh } = useSupplierList();
  const [adding, setAdding] = useState(false);
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

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Supplier Register</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${suppliers.length} suppliers`}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Supplier</Button>
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

      <Card>
        <div className="space-y-1">
          {suppliers.map((s) => (
            <Link key={s.id} to={`/wli/suppliers/${s.id}`} className="flex items-center justify-between flex-wrap p-3 rounded-lg hover:bg-bg-surface group">
              <div className="flex items-center gap-3">
                <Store size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs font-medium text-text-primary group-hover:text-blue">{s.name}</p>
                  <p className="text-[10px] text-text-muted">{s.country || '—'} · {s.categories?.join(', ') || 'no categories'}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">{s.active ? 'active' : 'inactive'}</span>
            </Link>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
