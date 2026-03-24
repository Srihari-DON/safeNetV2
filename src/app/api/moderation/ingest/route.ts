import { NextResponse } from 'next/server';
import { evaluateContent } from '@/lib/moderationEngine';
import { db } from '@/lib/db';
import { addFallbackContent, canUseDatabase } from '@/lib/fallbackData';
import { requireServiceApiKey } from '@/lib/security';
import { ContentStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const access = requireServiceApiKey(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const text = String(body?.text || '').trim();
    const source = String(body?.source || 'women-safety-api-ingest').trim();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'text is required.' },
        { status: 400 }
      );
    }

    const analysis = evaluateContent(text);
    const initialStatus: ContentStatus = analysis.decision === 'SAFE' ? 'SAFE' : 'PENDING';

    if (!canUseDatabase()) {
      const item = addFallbackContent({ text, source, status: initialStatus });
      return NextResponse.json(
        {
          success: true,
          data: {
            mode: access.protectedMode ? 'api-key-protected' : 'demo-open',
            queuedForReview: initialStatus === 'PENDING',
            item,
            analysis,
          },
        },
        { status: 201 }
      );
    }

    const item = await db.contentItem.create({
      data: {
        text,
        source,
        status: initialStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          mode: access.protectedMode ? 'api-key-protected' : 'demo-open',
          queuedForReview: initialStatus === 'PENDING',
          item,
          analysis,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingest failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
