// This route is no longer used. OAuth flow is initiated from /api/auth/notion/prepare
// and the state is passed directly to Notion.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Use POST /api/auth/notion/prepare instead' }, { status: 400 });
}
