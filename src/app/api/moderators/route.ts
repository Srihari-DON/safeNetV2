import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const moderators = await db.moderator.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: moderators });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load moderators.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
