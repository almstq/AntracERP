/**
 * Centralized Gemini prompt builders for Antrac ERP.
 *
 * Kept apart from ai.ts (transport/retry) and the UI components so prompt
 * wording lives in one place and can be tuned without touching component logic.
 * Pure string builders — no side effects, no imports.
 *
 * NOTE: the leading phrases ("operations advisor", "maintenance advisor") are
 * load-bearing — ai.ts/getMockResponse keys its demo fallback off them. Keep
 * those substrings intact if you reword.
 */

export interface OpsBriefInput {
  openTickets: number;
  criticalTickets: number;
  approvals: number;
  landReady: number;
  landTotal: number;
  vesselReady: number;
  vesselTotal: number;
  sites: number;
}

/** Operations advisor brief shown on the dashboard (AiBrief). */
export function opsBriefPrompt(i: OpsBriefInput): string {
  return [
    'You are the operations advisor for Well Land Investment (WLI), a heavy-equipment',
    'rental and marine-logistics company in the Maldives, reporting to the General Manager.',
    'Write a concise operational brief: 2-3 short sentences, max ~45 words. Be direct and',
    'action-oriented; flag the most important risk first. Plain prose only — no markdown,',
    'headings, or bullet points. If everything is calm, say so briefly.',
    '',
    "Today's snapshot:",
    `- ${i.openTickets} open issue tickets (${i.criticalTickets} critical)`,
    `- ${i.approvals} item(s) awaiting GM approval`,
    `- Land fleet ${i.landReady}/${i.landTotal} operational`,
    `- Vessel fleet ${i.vesselReady}/${i.vesselTotal} operational`,
    `- ${i.sites} active sites`,
  ].join('\n');
}

export interface DiagnosisHintInput {
  description: string;
  assetLabel?: string;
}

/** Maintenance pre-diagnosis hint shown to the mechanic (AiDiagnosisHint). */
export function diagnosisHintPrompt(i: DiagnosisHintInput): string {
  return [
    'You are a heavy-equipment maintenance advisor for Well Land Investment, a plant',
    'and marine-logistics company in the Maldives. A machine has a reported fault.',
    `Asset: ${i.assetLabel || 'unspecified'}.`,
    `Operator's report: "${i.description}".`,
    '',
    'Give the mechanic a quick pre-diagnosis. Cover, briefly:',
    '1) the 2-3 most likely causes,',
    '2) what to check first,',
    '3) parts/consumables likely needed.',
    'Be concise and practical. Short labelled lines, plain text, no markdown headers.',
  ].join('\n');
}
