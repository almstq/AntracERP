/**
 * Gemini Flash — surgical AI helper for Antrac ERP.
 *
 * Free tier (Generative Language API): ~15 RPM / 1,500 req/day. We call it in a
 * handful of advisory, read-only places (ops brief, price-comparison hint,
 * diagnosis assist) — never in a hot loop — so the free limits are never near.
 *
 * No SDK: a single REST call keeps the dependency surface zero. Graceful no-key
 * handling so the app works fine without AI configured.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Free-tier Flash model. If Google retires/renames it, this is the one line to change.
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export function isAiConfigured(): boolean {
  return !!API_KEY;
}

interface GenerateOpts {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/** One-shot text generation. Throws on missing key or API error. */
export async function generateText(prompt: string, opts: GenerateOpts = {}): Promise<string> {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxTokens ?? 600,
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 400) throw new Error('Gemini rejected the request (check API key / model name)');
    if (res.status === 403) throw new Error('Gemini key not authorised yet (new keys can take a few minutes)');
    if (res.status === 429) throw new Error('Gemini rate limit reached — try again shortly');
    throw new Error(`Gemini error (${res.status})`);
  }

  const j = await res.json();
  const parts = j?.candidates?.[0]?.content?.parts as { text?: string }[] | undefined;
  const text = parts?.map((p) => p.text ?? '').join('').trim() ?? '';
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

// ─── sessionStorage cache (surgical — avoid re-calling for the same input) ──────

interface CacheEntry { text: string; sig: string; ts: number }

/**
 * Generate with a cache. Reuses a prior result while it's younger than ttlMs AND
 * the signature (a hash of the meaningful inputs) is unchanged — so the brief
 * regenerates when the underlying numbers move, not on every mount.
 */
export async function cachedGenerate(
  cacheId: string,
  signature: string,
  ttlMs: number,
  prompt: string,
  opts?: GenerateOpts,
): Promise<string> {
  const key = `ai:${cacheId}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const e = JSON.parse(raw) as CacheEntry;
      if (e.sig === signature && Date.now() - e.ts < ttlMs) return e.text;
    }
  } catch { /* ignore cache read errors */ }

  const text = await generateText(prompt, opts);

  try {
    sessionStorage.setItem(key, JSON.stringify({ text, sig: signature, ts: Date.now() } satisfies CacheEntry));
  } catch { /* ignore cache write errors */ }

  return text;
}
