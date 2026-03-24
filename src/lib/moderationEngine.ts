export type Decision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

type Signal = {
  term: string;
  weight: number;
  reason: string;
  category: 'threat' | 'harassment' | 'coercion' | 'privacy' | 'sexual' | 'hate';
};

const SIGNALS: Signal[] = [
  { term: 'kill', weight: 30, reason: 'Explicit violence language', category: 'threat' },
  { term: 'rape', weight: 45, reason: 'Sexual violence indicator', category: 'sexual' },
  { term: 'acid attack', weight: 50, reason: 'Gendered violence threat indicator', category: 'threat' },
  { term: 'stalk', weight: 28, reason: 'Stalking and persistent harassment indicator', category: 'harassment' },
  { term: 'follow you home', weight: 35, reason: 'Physical stalking threat', category: 'threat' },
  { term: 'leak your photos', weight: 45, reason: 'Image-based abuse or blackmail indicator', category: 'privacy' },
  { term: 'morph your photo', weight: 40, reason: 'Non-consensual intimate imagery indicator', category: 'privacy' },
  { term: 'send nudes', weight: 32, reason: 'Sexual coercion indicator', category: 'coercion' },
  { term: 'send pics', weight: 22, reason: 'Sexualized coercive request marker', category: 'coercion' },
  { term: 'dowry', weight: 24, reason: 'Gender-based abuse context indicator', category: 'harassment' },
  { term: 'slut', weight: 30, reason: 'Misogynistic abuse indicator', category: 'hate' },
  { term: 'bitch', weight: 22, reason: 'Gender-targeted abusive language indicator', category: 'hate' },
  { term: 'randi', weight: 30, reason: 'Gendered slur in Hindi/Urdu context', category: 'hate' },
  { term: 'izzat kharab', weight: 26, reason: 'Shaming and coercive honor-threat phrase', category: 'harassment' },
  { term: 'photo viral', weight: 30, reason: 'Threat of non-consensual image circulation', category: 'privacy' },
  { term: 'child', weight: 25, reason: 'Potential child safety context', category: 'threat' },
  { term: 'minor', weight: 20, reason: 'Minor safety mention', category: 'threat' },
  { term: 'address', weight: 14, reason: 'Possible doxxing context', category: 'privacy' },
  { term: 'number de', weight: 16, reason: 'Pressure for private contact details', category: 'privacy' },
  { term: 'dm me', weight: 10, reason: 'Private contact solicitation', category: 'coercion' },
  { term: 'hate', weight: 18, reason: 'Hostile speech pattern', category: 'hate' },
  { term: 'slur', weight: 25, reason: 'Hate term marker', category: 'hate' },
];

const REWRITE_BLOCKLIST = [
  'kill',
  'rape',
  'acid attack',
  'stalk',
  'leak your photos',
  'morph your photo',
  'send nudes',
  'slut',
  'bitch',
  'randi',
];

function suggestRewrite(text: string, matchedTerms: string[]) {
  let safe = text;
  const replaceTerms = matchedTerms.filter((t) => REWRITE_BLOCKLIST.includes(t));

  for (const term of replaceTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    safe = safe.replace(new RegExp(escaped, 'gi'), '[removed]');
  }

  safe = safe.replace(/\s+/g, ' ').trim();
  if (!safe) {
    return 'I want help to report this incident safely.';
  }

  if (safe.length < 14) {
    return `${safe}. Please keep this respectful and non-threatening.`;
  }

  return safe;
}

export function evaluateContent(text: string) {
  const startedAt = Date.now();
  const normalized = text.toLowerCase();
  const matched = SIGNALS.filter((s) => normalized.includes(s.term));
  const score = matched.reduce((sum, s) => sum + s.weight, 0);

  let decision: Decision = 'SAFE';
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (score >= 60) {
    decision = 'ESCALATED';
    riskLevel = 'critical';
  } else if (score >= 25) {
    decision = 'FLAGGED';
    riskLevel = 'high';
  } else if (score >= 10) {
    decision = 'FLAGGED';
    riskLevel = 'medium';
  }

  const policyTags = matched.map((s) =>
    s.reason
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  );

  const confidence = Math.min(0.98, Math.max(0.5, 0.5 + score / 120));
  const escalationPriority = decision === 'ESCALATED' ? 'P1' : decision === 'FLAGGED' ? 'P2' : 'P3';
  const slaMinutes = decision === 'ESCALATED' ? 15 : decision === 'FLAGGED' ? 60 : 240;
  const categories = Array.from(new Set(matched.map((s) => s.category)));
  const rewriteSuggestion = suggestRewrite(text, matched.map((m) => m.term));

  const instruction = [
    'Role: Women-first digital safety moderation assistant.',
    'Goal: Detect and triage online abuse, stalking, coercion, and image-based harm targeting women and girls.',
    `Input: ${text}`,
    `Risk score: ${score}`,
    `Recommended action: ${decision}`,
    'Rules:',
    '1) Escalate immediately for threats of sexual/gendered violence, blackmail, stalking, or doxxing intent.',
    '2) Flag misogynistic harassment, coercive sexual requests, and repeat intimidation for human review.',
    '3) Mark safe only when no abuse indicators appear and context is non-threatening.',
    '4) Return machine-readable JSON with fields: decision, confidence, reasons, policy_tags.',
    `5) Target response SLA: ${slaMinutes} minutes.`,
  ].join('\n');

  return {
    processingMs: Date.now() - startedAt,
    score,
    decision,
    riskLevel,
    confidence,
    policyTags,
    categories,
    escalationPriority,
    slaMinutes,
    rewriteSuggestion,
    matchedSignals: matched,
    instruction,
  };
}
