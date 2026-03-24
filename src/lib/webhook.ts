type EscalationWebhookPayload = {
  event: 'incident.escalated' | 'incident.flagged';
  contentId: string;
  decision: 'FLAGGED' | 'ESCALATED';
  source: string;
  reason: string | null;
  moderatorId?: string;
  riskScore?: number;
  riskLevel?: string;
  escalationPriority?: string;
  policyTags?: string[];
  occurredAt: string;
};

export async function sendEscalationWebhook(payload: EscalationWebhookPayload) {
  const endpoint = process.env.SAFENET_ESCALATION_WEBHOOK_URL;
  if (!endpoint) return { sent: false as const, reason: 'no-webhook-configured' as const };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    return {
      sent: response.ok,
      status: response.status,
    };
  } catch {
    return { sent: false as const, reason: 'webhook-delivery-failed' as const };
  }
}
