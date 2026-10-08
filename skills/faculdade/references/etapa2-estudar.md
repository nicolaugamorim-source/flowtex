# Etapa ② Estudar e verificar

**Objetivo: dominar a matéria e provar que ficou.** Na etapa ① o aluno percebeu a aula. Aqui treina até conseguir aplicá-la **sozinho, sem pistas e noutro dia**, que é o que o exame exige.

Uma aula só sai desta etapa quando passa a **verificação de domínio**.

## Parte A: estudar (treino ativo)

Começa no dia seguinte à etapa ① ou mais tarde. O espaçamento faz parte do método. Cada sessão dura 25 a 50 minutos.

### Cadeiras práticas (Matemática, Estatística, Econometria)
1. **Aquecimento sem ajuda:** 1 exercício base dos materiais. Se o aluno falhar, ainda não está pronto: volta ao exemplo resolvido.
2. **Exercícios progressivos** das fichas e exames antigos: do mais simples ao tipo exame.
3. **Pistas progressivas:** pista 1 (qual é o método) → pista 2 (o primeiro passo) → pista 3 (o passo em que o aluno está preso). A solução só aparece depois de uma tentativa real.
4. **Intercalar:** misturar exercícios desta aula com exercícios de aulas anteriores. Escolher o método é parte do treino.
5. Regista cada exercício com `resultado --origem exercicio --acerto` (1 sozinho · 0,75 com uma pista · 0,5 com várias · 0,25 só com a solução · 0 não conseguiu).

### Cadeiras teóricas (Direito, etc.)
1. **Explicar de cor:** "explica-me X sem olhar" e depois corriges com os materiais.
2. **Perguntas de desenvolvimento** tipo exame (dos exames antigos), respondidas por escrito no chat. Corrige com uma grelha tirada dos materiais: conceitos que deviam aparecer, estrutura e precisão dos termos.
3. **Casos práticos**, quando os exames os tiverem: estrutura de resposta segundo os materiais.
4. **Comparar e ligar:** "qual a diferença entre…", "como se relaciona com a aula anterior?".

### Cadeiras mistas (Micro, Macro)
Teoria (explicar de cor, gráficos de deslocamento: o aluno descreve ou desenha o efeito antes de mexer no artifact) e cálculo (equilíbrios, multiplicadores, elasticidades), tratado como nas práticas.

### Flashcards nesta etapa
São só **manutenção**, 10 a 15 minutos por dia, para não esquecer definições e fórmulas. Não substituem os exercícios nem a verificação.

## Parte B: verificar (teste de domínio)

### Quando
- **Nunca no mesmo dia** em que a aula foi aprendida (o script não aceita). Logo a seguir a aprender, tudo parece sabido.
- Quando o aluno acerta os exercícios tipo exame com no máximo uma pista, ou quando ele próprio pede.

### Como
1. Prepara **6 a 10 perguntas** que cubram **todos os objetivos** da aula, com cada pergunta marcada com o seu subdomínio:
   - pelo menos metade de **aplicação** (exercício, caso, "o que acontece se…"), não só definições;
   - pelo menos uma de **ligação** com uma aula anterior;
   - estilo e dificuldade dos exames antigos, com cada pergunta tirada dos materiais ou baseada num exercício identificado.
2. Para perguntas fechadas e numéricas, usa `assets/quiz.html` com `"modo": "verificacao"` e `"aula": "<id>"`, sem pistas nem correção até ao fim.
3. Perguntas abertas (teóricas) vão no chat: o aluno responde a todas, depois corriges cada uma com cotação de 0 a 1.
4. Regista:
   - artifact: o aluno cola o código → `registar 'RESULTADOS:{...}'`;
   - chat: `verificar <id> --acerto <média>` (ou um `resultado --origem verificacao` por subdomínio e depois `verificar`).

### Critério de domínio
| Resultado | Etapa seguinte |
|---|---|
| ≥ 80% **e** nenhum subdomínio abaixo de 50% **e** noutro dia | ✅ **dominada**: só manutenção |
| ≥ 80%, mas com subdomínios abaixo de 50% | Continua em ②: treinar esses pontos e reverificar só esses |
| 50–79% | Continua em ②: mais treino nos pontos falhados e reverificar daqui a 1 ou 2 dias |
| < 50% | Volta a ① **recordar** os pontos falhados |

O script aplica estas regras sozinho.

### Depois da verificação
- Mostra o resultado por subdomínio e diz exatamente o que falhou.
- Cria flashcards **só** para os erros de memória (definição, fórmula). Os erros de aplicação treinam-se com mais exercícios e não com cartões.

## Manter o domínio
- Uma aula dominada entra nos **quizzes intercalados** semanais da cadeira (perguntas misturadas de várias aulas dominadas).
- Se a proficiência de um subdomínio de uma aula dominada cair abaixo de 70%, marca a aula como `estudar` (`aula set <id> --etapa estudar`) e agenda uma nova verificação.
- Antes do exame: simulação completa (`references/planeamento.md`).
