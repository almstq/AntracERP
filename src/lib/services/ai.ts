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

// gemini-2.0-flash is the current free-tier model; served on the v1beta endpoint.
// (gemini-1.5-flash on /v1 returns 404 "model not found for API version".)
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export function isAiConfigured(): boolean {
  return !!API_KEY;
}

/** 
 * Returns a high-quality mock response for demo purposes when AI is not configured.
 */
function getMockResponse(prompt: string): string {
  if (prompt.includes('operations advisor')) {
    return 'Operations are currently stable. Land fleet is at 85% capacity; consider scheduling maintenance for Excavator EX-04. One critical ticket at Site A requires immediate supervisor attention.';
  }
  if (prompt.includes('maintenance advisor')) {
    return 'Probable cause: Hydraulic seal failure or contaminated fluid. Check for leaks around the main cylinder. Parts needed: Seal kit #442, 20L hydraulic fluid.';
  }
  return 'AI Advisor is ready to assist. Please configure your API key for live operational insights.';
}

interface GenerateOpts {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

// Transient statuses worth retrying: 429 (rate limit) and 503 (overloaded).
// 4xx other than 429 are caller errors and fail fast.
const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_RETRIES = 3;

/** Exponential backoff with jitter: ~600ms, ~1.2s, ~2.4s (+ up to 250ms). */
function backoffDelayMs(attempt: number): number {
  return 600 * 2 ** attempt + Math.floor(Math.random() * 250);
}

/** Promise-based delay that rejects early if the abort signal fires. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/**
 * One-shot text generation. Returns mock data if no key, retries transient
 * 429/503 with exponential backoff (max 3), or throws on a terminal API error.
 */
export async function generateText(prompt: string, opts: GenerateOpts = {}): Promise<string> {
  if (!API_KEY) {
    // Graceful fallback to demo mode
    await new Promise(r => setTimeout(r, 800)); // Simulate latency
    return getMockResponse(prompt);
  }

  let lastErr = new Error('Gemini request failed');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: opts.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.4,
          maxOutputTokens: opts.maxTokens ?? 600,
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const msg = errorBody?.error?.message || `Gemini error (${res.status})`;
      // Retry transient overload/rate-limit; everything else fails fast.
      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        lastErr = new Error(msg);
        await delay(backoffDelayMs(attempt), opts.signal);
        continue;
      }
      throw new Error(msg);
    }

    const j = await res.json();
    const candidate = j?.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      return 'I cannot provide advice on this specific query due to safety filters. Please rephrase.';
    }

    const parts = candidate?.content?.parts as { text?: string }[] | undefined;
    const text = parts?.map((p) => p.text ?? '').join('').trim() ?? '';

    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  }

  // Exhausted retries on a transient error.
  throw lastErr;
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
