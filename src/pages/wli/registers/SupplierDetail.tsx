import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Pencil, Package, ChevronRight } from 'lucide-react';
import { useSupplierList, usePOList } from '../../../lib/hooks/useWorkflowData';
import { updateSupplier } from '../../../lib/services/registry';
import { purchaseOrderWorkflow as poWf } from '../../../lib/workflow/definitions';
import type { POStatus } from '../../../types/workflow-entities';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

function poBadge(status: string): string {
  if (status === 'po_closed' || status === 'items_collected' || status === 'wli_finance_confirmed') return 'b-pos';
  if (status === 'payment_completed' || status === 'director_approved') return 'b-accent';
  if (status === 'raised' || status === 'supplier_confirmed') return 'b-info';
  return 'b-warn';
}

export function SupplierDetail() {
  const { id } = useParams();
  const { data: suppliers, loading, refresh } = useSupplierList();
  const { data: pos } = usePOList();
  const { toast } = useToast();

  const supplier = suppliers.find((s) => s.id === id);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', contactEmail: '', contactPhone: '', categories: '', active: 'true', tin: '', address: '' });
  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit() {
    if (!supplier) return;
    setForm({
      name: supplier.name, country: supplier.country ?? '', contactEmail: supplier.contactEmail ?? '',
      contactPhone: supplier.contactPhone ?? '', categories: supplier.categories?.join(', ') ?? '',
      active: String(supplier.active),
      tin: supplier.tin ?? '', address: supplier.address ?? '',
    });
    setEditing(true);
  }
  async function save() {
    if (!supplier) return;
    setBusy(true);
    try {
      await updateSupplier(supplier.id, {
        name: form.name, country: form.country || undefined, contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
        active: form.active === 'true',
        tin: form.tin || undefined,
        address: form.address || undefined,
      });
      toast('success', 'Supplier updated');
      setEditing(false);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!supplier) return <div className="page"><p className="empty-note">Supplier not found.</p></div>;

  const orders = pos.filter((p) => p.supplierName === supplier.name);
  const totalAwarded = orders.reduce((s, p) => s + (p.total ?? 0), 0);

  return (
    <div className="page">
      <Link to="/wli/suppliers" className="dback"><ArrowLeft /> Supplier Register</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">SUPPLIER</span>
          <h1 className="dtitle">{supplier.name}</h1>
          <div className="dhead-badges">
            <span className={`badge ${supplier.active ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{supplier.active ? 'active' : 'inactive'}</span>
            {supplier.country && <span className="tc-sub">{supplier.country}</span>}
            {supplier.categories?.slice(0, 3).map((c) => <span key={c} className="badge b-info">{c}</span>)}
          </div>
        </div>
        <div className="dhead-actions">
          {!editing && <button className="btn btn-ghost" onClick={startEdit}><Pencil /> Edit</button>}
        </div>
      </div>

      <div className="detail">
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><Store /> Supplier Profile</h3></div>
            <div className="dcard-b">
              {editing ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="kv">
                    <div><div className="k">Name</div><Input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Company name" /></div>
                    <div><div className="k">TIN</div><Input value={form.tin} onChange={(e) => setF('tin', e.target.value)} placeholder="TIN Number" /></div>
                    <div><div className="k">Country</div><Input value={form.country} onChange={(e) => setF('country', e.target.value)} placeholder="Country" /></div>
                    <div><div className="k">Email</div><Input value={form.contactEmail} onChange={(e) => setF('contactEmail', e.target.value)} placeholder="Email" /></div>
                    <div><div className="k">Phone</div><Input value={form.contactPhone} onChange={(e) => setF('contactPhone', e.target.value)} placeholder="Phone" /></div>
                    <div><div className="k">Status</div>
                      <InputSelect value={form.active} onChange={(e) => setF('active', e.target.value)}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </InputSelect>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}><div className="k">Registered Address</div><Input value={form.address} onChange={(e) => setF('address', e.target.value)} placeholder="Registered Address" /></div>
                    <div style={{ gridColumn: '1 / -1' }}><div className="k">Categories (comma-separated)</div><Input value={form.categories} onChange={(e) => setF('categories', e.target.value)} placeholder="spares, hydraulics, marine" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="kv">
                  <div><div className="k">TIN</div><div className="v"><span className="mono">{supplier.tin || '—'}</span></div></div>
                  <div><div className="k">Country</div><div className="v">{supplier.country || '—'}</div></div>
                  <div><div className="k">Email</div><div className="v">{supplier.contactEmail || '—'}</div></div>
                  <div><div className="k">Phone</div><div className="v">{supplier.contactPhone || '—'}</div></div>
                  <div><div className="k">Status</div><div className="v" style={{ textTransform: 'capitalize' }}>{supplier.active ? 'active' : 'inactive'}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><div className="k">Registered Address</div><div className="v">{supplier.address || '—'}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><div className="k">Categories</div><div className="v">{supplier.categories?.join(', ') || '—'}</div></div>
                </div>
              )}
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3><Package /> Order History</h3><span className="tc-sub">{orders.length} PO{orders.length !== 1 ? 's' : ''} · MVR {totalAwarded.toLocaleString()}</span></div>
            <div className="dcard-b">
              {orders.length === 0
                ? <p className="empty-note" style={{ padding: 0 }}>No purchase orders awarded to this supplier yet.</p>
                : orders.map((p) => (
                  <Link className="linkrow" key={p.id} to={`/wli/procurement/orders/${p.id}`}>
                    <span className="lr-ic tint-pos"><Package /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="lr-id">{p.displayId}</div>
                      <div className="lr-sub">{p.currency} {p.total?.toLocaleString()} · {p.lineItems?.length ?? 0} item(s)</div>
                    </div>
                    <span className={`badge ${poBadge(p.status)}`}><span className="bdot" />{poWf.statusLabels[p.status as POStatus] ?? p.status}</span>
                    <ChevronRight className="lr-chev" />
                  </Link>
                ))}
            </div>
          </div>
        </div>

        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3>Summary</h3></div>
            <div className="dcard-b">
              <div className="lineitem"><span className="li-t">Purchase orders</span><span className="li-v">{orders.length}</span></div>
              <div className="lineitem"><span className="li-t">Total awarded</span><span className="li-v">MVR {totalAwarded.toLocaleString()}</span></div>
              <div className="lineitem"><span className="li-t">Categories</span><span className="li-v">{supplier.categories?.length ?? 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
