import { useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { getValidAccessToken } from './google-token-manager';
import { trackActivity } from './activity-tracker';
import { useToast } from '@/components/ui/toast-provider';
import { Clock } from 'lucide-react';

export interface BubbleData {
  type: "email" | "email_draft" | "event" | "task" | "notion" | "slack" | "custom";
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Array<{
    icon?: string;
    label: string;
    value: string;
    color?: "default" | "accent" | "success" | "warning" | "error" | "info";
  }>;
  badge?: {
    label: string;
    color?: "default" | "accent" | "success" | "warning" | "error" | "info";
  };
  actions?: Array<{
    label: string;
    onClick?: () => void;
    variant?: "default" | "secondary" | "outline";
  }>;
  // Raw data needed to power interactive buttons (reschedule, reply, delete, ...)
  // without having to re-parse the displayed text.
  meta?: {
    emailId?: string;
    fromEmail?: string;
    to?: string;
    subject?: string;
    body?: string;
    // Present when a destructive/mutating tool call found a candidate but has not
    // executed yet — the chat UI must show a confirm button that hits the real API
    // directly before the action happens (see components/ui/integration-bubble.tsx).
    pendingDelete?: { eventId: string; calendarId: string };
    pendingReschedule?: {
      eventId: string;
      calendarId: string;
      summary: string;
      description?: string;
      startTime: string;
      endTime: string;
      newCalendarId?: string;
    };
    pendingDeleteClient?: { clientId: string; clientName: string };
    pendingDeleteNotion?: { pageId: string; pageName: string };
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  threadId?: string;
  bubbles?: BubbleData[];
}

export function useChatBot() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, activeAction?: string | null, googleAccessToken?: string) => {
    if (!content.trim()) return;

    // Get user ID for token refresh
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    console.log('Sending message with userId:', userId ? 'YES' : 'NO');

    // Track first AI message of the day
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `flowtex_ai_message_${today}`;

    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, 'true');
      trackActivity('ai_message', 1).catch((err) =>
        console.error('Failed to track AI message activity:', err)
      );
    }

    // Get valid access token (uses smart caching and refresh)
    let freshAccessToken = await getValidAccessToken();

    if (!freshAccessToken && googleAccessToken) {
      console.log('Could not get fresh token, using provided token');
      freshAccessToken = googleAccessToken;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages,
          googleAccessToken: freshAccessToken,
          activeAction: activeAction || null,
          userId: userId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 429) {
        // Never sent — drop the optimistic bubble so the input looks untouched.
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        const { retryAfterSeconds } = await response.json().catch(() => ({ retryAfterSeconds: 60 }));
        toast.show({
          title: "Slow down",
          message: `Too many messages at once — this one wasn't sent. Try again in ${retryAfterSeconds}s.`,
          icon: Clock,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        threadId: data.threadId,
        bubbles: data.bubbles,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Let other open pages (e.g. the Kanban board) know a task was created/moved
      // via the chat, so they can refresh without needing a manual reload.
      if (data.bubbles?.some((b: BubbleData) => b.type === 'task')) {
        window.dispatchEvent(new CustomEvent('flowtex:kanban-updated'));
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);

        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const stopResponse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    clearChat,
    stopResponse,
  };
}
