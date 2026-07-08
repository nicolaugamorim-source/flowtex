// Maps the `?error=` codes the OAuth callback routes already redirect with
// (app/api/auth/callback/route.ts, app/api/auth/notion/callback/route.ts) to
// a message a user can actually act on. The codes were always generated —
// nothing read them, so every failure looked like "nothing happened."
export interface OAuthErrorMessage {
  title: string;
  message: string;
}

export const LOGIN_ERROR_MESSAGES: Record<string, OAuthErrorMessage> = {
  no_code: {
    title: "Sign-in didn't complete",
    message: "Google didn't return an authorization code. Please try signing in again.",
  },
  auth_failed: {
    title: "Sign-in failed",
    message: "Google couldn't verify your account. Please try again.",
  },
  no_user: {
    title: "Sign-in failed",
    message: "We couldn't find an account for that login. Please try again.",
  },
  callback_error: {
    title: "Sign-in failed",
    message: "Something went wrong finishing sign-in. Please try again.",
  },
};

export const INTEGRATION_ERROR_MESSAGES: Record<string, OAuthErrorMessage> = {
  no_code: {
    title: "Connection didn't complete",
    message: "Notion didn't return an authorization code. Please try connecting again.",
  },
  no_state: {
    title: "Connection didn't complete",
    message: "The connection request expired or was incomplete. Please try connecting again.",
  },
  invalid_state: {
    title: "Connection didn't complete",
    message: "This connection link is no longer valid. Please try connecting again.",
  },
  no_user_id: {
    title: "Connection failed",
    message: "We couldn't identify your account. Please sign in again and retry.",
  },
  supabase_not_configured: {
    title: "Connection failed",
    message: "A server configuration issue is blocking this connection. Please try again shortly.",
  },
  notion_not_configured: {
    title: "Connection failed",
    message: "Notion isn't configured correctly on our end. Please try again shortly.",
  },
  token_exchange_failed: {
    title: "Connection failed",
    message: "Notion rejected the connection request. Please try connecting again.",
  },
  no_access_token: {
    title: "Connection failed",
    message: "Notion didn't grant access. Please try connecting again.",
  },
  save_failed: {
    title: "Connection failed",
    message: "The connection succeeded but couldn't be saved. Please try connecting again.",
  },
  callback_error: {
    title: "Connection failed",
    message: "Something went wrong finishing the connection. Please try again.",
  },
};

const FALLBACK: OAuthErrorMessage = {
  title: "Something went wrong",
  message: "Please try again.",
};

export function getOAuthErrorMessage(
  code: string,
  map: Record<string, OAuthErrorMessage>
): OAuthErrorMessage {
  return map[code] ?? FALLBACK;
}
