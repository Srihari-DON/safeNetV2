import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const allowed = new Set(['SAFE', 'FLAGGED', 'ESCALATED']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId, moderatorId, decision, reason } = body;

    if (!contentId || !moderatorId || !decision || !allowed.has(String(decision))) {
      return NextResponse.json(
        { success: false, error: 'Invalid moderation payload.' },
        { status: 400 }
      );
    }

    const [updatedContent, moderationDecision] = await db.$transaction([
      db.contentItem.update({
        where: { id: String(contentId) },
        data: { status: decision },
      }),
      db.moderationDecision.create({
        data: {
          contentId: String(contentId),
          moderatorId: String(moderatorId),
          decision,
          reason: reason ? String(reason) : null,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit decision.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
