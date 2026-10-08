# Etapa ① Aprender (ou recordar)

**Objetivo: perceber a matéria.** No fim desta etapa, o aluno consegue explicar a aula por palavras dele e resolver os exemplos base com ajuda. Ainda não se exige domínio; isso fica para a etapa ②.

Toda a matéria vem dos materiais dessa aula. Lê os slides e apontamentos **completos** antes de começar.

Há duas variantes:
- **Aprender:** matéria nova, uma aula a que o aluno faltou ou que nunca estudou.
- **Recordar:** matéria que já foi aprendida mas falhou na verificação, ficou esquecida ou é de uma cadeira em atraso. É mais curta e vai direto às falhas (ver no fim).

## Antes de começar
1. Identifica a aula em `aulas.csv` (ou regista-a com `aula add`).
2. Define 3 a 5 **objetivos** ("no fim deves conseguir…"), tirados dos slides ou do programa.
3. Vê o tipo de cadeira (`cadeiras.csv`) e o plano certo em `references/metodos.md`.
4. Diz ao aluno quanto tempo vai demorar (normalmente 30 a 60 minutos).

## Aula interativa (um bloco de cada vez)

**1. Pré-teste (2–3 min).** Faz 2 ou 3 perguntas sobre o que vem a seguir. O aluno tenta mesmo sem saber, e depois dás a correção curta. Explica que errar aqui é normal e ajuda a fixar.

**2. Mapa (1 min).** A estrutura da aula em 4 a 6 linhas, com as fontes.

**3. Blocos de explicação.** Para cada objetivo:
- Explica numa mensagem curta (no máximo cerca de 150 palavras ou um passo de cálculo), com fonte e notação do professor.
- Quando houver gráfico ou fórmula com parâmetros, cria um **artifact interativo** (`references/visual.md`) com desafio de previsão: o aluno prevê, mexe e confirma.
- Faz **uma pergunta de compreensão** e espera pela resposta. Se o aluno errar, reexplica de outra maneira (outro exemplo dos materiais, um visual) e volta a perguntar. Não avances com a base errada.
- Cadeiras práticas: exemplo resolvido dos materiais com autoexplicação ("porque é que se faz isto aqui?"), depois o mesmo exercício com passos em falta.
- Cadeiras teóricas: depois de cada ideia, um "porquê?" e um "qual a diferença entre X e Y?".

**4. Síntese pelo aluno (2 min).** Pede-lhe que explique a aula em 3 ou 4 frases. Corrige o que faltar.

**5. Fecho da etapa ①.**
- Escreve o resumo da aula em `<Cadeira>/aulas/AAAA-MM-DD-<tema>.md` (formato abaixo). Serve de mapa, não de método de estudo.
- Cria poucos flashcards (5 a 10), só do que tem mesmo de ser memorizado: definições, fórmulas, distinções. Servem para manutenção e não são o centro do estudo.
- Corre `aprendida <id> --resumo <caminho>`. A aula passa para a etapa ②.
- Diz o próximo passo: "amanhã ou depois: etapa ②, treinar e verificar esta aula".

## Variante: recordar
Usa-a quando a aula está em `recordar` (falhou a verificação), quando o aluno diz "já dei isto mas esqueci-me" ou numa cadeira em atraso.
1. **Diagnóstico primeiro:** 4 a 6 perguntas rápidas sobre a aula toda (ou os pontos falhados indicados em `resultados.csv`).
2. Reexplica **só o que falhou**, com outra representação (visual, exemplo numérico diferente dos materiais).
3. Uma pergunta de compreensão por ponto.
4. `aprendida <id>` e volta à etapa ②.

Duração típica: 15 a 25 minutos, contra os 30 a 60 de aprender do zero.

## Regras
- **Ritmo do aluno:** uma pergunta de cada vez, sem despejar a aula numa mensagem só.
- Se ele disser "não percebi", não repitas igual: muda de representação (palavras → gráfico → exemplo numérico → analogia **que esteja nos materiais**).
- Se faltar material (slides incompletos, matéria dada no quadro), diz exatamente o que falta e sugere pedir os apontamentos a um colega.
- Versão rápida (por exemplo, véspera de exame): mapa, ideias-chave e perguntas. Avisa que é a versão curta.

## Formato do resumo da aula

```markdown
# <Cadeira> · Aula <id> · <data> · <tipo T/TP/P>
**Matéria:** <capítulo/slides>   **Domínio:** <domínio>
**Fontes:** <ficheiros e slides usados>

## Objetivos
- …

## Ideias-chave
1. <conceito> — <explicação curta> [fonte]

## Fórmulas e gráficos
- <fórmula com notação do prof.> — <significado das letras> [fonte]

## Armadilhas
- …

## Ligações
- Usa: <matéria anterior> · Prepara: <matéria seguinte>
```
