import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lightweight check for whether the current request has a valid Supabase session.
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { data: null, error: 'Missing Supabase config' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return NextResponse.json({ data: { session } });
  } catch (error) {
    console.error('[AUTH CHECK] Error:', error);
    return NextResponse.json(
      { data: null, error: 'Auth check failed' },
      { status: 500 }
    );
  }
}
