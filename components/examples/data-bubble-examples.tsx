"use client";

import { DataBubble } from "@/components/ui/data-bubble";
import {
  Mail,
  Calendar,
  CheckCircle2,
  Database,
  MessageCircle,
  Clock,
  User,
  FileText,
  Tag,
} from "lucide-react";

/**
 * EMAIL EXAMPLE
 * Shows how to use DataBubble for email integration
 */
export function EmailBubbleExample() {
  return (
    <DataBubble
      type="email"
      title="FEUC: Avaliações 25/26"
      subtitle="Universidade de Coimbra"
      description="A Universidade de Coimbra informa sobre a avaliação da disciplina Estatística para Economia e Gestão I, marcada para 15.06.2026."
      metadata={[
        {
          icon: Clock,
          label: "Data",
          value: "Thu, Jun 11, 2026",
          color: "default",
        },
        {
          icon: User,
          label: "De",
          value: "no-reply@uc.pt",
          color: "info",
        },
        {
          icon: Tag,
          label: "Categoria",
          value: "Educação",
          color: "warning",
        },
      ]}
      badge={{
        label: "Não lido",
        color: "warning",
      }}
      actionLabel="Ler email"
    />
  );
}

/**
 * EVENT EXAMPLE
 * Shows how to use DataBubble for calendar events
 */
export function EventBubbleExample() {
  return (
    <DataBubble
      type="event"
      title="Reunião com o cliente"
      subtitle="Calendário Principal"
      description="Discussão sobre os requisitos do projeto Q2 e timeline de implementação."
      metadata={[
        {
          icon: Calendar,
          label: "Data",
          value: "Terça, 18 Jun, 2026",
          color: "accent",
        },
        {
          icon: Clock,
          label: "Horário",
          value: "14:00 - 15:30",
          color: "accent",
        },
        {
          icon: User,
          label: "Participantes",
          value: "5 pessoas",
          color: "info",
        },
      ]}
      badge={{
        label: "Confirmado",
        color: "success",
      }}
      actionLabel="Ver detalhes"
    />
  );
}

/**
 * TASK EXAMPLE
 * Shows how to use DataBubble for task management (future Notion integration)
 */
export function TaskBubbleExample() {
  return (
    <DataBubble
      type="task"
      title="Implementar autenticação OAuth"
      subtitle="Projeto: Flowtex"
      description="Adicionar suporte para login com Google, GitHub e Microsoft. Incluir refresh token handling e persistência."
      metadata={[
        {
          icon: Calendar,
          label: "Deadline",
          value: "25 Jun, 2026",
          color: "warning",
        },
        {
          icon: User,
          label: "Atribuído a",
          value: "Você",
          color: "success",
        },
        {
          icon: Tag,
          label: "Prioridade",
          value: "Alta",
          color: "error",
        },
      ]}
      badge={{
        label: "Em Progresso",
        color: "info",
      }}
      actionLabel="Atualizar status"
    />
  );
}

/**
 * NOTION EXAMPLE
 * Shows how to use DataBubble for Notion database entries
 */
export function NotionBubbleExample() {
  return (
    <DataBubble
      type="notion"
      title="Roadmap Q3 2026"
      subtitle="Notion Database"
      description="Planeamento de features para o terceiro trimestre incluindo melhorias de performance e novas integrações."
      metadata={[
        {
          icon: Calendar,
          label: "Criado",
          value: "10 Jun, 2026",
          color: "default",
        },
        {
          icon: User,
          label: "Proprietário",
          value: "Produto Team",
          color: "info",
        },
        {
          icon: FileText,
          label: "Status",
          value: "Em Revisão",
          color: "warning",
        },
      ]}
      badge={{
        label: "Notion",
        color: "info",
      }}
      actionLabel="Abrir no Notion"
    />
  );
}

/**
 * SLACK EXAMPLE
 * Shows how to use DataBubble for Slack messages
 */
export function SlackBubbleExample() {
  return (
    <DataBubble
      type="slack"
      title="Design Review Feedback"
      subtitle="@design-team"
      description="Feedback sobre o novo design da landing page. Precisa de ajustes na seção de pricing e footer."
      metadata={[
        {
          icon: Clock,
          label: "Hora",
          value: "Há 2 horas",
          color: "default",
        },
        {
          icon: User,
          label: "De",
          value: "João Silva",
          color: "default",
        },
        {
          icon: MessageCircle,
          label: "Canal",
          value: "#design",
          color: "default",
        },
      ]}
      badge={{
        label: "Novo",
        color: "success",
      }}
      actionLabel="Ver conversa"
    />
  );
}

/**
 * CUSTOM EXAMPLE
 * Shows how to use DataBubble with custom type and icon
 */
export function CustomBubbleExample() {
  return (
    <DataBubble
      type="custom"
      icon={FileText}
      title="Documento: Políticas de Privacidade"
      subtitle="Google Drive"
      description="Documento compartilhado com a equipe legal para revisão final antes de publicação."
      metadata={[
        {
          icon: Clock,
          label: "Modificado",
          value: "Hoje às 10:30",
          color: "default",
        },
        {
          icon: User,
          label: "Compartilhado por",
          value: "Legal Team",
          color: "info",
        },
      ]}
      badge={{
        label: "Aguardando Review",
        color: "warning",
      }}
      actionLabel="Abrir documento"
    />
  );
}

/**
 * COMPACT VARIANT EXAMPLE
 * Shows how to use the compact variant for lists/sidebars
 */
export function CompactBubbleExample() {
  return (
    <DataBubble
      type="email"
      title="Quick Update"
      subtitle="sender@example.com"
      variant="compact"
      badge={{
        label: "Não lido",
        color: "warning",
      }}
    />
  );
}

/**
 * FULL PAGE EXAMPLE
 * Shows all variations together
 */
export function DataBubbleShowcase() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6 sm:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">Data Bubble Components</h1>
          <p className="text-[var(--color-text-muted)]">
            Exemplos de uso do componente genérico DataBubble para diferentes integrações
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">📧 Email</h2>
            <EmailBubbleExample />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">📅 Calendar Event</h2>
            <EventBubbleExample />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">✅ Task (Notion)</h2>
            <TaskBubbleExample />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">📊 Notion Page</h2>
            <NotionBubbleExample />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">💬 Slack Message</h2>
            <SlackBubbleExample />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">📄 Custom</h2>
            <CustomBubbleExample />
          </div>
        </div>
      </div>
    </div>
  );
}
