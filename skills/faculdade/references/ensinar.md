# Ensinar uma aula (perdida ou por estudar)

Usa este protocolo quando o aluno faltou a uma aula, quer aprender um capítulo do zero ou diz "ensina-me a aula X". Toda a matéria vem dos materiais dessa aula. Antes de começar, lê os slides e apontamentos completos.

## Antes de começar
1. Identifica a aula em `aulas.csv` (ou regista-a com `aula add`).
2. Lê o material **todo** e define 3 a 5 **objetivos** ("no fim deves conseguir…"), tirados dos slides ou do programa.
3. Vê o tipo de cadeira (`cadeiras.csv`) e escolhe o plano certo em `references/metodos.md`.
4. Estima o tempo (normalmente 30 a 60 minutos) e diz-o ao aluno.

## Estrutura da aula (interativa, um bloco de cada vez)

**1. Pré-teste (2–3 min).** Faz 2 ou 3 perguntas sobre o que vem a seguir. O aluno tenta, mesmo sem saber, e depois dás a correção curta. Explica que errar aqui é normal e ajuda a memorizar.

**2. Mapa (1 min).** A estrutura da aula em 4 a 6 linhas, com as fontes.

**3. Blocos de explicação.** Para cada objetivo:
- Explica numa mensagem curta (no máximo cerca de 150 palavras ou um passo de cálculo), com fonte e notação do professor.
- Quando houver gráfico ou fórmula com parâmetros, cria um **artifact interativo** (ver `references/visual.md`) com desafio de previsão.
- Faz **uma pergunta de verificação** e espera pela resposta. Se o aluno errar, reexplica de outra maneira (outro exemplo dos materiais, um visual) e volta a perguntar. Não avances com a base errada.
- Cadeiras práticas: exemplo resolvido dos materiais com autoexplicação ("porque é que se faz isto aqui?"), depois o mesmo tipo de exercício com lacunas, depois sozinho.

**4. Síntese pelo aluno (2 min).** Pede-lhe que explique a aula toda em 3 ou 4 frases. Corrige o que faltar.

**5. Fecho.**
- Escreve o resumo da aula em `<Cadeira>/aulas/AAAA-MM-DD-<tema>.md` (formato abaixo).
- Propõe 5 a 12 cartões e importa-os depois do "ok", com `aula=<id>`.
- Faz um mini-quiz de 4 a 6 perguntas (artifact `quiz.html`, modo treino) e regista os resultados.
- Executa `aula set <id> --estudada sim --resumo <caminho>`.

## Regras
- **Ritmo do aluno:** uma pergunta de cada vez, sem despejar a aula inteira numa mensagem.
- Se ele disser "não percebi", não repitas igual: muda de representação (passa de palavras para um gráfico, para um exemplo numérico ou para uma analogia **que esteja nos materiais**).
- Se o aluno quiser só um resumo rápido (por exemplo, véspera de exame), faz o resumo seguido de quiz e avisa que é a versão curta.
- Se faltar material da aula (slides incompletos ou matéria dada no quadro), diz-lhe exatamente o que falta e sugere pedir os apontamentos a um colega.

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
