import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, getFallbackAudit } from '@/lib/fallbackData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 25), 100);

  if (!canUseDatabase()) {
    return NextResponse.json({
      success: true,
      data: getFallbackAudit(limit),
    });
  }

  try {
    const decisions = await db.moderationDecision.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        moderator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: decisions.map((d) => ({
        id: d.id,
        decision: d.decision,
        reason: d.reason,
        createdAt: d.createdAt,
        contentId: d.contentId,
        moderatorId: d.moderatorId,
        moderatorName: d.moderator.name,
        moderatorEmail: d.moderator.email,
      })),
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: getFallbackAudit(limit),
    });
  }
}
