import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canUseDatabase, getFallbackEvidence } from '@/lib/fallbackData';
import { requireServiceApiKey } from '@/lib/security';

export async function GET(request: Request) {
  const access = requireServiceApiKey(request);
  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 200);

  if (!canUseDatabase()) {
    return NextResponse.json({
      success: true,
      data: {
        source: 'fallback',
        mode: access.protectedMode ? 'api-key-protected' : 'demo-open',
        exportedAt: new Date().toISOString(),
        incidents: getFallbackEvidence(limit),
      },
    });
  }

  try {
    const decisions = await db.moderationDecision.findMany({
      where: {
        decision: {
          in: ['FLAGGED', 'ESCALATED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        content: {
          select: {
            id: true,
            text: true,
            source: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        source: 'database',
        mode: access.protectedMode ? 'api-key-protected' : 'demo-open',
        exportedAt: new Date().toISOString(),
        incidents: decisions.map((d) => ({
          decisionId: d.id,
          contentId: d.contentId,
          decision: d.decision,
          reason: d.reason,
          decisionAt: d.createdAt,
          contentText: d.content.text,
          source: d.content.source,
          reportedAt: d.content.createdAt,
          moderator: d.moderator,
        })),
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        source: 'fallback',
        mode: access.protectedMode ? 'api-key-protected' : 'demo-open',
        exportedAt: new Date().toISOString(),
        incidents: getFallbackEvidence(limit),
      },
    });
  }
}
