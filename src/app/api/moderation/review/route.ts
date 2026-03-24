import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, submitFallbackDecision } from '@/lib/fallbackData';
import { ContentStatus } from '@prisma/client';
import { sendEscalationWebhook } from '@/lib/webhook';

const allowed = new Set(['SAFE', 'FLAGGED', 'ESCALATED']);
type ReviewDecision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const contentId = String(body?.contentId || '');
  const moderatorId = String(body?.moderatorId || '');
  const decision = String(body?.decision || '');
  const reason = body?.reason ? String(body.reason) : null;

  try {
    if (!contentId || !moderatorId || !decision || !allowed.has(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid moderation payload.' },
        { status: 400 }
      );
    }

    const typedDecision = decision as ReviewDecision;

    if (!canUseDatabase()) {
      const fallback = submitFallbackDecision({
        contentId,
        moderatorId,
        decision: typedDecision,
        reason,
      });

      if (typedDecision === 'FLAGGED' || typedDecision === 'ESCALATED') {
        await sendEscalationWebhook({
          event: typedDecision === 'ESCALATED' ? 'incident.escalated' : 'incident.flagged',
          contentId,
          decision: typedDecision,
          source: 'fallback-moderation-review',
          reason,
          moderatorId,
          occurredAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        data: fallback,
      });
    }

    const [updatedContent, moderationDecision] = await db.$transaction([
      db.contentItem.update({
        where: { id: contentId },
        data: { status: typedDecision as ContentStatus },
      }),
      db.moderationDecision.create({
        data: {
          contentId,
          moderatorId,
          decision: typedDecision as ContentStatus,
          reason,
        },
      }),
    ]);

    if (typedDecision === 'FLAGGED' || typedDecision === 'ESCALATED') {
      await sendEscalationWebhook({
        event: typedDecision === 'ESCALATED' ? 'incident.escalated' : 'incident.flagged',
        contentId,
        decision: typedDecision,
        source: updatedContent.source,
        reason,
        moderatorId,
        occurredAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: updatedContent,
        moderationDecision,
      },
    });
  } catch {
    const fallback = submitFallbackDecision({
      contentId: contentId || 'fallback-content',
      moderatorId: moderatorId || 'fallback-mod-1',
      decision: (decision || 'FLAGGED') as ReviewDecision,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: fallback,
    });
  }
}
