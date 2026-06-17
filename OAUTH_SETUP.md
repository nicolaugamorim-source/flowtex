# OAuth Setup Guide for Flowtex

This guide explains how to configure Google OAuth with Supabase for Flowtex.

## The OAuth Flow

```
User clicks "Login with Google"
    ↓
Frontend calls signInWithOAuth()
    ↓
Redirects to Google Sign-In
    ↓
User authorizes Flowtex
    ↓
Google redirects to: https://xxx.supabase.co/auth/v1/callback
    ↓
Supabase exchanges code, sets session cookies
    ↓
Supabase redirects to: http://localhost:3000/auth/callback
    ↓
Client-side callback exchanges code, creates profile
    ↓
Redirects to /app or /pricing based on subscription
```

## Configuration Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select your project
3. Enable these APIs:
   - Google+ API
   - Gmail API
   - Google Calendar API

4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if needed
6. Choose **Web application** as the application type
7. Add these URIs to **Authorized redirect URIs**:
   ```
   https://xxx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   (Replace `xxx` with your Supabase project URL)

8. Copy the **Client ID** and **Client Secret**

### 2. Supabase Dashboard Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers** → **Google**
4. Enable the provider
5. Paste your Google Client ID and Client Secret
6. Copy the **Callback URL** displayed (should be `https://xxx.supabase.co/auth/v1/callback`)
7. Save

8. Go to **Authentication** → **URL Configuration**
9. Add your redirect URLs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

### 3. Environment Variables

Add to your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Verify Configuration

Test the flow:

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000/login
3. Click "Sign in with Google"
4. Complete Google authorization
5. You should be redirected to `/auth/callback`
6. The callback page will:
   - Exchange the OAuth code
   - Create a profile with 14-day trial
   - Create AI context
   - Save Google tokens
   - Redirect to `/app`

## What Each File Does

### Client-Side Callback (`/app/auth/callback/page.tsx`)
- Handles the OAuth code exchange
- Shows loading state during authentication
- Calls the setup profile API
- Displays errors if authentication fails

### Profile Setup API (`/api/auth/setup-profile`)
- Creates the user profile with trial status
- Creates AI context entry
- Saves Google tokens for Gmail/Calendar access
- Returns redirect URL (usually `/app`)

### OAuth in `lib/auth.ts`
- `signInWithGoogle()` initiates the OAuth flow
- Sets redirect to `/auth/callback`
- Requests Gmail and Calendar scopes

## Troubleshooting

### "No code received"
- Check that the redirect URI in Google Console matches Supabase exactly
- Verify Supabase has the URL Configuration set correctly

### "Session not found"
- Browser cookies may be blocked
- Check browser privacy settings
- Try in an incognito window

### "Profile creation failed"
- Check SUPABASE_SERVICE_ROLE_KEY is set
- Verify profiles table exists in Supabase
- Check server logs for specific errors

### "Gmail/Calendar integration not working"
- Verify the scopes are correct in `signInWithGoogle()`
- Check that Google tokens were saved correctly
- Ensure user authorized the requested scopes during OAuth

## Production Deployment

1. Update `.env` with your production Supabase URL and keys
2. Add your production domain to:
   - Google Cloud Console OAuth URIs
   - Supabase URL Configuration
3. Update `signInWithGoogle()` redirect to use your domain:
   ```typescript
   const redirectUrl = `https://yourdomain.com/auth/callback`;
   ```

## Testing OAuth Without UI

You can test the flow directly:

```bash
# Exchange a code for a session
curl -X POST https://xxx.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_FROM_GOOGLE",
    "redirect_uri": "http://localhost:3000/auth/callback"
  }'
```

## More Information

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Scopes](https://developers.google.com/gmail/api/auth/scopes)
- [Google Calendar API Scopes](https://developers.google.com/calendar/api/guides/auth)
