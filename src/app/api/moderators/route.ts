import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, FALLBACK_MODERATORS } from '@/lib/fallbackData';

export async function GET() {
  if (!canUseDatabase()) {
    return NextResponse.json({ success: true, data: FALLBACK_MODERATORS });
  }

  try {
    const moderators = await db.moderator.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: moderators });
  } catch {
    return NextResponse.json({ success: true, data: FALLBACK_MODERATORS });
  }
}
