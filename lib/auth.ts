import { supabase } from "./supabase";
import { checkFraudRisk, logFraudAttempt, generateEmailVerificationToken } from "./fraud-detection";
import { activateFreeTrial } from "./access-control";

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  teamName: string
): Promise<{ user: any; error: any }> {
  try {
    // Verifica fraude
    const fraudCheck = await checkFraudRisk(email);

    if (fraudCheck.flagged) {
      return {
        user: null,
        error: {
          message: "Account creation blocked due to security concerns. Please contact support.",
          code: "FRAUD_DETECTED",
        },
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/verify-email`,
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      // Cria profile com verificação
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name: fullName,
          team_name: teamName,
          email,
          email_verified: false,
        });

      if (profileError) throw profileError;

      // Gera token de verificação de email
      await generateEmailVerificationToken(authData.user.id, email);

      // Log da tentativa
      await logFraudAttempt(
        authData.user.id,
        email,
        "signup",
        undefined,
        undefined,
        fraudCheck.riskScore,
        fraudCheck.flagged
      );

      return { user: authData.user, error: null };
    }

    return { user: null, error: "Erro desconhecido" };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: any; error: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

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
