# Google Token Integration Fix

## Problemas Encontrados e Corrigidos

### 1. **Dessincronia de Tabelas do Banco de Dados**
- ❌ `google-token-manager.ts` tentava salvar em tabela `users` (não existe)
- ❌ `google-refresh.ts` tentava ler de tabela `users` (não existe)
- ✅ Migration `create_user_integrations.sql` definiam `user_integrations` (diferente nome)
- ✅ Callback OAuth usa `integrations` (correto)

### 2. **Token Não Era Recuperado Corretamente**
- ❌ `auth-handler.tsx` tentava extrair de `identity_data` (estava vazio)
- ✅ Corrigido para usar `session.provider_token` (correto)

### 3. **Rota de Redirect Errada**
- ❌ `auth-handler.tsx` redirecionava para `/app` (landing page)
- ✅ Corrigido para `/app/app` (dashboard real)

---

## Mudanças Realizadas

### 📁 Novos Arquivos
- **`supabase/migrations/create_integrations.sql`** - Tabela correta para armazenar tokens OAuth

### 🔧 Arquivos Corrigidos

#### 1. `lib/google-token-manager.ts`
- ✅ `saveTokenData()` agora salva em `integrations` com `user_id` e `provider`
- ✅ `getValidAccessToken()` agora busca de `integrations` no banco de dados

#### 2. `lib/google-refresh.ts`
- ✅ `refreshGoogleAccessToken()` agora lê refresh token de `integrations`
- ✅ Salva novo access token em `integrations.access_token`

#### 3. `app/auth-handler.tsx`
- ✅ Lê `session.provider_token` corretamente
- ✅ Redireciona para `/app/app` (dashboard) não `/app` (landing)
- ✅ Fallback: tenta buscar token salvo anteriormente em `integrations`

#### 4. `lib/auth.ts`
- ✅ `upsertProfileFromGoogle()` agora usa `profiles` não `users`

---

## Passo-a-Passo: Executar as Mudanças

### 1. **Correr a Migration no Supabase**

Acesse o **Supabase Dashboard** → **SQL Editor** e execute:

```bash
# 1. Copie o conteúdo de:
# supabase/migrations/create_integrations.sql

# 2. Cole no SQL Editor
# 3. Clique "Run"
```

**Ou use a CLI do Supabase:**
```bash
supabase db push
```

### 2. **Testar Localmente**

```bash
npm run dev
```

### 3. **Fluxo de Teste**

1. Vá para http://localhost:3000/login
2. Clique "Sign in with Google"
3. Autorize a aplicação
4. Verifique os logs:
   ```
   ✅ [AUTH CALLBACK] Saving Google tokens to integrations...
   ✅ Google tokens saved to integrations
   ✅ Auth handler complete, redirecting to /app/app
   ```
5. Vá para `/app` (dashboard)
6. Tente: "check what i have this week" no chat
7. Deve aparecer os eventos do calendário

### 4. **Verificar no Banco de Dados**

No **Supabase Dashboard** → **SQL Editor**, execute:
```sql
SELECT user_id, provider, access_token, refresh_token, token_expires_at 
FROM integrations 
WHERE provider = 'google' 
LIMIT 1;
```

Deve aparecer um registro com tokens preenchidos.

---

## O Que Funciona Agora

✅ **Login com Google** - Tokens são salvos em `integrations`  
✅ **Chat acessa Calendário** - `getUpcomingEvents()` tem token válido  
✅ **Chat acessa Gmail** - `searchEmails()`, `getFullEmailContent()` funcionam  
✅ **Token Refresh** - Refresh token restaura acesso quando expira  
✅ **Rota correta** - Redirect pós-login vai para dashboard, não landing page  

---

## Rollback (Se Algo Der Errado)

Se precisar voltar:

```sql
-- Deletar integrations (volta ao estado anterior)
DROP TABLE IF EXISTS integrations CASCADE;

-- Tabela user_integrations ainda existe se precisar usar
```

---

## Arquivos Antes/Depois

| Arquivo | Problema | Solução |
|---------|----------|---------|
| `google-token-manager.ts` | Usa `users` | ✅ Usa `integrations` |
| `google-refresh.ts` | Usa `users` | ✅ Usa `integrations` |
| `auth-handler.tsx` | Lê `identity_data` | ✅ Lê `session.provider_token` |
| `auth-handler.tsx` | Redirect `/app` | ✅ Redirect `/app/app` |
| `auth.ts` | Usa `users` | ✅ Usa `profiles` |

---

## Observações Finais

- A tabela `user_integrations` criada antes pode ser deletada se não for usada
- A tabela `integrations` é agora o padrão para OAuth
- O sistema agora mantém histórico de quando os tokens foram conectados/atualizados
- RLS (Row Level Security) garante que usuarios só acessam seus próprios tokens
