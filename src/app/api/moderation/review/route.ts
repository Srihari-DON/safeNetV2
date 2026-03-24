import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, submitFallbackDecision } from '@/lib/fallbackData';

const allowed = new Set(['SAFE', 'FLAGGED', 'ESCALATED']);

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

    if (!canUseDatabase()) {
      const fallback = submitFallbackDecision({
        contentId,
        moderatorId,
        decision: decision as 'SAFE' | 'FLAGGED' | 'ESCALATED',
        reason,
      });

      return NextResponse.json({
        success: true,
        data: fallback,
      });
    }

    const [updatedContent, moderationDecision] = await db.$transaction([
      db.contentItem.update({
        where: { id: contentId },
        data: { status: decision },
      }),
      db.moderationDecision.create({
        data: {
          contentId,
          moderatorId,
          decision,
          reason,
        },
      }),
    ]);

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
      decision: (decision || 'FLAGGED') as 'SAFE' | 'FLAGGED' | 'ESCALATED',
      reason,
    });

    return NextResponse.json({
      success: true,
      data: fallback,
    });
  }
}
