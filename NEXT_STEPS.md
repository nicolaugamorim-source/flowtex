# Next Steps - Manual Configuration & Testing

This document outlines what needs to be done after the database layer implementation to complete the integration.

## Immediate Manual Steps

### 1. Verify Supabase Tables Exist

Go to your Supabase console and verify these tables exist with the correct schema:

- [ ] `profiles` table
  - id (uuid)
  - full_name (text)
  - email (text)
  - business_name (text)
  - business_brief (text)
  - business_type (text)
  - theme (text)
  - language (text)
  - onboarding_completed (boolean)
  - email_verified (boolean)
  - plan (text)
  - stripe_customer_id (text)
  - stripe_subscription_id (text)
  - created_at (timestamp)
  - updated_at (timestamp)

- [ ] `integrations` table
  - id (uuid)
  - user_id (uuid) - FK to auth.users
  - provider (text) - 'google', 'notion', etc.
  - access_token (text)
  - refresh_token (text, nullable)
  - token_expires_at (timestamp, nullable)
  - scope (text, nullable)
  - metadata (jsonb, nullable)
  - is_active (boolean)
  - connected_at (timestamp)
  - updated_at (timestamp)
  - Unique constraint on (user_id, provider)

- [ ] `chat_messages` table
  - id (uuid)
  - user_id (uuid) - FK to auth.users
  - role (text) - 'user' or 'assistant'
  - content (text)
  - action_type (text, nullable)
  - action_result (text, nullable)
  - input_tokens (integer)
  - output_tokens (integer)
  - created_at (timestamp)

- [ ] `ai_context` table
  - id (uuid)
  - user_id (uuid) - FK to auth.users, unique
  - business_brief (text)
  - industry (text)
  - key_goals (text)
  - context (text)
  - tone (text)
  - language (text)
  - preferences (jsonb)
  - updated_at (timestamp)

- [ ] `waitlist` table
  - id (uuid)
  - email (text, unique)
  - source (text)
  - name (text, nullable)
  - company (text, nullable)
  - message (text, nullable)
  - created_at (timestamp)

### 2. Set Up RLS Policies

Verify Row Level Security policies are configured:

- [ ] `profiles` - Users can only read/update their own profile
  ```sql
  CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
  
  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
  ```

- [ ] `integrations` - Users can only access their own integrations
  ```sql
  CREATE POLICY "Users can view own integrations" ON integrations
    FOR SELECT USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can manage own integrations" ON integrations
    FOR ALL USING (auth.uid() = user_id);
  ```

- [ ] `chat_messages` - Users can only access their own messages
  ```sql
  CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  ```

- [ ] `ai_context` - Users can only access their own context
  ```sql
  CREATE POLICY "Users can manage own context" ON ai_context
    FOR ALL USING (auth.uid() = user_id);
  ```

- [ ] `waitlist` - Public read, anyone can insert
  ```sql
  CREATE POLICY "Anyone can view waitlist" ON waitlist
    FOR SELECT USING (true);
  
  CREATE POLICY "Anyone can join waitlist" ON waitlist
    FOR INSERT WITH CHECK (true);
  ```

### 3. Test Database Functions

Test each function to ensure it works:

```bash
cd path/to/flowtex

# Test TypeScript compilation
npx tsc --noEmit

# Run tests (if you have them)
npm test -- database

# Start dev server
npm run dev
```

### 4. Test OAuth Flows

- [ ] Test Google OAuth
  1. Click "Sign in with Google" on login page
  2. Complete OAuth flow
  3. Check Supabase `profiles` table has new user
  4. Check Supabase `integrations` table has Google entry

- [ ] Test Notion OAuth
  1. Go to `/app/integrations`
  2. Click "Connect Notion"
  3. Complete Notion OAuth
  4. Check Supabase `integrations` table has Notion entry

### 5. Test Chat Functionality

- [ ] Send a message in chat
  1. Go to `/app` (chat page)
  2. Send a message
  3. Check Supabase `chat_messages` table has new message
  4. Check assistant response was saved

- [ ] Test AI context
  1. Complete onboarding with business info
  2. Check Supabase `ai_context` table has user's context
  3. Send chat message
  4. Verify context is included in AI response

### 6. Test Waitlist

- [ ] Add email to waitlist
  1. Go to landing page
  2. Submit email to waitlist
  3. Check Supabase `waitlist` table has entry
  4. Try submitting same email again - should show "already on waitlist"

### 7. Monitor Production

Once deployed:

- [ ] Set up monitoring for token refresh failures
- [ ] Monitor database query performance
- [ ] Track RLS policy issues
- [ ] Set up alerts for critical errors

## Integration Testing Checklist

### Google Integration
- [ ] Token saves correctly
- [ ] Token refresh works
- [ ] Gmail access works
- [ ] Calendar access works
- [ ] Old token expires gracefully

### Notion Integration
- [ ] Token saves correctly
- [ ] Workspace info is stored
- [ ] Notion API calls work
- [ ] Can create/read pages

### Chat System
- [ ] User messages saved
- [ ] Assistant responses saved
- [ ] Token counts tracked
- [ ] Context loaded correctly
- [ ] Chat history loads on page refresh

### User Profiles
- [ ] Created after OAuth
- [ ] Updated when user changes settings
- [ ] Onboarding completion tracked
- [ ] Language preference saved

## Code Changes You May Need to Make

### 1. Add to App Layout

If not already done, add profile loading to your app layout:

```typescript
// app/app/layout.tsx
import { useProfile } from '@/hooks/useProfile';

export function AppLayout({ children }) {
  const { profile, loading } = useProfile();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* App header with profile info */}
      <header>{profile?.full_name}</header>
      {children}
    </div>
  );
}
```

### 2. Error Boundaries

Add error handling to critical components:

```typescript
export function IntegrationsPage() {
  // ... existing code ...

  if (error) {
    return (
      <div className="error">
        <p>Error loading integrations</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return /* ... */;
}
```

### 3. Loading States

Ensure all data-fetching components have loading states:

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

if (loading) return <Skeleton />;
```

## Debugging Tips

### Check Supabase Logs
1. Go to Supabase console
2. Click "Logs" in sidebar
3. Check for RLS policy errors
4. Look for query performance issues

### Enable Debug Logging
```typescript
// In your components
console.log('Debug:', {
  userId,
  profile,
  integrations,
  messages,
});
```

### Monitor Token Refresh
Check `google-token-refresh.ts` logs:
```
✅ Successfully refreshed Google access token
❌ Token refresh failed: [error]
```

### Verify Database State
```sql
-- Check profiles
SELECT id, full_name, email FROM profiles LIMIT 10;

-- Check integrations
SELECT user_id, provider, is_active FROM integrations;

-- Check chat messages
SELECT COUNT(*), user_id FROM chat_messages GROUP BY user_id;

-- Check AI context
SELECT user_id, business_brief FROM ai_context;

-- Check waitlist
SELECT COUNT(*) FROM waitlist;
```

## Deployment Checklist

Before deploying to production:

- [ ] All RLS policies configured
- [ ] Environment variables set in Vercel
- [ ] Supabase connection tested
- [ ] OAuth credentials verified
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Database backups configured

### Environment Variables Needed

Make sure these are set in your deployment:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=
```

## Performance Optimization

### Database Indexes
Consider adding indexes for common queries:

```sql
-- Profile lookups by user_id
CREATE INDEX idx_profiles_user_id ON profiles(id);

-- Integration lookups
CREATE INDEX idx_integrations_user_provider ON integrations(user_id, provider);

-- Chat message lookups
CREATE INDEX idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);

-- AI context lookups
CREATE INDEX idx_ai_context_user ON ai_context(user_id);

-- Waitlist lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
```

### Caching Strategy

Consider caching frequently accessed data:

```typescript
// Cache profile for 5 minutes
const cachedProfile = sessionStorage.getItem(`profile-${userId}`);
if (cachedProfile && !isStale()) {
  return JSON.parse(cachedProfile);
}

const profile = await getProfile(userId);
sessionStorage.setItem(`profile-${userId}`, JSON.stringify(profile));
```

## Monitoring & Analytics

Set up monitoring for:

- [ ] Token refresh success/failure rate
- [ ] API response times
- [ ] Database query performance
- [ ] Error rates by feature
- [ ] User signup/onboarding flow
- [ ] Integration connection success rate

## Support & Troubleshooting

If something doesn't work:

1. Check Supabase console logs
2. Review IMPLEMENTATION_EXAMPLES.md for patterns
3. Check typescript errors: `npx tsc --noEmit`
4. Review QUICK_REFERENCE.md for common operations
5. Check RLS policies are correctly configured

## Timeline

Estimated time for each step:

- Verify tables exist: **15 min**
- Set up RLS policies: **20 min**
- Test database functions: **30 min**
- Test OAuth flows: **45 min**
- Test chat: **30 min**
- Test waitlist: **15 min**
- Code changes: **30 min**
- Final testing: **60 min**

**Total: ~4-5 hours**

## Final Verification

Once everything is set up:

```typescript
// Test script to verify everything works
async function testIntegration() {
  const userId = 'test-user-id';

  // Test profiles
  const profile = await getProfile(userId);
  console.assert(profile, 'Profile test failed');

  // Test integrations
  const integrations = await getIntegrations(userId);
  console.assert(Array.isArray(integrations), 'Integrations test failed');

  // Test chat
  const messages = await getChatHistory(userId);
  console.assert(Array.isArray(messages), 'Chat test failed');

  // Test AI context
  const context = await getAIContext(userId);
  console.assert(context, 'AI context test failed');

  console.log('✅ All tests passed!');
}
```

## Summary

The database layer implementation is complete. What remains is:

1. **Manual Setup** - Configure tables and RLS in Supabase (1 hour)
2. **Testing** - Run through test scenarios (2-3 hours)
3. **Debugging** - Fix any issues that come up (1 hour)
4. **Deployment** - Deploy to production (30 mins)

**Total time to full integration: 4-5 hours**

Good luck! 🚀
