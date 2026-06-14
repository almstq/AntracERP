import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/shared/Input';
import { useToast } from '../lib/context/ToastContext';
import { getDbInstance } from '../lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import type { RegistryRecord } from '../lib/services/registryIndex';

export function UniversalRegistry() {
  const [queryVal, setQueryVal] = useState('');
  const [record, setRecord] = useState<RegistryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleSearch() {
    const term = queryVal.trim().toUpperCase();
    if (!term) {
      toast('error', 'Please enter a serial number');
      return;
    }
    setLoading(true);
    setSearched(true);
    setRecord(null);

    const db = getDbInstance();
    if (!db) {
      toast('error', 'Database connection error');
      setLoading(false);
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, 'registryIndex', term));
      if (docSnap.exists()) {
        setRecord(docSnap.data() as RegistryRecord);
      } else {
        toast('error', 'No registry record found for this serial number');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Universal Document Registry</h1>
          <p className="page-sub">Search, verify, and resolve operational document serials</p>
        </div>
      </div>

      <Card className="mb-6 max-w-xl">
        <p className="text-xs font-medium text-text-primary mb-3">Search Serial Number</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g. WLI-TKT-202606-0001"
              value={queryVal}
              onChange={(e) => setQueryVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSearch();
              }}
            />
          </div>
          <Button variant="primary" onClick={handleSearch} disabled={loading}>
            <Search size={14} style={{ marginRight: 6 }} /> Search
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <p className="text-xs text-text-muted">Loading registry details…</p>
        </div>
      )}

      {!loading && searched && record && (
        <Card className="max-w-xl">
          <div className="dcard-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><FileText size={16} /> Registry Metadata</h3>
            <span className="badge b-pos"><span className="bdot" />VERIFIED RECORD</span>
          </div>
          <div className="dcard-b">
            <div className="kv mb-6">
              <div>
                <div className="k">Serial Number</div>
                <div className="v font-bold text-teal mono">{record.id}</div>
              </div>
              <div>
                <div className="k">Prefix / Type</div>
                <div className="v">{record.prefix}</div>
              </div>
              <div>
                <div className="k">SBU Dimension</div>
                <div className="v text-accent font-semibold">
                  {record.sbuId === 'sbu-wli' ? 'WLI' : record.sbuId === 'sbu-mpl' ? 'MPL' : record.sbuId === 'sbu-ems' ? 'EMS' : 'Antrac'}
                </div>
              </div>
              <div>
                <div className="k">Fiscal Period</div>
                <div className="v mono">{record.fiscalPeriod}</div>
              </div>
              <div>
                <div className="k">Status</div>
                <div className="v">
                  <span className="badge b-info">{record.status}</span>
                </div>
              </div>
              <div>
                <div className="k">Target Collection</div>
                <div className="v mono">{record.targetCollection}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Button variant="primary" onClick={() => navigate(record.link)} style={{ flex: 1 }}>
                Open Source Record <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!loading && searched && !record && (
        <div className="tbl" style={{ maxWidth: '36rem' }}>
          <div className="tbl-empty">
            No matching document found in the central registry. Double-check the formatting (e.g. SBU-PREFIX-YYYYMM-XXXX).
          </div>
        </div>
      )}
    </div>
  );
}
