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

export async function signInWithGoogle(): Promise<{ error: any }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
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
