import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, FALLBACK_OVERVIEW } from '@/lib/fallbackData';

export async function GET() {
  if (!canUseDatabase()) {
    return NextResponse.json({ success: true, data: FALLBACK_OVERVIEW });
  }

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
  } catch {
    return NextResponse.json({ success: true, data: FALLBACK_OVERVIEW });
  }
}
