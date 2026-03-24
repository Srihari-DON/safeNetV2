import { NextResponse } from 'next/server';

function extractApiKey(request: Request) {
  const direct = request.headers.get('x-api-key');
  if (direct) return direct.trim();

  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  return '';
}

export function requireServiceApiKey(request: Request) {
  const expected = process.env.SAFENET_API_KEY;

  // Demo mode: if no key configured, allow requests but mark as unprotected.
  if (!expected) {
    return { ok: true, protectedMode: false as const };
  }

  const provided = extractApiKey(request);
  if (provided && provided === expected) {
    return { ok: true, protectedMode: true as const };
  }

  return {
    ok: false,
    protectedMode: true as const,
    response: NextResponse.json(
      {
        success: false,
        error: 'Unauthorized. Provide a valid x-api-key or Bearer token.',
      },
      { status: 401 }
    ),
  };
}
