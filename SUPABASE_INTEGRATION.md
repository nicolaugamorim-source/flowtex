# Supabase Integration Guide

This document describes the database layer implementation for Flowtex using Supabase.

## Overview

All database operations are centralized in `lib/database/` with a main export file `lib/database/index.ts`. This ensures consistent error handling, RLS compliance, and easy maintenance.

## Database Layer Files

### 1. Profiles (`lib/database/profiles.ts`)

Manages user profile data including business information, preferences, and onboarding status.

**Key Functions:**
- `createOrUpdateProfile(userId, data)` - Create or update user profile after auth
- `getProfile(userId)` - Fetch user profile
- `updateProfile(userId, data)` - Update specific profile fields
- `completeOnboarding(userId, {business_name, business_brief, business_type})` - Mark onboarding complete
- `markOnboardingComplete(userId)` - Mark only the onboarding flag

**Usage Example:**
```typescript
import { createOrUpdateProfile, getProfile } from '@/lib/database';

// After Google OAuth
await createOrUpdateProfile(userId, {
  full_name: 'John Doe',
  email: 'john@example.com',
  email_verified: true,
});

// Get current profile
const profile = await getProfile(userId);

// Complete onboarding
await completeOnboarding(userId, {
  business_name: 'My Company',
  business_brief: 'We help companies grow',
  business_type: 'B2B SaaS',
});
```

### 2. Integrations (`lib/database/integrations.ts`)

Manages OAuth tokens for Google and Notion integrations with refresh token handling.

**Key Functions:**
- `saveGoogleIntegration(userId, {access_token, refresh_token, token_expires_at, scope})`
- `saveNotionIntegration(userId, {access_token, notion_workspace_id, notion_workspace_name})`
- `getIntegrations(userId)` - Get all active integrations
- `getIntegration(userId, provider)` - Get specific integration
- `updateIntegrationToken(userId, provider, {access_token, token_expires_at})` - Called when refreshing tokens
- `deactivateIntegration(userId, provider)` - Disconnect an integration
- `isIntegrationConnected(userId, provider)` - Check if integration is active

**Usage Example:**
```typescript
import { saveGoogleIntegration, updateIntegrationToken, getIntegration } from '@/lib/database';

// After Google OAuth callback
await saveGoogleIntegration(userId, {
  access_token: googleAccessToken,
  refresh_token: googleRefreshToken,
  scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar',
});

// When refreshing token
await updateIntegrationToken(userId, 'google', {
  access_token: newToken,
  token_expires_at: expiryDate,
});

// Check if Notion is connected
const notionIntegration = await getIntegration(userId, 'notion');
if (notionIntegration) {
  // User has Notion connected
}
```

### 3. Chat Messages (`lib/database/chat.ts`)

Manages chat history, message storage, and token usage tracking.

**Key Functions:**
- `saveChatMessage(userId, {role, content, action_type, action_result, input_tokens, output_tokens})` - Save each message
- `getChatHistory(userId, limit=50)` - Get last N messages for context
- `getFullChatHistory(userId)` - Get all messages for export
- `getRecentChatMessages(userId, minutesBack=120)` - Get messages from last N minutes
- `getChatMessagesWithActions(userId, limit=50)` - Get messages with actions performed
- `clearChatHistory(userId)` - Clear all chat history
- `getTokenUsageStats(userId, period='month')` - Calculate token usage

**Usage Example:**
```typescript
import { saveChatMessage, getChatHistory } from '@/lib/database';

// After user sends message
await saveChatMessage(userId, {
  role: 'user',
  content: 'Schedule a meeting tomorrow',
});

// After Claude responds
await saveChatMessage(userId, {
  role: 'assistant',
  content: 'I scheduled your meeting for tomorrow at 2pm.',
  input_tokens: 150,
  output_tokens: 45,
});

// Load conversation history
const history = await getChatHistory(userId, 50);
const conversation = history.map(msg => ({
  role: msg.role,
  content: msg.content,
}));

// Track token usage for billing
const stats = await getTokenUsageStats(userId, 'month');
console.log(`Used ${stats.input_tokens} input tokens this month`);
```

### 4. AI Context (`lib/database/ai-context.ts`)

Stores persistent AI context about the user for smarter responses.

**Key Functions:**
- `saveAIContext(userId, {business_brief, industry, key_goals, context})` - Save user context
- `getAIContext(userId)` - Fetch user context
- `updateAIContext(userId, data)` - Update specific context fields
- `buildAIContextString(userId)` - Build context string for AI system prompt

**Usage Example:**
```typescript
import { saveAIContext, buildAIContextString } from '@/lib/database';

// After onboarding
await saveAIContext(userId, {
  business_brief: 'We provide financial planning services',
  industry: 'Finance',
  key_goals: 'Help users save money and invest',
});

// Build context for Claude
const contextString = await buildAIContextString(userId);
// Returns: "USER CONTEXT:\nBusiness Brief: We provide financial planning services\nIndustry: Finance\nKey Goals: Help users save money and invest\n"

// Include in system prompt
const systemPrompt = `You are Flowtex, a helpful assistant.${contextString}`;
```

### 5. Waitlist (`lib/database/waitlist.ts`)

Manages email waitlist signups with duplicate checking.

**Key Functions:**
- `addToWaitlist(email, source)` - Add email to waitlist (checks duplicates)
- `isOnWaitlist(email)` - Check if email is on waitlist
- `getWaitlistCount()` - Get total waitlist size
- `getWaitlistEntries(limit=100)` - Get all entries (admin)
- `removeFromWaitlist(email)` - Remove email from waitlist

**Usage Example:**
```typescript
import { addToWaitlist } from '@/lib/database';

// On landing page form submission
const result = await addToWaitlist({
  email: 'user@example.com',
  source: 'landing_page',
  name: 'John Doe',
  company: 'My Company',
});

if (result.success) {
  console.log('Added to waitlist');
}
```

## Integration Points

### 1. OAuth Callback (`app/auth/callback/route.ts`)

**Before:**
```typescript
// Was saving to users table directly
await supabase.from("users").update({...}).eq("id", userId);
```

**After:**
```typescript
import { createOrUpdateProfile, saveGoogleIntegration } from '@/lib/database';

// Create/update profile
await createOrUpdateProfile(userId, {
  full_name: fullName,
  email: userEmail,
});

// Save Google integration
await saveGoogleIntegration(userId, {
  access_token: googleAccessToken,
  refresh_token: googleRefreshToken,
});
```

### 2. Auth Handler (`app/auth-handler.tsx`)

**After Session Setup:**
```typescript
import { createOrUpdateProfile, saveGoogleIntegration } from '@/lib/database';

// Create/update profile and save integrations
const { data: { user } } = await supabase.auth.getUser();

await createOrUpdateProfile(user.id, {
  full_name: user.user_metadata?.full_name,
  email: user.email,
});

await saveGoogleIntegration(user.id, {
  access_token: googleAccessToken,
  refresh_token: googleRefreshToken,
});
```

### 3. Chat Route (`app/api/chat/route.ts`)

**Load Context:**
```typescript
import { getChatHistory, buildAIContextString, saveChatMessage } from '@/lib/database';

// Build AI context
const aiContextString = await buildAIContextString(userId);

// Save user message
await saveChatMessage(userId, {
  role: 'user',
  content: message,
});

// Include in system prompt
const systemPrompt = `You are Flowtex...${aiContextString}...`;
```

**Save Response:**
```typescript
// After Claude responds
await saveChatMessage(userId, {
  role: 'assistant',
  content: responseContent,
  input_tokens: response.usage?.input_tokens,
  output_tokens: response.usage?.output_tokens,
});
```

### 4. Google Token Refresh (`lib/google-token-refresh.ts`)

**Updated to use integrations table:**
```typescript
import { getIntegration, updateIntegrationToken } from '@/lib/database';

// Get refresh token from integrations
const googleIntegration = await getIntegration(userId, 'google');

// Refresh token via Google OAuth
const newAccessToken = await refreshToken(googleIntegration.refresh_token);

// Update in database
await updateIntegrationToken(userId, 'google', {
  access_token: newAccessToken,
  token_expires_at: expiresAt,
});
```

### 5. Notion OAuth Callback

**Updated to use integrations table:**
```typescript
import { saveNotionIntegration } from '@/lib/database';

// After exchanging code for token
await saveNotionIntegration(userId, {
  access_token: tokenData.access_token,
  notion_workspace_id: tokenData.workspace_id,
});
```

### 6. Integrations Page (`app/app/integrations/page.tsx`)

**Load status from database:**
```typescript
import { getIntegration } from '@/lib/database';

const notionIntegration = await getIntegration(userId, 'notion');
setNotionConnected(notionIntegration?.is_active === true);

const googleIntegration = await getIntegration(userId, 'google');
setGoogleConnected(googleIntegration?.is_active === true);
```

## Database Schema

The implementation expects the following Supabase tables (these should already exist):

### profiles
- `id` (UUID, PK) - User ID from auth.users
- `full_name` (text)
- `email` (text)
- `business_name` (text)
- `business_brief` (text)
- `business_type` (text)
- `theme` (text) - 'light' or 'dark'
- `language` (text) - User's preferred language
- `onboarding_completed` (boolean)
- `email_verified` (boolean)
- `plan` (text) - Subscription plan
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### integrations
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `provider` (text) - 'google', 'notion', etc.
- `access_token` (text)
- `refresh_token` (text, nullable)
- `token_expires_at` (timestamp, nullable)
- `scope` (text, nullable)
- `metadata` (jsonb, nullable) - Additional provider data
- `is_active` (boolean)
- `connected_at` (timestamp)
- `updated_at` (timestamp)
- Unique constraint on (user_id, provider)

### chat_messages
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `role` (text) - 'user' or 'assistant'
- `content` (text)
- `action_type` (text, nullable) - Type of action performed
- `action_result` (text, nullable) - Result of action
- `input_tokens` (integer)
- `output_tokens` (integer)
- `created_at` (timestamp)

### ai_context
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users, unique)
- `business_brief` (text)
- `industry` (text)
- `key_goals` (text)
- `context` (text)
- `tone` (text)
- `language` (text)
- `preferences` (jsonb)
- `updated_at` (timestamp)

### waitlist
- `id` (UUID, PK)
- `email` (text, unique)
- `source` (text) - Where signup came from
- `name` (text, nullable)
- `company` (text, nullable)
- `message` (text, nullable)
- `created_at` (timestamp)

## Error Handling

All database functions follow consistent error handling:

```typescript
try {
  // Database operation
  return { success: true };
} catch (error) {
  console.error('❌ Error:', error);
  return { success: false, error };
}
```

## RLS Security

All functions respect Supabase Row Level Security (RLS):
- Never use service role key on client side
- Always pass userId to ensure RLS policies work
- Use service role only for OAuth callbacks and admin operations

## Future Enhancements

1. **Team Members** - Support for team collaboration
2. **Usage Logs** - Track API usage for billing
3. **Billing Events** - Payment audit trail
4. **Notifications** - In-app notification system
5. **Activity Log** - User action tracking

These can be implemented following the same pattern as existing modules.
