# Database Layer - Complete Implementation

## Overview

This is a complete implementation of the Supabase database integration for Flowtex. All database operations are centralized in `lib/database/` with type-safe functions and consistent error handling.

## What's Included

### Core Files Created

1. **`lib/database/profiles.ts`** - User profile management
2. **`lib/database/integrations.ts`** - OAuth integration tracking
3. **`lib/database/chat.ts`** - Chat message storage and history
4. **`lib/database/ai-context.ts`** - Persistent AI context
5. **`lib/database/waitlist.ts`** - Email waitlist management
6. **`lib/database/index.ts`** - Centralized exports
7. **`hooks/useProfile.ts`** - React hook for profile management

### Modified Files

1. **`app/auth/callback/route.ts`** - OAuth callback now saves to profiles and integrations tables
2. **`app/auth-handler.tsx`** - Auth handler now saves profile and integrations
3. **`app/api/auth/notion/callback/route.ts`** - Notion OAuth callback saves to integrations table
4. **`lib/google-token-refresh.ts`** - Token refresh now updates integrations table
5. **`app/api/chat/route.ts`** - Chat route now saves messages and loads AI context
6. **`app/app/integrations/page.tsx`** - Integrations page loads status from database

## Key Features

### Type Safety
All functions are fully typed with TypeScript interfaces:
```typescript
export interface ProfileData {
  full_name?: string;
  email?: string;
  business_name?: string;
  // ...
}
```

### Error Handling
Consistent error handling across all functions:
```typescript
return { success: boolean; error?: any };
```

### Async/Await
All functions use modern async/await patterns:
```typescript
const result = await createOrUpdateProfile(userId, data);
if (result.success) {
  // Profile saved
}
```

### RLS Compliance
All functions respect Supabase Row Level Security:
- Always pass userId to queries
- Service role used only for OAuth callbacks
- Client-side operations use anon key

## Database Functions by Category

### User Management
- `createOrUpdateProfile()` - Create/update user profile
- `getProfile()` - Fetch user profile
- `updateProfile()` - Update profile fields
- `completeOnboarding()` - Mark onboarding complete
- `markOnboardingComplete()` - Toggle onboarding flag

### Integration Management
- `saveGoogleIntegration()` - Save Google OAuth tokens
- `saveNotionIntegration()` - Save Notion OAuth tokens
- `getIntegrations()` - Get all active integrations
- `getIntegration()` - Get specific integration
- `updateIntegrationToken()` - Update token when refreshing
- `deactivateIntegration()` - Disconnect an integration
- `isIntegrationConnected()` - Check if integration is active

### Chat Management
- `saveChatMessage()` - Save individual messages
- `getChatHistory()` - Get last N messages
- `getFullChatHistory()` - Get all messages
- `getRecentChatMessages()` - Get messages from last N minutes
- `getChatMessagesWithActions()` - Get messages with actions
- `clearChatHistory()` - Clear all chat history
- `getTokenUsageStats()` - Calculate token usage

### AI Context
- `saveAIContext()` - Save business context
- `getAIContext()` - Fetch context
- `updateAIContext()` - Update context fields
- `buildAIContextString()` - Build system prompt context

### Waitlist
- `addToWaitlist()` - Add email to waitlist
- `isOnWaitlist()` - Check if email exists
- `getWaitlistCount()` - Get total count
- `getWaitlistEntries()` - Get all entries
- `removeFromWaitlist()` - Remove email

## Integration Points

### 1. Google OAuth Flow

**Before**: Token saved to `users.google_refresh_token`
**After**: Token saved to `integrations` table with full metadata

```typescript
// In auth callback
await createOrUpdateProfile(userId, {...});
await saveGoogleIntegration(userId, {
  access_token,
  refresh_token,
  scope,
});
```

### 2. Notion OAuth Flow

**Before**: Token saved to `user_integrations.notion_access_token`
**After**: Token saved to `integrations` table with workspace info

```typescript
// In Notion callback
await saveNotionIntegration(userId, {
  access_token,
  notion_workspace_id,
  notion_workspace_name,
});
```

### 3. Token Refresh

**Before**: Token refresh logic scattered
**After**: Centralized in `google-token-refresh.ts`

```typescript
// When token expires
const newToken = await refreshGoogleAccessToken(userId);
await updateIntegrationToken(userId, 'google', {
  access_token: newToken,
  token_expires_at,
});
```

### 4. Chat Route

**Added**:
- Automatic message saving
- AI context loading from database
- Token usage tracking

```typescript
// Save user message
await saveChatMessage(userId, { role: 'user', content });

// Load AI context
const context = await buildAIContextString(userId);

// Save assistant response
await saveChatMessage(userId, {
  role: 'assistant',
  content,
  input_tokens,
  output_tokens,
});
```

### 5. Integrations Page

**Updated**: Now loads status from `integrations` table instead of `user_integrations`

```typescript
const notionIntegration = await getIntegration(userId, 'notion');
const googleIntegration = await getIntegration(userId, 'google');
```

## Usage Examples

### Save Profile After OAuth
```typescript
import { createOrUpdateProfile } from '@/lib/database';

const { data: { user } } = await supabase.auth.getUser();
await createOrUpdateProfile(user.id, {
  full_name: user.user_metadata?.full_name,
  email: user.email,
});
```

### Save Google Integration
```typescript
import { saveGoogleIntegration } from '@/lib/database';

await saveGoogleIntegration(userId, {
  access_token: googleAccessToken,
  refresh_token: googleRefreshToken,
  scope: 'https://www.googleapis.com/auth/gmail.modify',
});
```

### Save Chat Message
```typescript
import { saveChatMessage } from '@/lib/database';

await saveChatMessage(userId, {
  role: 'user',
  content: 'Schedule a meeting tomorrow',
});
```

### Build AI Context
```typescript
import { buildAIContextString } from '@/lib/database';

const context = await buildAIContextString(userId);
const systemPrompt = `You are an AI assistant.${context}`;
```

### Add to Waitlist
```typescript
import { addToWaitlist } from '@/lib/database';

const result = await addToWaitlist({
  email: 'user@example.com',
  source: 'landing_page',
});
```

## Database Schema Requirements

The implementation uses these Supabase tables:

### profiles
- Core user profile data
- Stores business info and preferences
- Linked to auth.users by id

### integrations
- OAuth token storage
- One record per provider per user
- Tracks active status and connection time

### chat_messages
- Full chat history
- Tracks token usage
- Stores action metadata

### ai_context
- User context for AI
- Business brief, industry, goals
- One record per user

### waitlist
- Email list for early access
- Tracks source and signup date
- Prevents duplicates

## Best Practices

1. **Always check userId**
   ```typescript
   if (!userId) throw new Error('userId required');
   ```

2. **Use consistent error handling**
   ```typescript
   return { success: true } or { success: false, error };
   ```

3. **Import from main index**
   ```typescript
   import { getProfile, saveProfile } from '@/lib/database';
   ```

4. **Validate data before saving**
   ```typescript
   if (!email) throw new Error('email required');
   ```

5. **Log important operations**
   ```typescript
   console.log('✅ Profile updated');
   ```

## Testing the Implementation

### 1. Test Profile Creation
```bash
curl -X POST http://localhost:3000/api/test-profile \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user", "fullName":"John Doe"}'
```

### 2. Test Integration Saving
```typescript
const result = await saveGoogleIntegration('user-id', {
  access_token: 'token',
  refresh_token: 'refresh',
});
console.log(result); // { success: true }
```

### 3. Test Chat Saving
```typescript
const result = await saveChatMessage('user-id', {
  role: 'user',
  content: 'Hello',
});
console.log(result); // { success: true, messageId: '...' }
```

## Debugging

### Enable Logging
All functions include detailed logging:
```
✅ Profile created for user: user-123
❌ Error saving chat message: [error details]
```

### Check Supabase
1. Go to Supabase console
2. Select your project
3. View the tables in the SQL editor
4. Check RLS policies are correct

### Monitor Token Refresh
```typescript
// Log all token updates
await updateIntegrationToken(userId, 'google', {...});
// Logs: ✅ google token updated for user: user-123
```

## Future Enhancements

1. **Team Members** - `lib/database/team.ts`
2. **Usage Logs** - `lib/database/usage.ts`
3. **Billing Events** - `lib/database/billing.ts`
4. **Notifications** - `lib/database/notifications.ts`
5. **Activity Log** - `lib/database/activity.ts`

Each can follow the same pattern as existing modules.

## Documentation Files

- **SUPABASE_INTEGRATION.md** - Detailed integration guide
- **IMPLEMENTATION_EXAMPLES.md** - Real-world code examples
- **DATABASE_LAYER_README.md** - This file

## Summary

This implementation provides:

✅ Type-safe database functions
✅ Consistent error handling
✅ Automatic token management
✅ Chat history tracking
✅ AI context persistence
✅ Integration status management
✅ Waitlist functionality
✅ RLS compliance
✅ Comprehensive documentation
✅ Ready-to-use examples

All pieces are in place to start using the database layer immediately!
