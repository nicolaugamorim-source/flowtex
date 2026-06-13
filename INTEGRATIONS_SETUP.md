# Integrations Setup Guide

## Requirements

### 1. Supabase Database Migration

Execute o SQL abaixo no Supabase SQL Editor (em `https://supabase.com/dashboard/project/[seu-project]/sql`):

```sql
-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_api_key text,
  google_access_token text,
  google_refresh_token text,
  gmail_connected boolean DEFAULT false,
  calendar_connected boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_integrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_integrations_timestamp_trigger ON user_integrations;
CREATE TRIGGER update_user_integrations_timestamp_trigger
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_timestamp();
```

### 2. Google OAuth Configuration

Se ainda não configurou:

1. Va para [Google Cloud Console](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Ativa as APIs:
   - Gmail API
   - Google Calendar API
4. Crie OAuth 2.0 credenciais (Web application)
5. Adicione `http://localhost:3000/auth/callback` às "Authorized redirect URIs"
6. Configure no Supabase:
   - Dashboard → Authentication → Providers
   - Ativa Google provider
   - Adicione Client ID e Client Secret

## Features

### Página de Integrations (`/app/integrations`)

- **Google Integration**: Botão para conectar Gmail e Google Calendar
- **Notion Integration**: Campo para colar API key do Notion

### Login Flow

Quando o user faz login:
1. Pede autorização para o Google (basic scopes)
2. Após login, pode clicar em "Connect Google" na página de Integrations
3. Será pedido autorização para Gmail e Google Calendar especificamente
4. Tokens são salvos na tabela `user_integrations`

### Notion Setup

1. User vai para `/app/integrations`
2. Copia API key do Notion
3. Cola no campo "Notion API Key"
4. Clica "Save"

## Next Steps

- Atualizar o chat API (`/api/chat`) para usar as integrações
- Implementar MCP servers para Notion, Gmail, Calendar
- Treinar o bot a usar as ferramentas
