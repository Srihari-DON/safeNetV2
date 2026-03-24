import { NextResponse } from 'next/server';
import { ContentStatus } from '@prisma/client';
import { evaluateContent } from '@/lib/moderationEngine';
import { db } from '@/lib/db';
import { addFallbackContent, canUseDatabase } from '@/lib/fallbackData';
import { requireServiceApiKey } from '@/lib/security';
import { sendEscalationWebhook } from '@/lib/webhook';

type ChatDecision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

function buildSafeReply(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return 'Could you share more details?';

  return [
    'Thanks for your message. I can help with that safely.',
    'SafeNet women-safety check: no high-risk abuse signal detected.',
    `Summary: ${trimmed.slice(0, 180)}`,
  ].join(' ');
}

async function queueForHumanReview(text: string, source: string) {
  if (!canUseDatabase()) {
    return addFallbackContent({
      text,
      source,
      status: 'PENDING',
    });
  }

  return db.contentItem.create({
    data: {
      text,
      source,
      status: 'PENDING' as ContentStatus,
    },
  });
}

export async function POST(request: Request) {
  try {
    const access = requireServiceApiKey(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const message = String(body?.message || '').trim();
    const userId = String(body?.userId || 'anonymous');
    const sessionId = String(body?.sessionId || `session-${Date.now()}`);

    if (!message) {
      return NextResponse.json({ success: false, error: 'message is required.' }, { status: 400 });
    }

    const analysis = evaluateContent(message);
    const decision = analysis.decision as ChatDecision;
    const traceId = `trace-${Date.now()}`;

    if (decision === 'ESCALATED') {
      const queued = await queueForHumanReview(message, 'women-safety-chat-escalated');
      await sendEscalationWebhook({
        event: 'incident.escalated',
        contentId: queued.id,
        decision,
        source: 'women-safety-chat-escalated',
        reason: analysis.matchedSignals.map((s) => s.reason).join('; ') || null,
        riskScore: analysis.score,
        riskLevel: analysis.riskLevel,
        escalationPriority: analysis.escalationPriority,
        policyTags: analysis.policyTags,
        occurredAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          ok: false,
          blocked: true,
          needsRewrite: false,
          action: 'ESCALATED',
          reply: 'This message was blocked due to severe women-safety risk and sent for urgent review.',
          traceId,
          userId,
          sessionId,
          queuedItemId: queued.id,
          moderation: {
            riskScore: analysis.score,
            riskLevel: analysis.riskLevel,
            confidence: Number(analysis.confidence.toFixed(2)),
            policyTags: analysis.policyTags,
            categories: analysis.categories,
            escalationPriority: analysis.escalationPriority,
            slaMinutes: analysis.slaMinutes,
            rewriteSuggestion: analysis.rewriteSuggestion,
          },
        },
      });
    }

    if (decision === 'FLAGGED') {
      const queued = await queueForHumanReview(message, 'women-safety-chat-flagged');
      await sendEscalationWebhook({
        event: 'incident.flagged',
        contentId: queued.id,
        decision,
        source: 'women-safety-chat-flagged',
        reason: analysis.matchedSignals.map((s) => s.reason).join('; ') || null,
        riskScore: analysis.score,
        riskLevel: analysis.riskLevel,
        escalationPriority: analysis.escalationPriority,
        policyTags: analysis.policyTags,
        occurredAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          ok: false,
          blocked: false,
          needsRewrite: true,
          action: 'FLAGGED',
          reply: 'Your message may contain harassment or coercive content. Please rephrase and try again.',
          traceId,
          userId,
          sessionId,
          queuedItemId: queued.id,
          moderation: {
            riskScore: analysis.score,
            riskLevel: analysis.riskLevel,
            confidence: Number(analysis.confidence.toFixed(2)),
            policyTags: analysis.policyTags,
            categories: analysis.categories,
            escalationPriority: analysis.escalationPriority,
            slaMinutes: analysis.slaMinutes,
            rewriteSuggestion: analysis.rewriteSuggestion,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ok: true,
        blocked: false,
        needsRewrite: false,
        action: 'SAFE',
        reply: buildSafeReply(message),
        traceId,
        userId,
        sessionId,
        moderation: {
          riskScore: analysis.score,
          riskLevel: analysis.riskLevel,
          confidence: Number(analysis.confidence.toFixed(2)),
          policyTags: analysis.policyTags,
          categories: analysis.categories,
          escalationPriority: analysis.escalationPriority,
          slaMinutes: analysis.slaMinutes,
          rewriteSuggestion: analysis.rewriteSuggestion,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat moderation failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
