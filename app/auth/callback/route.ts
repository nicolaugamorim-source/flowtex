import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error("Auth error:", error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    );
  }

  if (code) {
    // Redireciona para dashboard após sucesso
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Se nenhum código ou erro, redireciona para login
  return NextResponse.redirect(new URL("/login", request.url));
}
