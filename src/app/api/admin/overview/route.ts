import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, getFallbackOverview } from '@/lib/fallbackData';

export async function GET() {
  if (!canUseDatabase()) {
    return NextResponse.json({ success: true, data: getFallbackOverview() });
  }

  try {
    const [moderators, pending, flagged, escalated, reviewed, decisionsWithContent] = await Promise.all([
      db.moderator.count(),
      db.contentItem.count({ where: { status: 'PENDING' } }),
      db.contentItem.count({ where: { status: 'FLAGGED' } }),
      db.contentItem.count({ where: { status: 'ESCALATED' } }),
      db.moderationDecision.count(),
      db.moderationDecision.findMany({
        orderBy: { createdAt: 'desc' },
        take: 300,
        include: {
          content: {
            select: {
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const durations = decisionsWithContent.map((d) => {
      const contentTs = new Date(d.content.createdAt).getTime();
      const decisionTs = new Date(d.createdAt).getTime();
      return Math.max(0, Math.round((decisionTs - contentTs) / 60000));
    });
    const avgReviewMinutes =
      durations.length > 0
        ? Number((durations.reduce((sum, item) => sum + item, 0) / durations.length).toFixed(1))
        : 0;

    const slaBreaches = decisionsWithContent.filter((d) => {
      const contentTs = new Date(d.content.createdAt).getTime();
      const decisionTs = new Date(d.createdAt).getTime();
      const minutes = Math.max(0, Math.round((decisionTs - contentTs) / 60000));
      const sla = d.decision === 'ESCALATED' ? 15 : d.decision === 'FLAGGED' ? 60 : 240;
      return minutes > sla;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        moderators,
        pending,
        flagged,
        escalated,
        reviewed,
        avgReviewMinutes,
        slaBreaches,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: getFallbackOverview() });
  }
}
