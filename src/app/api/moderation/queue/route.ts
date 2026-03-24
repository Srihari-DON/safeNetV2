import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, getFallbackPendingQueue } from '@/lib/fallbackData';

export async function GET() {
  if (!canUseDatabase()) {
    return NextResponse.json({ success: true, data: getFallbackPendingQueue() });
  }

  try {
    const items = await db.contentItem.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });

    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: true, data: getFallbackPendingQueue() });
  }
}
