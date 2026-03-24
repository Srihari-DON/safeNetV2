import { NextResponse } from 'next/server';
import { evaluateContent } from '@/lib/moderationEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = String(body?.content || '').trim();

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
        policyVersion: 'mvp-v1',
        input: content,
        riskScore: analysis.score,
        riskLevel: analysis.riskLevel,
        suggestedDecision: analysis.decision,
        signals: analysis.matchedSignals,
        instruction: analysis.instruction,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instruction generation failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
