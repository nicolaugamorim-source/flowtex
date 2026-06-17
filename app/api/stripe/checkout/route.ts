import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PLANS = {
  solo: {
    name: 'Solo',
    price: 2999, // in cents
    interval: 'month',
  },
  team: {
    name: 'Team',
    price: 4999, // in cents
    interval: 'month',
  },
};

export async function GET(request: NextRequest) {
  try {
    const plan = request.nextUrl.searchParams.get('plan');

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get current user from session cookie
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.error('❌ [STRIPE CHECKOUT] No session found');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = session.user;

    console.log('💳 [STRIPE CHECKOUT] Starting checkout for user:', user.id);
    console.log('📦 [STRIPE CHECKOUT] Plan:', plan);

    // TODO: Integrate with Stripe to create checkout session
    // For now, redirect to a success page as placeholder

    // Update profile with selected plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ [STRIPE CHECKOUT] Failed to update profile:', updateError);
    }

    console.log('✅ [STRIPE CHECKOUT] Plan saved to profile');

    // For now, redirect to /app (in production, this would be Stripe checkout)
    return NextResponse.redirect(new URL('/app', request.url));
  } catch (error) {
    console.error('❌ [STRIPE CHECKOUT] Error:', error);
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
