# Token Refresh Implementation

## Problema Resolvido
O chatbot perdia acesso às integrações do Google (Calendar, Gmail) a cada ~1 hora quando o token de acesso expirava. O usuário era forçado a fazer logout/login novamente para obter um novo token.

## Solução Implementada
Sistema automático de refresh de tokens que mantém o chatbot sempre com acesso válido às integrações.

## Como Funciona

### 1. Fluxo de Login (`/app/auth/callback/route.ts`)
```
Usuário faz login via Google
    ↓
Supabase troca code por session
    ↓
App extrai o refresh token do Google
    ↓
App salva refresh token no banco de dados (tabela `users.google_refresh_token`)
    ↓
Usuário pode agora usar integrações indefinidamente
```

### 2. Fluxo de Uso (Chatbot + APIs)
Sempre que o chatbot ou qualquer endpoint acessa Google Calendar/Gmail:

```
Request chega ao backend
    ↓
Backend extrai userId da sessão Supabase
    ↓
Backend chama ensureValidGoogleToken()
    ↓
    ├─ Se userId disponível:
    │   └─ Tenta refrescar token usando refresh token do banco
    │       ├─ Se sucesso → usa novo token
    │       └─ Se falha → cai para frontend token
    │
    └─ Usa token do frontend (pode estar expirado)
    ↓
Backend faz chamada ao Google com token válido
```

### 3. Componentes Principais

#### `lib/ensure-valid-token.ts` (NOVO)
Utility que centraliza a lógica de refresh:
```typescript
ensureValidGoogleToken(currentToken, userId)
  ├─ Se userId existe:
  │   └─ Refresh automaticamente usando refresh token do DB
  └─ Retorna token válido ou null
```

#### `lib/google-refresh.ts` (EXISTENTE)
Faz a chamada OAuth2 para refrescar:
```typescript
refreshGoogleAccessToken(userId)
  └─ Busca refresh token no DB
  └─ Chama Google OAuth2 API
  └─ Retorna novo access token
```

## Arquivos Modificados

### Backend
1. **`app/api/chat/route.ts`**
   - Agora extrai userId da sessão Supabase
   - Chama `ensureValidGoogleToken()` automaticamente
   - Usa token refrescado para todas as operações

2. **`app/api/calendar/events/route.ts`**
   - Adiciona refresh automático de token
   - Garante que sempre tenha token válido

3. **`app/api/calendar/create/route.ts`**
   - Adiciona refresh automático de token

4. **`app/api/auth/refresh-google-token/route.ts`**
   - Simplificado para usar `refreshGoogleAccessToken()`
   - Usa refresh token do banco em vez de identities

5. **`app/auth/callback/route.ts`**
   - Extrai refresh token do Google após login
   - Salva no banco de dados para uso futuro

### Novo
- **`lib/ensure-valid-token.ts`**
  - Utility helper para centralizar lógica de refresh

## Benefícios

✅ **Acesso contínuo** - Nenhuma perda de funcionalidade por expiração de token
✅ **Experiência do usuário** - Sem necessidade de refazer login a cada hora
✅ **Segurança** - Refresh token armazenado com segurança no banco
✅ **Automático** - Funciona transparentemente sem ação do usuário
✅ **Reutilizável** - Qualquer novo endpoint pode usar `ensureValidGoogleToken()`

## Requisitos no Banco de Dados

Certifique-se de que a tabela `users` tem a coluna:
```sql
google_refresh_token VARCHAR(500)
```

Se não existir, execute:
```sql
ALTER TABLE users ADD COLUMN google_refresh_token VARCHAR(500);
```

## Teste

1. Faça login normalmente via Google
2. Abra o console do navegador (DevTools)
3. Aguarde ~1 hora OU force o teste:
   - Abra DevTools → Application → localStorage
   - Remova `google_token_data`
   - Tente usar o chatbot novamente
4. O chatbot deve funcionar normalmente (token refrescado automaticamente)
