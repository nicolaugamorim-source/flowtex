# DataBubble Component Guide

## Overview

`DataBubble` é um componente genérico e reutilizável para exibir informações estruturadas de diferentes integrações (Email, Calendar, Notion, Slack, etc.) de forma consistente.

**Vantagens:**
- ✅ Um componente para todas as integrações
- ✅ Design consistente e profissional
- ✅ Fácil de estender com novas integrações
- ✅ Organização visual clara da informação
- ✅ Responsivo e com animações suaves
- ✅ Suporta 6+ tipos de integrações built-in

---

## Basic Usage

```tsx
import { DataBubble } from "@/components/ui/data-bubble";
import { Clock, User } from "lucide-react";

export function MyComponent() {
  return (
    <DataBubble
      type="email"
      title="Email Subject"
      subtitle="sender@example.com"
      description="Short description of the email content..."
      metadata={[
        {
          icon: Clock,
          label: "Received",
          value: "Today at 10:30",
          color: "default",
        },
        {
          icon: User,
          label: "From",
          value: "John Doe",
          color: "info",
        },
      ]}
      badge={{
        label: "Unread",
        color: "warning",
      }}
    />
  );
}
```

---

## Props Reference

### Main Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | `"email" \| "event" \| "task" \| "notion" \| "slack" \| "custom"` | ✅ | - | Integration type for icon & styling |
| `title` | `string` | ✅ | - | Main title of the card |
| `subtitle` | `string` | ❌ | - | Secondary subtitle (e.g., sender, calendar name) |
| `description` | `string` | ❌ | - | Detailed description (line-clamped to 3 lines) |
| `icon` | `LucideIcon` | ❌ | Auto | Custom icon (overrides type icon) |
| `metadata` | `MetadataItem[]` | ❌ | `[]` | Organized metadata items with icons & colors |
| `badge` | `Badge` | ❌ | - | Status badge (e.g., "Unread", "Confirmed") |
| `actions` | `Action[]` | ❌ | `[]` | Action buttons at bottom |
| `actionLabel` | `string` | ❌ | `"View"` | Label for default action (if no actions array) |
| `variant` | `"default" \| "compact"` | ❌ | `"default"` | Card size & layout |
| `className` | `string` | ❌ | - | Additional CSS classes |

### MetadataItem

```tsx
interface MetadataItem {
  icon?: LucideIcon;
  label: string;
  value: string;
  color?: "default" | "accent" | "success" | "warning" | "error" | "info";
}
```

**Color meanings:**
- `default` - Gray (neutral information)
- `accent` - Green turquoise (primary action, positive)
- `success` - Green (confirmed, done)
- `warning` - Orange (pending, needs attention)
- `error` - Red (failed, blocked)
- `info` - Blue (informational)

### Badge

```tsx
interface Badge {
  label: string;
  color?: "default" | "accent" | "success" | "warning" | "error" | "info";
}
```

### Action

```tsx
interface DataBubbleAction {
  label: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline";
}
```

---

## Integration Examples

### 📧 Email Integration

```tsx
<DataBubble
  type="email"
  title="Project Update"
  subtitle="manager@company.com"
  description="Discussion about Q3 roadmap and resource allocation..."
  metadata={[
    { icon: Clock, label: "Date", value: "Jun 18, 2026" },
    { icon: User, label: "From", value: "Sarah Manager" },
    { icon: Mail, label: "Priority", value: "High", color: "error" },
  ]}
  badge={{ label: "Unread", color: "warning" }}
  actions={[
    { label: "Read", variant: "default" },
    { label: "Archive", variant: "outline" },
  ]}
/>
```

### 📅 Calendar Event Integration

```tsx
<DataBubble
  type="event"
  title="Team Meeting"
  subtitle="Work Calendar"
  description="Discuss sprint progress and upcoming deliverables..."
  metadata={[
    { icon: Calendar, label: "Date", value: "Tue, Jun 25, 2026", color: "accent" },
    { icon: Clock, label: "Time", value: "14:00 - 15:00", color: "accent" },
    { icon: Users, label: "Attendees", value: "8 people", color: "info" },
  ]}
  badge={{ label: "Confirmed", color: "success" }}
  actions={[
    { label: "Join", variant: "default" },
    { label: "Decline", variant: "outline" },
  ]}
/>
```

### ✅ Task/Notion Integration

```tsx
<DataBubble
  type="task"
  title="Fix: Login page not responsive"
  subtitle="Project: Flowtex"
  description="The login page breaks on mobile devices below 320px width..."
  metadata={[
    { icon: Calendar, label: "Deadline", value: "Jun 20, 2026", color: "warning" },
    { icon: User, label: "Assigned to", value: "You", color: "success" },
    { icon: Flag, label: "Priority", value: "Critical", color: "error" },
  ]}
  badge={{ label: "In Progress", color: "info" }}
  actions={[
    { label: "Start Work", variant: "default" },
    { label: "View in Notion", variant: "secondary" },
  ]}
/>
```

### 📊 Notion Database Entry

```tsx
<DataBubble
  type="notion"
  title="2026 Planning Document"
  subtitle="Notion Workspace"
  description="Strategic planning for the year including budget allocation, team expansion, and product roadmap..."
  metadata={[
    { icon: Calendar, label: "Created", value: "Jan 1, 2026" },
    { icon: User, label: "Owner", value: "Product Team" },
    { icon: Database, label: "Status", value: "Published", color: "success" },
  ]}
  badge={{ label: "Shared", color: "accent" }}
  actions={[
    { label: "Open in Notion", variant: "default" },
  ]}
/>
```

### 💬 Slack Message Integration

```tsx
<DataBubble
  type="slack"
  title: "New feature released!"
  subtitle: "@product-updates",
  description: "Version 2.5.0 is now live with improved performance and new dashboard widgets..."
  metadata={[
    { icon: Clock, label: "Time", value: "2 hours ago" },
    { icon: User, label: "Posted by", value: "Engineering Team" },
    { icon: MessageCircle, label: "Channel", value: "#announcements" },
  ]}
  badge={{ label: "Announcement", color: "success" }}
/>
```

### 🔧 Custom Integration (Google Drive, GitHub, etc.)

```tsx
import { FileText } from "lucide-react";

<DataBubble
  type="custom"
  icon={FileText}
  title="GitHub PR: Add dark mode"
  subtitle="Repository: flowtex"
  description="Implementation of dark mode toggle with system preference detection..."
  metadata={[
    { icon: GitBranch, label: "Branch", value: "feature/dark-mode" },
    { icon: User, label: "Author", value: "Developer Name" },
    { icon: Code, label: "Changes", value: "+250 -85 lines", color: "info" },
  ]}
  badge={{ label: "Review Needed", color: "warning" }}
  actions={[
    { label: "Review PR", variant: "default" },
  ]}
/>
```

---

## Advanced Usage

### Compact Variant for Sidebars/Lists

```tsx
<DataBubble
  type="email"
  title="Quick Update"
  subtitle="sender@example.com"
  variant="compact"
  badge={{ label: "New", color: "success" }}
/>
```

### Dynamic Actions with State

```tsx
function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <DataBubble
      type="task"
      title="Deploy to production"
      actions={[
        {
          label: isLoading ? "Deploying..." : "Deploy",
          onClick: async () => {
            setIsLoading(true);
            await deploy();
            setIsLoading(false);
          },
        },
      ]}
    />
  );
}
```

### Mapping Array Data

```tsx
function EmailList({ emails }) {
  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <DataBubble
          key={email.id}
          type="email"
          title={email.subject}
          subtitle={email.from}
          description={email.preview}
          metadata={[
            { icon: Clock, label: "Date", value: formatDate(email.date) },
            { icon: Tag, label: "Label", value: email.label, color: "info" },
          ]}
          badge={{
            label: email.unread ? "Unread" : "Read",
            color: email.unread ? "warning" : "default",
          }}
          actions={[
            {
              label: "Read",
              onClick: () => openEmail(email.id),
              variant: "default",
            },
          ]}
        />
      ))}
    </div>
  );
}
```

---

## Extending for New Integrations

To add a new integration type (e.g., "slack"), just add it to the `TYPE_ICONS` map:

```tsx
const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  // ... existing types ...
  slack: {
    icon: MessageCircle,
    color: "#7C3AED",      // Slack purple
    bg: "#F3E8FF",         // Light purple background
  },
};
```

Then use it:

```tsx
<DataBubble
  type="slack"
  title="Message"
  // ... rest of props
/>
```

---

## Color Palette Reference

The component uses Flowtex's color system:

```css
--color-text-primary: #0D1F2D;      /* Dark blue for main text */
--color-text-secondary: #2E4A62;    /* Medium blue for secondary text */
--color-text-muted: #4A6880;        /* Light blue-gray for muted text */
--color-border-default: #E2EAF1;    /* Light border */
--color-border-strong: #C8D8E6;     /* Stronger border for hover */
--color-accent: #00D4A4;            /* Green turquoise for actions */
--color-accent-hover: #00A882;      /* Darker green for hover */
--color-accent-subtle: #E0F7F2;     /* Light green background */
--color-success: #22C55E;           /* Green for success */
--color-warning: #F59E0B;           /* Orange for warnings */
--color-error: #EF4444;             /* Red for errors */
--color-info: #3B82F6;              /* Blue for info */
```

---

## Best Practices

1. **Always use appropriate icons** - Match icons to the information they represent
2. **Keep descriptions concise** - Use 1-2 sentences, the component will truncate long text
3. **Use color semantics** - Use `warning` for pending items, `error` for failures, `success` for completed
4. **Organize metadata logically** - Put the most important info first
5. **Test responsive behavior** - The component adapts to mobile/tablet/desktop
6. **Use actions wisely** - Keep 1-3 actions per card maximum
7. **Batch similar items** - When showing lists, use consistent metadata order

---

## See Examples

Check `components/examples/data-bubble-examples.tsx` for a complete showcase of all variations!
