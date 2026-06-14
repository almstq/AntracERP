import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { MapPin, Plus, ChevronRight, Search } from 'lucide-react';
import { useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createLocation } from '../../../lib/services/registry';
import type { Site } from '../../../types/org';
import { useToast } from '../../../lib/context/ToastContext';

const TYPES: Site['type'][] = ['project', 'yard', 'office', 'vessel', 'depot', 'hq'];
const COLS = '2fr 0.9fr 0.9fr 24px';

export function LocationRegister() {
  const { data: sites, loading, refresh } = useSiteList();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Site['type']>('project');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) { setErr('Name required'); return; }
    setBusy(true); setErr(null);
    try {
      await createLocation({ name, type, lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined });
      toast('success', 'Location added');
      setName(''); setLat(''); setLng(''); setType('project'); setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  const q = search.trim().toLowerCase();
  const filtered = sites.filter((s) => !q || `${s.name} ${s.type}`.toLowerCase().includes(q));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${sites.length} locations`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Location</Button>
        </div>
      </div>

      {adding && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <InputSelect value={type} onChange={(e) => setType(e.target.value as Site['type'])}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </InputSelect>
            <Input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
            <Input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search locations…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Location</span><span>Type</span><span>Status</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No locations match.' : 'No locations yet. Add your first one.'}</div>
        ) : filtered.map((s) => (
          <Link key={s.id} to={`/wli/locations/${s.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={15} className="text-text-muted" />
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{s.name}</div>
                <div className="tc-desc">{s.location ? `${s.location.lat.toFixed(4)}, ${s.location.lng.toFixed(4)}` : 'no coordinates'}</div>
              </div>
            </div>
            <div className="tc-txt">{s.type}</div>
            <div><span className="badge b-info"><span className="bdot" />{s.status}</span></div>
            <ChevronRight className="tc-chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
