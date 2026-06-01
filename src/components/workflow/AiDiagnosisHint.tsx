import { useState } from 'react';
import { Sparkles, Wrench } from 'lucide-react';
import { Card } from '../ui/Card';
import { isAiConfigured, generateText } from '../../lib/services/ai';
import { useAuth } from '../../lib/hooks/useAuth';

interface Props {
  description: string;
  assetLabel?: string;
}

/**
 * Optional AI assist shown to the mechanic at diagnosis time. Suggests likely
 * causes, first checks, and probable parts. Advisory only — the mechanic still
 * writes and submits the real diagnosis via the TransitionPanel.
 */
export function AiDiagnosisHint({ description, assetLabel }: Props) {
  const { effectiveRole } = useAuth();
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Only mechanics (and super_admin acting as one) see this, and only if AI is configured.
  if (!isAiConfigured()) return null;
  if (!['mechanic', 'super_admin'].includes(effectiveRole)) return null;

  async function run() {
    setBusy(true); setErr(null);
    const prompt = [
      'You are a heavy-equipment maintenance advisor for Well Land Investment, a plant',
      'and marine-logistics company in the Maldives. A machine has a reported fault.',
      `Asset: ${assetLabel || 'unspecified'}.`,
      `Operator's report: "${description}".`,
      '',
      'Give the mechanic a quick pre-diagnosis. Cover, briefly:',
      '1) the 2-3 most likely causes,',
      '2) what to check first,',
      '3) parts/consumables likely needed.',
      'Be concise and practical. Short labelled lines, plain text, no markdown headers.',
    ].join('\n');
    try { setHint(await generateText(prompt, { temperature: 0.3, maxTokens: 350 })); }
    catch (e) { setErr(e instanceof Error ? e.message : 'AI unavailable'); }
    finally { setBusy(false); }
  }

  return (
    <Card header={
      <span className="text-sm font-medium flex items-center gap-2">
        <Wrench size={14} className="text-amber" /> AI Diagnosis Assist
      </span>
    }>
      {!hint && !err && (
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-1.5 text-[11px] text-amber hover:opacity-80 disabled:opacity-40"
        >
          <Sparkles size={12} /> {busy ? 'Analysing fault…' : 'Suggest likely causes & checks'}
        </button>
      )}
      {err && <p className="text-[11px] text-red">{err}</p>}
      {hint && (
        <>
          <p className="text-[11px] text-text-secondary whitespace-pre-line leading-snug">{hint}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[9px] text-text-muted">AI suggestion — verify before recording your diagnosis.</p>
            <button onClick={run} disabled={busy} className="text-[10px] text-amber hover:opacity-80 disabled:opacity-40">
              {busy ? '…' : 'Regenerate'}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
