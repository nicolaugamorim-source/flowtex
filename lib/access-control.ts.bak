import { supabase } from "./supabase";

export type UserRole = "admin" | "user" | "premium";
export type SubscriptionStatus = "free" | "trial" | "active" | "cancelled";

export interface UserAccess {
  hasAccess: boolean;
  role: UserRole;
  subscription: SubscriptionStatus;
  emailVerified: boolean;
  reason?: string;
}

export async function checkAppAccess(userId: string): Promise<UserAccess> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, subscription_status, email_verified, subscription_expires_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return {
        hasAccess: false,
        role: "user",
        subscription: "free",
        emailVerified: false,
        reason: "Profile not found",
      };
    }

    // Admin sempre tem acesso
    if (profile.role === "admin") {
      return {
        hasAccess: true,
        role: profile.role,
        subscription: profile.subscription_status,
        emailVerified: profile.email_verified,
      };
    }

    // Email deve estar verificado
    if (!profile.email_verified) {
      return {
        hasAccess: false,
        role: profile.role,
        subscription: profile.subscription_status,
        emailVerified: false,
        reason: "Email not verified",
      };
    }

    // Verifica se é premium ativo
    if (profile.subscription_status === "active") {
      const expiresAt = new Date(profile.subscription_expires_at);
      if (expiresAt > new Date()) {
        return {
          hasAccess: true,
          role: "premium",
          subscription: "active",
          emailVerified: true,
        };
      }
    }

    // Trial é permitido
    if (profile.subscription_status === "trial") {
      const expiresAt = new Date(profile.subscription_expires_at);
      if (expiresAt > new Date()) {
        return {
          hasAccess: true,
          role: "user",
          subscription: "trial",
          emailVerified: true,
        };
      }
    }

    // Caso contrário, sem acesso
    return {
      hasAccess: false,
      role: profile.role,
      subscription: profile.subscription_status,
      emailVerified: profile.email_verified,
      reason: "Subscription expired or inactive",
    };
  } catch (error) {
    console.error("Error checking app access:", error);
    return {
      hasAccess: false,
      role: "user",
      subscription: "free",
      emailVerified: false,
      reason: "Error checking access",
    };
  }
}

export async function grantAdminAccess(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return !error;
  } catch (error) {
    console.error("Error granting admin access:", error);
    return false;
  }
}

export async function activateFreeTrial(userId: string, days: number = 14): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_status: "trial",
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    return !error;
  } catch (error) {
    console.error("Error activating free trial:", error);
    return false;
  }
}

export async function setActiveSubscription(userId: string, daysValid: number = 30): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString(),
        role: "premium",
      })
      .eq("id", userId);

    return !error;
  } catch (error) {
    console.error("Error setting active subscription:", error);
    return false;
  }
}
