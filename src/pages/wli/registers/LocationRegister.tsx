import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { MapPin, Plus } from 'lucide-react';
import { useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createLocation } from '../../../lib/services/registry';
import type { Site } from '../../../types/org';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

const TYPES: Site['type'][] = ['project', 'yard', 'office', 'vessel', 'depot', 'hq'];

export function LocationRegister() {
  const { data: sites, loading, refresh } = useSiteList();
  const [adding, setAdding] = useState(false);
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

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Locations</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${sites.length} locations`}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Location</Button>
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

      <Card>
        <div className="space-y-1">
          {sites.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs font-medium text-text-primary">{s.name}</p>
                  <p className="text-[10px] text-text-muted">
                    {s.type} · {s.location ? `${s.location.lat.toFixed(4)}, ${s.location.lng.toFixed(4)}` : 'no coordinates'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">{s.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
