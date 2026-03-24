import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addFallbackModerator, canUseDatabase } from '@/lib/fallbackData';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').toLowerCase().trim();
  const phone = String(body?.phone || '').trim();
  const language = String(body?.language || '').trim();
  const hoursPerWeek = Number(body?.hoursPerWeek);

  try {
    if (!name || !email || !phone || !language || !hoursPerWeek) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (!canUseDatabase()) {
      const fallback = addFallbackModerator({
        name,
        email,
        phone,
        language,
        hoursPerWeek,
      });

      return NextResponse.json(
        {
          success: true,
          data: fallback,
        },
        { status: 201 }
      );
    }

    const moderator = await db.moderator.create({
      data: {
        name,
        email,
        phone,
        language,
        hoursPerWeek,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, data: moderator }, { status: 201 });
  } catch {
    const fallback = addFallbackModerator({
      name: name || 'New Moderator',
      email: email || 'new@safenet.ai',
      phone: phone || '+91-90000-00000',
      language: language || 'English',
      hoursPerWeek: hoursPerWeek || 20,
    });

    return NextResponse.json(
      {
        success: true,
        data: fallback,
      },
      { status: 201 }
    );
  }
}
