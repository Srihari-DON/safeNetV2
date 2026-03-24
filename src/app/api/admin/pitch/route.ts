import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, getFallbackSnapshot } from '@/lib/fallbackData';

function calculatePitchMetrics(params: {
  moderatorCount: number;
  pending: number;
  flagged: number;
  escalated: number;
  reviewed: number;
}) {
  const { moderatorCount, pending, flagged, escalated, reviewed } = params;
  const activeModerators = Math.max(moderatorCount, 1);

  const avgReviewsPerModPerHour = 28;
  const dailyCapacity = activeModerators * avgReviewsPerModPerHour * 6;
  const queueClearHours = Number((pending / Math.max(1, activeModerators * avgReviewsPerModPerHour)).toFixed(1));
  const highRiskRate = reviewed > 0 ? Number((((flagged + escalated) / reviewed) * 100).toFixed(1)) : 0;
  const escalationRate = reviewed > 0 ? Number(((escalated / reviewed) * 100).toFixed(1)) : 0;

  const estimatedMonthlyOpsCostInr = activeModerators * 40000;
  const estimatedIncidentReductionPct = Math.min(65, Number((20 + highRiskRate * 0.9).toFixed(1)));

  return {
    activeModerators,
    pendingQueue: pending,
    reviewedItems: reviewed,
    highRiskRate,
    escalationRate,
    dailyCapacity,
    queueClearHours,
    estimatedMonthlyOpsCostInr,
    estimatedIncidentReductionPct,
    investorNarrative: {
      headline: 'Hybrid moderation stack with API + human review loop',
      proofPoints: [
        `${activeModerators} trained moderators active`,
        `${dailyCapacity} items/day review capacity`,
        `${highRiskRate}% high-risk capture rate`,
      ],
    },
  };
}

export async function GET() {
  if (!canUseDatabase()) {
    const fallback = getFallbackSnapshot();
    const pending = fallback.queue.filter((q) => q.status === 'PENDING').length;
    const flagged = fallback.queue.filter((q) => q.status === 'FLAGGED').length;
    const escalated = fallback.queue.filter((q) => q.status === 'ESCALATED').length;
    const reviewed = fallback.decisions.length;

    return NextResponse.json({
      success: true,
      data: {
        source: 'fallback',
        ...calculatePitchMetrics({
          moderatorCount: fallback.moderators.length,
          pending,
          flagged,
          escalated,
          reviewed,
        }),
      },
    });
  }

  try {
    const [moderatorCount, pending, flagged, escalated, reviewed] = await Promise.all([
      db.moderator.count(),
      db.contentItem.count({ where: { status: 'PENDING' } }),
      db.contentItem.count({ where: { status: 'FLAGGED' } }),
      db.contentItem.count({ where: { status: 'ESCALATED' } }),
      db.moderationDecision.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        source: 'database',
        ...calculatePitchMetrics({
          moderatorCount,
          pending,
          flagged,
          escalated,
          reviewed,
        }),
      },
    });
  } catch {
    const fallback = getFallbackSnapshot();
    const pending = fallback.queue.filter((q) => q.status === 'PENDING').length;
    const flagged = fallback.queue.filter((q) => q.status === 'FLAGGED').length;
    const escalated = fallback.queue.filter((q) => q.status === 'ESCALATED').length;
    const reviewed = fallback.decisions.length;

    return NextResponse.json({
      success: true,
      data: {
        source: 'fallback',
        ...calculatePitchMetrics({
          moderatorCount: fallback.moderators.length,
          pending,
          flagged,
          escalated,
          reviewed,
        }),
      },
    });
  }
}
