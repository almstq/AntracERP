import { useEffect, useState, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { isAiConfigured, cachedGenerate } from '../../lib/services/ai';

interface Props {
  openTickets: number;
  criticalTickets: number;
  approvals: number;
  landReady: number; landTotal: number;
  vesselReady: number; vesselTotal: number;
  sites: number;
}

const ONE_HOUR = 60 * 60 * 1000;

export function AiBrief(props: Props) {
  const { openTickets, criticalTickets, approvals, landReady, landTotal, vesselReady, vesselTotal, sites } = props;
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signature = JSON.stringify(props);

  const run = useCallback(async (force = false) => {
    if (!isAiConfigured()) return;
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
      // force = bypass cache by using a per-call signature
      const sig = force ? `${signature}:${Date.now()}` : signature;
      const text = await cachedGenerate('ops-brief', sig, ONE_HOUR, prompt, { temperature: 0.4, maxTokens: 200 });
      setBrief(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI brief unavailable');
    } finally {
      setLoading(false);
    }
  }, [signature, openTickets, criticalTickets, approvals, landReady, landTotal, vesselReady, vesselTotal, sites]);

  // Fire ONCE after the dashboard data settles. The dashboard's data hooks resolve
  // at different times, so the signature changes a few times on load — debounce so we
  // make a single Gemini call (not one per re-render), and never re-fire the same snapshot.
  const firedSig = useRef<string>('');
  useEffect(() => {
    if (!isAiConfigured()) return;
    const t = setTimeout(() => {
      if (firedSig.current === signature) return;
      firedSig.current = signature;
      run(false);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="absolute top-3 left-3 z-[1] max-w-[300px] rounded-lg bg-black/70 backdrop-blur px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-amber">
          <Sparkles size={13} />
          <span className="text-[11px] font-semibold">NEXUS AI ADVISOR</span>
        </div>
        {isAiConfigured() && (
          <button
            onClick={() => run(true)}
            disabled={loading}
            className="text-white/50 hover:text-white/90 disabled:opacity-40"
            title="Regenerate brief"
            aria-label="Regenerate brief"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!isAiConfigured() ? (
        <p className="text-[10px] text-white/60 mt-1">
          AI advisor not configured — add <code>VITE_GEMINI_API_KEY</code> to <code>.env.local</code>.
        </p>
      ) : loading && !brief ? (
        <p className="text-[10px] text-white/70 mt-1">Generating brief…</p>
      ) : err ? (
        <p className="text-[10px] text-amber/90 mt-1">{err}</p>
      ) : brief ? (
        <p className="text-[11px] text-white/85 mt-1 leading-snug">{brief}</p>
      ) : (
        <p className="text-[10px] text-white/60 mt-1">Daily operational brief</p>
      )}
    </div>
  );
}
