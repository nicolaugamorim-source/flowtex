import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      if (userId) {
        // Extract Google refresh token from session
        // Supabase stores the OAuth provider data in session.user.identities
        const googleIdentity = data.user?.identities?.find((id: any) => id.provider === 'google');
        const googleRefreshToken = googleIdentity?.identity_data?.refresh_token;

        // Save Google refresh token to database for long-term access
        if (googleRefreshToken) {
          const { error: updateTokenError } = await supabase
            .from("users")
            .update({
              google_refresh_token: googleRefreshToken,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateTokenError) {
            console.error("❌ Error saving refresh token:", updateTokenError);
          } else {
            console.log("✅ Google refresh token saved to database");
          }
        }

        // If coming from integrations page, update user_integrations
        if (isIntegrations) {
          const { error: updateError } = await supabase
            .from("user_integrations")
            .upsert({
              id: userId,
              gmail_connected: true,
              calendar_connected: true,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "id"
            });

          if (updateError) {
            console.error("Error updating integrations:", updateError);
          }
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
