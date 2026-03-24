export type Decision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

type Signal = {
  term: string;
  weight: number;
  reason: string;
};

const SIGNALS: Signal[] = [
  { term: 'kill', weight: 30, reason: 'Explicit violence language' },
  { term: 'rape', weight: 45, reason: 'Sexual violence indicator' },
  { term: 'acid attack', weight: 50, reason: 'Gendered violence threat indicator' },
  { term: 'stalk', weight: 28, reason: 'Stalking and persistent harassment indicator' },
  { term: 'leak your photos', weight: 45, reason: 'Image-based abuse or blackmail indicator' },
  { term: 'morph your photo', weight: 40, reason: 'Non-consensual intimate imagery indicator' },
  { term: 'send nudes', weight: 32, reason: 'Sexual coercion indicator' },
  { term: 'dowry', weight: 24, reason: 'Gender-based abuse context indicator' },
  { term: 'slut', weight: 30, reason: 'Misogynistic abuse indicator' },
  { term: 'bitch', weight: 22, reason: 'Gender-targeted abusive language indicator' },
  { term: 'child', weight: 25, reason: 'Potential child safety context' },
  { term: 'minor', weight: 20, reason: 'Minor safety mention' },
  { term: 'address', weight: 14, reason: 'Possible doxxing context' },
  { term: 'dm me', weight: 10, reason: 'Private contact solicitation' },
  { term: 'hate', weight: 18, reason: 'Hostile speech pattern' },
  { term: 'slur', weight: 25, reason: 'Hate term marker' },
];

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
  const escalationPriority = decision === 'ESCALATED' ? 'P1' : decision === 'FLAGGED' ? 'P2' : 'P4';
  const slaMinutes = decision === 'ESCALATED' ? 15 : decision === 'FLAGGED' ? 60 : 240;

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
    escalationPriority,
    slaMinutes,
    matchedSignals: matched,
    instruction,
  };
}
