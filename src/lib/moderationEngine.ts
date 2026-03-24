export type Decision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

type Signal = {
  term: string;
  weight: number;
  reason: string;
};

const SIGNALS: Signal[] = [
  { term: 'kill', weight: 30, reason: 'Explicit violence language' },
  { term: 'rape', weight: 40, reason: 'Sexual violence indicator' },
  { term: 'suicide', weight: 30, reason: 'Self-harm indicator' },
  { term: 'nude', weight: 20, reason: 'Sexual exploitation indicator' },
  { term: 'child', weight: 25, reason: 'Potential child safety context' },
  { term: 'dm me', weight: 10, reason: 'Private contact solicitation' },
  { term: 'hate', weight: 18, reason: 'Hostile speech pattern' },
  { term: 'slur', weight: 25, reason: 'Hate term marker' },
  { term: 'address', weight: 12, reason: 'Possible doxxing context' },
  { term: 'minor', weight: 20, reason: 'Minor safety mention' },
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
    'Role: Safety moderation assistant.',
    'Goal: Classify content with strict child-safety and abuse handling.',
    `Input: ${text}`,
    `Risk score: ${score}`,
    `Recommended action: ${decision}`,
    'Rules:',
    '1) Escalate immediately for child exploitation, threats, or doxxing intent.',
    '2) Flag hateful harassment and sexual coercion for human review.',
    '3) Mark safe only when no abuse indicators appear.',
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
