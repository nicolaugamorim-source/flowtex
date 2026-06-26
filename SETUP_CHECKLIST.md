# ✅ Setup Checklist - Google Token Fix

## Passo 1: Executar Migration no Supabase

### Opção A: Via Dashboard (Mais Fácil)
- [ ] Acesse https://app.supabase.com
- [ ] Projeto → SQL Editor
- [ ] Novo query
- [ ] Copie o conteúdo de `supabase/migrations/create_integrations.sql`
- [ ] Clique "Run"
- [ ] Deve aparecer: "Query saved successfully" (sem erros)

### Opção B: Via CLI
```bash
supabase db push
```

## Passo 2: Verificar que Tabela Foi Criada

```sql
-- No Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'integrations';

-- Deve retornar: integrations
```

## Passo 3: Testar a App Localmente

```bash
npm run dev
# ou
npm start
```

## Passo 4: Testar Login com Google

1. Abra http://localhost:3000
2. Clique "Login" → "Sign in with Google"
3. Autorize a aplicação
4. Verifique no console que aparecem esses logs:
   ```
   ✅ Google provider_token found, saving with token manager
   ✅ Saved provider_token to localStorage and integrations table
   ✅ Auth handler complete, redirecting to /app/app
   ```
5. Deve redirecionar para dashboard (`/app/app`)

## Passo 5: Testar Chat

1. Na dashboard, abra o chat (ícone no canto)
2. Escreva: "check what i have this week"
3. Verifique logs que aparecem:
   ```
   Calling Claude API with message: check what i have this week
   Claude response: ... (com dados dos eventos)
   ```
4. Deve aparecer seus eventos do calendário

## Passo 6: Verificar Tokens Salvos

No Supabase SQL Editor:
```sql
SELECT 
  user_id, 
  provider, 
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token,
  token_expires_at,
  is_active
FROM integrations 
WHERE provider = 'google' 
ORDER BY connected_at DESC 
LIMIT 5;
```

Deve aparecer um registro com:
- ✅ `provider` = 'google'
- ✅ `has_access_token` = true
- ✅ `is_active` = true

## 🚨 Se der erro...

### Erro 1: "violates row-level security policy"
- Significa: Falta tabela ou RLS está bloqueando
- Solução: Execute a migration novamente

### Erro 2: "table 'integrations' does not exist"
- Significa: Migration não foi executada
- Solução: Acesse Supabase Dashboard e execute SQL

### Erro 3: Chat não consegue ver calendário
- Significa: Token ainda não está sendo salvo
- Verifique: Logs em `auth-handler.tsx` 
- Solução: Logout completo + Login novamente

### Erro 4: 404 em `/app`
- Significado: Ainda está tentando ir para landing page
- Solução: Clear browser cache (Ctrl+Shift+Del)

## ✅ Está Funcionando Se...

- [ ] Login com Google redireciona para `/app/app`
- [ ] Chat consegue listar eventos do calendário
- [ ] Chat consegue enviar emails (draft)
- [ ] Chat consegue criar eventos
- [ ] Não aparecem erros sobre "table users does not exist"
- [ ] Database tem registros em `integrations`

## 📝 Notas

- Primeira vez que faz login com Google, refresh token é salvo
- Próximas vezes, apenas access token é renovado
- Cache de localStorage é limpo automaticamente quando expirar
- RLS garante que usuário só vê seus próprios tokens

## 🔗 Links Úteis

- Supabase Dashboard: https://app.supabase.com
- Documentação Completa: [Veja GOOGLE_TOKEN_FIX.md](./GOOGLE_TOKEN_FIX.md)
- Logs da App: http://localhost:3000 → DevTools → Console

---

**Status: ✅ Pronto para usar após executar a migration**
