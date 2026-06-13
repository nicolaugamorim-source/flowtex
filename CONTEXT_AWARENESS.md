# Context Awareness & Smart Inference

## Problema Resolvido
Claude estava sendo "burro" - pedia informações óbvias que ele já tinha do contexto.

**Antes:**
```
User: "Restos a reunião e manda um email confirmando"
Claude: "Qual reunião? Qual data? Para quem mando o email?"
```

**Agora:**
```
User: "Restos a reunião e manda um email confirmando"
Claude: [Viu o email anterior] → Já sabe: qual reunião, data, e-mail
Claude: Executa automaticamente ✓
```

## Como Funciona

### 1. Email Context Memory
Quando Claude lê um email, ele **lembra**:
- Quem enviou (From)
- O assunto (Subject)
- Conteúdo completo
- Action items mencionados
- Quem responder (reply-to)

**Exemplo:**
```
Email lido: "Flow quer remarcar reunião de Terça para Quarta"
↓
User diz: "Restos"
↓
Claude: "Já sei - remover de Terça, agendar Quarta para Flow"
Claude: Executa sem perguntar ✓
```

### 2. Smart Inference
Claude agora **infere** informações implícitas:

| Situação | Antes | Agora |
|----------|-------|-------|
| User: "manda confirmar" | "Para quem?" | Envia para quem mandou o email |
| User: "restos a reunião" | "Qual?" | Usa título do email |
| User: "marca para amanhã" | "Que hora?" | Usa horário mencionado no email |

### 3. Recent Context
Claude mantém contexto de:
- Último email lido
- Últimas reuniões mencionadas
- Últimas ações pedidas
- Flow da conversa

## Benefícios

✅ **Menos perguntas** - Claude não pede o óbvio
✅ **Mais rápido** - Executa comandos direto
✅ **Mais natural** - Conversa flui naturalmente
✅ **Menos repetição** - Não reafirma contexto já claro
✅ **Mais proativo** - Sugere próximos passos

## Exemplos de Uso

### Exemplo 1: Email + Reschedule + Reply
```
1. User: "Mostra meus emails"
   → Claude encontra: "Re: Meeting Next Week from Flow"
   → Conteúdo: "Quer remarcar Terça para Quarta, 10:00-13:00"

2. User: "Restos e manda confirmar"
   → Claude SABE:
     - Evento: "Meeting Next Week"
     - Data antiga: Tuesday
     - Data nova: Wednesday
     - Hora: 10:00-13:00
     - Responder para: support.flowapp@gmail.com
   
   → Claude FAZE (sem perguntar):
     1. Delete old event from Tuesday
     2. Create new event for Wednesday
     3. Send confirmation email to Flow
```

### Exemplo 2: Multiple Actions in Sequence
```
1. User: "Lê meu último email não lido"
   → Claude lê: Projeto X deadline amanhã

2. User: "Adiciona no meu calendario e manda lembrete pro cliente"
   → Claude SABE:
     - Projeto X (from email)
     - Deadline amanhã (from email)
     - Cliente a contactar (inferred from context)
     
   → Claude FAZE sem perguntar:
     1. Add deadline to calendar
     2. Send reminder email to client
```

## Technical Details

### System Prompt Updates
```
CONTEXT AWARENESS & SMART INFERENCE:
- You have full context from recent emails, calendar events, and conversations
- When the user refers to something you just read, use that context immediately
- DO NOT ask for information you can infer from context
- Make intelligent assumptions based on conversation flow
- Extract implicit information and be proactive
```

### Conversation Flow
```
User Message
    ↓
Check Recent Context (last email/calendar mentioned)
    ↓
Apply Context Awareness Rules
    ↓
Make Smart Inferences
    ↓
Execute with full context (no redundant questions)
```

## Next Improvements

- [ ] Add email thread context (full conversation thread)
- [ ] Remember previous actions in same conversation
- [ ] Suggest natural next steps automatically
- [ ] Learn user's preferences over time
- [ ] Handle ambiguous requests with intelligent guessing

## Testing

Try these commands to see context awareness:

1. **After reading an email:**
   - "Restos" (reschedule) - Claude knows which meeting
   - "Manda resposta" (send reply) - Claude knows who to reply to
   - "Confirma" (confirm) - Claude knows what to confirm

2. **After seeing calendar:**
   - "Move para amanhã" - Claude knows which event
   - "Muda a hora" - Claude picks logical new time

3. **Multi-step actions:**
   - "Faz todo o processo" - Claude chains actions intelligently
