import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const items = await db.contentItem.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load queue.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
