import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabase";

export async function protectAppRoute(request: NextRequest) {
  try {
    // Obtém a session do utilizador
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verifica o acesso do utilizador
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, subscription_status, email_verified, subscription_expires_at")
      .eq("id", session.user.id)
      .single();

    // Admin sempre tem acesso
    if (profile?.role === "admin") {
      return NextResponse.next();
    }

    // Email deve estar verificado
    if (!profile?.email_verified) {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    // Verifica subscrição ativa ou trial válido
    if (profile?.subscription_status === "active") {
      const expiresAt = new Date(profile.subscription_expires_at!);
      if (expiresAt > new Date()) {
        return NextResponse.next();
      }
    }

    if (profile?.subscription_status === "trial") {
      const expiresAt = new Date(profile.subscription_expires_at!);
      if (expiresAt > new Date()) {
        return NextResponse.next();
      }
    }

    // Sem acesso, redireciona para pricing
    return NextResponse.redirect(new URL("/pricing", request.url));
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
