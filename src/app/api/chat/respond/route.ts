import { NextResponse } from 'next/server';
import { ContentStatus } from '@prisma/client';
import { evaluateContent } from '@/lib/moderationEngine';
import { db } from '@/lib/db';
import { addFallbackContent, canUseDatabase } from '@/lib/fallbackData';
import { requireServiceApiKey } from '@/lib/security';

type ChatDecision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

function buildSafeReply(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return 'Could you share more details?';

  return [
    'Thanks for your message. I can help with that.',
    'SafeNet check: no high-risk policy signal detected.',
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
      const queued = await queueForHumanReview(message, 'chat-escalated');

      return NextResponse.json({
        success: true,
        data: {
          ok: false,
          blocked: true,
          needsRewrite: false,
          action: 'ESCALATED',
          reply: 'This message was blocked for safety review.',
          traceId,
          userId,
          sessionId,
          queuedItemId: queued.id,
          moderation: {
            riskScore: analysis.score,
            riskLevel: analysis.riskLevel,
            confidence: Number(analysis.confidence.toFixed(2)),
            policyTags: analysis.policyTags,
            escalationPriority: analysis.escalationPriority,
            slaMinutes: analysis.slaMinutes,
          },
        },
      });
    }

    if (decision === 'FLAGGED') {
      const queued = await queueForHumanReview(message, 'chat-flagged');

      return NextResponse.json({
        success: true,
        data: {
          ok: false,
          blocked: false,
          needsRewrite: true,
          action: 'FLAGGED',
          reply: 'Your message may violate safety policy. Please rephrase and try again.',
          traceId,
          userId,
          sessionId,
          queuedItemId: queued.id,
          moderation: {
            riskScore: analysis.score,
            riskLevel: analysis.riskLevel,
            confidence: Number(analysis.confidence.toFixed(2)),
            policyTags: analysis.policyTags,
            escalationPriority: analysis.escalationPriority,
            slaMinutes: analysis.slaMinutes,
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
          escalationPriority: analysis.escalationPriority,
          slaMinutes: analysis.slaMinutes,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat moderation failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
