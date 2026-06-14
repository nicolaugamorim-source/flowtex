# Database Layer - Quick Reference

## Import Statements

```typescript
// Import all database functions
import {
  // Profiles
  createOrUpdateProfile,
  getProfile,
  updateProfile,
  completeOnboarding,
  // Integrations
  saveGoogleIntegration,
  saveNotionIntegration,
  getIntegration,
  getIntegrations,
  updateIntegrationToken,
  deactivateIntegration,
  isIntegrationConnected,
  // Chat
  saveChatMessage,
  getChatHistory,
  getTokenUsageStats,
  // AI Context
  saveAIContext,
  getAIContext,
  buildAIContextString,
  // Waitlist
  addToWaitlist,
  isOnWaitlist,
} from '@/lib/database';
```

## Most Common Operations

### 1. After Google OAuth
```typescript
await createOrUpdateProfile(userId, {
  full_name: 'John Doe',
  email: 'john@example.com',
});

await saveGoogleIntegration(userId, {
  access_token: token,
  refresh_token: refreshToken,
  scope: 'https://www.googleapis.com/auth/gmail.modify',
});
```

### 2. Save Chat Message
```typescript
// User message
await saveChatMessage(userId, {
  role: 'user',
  content: 'Schedule a meeting',
});

// Assistant response
await saveChatMessage(userId, {
  role: 'assistant',
  content: 'I scheduled your meeting',
  input_tokens: 150,
  output_tokens: 45,
});
```

### 3. Build AI Context
```typescript
const contextString = await buildAIContextString(userId);
// Use in system prompt: `You are an AI...${contextString}`
```

### 4. Check Integration Status
```typescript
const isConnected = await isIntegrationConnected(userId, 'google');
if (isConnected) {
  // User has Google connected
}
```

### 5. Refresh Token
```typescript
await updateIntegrationToken(userId, 'google', {
  access_token: newToken,
  token_expires_at: expiryDate,
});
```

### 6. Add to Waitlist
```typescript
await addToWaitlist({
  email: 'user@example.com',
  source: 'landing_page',
});
```

### 7. Complete Onboarding
```typescript
await completeOnboarding(userId, {
  business_name: 'My Company',
  business_brief: 'We help companies grow',
  business_type: 'SaaS',
});

await saveAIContext(userId, {
  business_brief: 'We help companies grow',
  industry: 'SaaS',
});
```

## Error Handling Pattern

```typescript
const result = await createOrUpdateProfile(userId, data);

if (result.success) {
  console.log('✅ Profile saved');
} else {
  console.error('❌ Error:', result.error);
  // Show error to user
}
```

## Files to Remember

| File | Purpose |
|------|---------|
| `lib/database/profiles.ts` | User profile management |
| `lib/database/integrations.ts` | OAuth token storage |
| `lib/database/chat.ts` | Message history |
| `lib/database/ai-context.ts` | AI context |
| `lib/database/waitlist.ts` | Email waitlist |
| `lib/database/index.ts` | Main exports |
| `hooks/useProfile.ts` | React hook for profile |

## Modified Files

| File | Change |
|------|--------|
| `app/auth/callback/route.ts` | Now uses `createOrUpdateProfile`, `saveGoogleIntegration` |
| `app/auth-handler.tsx` | Now uses database functions instead of direct inserts |
| `app/api/auth/notion/callback/route.ts` | Now uses `saveNotionIntegration` |
| `lib/google-token-refresh.ts` | Now uses `updateIntegrationToken` |
| `app/api/chat/route.ts` | Now uses `saveChatMessage`, `buildAIContextString` |
| `app/app/integrations/page.tsx` | Now loads from `getIntegration` |

## Step-by-Step Integration Checklist

- [x] Create profiles.ts
- [x] Create integrations.ts
- [x] Create chat.ts
- [x] Create ai-context.ts
- [x] Create waitlist.ts
- [x] Create index.ts (exports)
- [x] Create useProfile.ts hook
- [x] Update auth callback
- [x] Update auth handler
- [x] Update Notion callback
- [x] Update token refresh
- [x] Update chat route
- [x] Update integrations page
- [x] Create documentation

## Testing Commands

```bash
# Test creating a profile
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","action":"createProfile","name":"John"}'

# Test saving integration
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","action":"saveIntegration","provider":"google"}'
```

## Common Patterns

### Load Profile on Component Mount
```typescript
const [profile, setProfile] = useState(null);

useEffect(() => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    const prof = await getProfile(user.id);
    setProfile(prof);
  }
}, []);
```

### Update Profile
```typescript
const result = await updateProfile(userId, {
  theme: 'dark',
  language: 'pt',
});

if (result.success) {
  // Refresh UI
}
```

### Save Message Pair
```typescript
// User message
await saveChatMessage(userId, { role: 'user', content });

// Process with Claude
const response = await claude.messages.create({...});

// Assistant response
await saveChatMessage(userId, {
  role: 'assistant',
  content: response.content[0].text,
  input_tokens: response.usage?.input_tokens,
  output_tokens: response.usage?.output_tokens,
});
```

## Database Tables Overview

```
profiles
├── id (user_id from auth)
├── full_name
├── email
├── business_name
├── business_brief
├── theme
├── language
└── onboarding_completed

integrations
├── id
├── user_id
├── provider (google, notion, etc)
├── access_token
├── refresh_token
├── token_expires_at
├── is_active
└── updated_at

chat_messages
├── id
├── user_id
├── role (user/assistant)
├── content
├── input_tokens
├── output_tokens
└── created_at

ai_context
├── id
├── user_id
├── business_brief
├── industry
├── key_goals
├── language
└── preferences

waitlist
├── id
├── email (unique)
├── source
├── name
└── created_at
```

## RLS Rules

All functions respect RLS (Row Level Security):
- Use anon key on client side
- Use service_role only for OAuth callbacks
- Always pass userId to ensure RLS works
- Never store tokens in client-side code

## Return Types

All functions return either:
```typescript
{ success: true }
{ success: false, error: any }
{ data: T }  // For fetch functions
```

## Logging

Functions use consistent logging:
```
✅ Operation successful
❌ Error with details
📝 Info messages
🔄 In-progress operations
```

## Next Steps

1. Test each function with sample data
2. Monitor Supabase logs for errors
3. Set up RLS policies if not already done
4. Add error boundaries to UI components
5. Implement retry logic for failed requests

---

For detailed documentation, see:
- `SUPABASE_INTEGRATION.md` - Full guide
- `IMPLEMENTATION_EXAMPLES.md` - Real examples
- `DATABASE_LAYER_README.md` - Complete overview
