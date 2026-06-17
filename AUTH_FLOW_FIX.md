# OAuth Authentication Flow - Server-Side Fix

## What Changed

The OAuth flow now uses **server-side session exchange** instead of client-side. This ensures cookies are set before the proxy checks for authentication.

### Old Flow (Broken)
```
Google → /auth/callback (client page)
→ exchangeCodeForSession (client-side)
→ Cookie set (after proxy already checked)
❌ Session not found by proxy
```

### New Flow (Fixed)
```
Google → /api/auth/callback (server route)
→ exchangeCodeForSession (server-side)
→ Cookie set immediately
→ Proxy checks for session
✅ Session found
→ Redirect to /onboarding or /pricing
```

## Updated Callback URL

**Old:** `http://localhost:3000/auth/callback`
**New:** `http://localhost:3000/api/auth/callback`

## Configuration Steps

### 1. Update Supabase Dashboard

**Go to:** Authentication → URL Configuration

**Update Redirect URLs:**
```
http://localhost:3000/api/auth/callback
http://localhost:3000/onboarding
http://localhost:3000/pricing
http://localhost:3000/app
```

### 2. Update Google Cloud Console

**Go to:** Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs

**Remove old URL:**
```
http://localhost:3000/auth/callback
```

**Add new URL:**
```
http://localhost:3000/api/auth/callback
```

Also ensure you have the Supabase callback URL:
```
https://xxx.supabase.co/auth/v1/callback
```

(Replace `xxx` with your Supabase project URL)

### 3. Production Deployment

Update to your production domain:
```
https://yourdomain.com/api/auth/callback
https://yourdomain.com/onboarding
https://yourdomain.com/pricing
https://yourdomain.com/app
```

## Files Changed

### Created
- **`/app/api/auth/callback/route.ts`** - Server-side OAuth callback
  - Exchanges code for session
  - Creates profile with trial
  - Creates AI context
  - Saves Google integration
  - Handles onboarding routing

### Updated
- **`lib/auth.ts`** - Changed redirect URL to `/api/auth/callback`

### Deleted
- **`/app/auth/callback/page.tsx`** - No longer needed (server handles it)
- **`/api/auth/setup-profile/route.ts`** - Functionality moved to callback

## OAuth Flow Diagram

```
1. User clicks "Login with Google"
   ↓
2. lib/auth.ts calls signInWithOAuth()
   - redirectTo: http://localhost:3000/api/auth/callback
   ↓
3. Browser redirects to Google
   ↓
4. User authorizes
   ↓
5. Google redirects to Supabase callback URL
   (https://xxx.supabase.co/auth/v1/callback)
   ↓
6. Supabase exchanges code internally
   ↓
7. Supabase redirects to /api/auth/callback?code=xxx
   ↓
8. Server-side route.ts receives request
   - exchangeCodeForSession(code) → ✅ Sets cookies
   ↓
9. Create profile with trial status
   - subscription_status: 'trialing'
   - onboarding_completed: false
   ↓
10. Create AI context
    ↓
11. Save Google integration tokens
    ↓
12. Check onboarding status and redirect:
    - Not completed → /onboarding
    - Completed + trial → /app
    - Completed + no subscription → /pricing
    ↓
13. Proxy checks for session
    - ✅ Session found in cookies
    - Allows request through
```

## Why This Works

1. **Server-side exchange sets cookies immediately**
   - When `/api/auth/callback` runs, cookies are set in the response
   
2. **Proxy sees the cookies**
   - When the redirect happens (to /onboarding, /app, or /pricing)
   - The proxy checks the next request
   - Session is now available in cookies
   
3. **No race conditions**
   - Everything happens server-side in sequence
   - No waiting for browser to process

## Testing

1. Go to http://localhost:3000/login
2. Click "Sign in with Google"
3. Complete Google authorization
4. Should be redirected to /onboarding
5. Proxy should not redirect you back to /login
6. Session should be accessible

## Troubleshooting

### Still seeing "No session" errors
- Check that you updated the redirect URL in Supabase and Google Cloud Console
- Make sure the URL matches exactly (including the `/api` part)
- Clear browser cookies and try again

### Getting redirected to /login
- Check browser console for error messages
- Verify SUPABASE_SERVICE_ROLE_KEY is set in .env.local
- Check server logs for detailed error messages

### Google OAuth not starting
- Verify the redirect URL in lib/auth.ts points to `/api/auth/callback`
- Check that Google Cloud Console has the correct redirect URI
- Ensure the OAuth consent screen is configured

## Summary of Key Changes

| Component | Old | New |
|-----------|-----|-----|
| Callback URL | `/auth/callback` (page) | `/api/auth/callback` (API) |
| Session Exchange | Client-side | **Server-side** |
| Cookie Timing | After proxy check | **Before proxy check** ✅ |
| Profile Creation | Separate API | **In callback route** |
| Flow | Client handles OAuth | **Server handles OAuth** |
