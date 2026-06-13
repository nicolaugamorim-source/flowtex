# Integrations Guide

## Overview
A página de integrations foi redesenhada com cards visuais usando a paleta de cores light do projeto. É fácil adicionar novas integrações.

## Current Integrations

### 1. **Google** ✅
- Gmail access
- Google Calendar
- Status: Active
- Connection: OAuth2

### 2. **Notion** ✅
- Notion database sync
- Status: Active (with API key)
- Connection: API Key

## How to Add a New Integration

### Step 1: Add to IntegrationsPanel

Edit `components/app/integrations-panel.tsx`:

```tsx
<IntegrationCard
  name="Slack"
  description="Send notifications to Slack"
  icon={<Send className="h-6 w-6 text-[#00D4A4]" />}
  isConnected={integrations.slack_connected || false}
>
  <div className="space-y-3">
    {/* Your integration UI here */}
    <Button className="w-full bg-[#00D4A4] hover:bg-[#00C494] text-white">
      Connect with Slack
    </Button>
  </div>
</IntegrationCard>
```

### Step 2: Update Database Schema

Add columns to `user_integrations` table:
```sql
ALTER TABLE user_integrations 
ADD COLUMN slack_token VARCHAR(500);
ADD COLUMN slack_connected BOOLEAN DEFAULT false;
```

### Step 3: Update Interface

Update the `Integration` interface in IntegrationsPanel:
```tsx
interface Integration {
  slack_token?: string;
  slack_connected?: boolean;
  // ... existing fields
}
```

### Step 4: Add Loading/Saving Logic

```tsx
async function saveSlackToken() {
  if (!userId) return;
  setSaving(true);

  try {
    const { error } = await supabase
      .from("user_integrations")
      .upsert({
        id: userId,
        slack_token: slackToken || null,
        slack_connected: !!slackToken,
      }, {
        onConflict: "id"
      });

    if (error) throw error;
  } finally {
    setSaving(false);
  }
}
```

## Integration Card Structure

```tsx
<IntegrationCard
  name="Service Name"                    // Display name
  description="What it does"             // Description
  icon={<IconComponent />}               // Lucide icon or custom
  isConnected={boolean}                  // Connected status
>
  {/* Card content goes here */}
  {/* Use existing UI components */}
</IntegrationCard>
```

## Color Palette

Use these colors consistently:

```
Primary: #00D4A4 (Teal accent)
Primary Dark: #00C494 (Hover state)
Background: #FFFFFF
Surface: #F8FAFC (Light gray)
Text Primary: #0D1F2D (Dark blue)
Text Secondary: #4A6880 (Medium blue)
Border: #E2EAF1 (Light border)
Success: green-500
Error: red-500
```

## Example: Add Slack Integration

```tsx
// In IntegrationsPanel component

const [slackToken, setSlackToken] = useState("");

async function handleSlackAuth() {
  // Redirect to Slack OAuth flow
  window.location.href = '/api/auth/slack';
}

// In return JSX:
<IntegrationCard
  name="Slack"
  description="Send notifications to your Slack workspace"
  icon={<MessageSquare className="h-6 w-6 text-[#00D4A4]" />}
  isConnected={integrations.slack_connected || false}
>
  <div className="space-y-3">
    <p className="text-xs text-[#4A6880]">
      {integrations.slack_connected
        ? "Your Slack workspace is connected"
        : "Connect your Slack workspace to receive notifications"}
    </p>
    <Button
      onClick={handleSlackAuth}
      className="w-full bg-[#00D4A4] hover:bg-[#00C494] text-white"
    >
      {integrations.slack_connected ? "Reconnect Slack" : "Connect with Slack"}
    </Button>
  </div>
</IntegrationCard>
```

## API Endpoints Pattern

For each integration, create:

```
app/api/auth/[integration]/route.ts
  └─ Handle OAuth callback or API requests

lib/[integration]-client.ts
  └─ Client for service API calls

lib/[integration]-config.ts
  └─ Configuration and constants
```

## Future Integrations

Planned (in Coming Soon section):
- [ ] Slack (notifications)
- [ ] Zapier (automation)
- [ ] Make (automation)
- [ ] Airtable (database)
- [ ] GitHub (version control)
- [ ] Stripe (payments)
- [ ] Figma (design)

## Testing Integrations

1. Update database schema
2. Add interface field
3. Add card to IntegrationsPanel
4. Test loading/saving state
5. Test connect/disconnect flow
6. Verify stored in database

## Component Props

### IntegrationCard

```typescript
interface IntegrationCardProps {
  name: string;              // Integration name
  description: string;       // What it does
  icon: React.ReactNode;     // Lucide icon
  isConnected: boolean;      // Connected status
  children: React.ReactNode; // Card content
  className?: string;        // Optional extra classes
}
```

## Notes

- All integrations use the light color palette
- Cards have smooth hover animations
- Status badges show Connected/Disconnected
- Use consistent spacing and layout
- Mobile responsive by default
- Animations powered by Framer Motion
