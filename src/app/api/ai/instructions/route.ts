import { NextResponse } from 'next/server';
import { evaluateContent } from '@/lib/moderationEngine';
import { requireServiceApiKey } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const access = requireServiceApiKey(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const content = String(body?.content || '').trim();
    const contentId = String(body?.contentId || `ingest-${Date.now()}`);
    const locale = String(body?.locale || 'en-IN');
    const platform = String(body?.platform || 'unknown');

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'content is required.' },
        { status: 400 }
      );
    }

    const analysis = evaluateContent(content);

    return NextResponse.json({
      success: true,
      data: {
        policyVersion: 'mvp-v1.1',
        mode: access.protectedMode ? 'api-key-protected' : 'demo-open',
        contentId,
        locale,
        platform,
        input: content,
        riskScore: analysis.score,
        riskLevel: analysis.riskLevel,
        confidence: Number(analysis.confidence.toFixed(2)),
        suggestedDecision: analysis.decision,
        escalationPriority: analysis.escalationPriority,
        slaMinutes: analysis.slaMinutes,
        policyTags: analysis.policyTags,
        categories: analysis.categories,
        rewriteSuggestion: analysis.rewriteSuggestion,
        signals: analysis.matchedSignals,
        reasons: analysis.matchedSignals.map((s) => s.reason),
        instruction: analysis.instruction,
        processingMs: analysis.processingMs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instruction generation failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
