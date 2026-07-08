import { supabase } from "./supabase";

// Sign-up/sign-in are Google-only (see components/ui/login-signup.tsx) —
// the email/password path that used to live here is gone.

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function signInWithGoogle(requestIntegrations: boolean = false): Promise<{ error: any }> {
  try {
    const scopes = "email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const redirectUrl = `${siteUrl}/api/auth/callback`;

    console.log("SignInWithGoogle called");
    console.log("  - scopes:", scopes);
    console.log("  - redirectTo:", redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        scopes: scopes,
        queryParams: {
          prompt: "consent",
          access_type: "offline",
        },
      },
    });

    console.log("Supabase OAuth response:");
    console.log("  - Error:", error);

    if (error) {
      console.error("OAuth Error Details:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      throw error;
    }

    console.log("OAuth request sent successfully");
    return { error: null };
  } catch (error) {
    console.error("SignInWithGoogle error:", error);
    return { error };
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    return null;
  }
}

export async function upsertProfileFromGoogle() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

    console.log("Upserting profile:", { id: user.id, email: user.email, fullName });

    // Upsert profile (profiles table is created by OAuth callback)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        email: user.email,
      }, {
        onConflict: "id",
        ignoreDuplicates: false
      });

    if (error) throw error;

    console.log("Profile upserted successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error("Error upserting profile:", error);
    return { success: false, error };
  }
}
