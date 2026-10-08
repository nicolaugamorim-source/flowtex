# Planeamento, briefing diário, check-in e exames

## Briefing da manhã
Gerado por `hoje` e enviado todos os dias de manhã (ver "Agendamento" no SKILL.md). O formato final para o aluno, curto e legível no telemóvel:

```
☀️ Quinta, 8 out

📚 Aulas hoje
• 09:00–11:00 Matemática II (TP) · Sala 2.1
• 14:00–16:00 Direito Económico (T)

🔁 Revisões: 23 cartões (~15 min)
• Macro I › IS-LM: 9 · Matemática II › Derivadas: 8 · …

🎯 Foco de hoje
1. Revisões (15 min), de manhã ou entre aulas
2. Estudar a aula de Mat II de 06/10 (faltaste): Cap. 3 (~45 min)
3. 10 min: quiz de Hessiana (ponto fraco, 35%)

⏰ Direito Económico: frequência daqui a 7 dias
```

Regras do foco de hoje:
- No máximo 3 tarefas, cada uma com duração e ordem.
- Ordem: (1) revisões; (2) aulas a que faltou ou ainda não estudadas, com prioridade para o exame mais próximo; (3) um ponto fraco; (4) cadeiras em atraso, nos dias fixos.
- Tem em conta as aulas do dia: num dia cheio, propõe menos.
- Se houver avaliação daqui a 7 dias ou menos, o foco passa a ser essa cadeira (simulação e pontos fracos dela).

## Registo das aulas
Quando o aluno disser "hoje em Mat demos o capítulo 3" (ou equivalente):
1. `aula add "Matemática II" --materia "Cap. 3 — <título dos slides>" --dominio "<domínio>" --presenca assisti|faltei [--tipo T/TP/P] [--data ...]`.
2. Confirma a correspondência com os materiais (que ficheiro e que slides) e corrige `--materia` com os números de slides.
3. Se ele faltou: propõe ensinar a aula (`references/ensinar.md`) e põe-na no briefing do dia seguinte.
4. Se assistiu: propõe uma sessão curta para consolidar (resumo, cartões e mini-quiz). Mesmo tendo ido à aula, sem recuperação esquece-se depressa.

Com `aula list --pendentes` vês o que falta estudar. Este registo é a "linha do tempo" de cada cadeira, aula a aula.

## Plano semanal
Prioridades:
1. **Revisões diárias** (15–30 min): a parte que não pode falhar.
2. **Exame mais próximo:** nas 3 semanas antes, essa cadeira fica com a maior parte dos blocos.
3. **Aulas da semana** estudadas até ao fim de semana (sobretudo aquelas a que faltou).
4. **Pontos fracos** (de `proficiencia`).
5. **Cadeiras em atraso:** pelo menos 2 blocos fixos por semana, sempre nos mesmos dias.

Regras:
- Blocos de 25 a 50 minutos com tarefa concreta (cadeira, aula ou tema, e o que fazer).
- Máximo de 3 a 4 blocos de estudo por dia útil, sem contar as aulas. Usa os buracos entre aulas para as revisões.
- Um dia leve por semana.
- Escreve o plano em `progresso.md` e, se o aluno quiser, cria os eventos no Google Calendar.

## Check-in semanal (domingo ou segunda)
1. "O que cumpriste?" (mostra o plano e o aluno marca).
2. "O que falhou e porquê?"
3. Mostra a evolução da proficiência em relação ao check-in anterior.
4. Ajusta de forma realista: se falhou muito, **reduz** em vez de aumentar. Constância vale mais do que intensidade.
5. Regista em `progresso.md`.

## Preparação para a avaliação
- **Daqui a 3 semanas ou mais:** estudo normal, mais 1 quiz intercalado por semana nessa cadeira.
- **2 semanas antes:** quiz diagnóstico de todos os domínios e plano focado nos fracos. A retenção alvo sobe para 95% (automático).
- **1 semana antes:** 1 ou 2 simulações completas (`quiz.html` em modo exame, ou enunciado no chat para perguntas de desenvolvimento), com correção e cartões dos erros.
- **Véspera:** só revisões e uma passagem pelos pontos fracos. Nada de matéria nova. Dormir.

## Simulação de exame
1. Usa **exames antigos e frequências** dos materiais como modelo: estrutura, tipo de perguntas, cotações e duração.
2. Se houver perguntas reais suficientes, usa-as. Se criares perguntas novas, têm de ser do mesmo estilo, só com matéria dos materiais, e deves indicar a pergunta original em que te baseaste.
3. O aluno responde a tudo antes de ver qualquer correção.
4. Corrige pergunta a pergunta: cotação estimada, o que faltou e a fonte.
5. Regista os resultados (`registar` ou `resultado --origem simulacao`), cria cartões dos erros e ajusta o plano.

## Cadeiras em atraso
- Começa pelos exames antigos: o que sai e quanto vale. Estuda primeiro o que mais pesa.
- Blocos fixos semanais, mesmo pequenos.
- Se for pré-requisito de uma cadeira atual (por exemplo, Matemática I para Micro), assinala a ligação: estudar uma ajuda na outra.
