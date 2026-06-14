# Implementation Examples

This document shows practical examples of how to use the Supabase database layer in different parts of the app.

## Example 1: Onboarding Flow

### Save Business Information

When user completes onboarding, save their business context:

```typescript
// app/onboarding/step-business-info.tsx
import { completeOnboarding, saveAIContext } from '@/lib/database';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function OnboardingBusinessInfo() {
  const [businessName, setBusinessName] = useState('');
  const [businessBrief, setBusinessBrief] = useState('');
  const [businessType, setBusinessType] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Complete onboarding and save business info to profiles
      await completeOnboarding(user.id, {
        business_name: businessName,
        business_brief: businessBrief,
        business_type: businessType,
      });

      // Save AI context for smarter responses
      await saveAIContext(user.id, {
        business_brief: businessBrief,
        industry: businessType,
      });

      // Redirect to app
      router.push('/app');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Business name"
      />
      <textarea
        value={businessBrief}
        onChange={(e) => setBusinessBrief(e.target.value)}
        placeholder="Brief description"
      />
      <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
        <option>Select industry</option>
        <option>Finance</option>
        <option>SaaS</option>
        <option>Consulting</option>
      </select>
      <button type="submit">Complete Onboarding</button>
    </form>
  );
}
```

## Example 2: Waitlist Form

### Add Email to Waitlist

On landing page or pricing page:

```typescript
// app/components/waitlist-form.tsx
import { addToWaitlist } from '@/lib/database';
import { useState } from 'react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const result = await addToWaitlist({
        email,
        name,
        source: 'landing_page',
      });

      if (result.success) {
        setStatus('success');
        setEmail('');
        setName('');
        // Show success message
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Adding...' : 'Get Early Access'}
      </button>
      {status === 'success' && <p>✅ Added to waitlist!</p>}
      {status === 'error' && <p>❌ Error adding to waitlist</p>}
    </form>
  );
}
```

## Example 3: Profile Settings Page

### Display and Update Profile

```typescript
// app/app/settings/page.tsx
import { getProfile, updateProfile } from '@/lib/database';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const prof = await getProfile(user.id);
        if (prof) {
          setProfile(prof);
          setFullName(prof.full_name || '');
          setLanguage(prof.language || 'en');
          setTheme(prof.theme || 'light');
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    await updateProfile(user.id, {
      full_name: fullName,
      language,
      theme,
    });

    // Show success message
    alert('Settings saved!');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div>
          <label>Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        <div>
          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
}
```

## Example 4: Chat with AI Context

### Load and Use AI Context

```typescript
// app/app/chat/page.tsx
import { getProfile, buildAIContextString } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [userContext, setUserContext] = useState('');

  useEffect(() => {
    const loadContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const profile = await getProfile(user.id);
        const context = await buildAIContextString(user.id);
        
        setUserContext(context);
        // Use context in chat requests
      }
    };

    loadContext();
  }, []);

  const sendMessage = async (message: string) => {
    // Send to API with user context included
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        userContext, // Include AI context
        conversationHistory: messages,
      }),
    });

    const data = await response.json();
    setMessages([...messages, { role: 'user', content: message }, { role: 'assistant', content: data.content }]);
  };

  return (
    <div className="chat-page">
      {/* Chat UI */}
    </div>
  );
}
```

## Example 5: Token Usage Analytics

### Display Token Usage

```typescript
// app/app/analytics/page.tsx
import { getTokenUsageStats } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const monthly = await getTokenUsageStats(user.id, 'month');
        const weekly = await getTokenUsageStats(user.id, 'week');
        
        setMonthlyStats(monthly);
        setWeeklyStats(weekly);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="analytics-page">
      <h1>Usage Statistics</h1>
      {monthlyStats && (
        <div>
          <h2>This Month</h2>
          <p>Input Tokens: {monthlyStats.input_tokens}</p>
          <p>Output Tokens: {monthlyStats.output_tokens}</p>
          <p>Messages: {monthlyStats.message_count}</p>
        </div>
      )}
      {weeklyStats && (
        <div>
          <h2>This Week</h2>
          <p>Input Tokens: {weeklyStats.input_tokens}</p>
          <p>Output Tokens: {weeklyStats.output_tokens}</p>
          <p>Messages: {weeklyStats.message_count}</p>
        </div>
      )}
    </div>
  );
}
```

## Example 6: Integration Status Dashboard

### Check All Integrations

```typescript
// app/app/dashboard/integrations-summary.tsx
import { getIntegrations, isIntegrationConnected } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function IntegrationsSummary() {
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    const loadIntegrations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const userIntegrations = await getIntegrations(user.id);
        setIntegrations(userIntegrations);
      }
    };

    loadIntegrations();
  }, []);

  return (
    <div className="integrations-summary">
      <h2>Connected Services</h2>
      <ul>
        {integrations.map((integration) => (
          <li key={integration.id}>
            <span>{integration.provider}</span>
            <span className={integration.is_active ? 'connected' : 'disconnected'}>
              {integration.is_active ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Example 7: Chat History Export

### Export All Messages

```typescript
// app/app/settings/export-data.tsx
import { getFullChatHistory } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export function ExportData() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Get all chat messages
      const messages = await getFullChatHistory(user.id);

      // Convert to JSON
      const json = JSON.stringify(messages, null, 2);

      // Download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowtex-chat-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      setExporting(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      setExporting(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={exporting}>
      {exporting ? 'Exporting...' : 'Export Chat History'}
    </button>
  );
}
```

## Example 8: Disconnect Integration

### Remove Integration

```typescript
// app/app/integrations/disconnect-button.tsx
import { deactivateIntegration } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export function DisconnectButton({ provider }: { provider: string }) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${provider}?`)) return;

    setDisconnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const result = await deactivateIntegration(user.id, provider);
      if (result.success) {
        alert(`${provider} disconnected`);
        // Refresh page or update state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Error disconnecting integration');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <button onClick={handleDisconnect} disabled={disconnecting}>
      {disconnecting ? 'Disconnecting...' : `Disconnect ${provider}`}
    </button>
  );
}
```

## Best Practices

1. **Always check userId before making queries**
   ```typescript
   if (!userId) {
     throw new Error('userId is required');
   }
   ```

2. **Handle errors gracefully**
   ```typescript
   const result = await updateProfile(userId, data);
   if (!result.success) {
     // Show error to user
   }
   ```

3. **Use TypeScript for type safety**
   ```typescript
   import { ProfileData, ChatMessageData } from '@/lib/database';
   
   const profileData: ProfileData = { ... };
   ```

4. **Cache results when appropriate**
   ```typescript
   const [profile, setProfile] = useState(null);
   useEffect(() => {
     loadProfile(); // Only load on mount
   }, []);
   ```

5. **Minimize database calls**
   ```typescript
   // Load all integrations once
   const integrations = await getIntegrations(userId);
   const isGoogleConnected = integrations.some(i => i.provider === 'google');
   ```

6. **Log important operations**
   ```typescript
   console.log('✅ Profile updated for user:', userId);
   console.log('❌ Error saving integration:', error);
   ```
