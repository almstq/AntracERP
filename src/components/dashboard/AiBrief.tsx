import { useEffect, useState, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Wind, CheckCircle2 } from 'lucide-react';
import { isAiConfigured, cachedGenerate } from '../../lib/services/ai';

interface Props {
  openTickets: number;
  criticalTickets: number;
  approvals: number;
  landReady: number; landTotal: number;
  vesselReady: number; vesselTotal: number;
  sites: number;
  variant?: 'overlay' | 'card';
}

const ONE_HOUR = 60 * 60 * 1000;

export function AiBrief(props: Props) {
  const { openTickets, criticalTickets, approvals, landReady, landTotal, vesselReady, vesselTotal, sites, variant = 'overlay' } = props;
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signature = JSON.stringify(props);

  const run = useCallback(async (force = false) => {
    setLoading(true); setErr(null);
    const prompt = [
      'You are the operations advisor for Well Land Investment (WLI), a heavy-equipment',
      'rental and marine-logistics company in the Maldives, reporting to the General Manager.',
      'Write a concise operational brief: 2-3 short sentences, max ~45 words. Be direct and',
      'action-oriented; flag the most important risk first. Plain prose only — no markdown,',
      'headings, or bullet points. If everything is calm, say so briefly.',
      '',
      'Today\'s snapshot:',
      `- ${openTickets} open issue tickets (${criticalTickets} critical)`,
      `- ${approvals} item(s) awaiting GM approval`,
      `- Land fleet ${landReady}/${landTotal} operational`,
      `- Vessel fleet ${vesselReady}/${vesselTotal} operational`,
      `- ${sites} active sites`,
    ].join('\n');

    try {
      const sig = force ? `${signature}:${Date.now()}` : signature;
      const text = await cachedGenerate('ops-brief', sig, ONE_HOUR, prompt, { temperature: 0.4, maxTokens: 200 });
      setBrief(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI brief unavailable');
    } finally {
      setLoading(false);
    }
  }, [signature, openTickets, criticalTickets, approvals, landReady, landTotal, vesselReady, vesselTotal, sites]);

  const firedSig = useRef<string>('');
  useEffect(() => {
    const t = setTimeout(() => {
      if (firedSig.current === signature) return;
      firedSig.current = signature;
      run(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [signature, run]);

  const configured = isAiConfigured();

  if (variant === 'card') {
    const ready = landReady + vesselReady;
    const total = landTotal + vesselTotal;
    return (
      <div className="ai-card">
        <div className="ai-top">
          <div className="ai-badge"><Sparkles /></div>
          <div style={{ flex: 1 }}>
            <h3>Morning Brief</h3>
            <div className="ai-meta">{configured ? 'Antrac Copilot' : 'Demo · add Gemini key for live'}</div>
          </div>
          <button className="icon-btn" onClick={() => run(true)} disabled={loading} title="Regenerate" style={{ width: 30, height: 30 }}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="ai-body">
          {loading && !brief
            ? 'Generating operational brief…'
            : err
              ? <span style={{ color: 'var(--warning)' }}>{err}</span>
              : brief || `Fleet is operational — ${ready} of ${total} assets ready across ${sites} sites.`}
        </div>
        <div className="ai-foot">
          {criticalTickets > 0 && <span className="ai-pill crit"><AlertTriangle /> {criticalTickets} critical</span>}
          {approvals > 0 && <span className="ai-pill warn"><Wind /> {approvals} awaiting GM</span>}
          <span className="ai-pill"><CheckCircle2 /> {ready}/{total} operational</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-[5] max-w-[320px] rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl p-5 select-none">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 text-amber">
          <Sparkles size={14} />
          <span className="text-[11px] font-bold tracking-wider uppercase">Nexus AI Advisor</span>
          {!configured && <span className="text-[8px] px-1 py-0.5 rounded bg-amber/20 font-medium">DEMO</span>}
        </div>
        <button
          onClick={() => run(true)}
          disabled={loading}
          className="text-white/40 hover:text-white/90 disabled:opacity-40 transition-colors"
          title="Regenerate brief"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !brief ? (
        <div className="space-y-1.5 mt-2">
          <div className="h-2 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-2 w-4/5 bg-white/10 rounded animate-pulse" />
        </div>
      ) : err ? (
        <p className="text-[10px] text-amber/90 mt-1 leading-relaxed italic">{err}</p>
      ) : brief ? (
        <p className="text-[11px] text-white/90 leading-relaxed font-medium">{brief}</p>
      ) : (
        <p className="text-[10px] text-white/50 italic">Generating operational brief…</p>
      )}

      {!configured && !loading && (
        <p className="text-[9px] text-white/30 mt-2 border-t border-white/5 pt-1.5">
          Live AI requires a Gemini API key.
        </p>
      )}
    </div>
  );
  }
