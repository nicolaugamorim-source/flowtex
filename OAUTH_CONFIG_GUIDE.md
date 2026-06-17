# OAuth Configuration Guide - PKCE Flow

## What Changed

- ✅ Using PKCE flow (more secure, code in POST body not URL)
- ✅ Callback URL uses environment variable `NEXT_PUBLIC_SITE_URL`
- ✅ No tokens in URL hash (hash was implicit flow)
- ✅ Separate configs for development and production

## Environment Variables

### Development (.env.local)
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Production (Vercel Environment Variables)
```
NEXT_PUBLIC_SITE_URL=https://flowtex.xyz
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase Configuration

### 1. Site URL
**Go to:** Authentication → URL Configuration

**Set Site URL to:**
- Development: `http://localhost:3000`
- Production: `https://flowtex.xyz`

(You may need to add both, one will be active at a time)

### 2. Redirect URLs
**Add these Redirect URLs:**

Development:
```
http://localhost:3000/api/auth/callback
http://localhost:3000/onboarding
http://localhost:3000/pricing
http://localhost:3000/app
```

Production:
```
https://flowtex.xyz/api/auth/callback
https://flowtex.xyz/onboarding
https://flowtex.xyz/pricing
https://flowtex.xyz/app
```

### 3. Providers → Google
Verify these are configured:
- Client ID
- Client Secret
- Enabled ✓

## Google Cloud Console

**Go to:** Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs

### Add Both Supabase URLs and Your App URLs

```
https://xxx.supabase.co/auth/v1/callback
http://localhost:3000/api/auth/callback
https://flowtex.xyz/api/auth/callback
```

## What PKCE Flow Does

### Old Flow (Implicit - BROKEN)
```
1. User authorizes
2. Google redirects with token in URL hash:
   https://localhost:3000/api/auth/callback#access_token=xxx&token_type=Bearer
3. Browser processes hash
4. Client-side code reads token from URL
❌ Tokens visible in browser history
❌ Can be logged by analytics
```

### New Flow (PKCE - SECURE)
```
1. App generates code_challenge
2. User authorizes
3. Google redirects with code in URL:
   https://localhost:3000/api/auth/callback?code=xxx
4. Server-side exchanges code for token:
   POST https://xxx.supabase.co/auth/v1/token
   body: { code, code_verifier, ... }
5. Token received in response body (not URL)
✅ Tokens never in browser history
✅ Cannot be logged by analytics
✅ Code is single-use
```

## Vercel Deployment

### 1. Add Environment Variables
**Go to:** Settings → Environment Variables

Add:
```
NEXT_PUBLIC_SITE_URL = https://flowtex.xyz
```

(The other vars should already be there)

### 2. Update Supabase Site URL
Change Supabase authentication Site URL to production domain:
```
https://flowtex.xyz
```

### 3. Update Google Cloud Console
Add production redirect URI:
```
https://flowtex.xyz/api/auth/callback
```

## Testing

### Local Development
1. `npm run dev`
2. Go to http://localhost:3000/login
3. Click "Sign in with Google"
4. After authorization, check URL:
   - ✅ Should be: `http://localhost:3000/api/auth/callback?code=xxx`
   - ❌ Should NOT be: `http://localhost:3000/#access_token=xxx`
5. Should redirect to /onboarding
6. Session should work on /app

### Production
1. Go to https://flowtex.xyz/login
2. Click "Sign in with Google"
3. After authorization, check URL:
   - ✅ Should be: `https://flowtex.xyz/api/auth/callback?code=xxx`
   - Session should work

## Troubleshooting

### "Invalid redirect_uri"
- Check that the redirect URL in Google Cloud Console matches EXACTLY
- Make sure Supabase Site URL is set correctly
- Clear browser cache and try again

### Token still in URL hash
- Clear browser cache
- Make sure Supabase client has `flowType: 'pkce'` configured
- Check that lib/supabase.ts was updated

### Redirecting to flowtex.xyz instead of localhost
- Verify NEXT_PUBLIC_SITE_URL is set in .env.local
- Restart the dev server: `npm run dev`
- Make sure the variable is visible: `console.log(process.env.NEXT_PUBLIC_SITE_URL)`

### Session lost after redirect
- Check that `/api/auth/callback` is in Supabase Redirect URLs
- Verify cookies are being set (browser DevTools → Application → Cookies)
- Check server logs for errors

## Security Checklist

- ✅ Using PKCE flow (code not token in URL)
- ✅ Tokens in POST body, not URL hash
- ✅ Server-side token exchange
- ✅ Separate configs for dev and prod
- ✅ No hardcoded URLs
- ⚠️ Clear browser history after fixing (tokens were exposed)

## Files Changed

- `lib/supabase.ts` - Added PKCE flow config
- `lib/auth.ts` - Using NEXT_PUBLIC_SITE_URL
- `.env.local` - Added NEXT_PUBLIC_SITE_URL

## Environment Variable Summary

| Variable | Dev | Prod | Purpose |
|----------|-----|------|---------|
| `NEXT_PUBLIC_SITE_URL` | localhost:3000 | flowtex.xyz | OAuth redirect base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Same | Same | Supabase API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | Same | Supabase client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same | Same | Server-side operations |
