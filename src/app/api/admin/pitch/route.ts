import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, getFallbackSnapshot } from '@/lib/fallbackData';

function calculatePitchMetrics(params: {
  moderatorCount: number;
  pending: number;
  flagged: number;
  escalated: number;
  reviewed: number;
  avgReviewMinutes: number;
  slaBreaches: number;
}) {
  const { moderatorCount, pending, flagged, escalated, reviewed, avgReviewMinutes, slaBreaches } = params;
  const activeModerators = Math.max(moderatorCount, 1);

  const avgReviewsPerModPerHour = 28;
  const dailyCapacity = activeModerators * avgReviewsPerModPerHour * 6;
  const queueClearHours = Number((pending / Math.max(1, activeModerators * avgReviewsPerModPerHour)).toFixed(1));
  const highRiskRate = reviewed > 0 ? Number((((flagged + escalated) / reviewed) * 100).toFixed(1)) : 0;
  const escalationRate = reviewed > 0 ? Number(((escalated / reviewed) * 100).toFixed(1)) : 0;

  const estimatedMonthlyOpsCostInr = activeModerators * 40000;
  const estimatedIncidentReductionPct = Math.min(65, Number((20 + highRiskRate * 0.9).toFixed(1)));
  const slaCompliancePct = reviewed > 0 ? Number((Math.max(0, ((reviewed - slaBreaches) / reviewed) * 100)).toFixed(1)) : 100;

  return {
    activeModerators,
    pendingQueue: pending,
    reviewedItems: reviewed,
    highRiskRate,
    escalationRate,
    dailyCapacity,
    queueClearHours,
    avgReviewMinutes,
    slaBreaches,
    slaCompliancePct,
    estimatedMonthlyOpsCostInr,
    estimatedIncidentReductionPct,
    investorNarrative: {
      headline: 'Women-first digital safety stack with API + human review loop',
      proofPoints: [
        `${activeModerators} trained women-safety moderators active`,
        `${dailyCapacity} interactions/day triage capacity for harassment reports`,
        `${highRiskRate}% high-risk abuse capture rate with human escalation`,
        `${slaCompliancePct}% SLA compliance for response-time accountability`,
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
    const avgReviewMinutes = fallback.decisions.length > 0 ? 12 : 0;
    const slaBreaches = 0;

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
          avgReviewMinutes,
          slaBreaches,
        }),
      },
    });
  }

  try {
    const [moderatorCount, pending, flagged, escalated, reviewed, decisionsWithContent] = await Promise.all([
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
        source: 'database',
        ...calculatePitchMetrics({
          moderatorCount,
          pending,
          flagged,
          escalated,
          reviewed,
          avgReviewMinutes,
          slaBreaches,
        }),
      },
    });
  } catch {
    const fallback = getFallbackSnapshot();
    const pending = fallback.queue.filter((q) => q.status === 'PENDING').length;
    const flagged = fallback.queue.filter((q) => q.status === 'FLAGGED').length;
    const escalated = fallback.queue.filter((q) => q.status === 'ESCALATED').length;
    const reviewed = fallback.decisions.length;
    const avgReviewMinutes = fallback.decisions.length > 0 ? 12 : 0;
    const slaBreaches = 0;

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
          avgReviewMinutes,
          slaBreaches,
        }),
      },
    });
  }
}
