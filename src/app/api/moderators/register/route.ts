import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, language, hoursPerWeek } = body;

    if (!name || !email || !phone || !language || !hoursPerWeek) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const moderator = await db.moderator.create({
      data: {
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        phone: String(phone).trim(),
        language: String(language).trim(),
        hoursPerWeek: Number(hoursPerWeek),
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, data: moderator }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
