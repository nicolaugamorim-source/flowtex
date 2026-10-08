# Planeamento, briefing diário, check-in e exames

## Briefing da manhã
Gerado por `hoje` e enviado todos os dias de manhã (ver "Agendamento" no SKILL.md). O formato final para o aluno, curto e legível no telemóvel:

```
☀️ Quinta, 8 out

📚 Aulas hoje
• 09:00–11:00 Matemática II (TP) · Sala 2.1
• 14:00–16:00 Direito Económico (T)

① Aprender
• Macro I · Cap. 4 IS-LM (faltaste) · ~45 min

② Estudar e verificar
• Mat II · Cap. 3 Derivadas parciais → verificação hoje (~20 min)
• Direito · Cap. 1 → treino: 2 perguntas de desenvolvimento

🔁 Manutenção: 14 flashcards (~10 min)

🎯 Foco de hoje
1. ① Macro Cap. 4 (45 min), já que faltaste
2. ② Verificação de Mat II Cap. 3 (20 min)
3. Flashcards (10 min), no intervalo entre aulas

⏰ Direito Económico: frequência daqui a 7 dias
```

Regras do foco de hoje:
- No máximo 3 tarefas, cada uma com etapa, duração e ordem.
- Equilíbrio: **pelo menos uma tarefa de ① e uma de ②** sempre que houver aulas em ambas. Não deixar acumular aulas em ① (matéria por perceber) nem em ② (matéria nunca verificada).
- Prioridade dentro de cada etapa: exame mais próximo → aulas a que faltou → mais antigas.
- Em ②, as aulas "prontas para verificação" (aprendidas antes de hoje) passam à frente do treino.
- Flashcards: 10 a 15 minutos, no fim ou nos buracos entre aulas. Nunca são a tarefa principal.
- Num dia cheio de aulas, propõe menos. Com avaliação daqui a 7 dias ou menos, o foco é essa cadeira (verificações pendentes e simulação).

## Registo das aulas
Quando o aluno disser "hoje em Mat demos o capítulo 3" (ou equivalente):
1. `aula add "Matemática II" --materia "Cap. 3 — <título dos slides>" --dominio "<domínio>" --presenca assisti|faltei [--tipo T/TP/P] [--data ...]`. A aula entra na etapa ①.
2. Confirma a correspondência com os materiais (que ficheiro e que slides) e corrige `--materia` com os números de slides.
3. Propõe fazer a etapa ① no próprio dia ou no seguinte. Se o aluno faltou, é a versão completa. Se assistiu, pode ser a versão curta (pré-teste, síntese e perguntas de compreensão), mas não se salta.

`aula list` mostra a linha do tempo de cada cadeira com a etapa de cada aula. `aula list --pendentes` mostra só o que ainda não está dominado.

## Plano semanal
Prioridades:
1. **Etapa ① em dia:** as aulas da semana aprendidas até ao fim de semana (primeiro aquelas a que faltou).
2. **Etapa ② em dia:** cada aula verificada 2 a 7 dias depois de aprendida.
3. **Exame mais próximo:** nas 3 semanas antes, essa cadeira fica com a maior parte dos blocos.
4. **Pontos fracos** (de `proficiencia`).
5. **Cadeiras em atraso:** pelo menos 2 blocos fixos por semana, sempre nos mesmos dias (recordar ou aprender, depois verificar).
6. **Manutenção:** 10 a 15 minutos de flashcards por dia.

Regras:
- Blocos de 25 a 50 minutos com tarefa concreta (cadeira, aula ou tema, e o que fazer).
- Máximo de 3 a 4 blocos de estudo por dia útil, sem contar as aulas. Usa os buracos entre aulas para as revisões.
- Um dia leve por semana.
- Escreve o plano em `progresso.md` e, se o aluno quiser, cria os eventos no Google Calendar.

## Check-in semanal (domingo ou segunda)
1. "O que cumpriste?" (mostra o plano e o aluno marca).
2. "O que falhou e porquê?"
3. Mostra o estado das aulas por cadeira (em ①, em ② e dominadas) e a evolução da proficiência em relação ao check-in anterior.
4. Ajusta de forma realista: se falhou muito, **reduz** em vez de aumentar. Constância vale mais do que intensidade.
5. Regista em `progresso.md`.

## Preparação para a avaliação
- **Daqui a 3 semanas ou mais:** estudo normal, mais 1 quiz intercalado por semana nessa cadeira.
- **2 semanas antes:** todas as aulas da matéria devem estar pelo menos em ②. Verifica as que faltam e faz um quiz diagnóstico intercalado de todos os domínios, com plano focado nos fracos. A retenção alvo sobe para 95% (automático).
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
