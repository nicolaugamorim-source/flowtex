import { supabase } from "./supabase";

interface FraudCheckResult {
  riskScore: number;
  flagged: boolean;
  reason: string | null;
}

export async function checkFraudRisk(
  email: string,
  ipAddress?: string
): Promise<FraudCheckResult> {
  let riskScore = 0;
  let reason: string | null = null;

  try {
    // Verifica se o email já existe com múltiplas contas
    const { data: existingAccounts } = await supabase
      .from("fraud_logs")
      .select("*")
      .eq("email", email)
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24h

    if (existingAccounts && existingAccounts.length > 3) {
      riskScore += 40;
      reason = "Multiple account creation attempts from same email";
    }

    // Verifica múltiplas tentativas do mesmo IP
    if (ipAddress) {
      const { data: ipAttempts } = await supabase
        .from("fraud_logs")
        .select("*")
        .eq("ip_address", ipAddress)
        .gt("created_at", new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()); // Última hora

      if (ipAttempts && ipAttempts.length > 5) {
        riskScore += 30;
        reason = "Multiple account creation from same IP address";
      }
    }

    // Verifica domínios de email suspeitos
    const suspiciousDomains = ["tempmail", "guerrillamail", "10minutemail", "mailinator"];
    const emailDomain = email.split("@")[1];

    if (suspiciousDomains.some(domain => emailDomain.includes(domain))) {
      riskScore += 50;
      reason = "Temporary email address detected";
    }

    // Verifica padrões de email suspeitos
    if (/^[0-9]{5,}@/.test(email)) {
      riskScore += 20;
      reason = "Suspicious email pattern";
    }

    return {
      riskScore,
      flagged: riskScore > 50,
      reason,
    };
  } catch (error) {
    console.error("Fraud check error:", error);
    return {
      riskScore: 0,
      flagged: false,
      reason: null,
    };
  }
}

export async function logFraudAttempt(
  userId: string,
  email: string,
  action: string,
  ipAddress?: string,
  userAgent?: string,
  riskScore?: number,
  flagged?: boolean
) {
  try {
    await supabase.from("fraud_logs").insert({
      user_id: userId,
      email,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      risk_score: riskScore || 0,
      flagged: flagged || false,
    });
  } catch (error) {
    console.error("Error logging fraud attempt:", error);
  }
}

export async function generateEmailVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  try {
    await supabase.from("email_verifications").insert({
      user_id: userId,
      email,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return token;
  } catch (error) {
    console.error("Error generating verification token:", error);
    throw error;
  }
}

export async function verifyEmail(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return false;

    // Marca como verificado
    await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", data.id);

    // Atualiza o perfil do usuário
    await supabase
      .from("profiles")
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq("id", data.user_id);

    return true;
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
}
