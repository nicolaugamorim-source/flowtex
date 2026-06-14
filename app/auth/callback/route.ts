import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createOrUpdateProfile, saveGoogleIntegration } from "@/lib/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");
  const isIntegrations = requestUrl.searchParams.get("integrations") === "true";

  if (error) {
    console.error("Auth error:", error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    );
  }

  if (code) {
    try {
      // Exchange code for session
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) throw exchangeError;

      const userId = data.user?.id;
      const userEmail = data.user?.email;
      const fullName = data.user?.user_metadata?.full_name || userEmail?.split("@")[0] || "User";

      if (userId) {
        // Create or update user profile
        await createOrUpdateProfile(userId, {
          full_name: fullName,
          email: userEmail,
          email_verified: data.user?.email_confirmed_at ? true : false,
        });

        // Extract Google OAuth data
        const googleIdentity = data.user?.identities?.find((id: any) => id.provider === 'google');
        const googleAccessToken = googleIdentity?.identity_data?.access_token;
        const googleRefreshToken = googleIdentity?.identity_data?.refresh_token;

        // Save Google integration
        if (googleAccessToken) {
          await saveGoogleIntegration(userId, {
            access_token: googleAccessToken,
            refresh_token: googleRefreshToken,
            scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar",
          });

          console.log("✅ Google integration saved");
        }
      }

      // Redirect to appropriate page
      const redirectPath = isIntegrations ? "/app/integrations" : "/";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch (err) {
      console.error("Auth callback error:", err);
      return NextResponse.redirect(new URL("/login?error=auth_error", request.url));
    }
  }

  // Se nenhum código ou erro, redireciona para login
  return NextResponse.redirect(new URL("/login", request.url));
}
