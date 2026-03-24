import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [moderators, pending, flagged, escalated, reviewed] = await Promise.all([
      db.moderator.count(),
      db.contentItem.count({ where: { status: 'PENDING' } }),
      db.contentItem.count({ where: { status: 'FLAGGED' } }),
      db.contentItem.count({ where: { status: 'ESCALATED' } }),
      db.moderationDecision.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        moderators,
        pending,
        flagged,
        escalated,
        reviewed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin metrics unavailable.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
