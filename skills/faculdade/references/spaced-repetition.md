# Spaced repetition: como funciona

## Caixas de Leitner

Cada cartão está numa caixa. Quanto mais alta a caixa, mais tempo passa até voltar a aparecer.

| Caixa | Próxima revisão |
|---|---|
| 0 | hoje (cartão novo) |
| 1 | 1 dia |
| 2 | 3 dias |
| 3 | 7 dias |
| 4 | 14 dias |
| 5 | 30 dias |
| 6 | 60 dias |

## Notas

| Nota | Significado | Efeito |
|---|---|---|
| 0 | Errei / não sabia | Volta à caixa 1 (amanhã) e repete no fim da sessão |
| 1 | Acertei com dificuldade | Fica na mesma caixa (mínimo 1) |
| 2 | Acertei bem | Sobe 1 caixa |
| 3 | Fácil, imediato | Sobe 2 caixas |

**Limite do exame:** se a cadeira tem data de exame, nenhum cartão é agendado para depois da véspera. Assim, tudo é revisto pelo menos uma vez antes do exame.

## Como conduzir a revisão

1. Mostra apenas: `[Cadeira · Tema] Frente`.
2. Espera pela resposta do aluno. Não mostres o verso antes.
3. Compara a resposta com o verso. Diz o que estava certo e o que faltou, e mostra o verso com a fonte.
4. Sugere uma nota com base na resposta, mas a decisão final é do aluno.
5. `review ID NOTA`.
6. Junta os cartões com nota 0 e repete-os no fim.

Se o aluno acertar só "por sorte" ou de forma vaga, a nota máxima é 1.

## Regras para bons cartões

- **Uma ideia por cartão.** "Define elasticidade-preço e dá a fórmula" são dois cartões.
- **Pergunta precisa, resposta curta.** O verso deve ler-se em menos de 10 segundos.
- **Notação do professor**, sempre.
- **Fonte obrigatória** em todos os cartões: `Slides Cap. 2, slide 14`, `Ficha 3, ex. 2`, `Apontamentos aula 05/10`.
- Para além de definições, usa estes tipos de cartão:
  - **Porquê**: "Porque é que a curva da procura tem inclinação negativa? (segundo os slides)"
  - **Gráfico**: "No modelo IS-LM, o que acontece à LM com ↑M?"
  - **Passo de método**: "1.º passo para maximizar a utilidade com restrição orçamental (método do prof.)?"
  - **Armadilha**: erros que os slides ou as correções de exame assinalam.
  - **Exercício curto**: cálculo que se faz em menos de 1 minuto.
- Não faças cartões de matéria que o aluno ainda não estudou. Primeiro estuda-se o tema, depois memoriza-se.
- Entre 5 e 15 cartões por aula ou capítulo costuma chegar. Qualidade acima de quantidade.

## Ficheiro de importação

CSV com cabeçalho `cadeira,tema,frente,verso,fonte`. Usa aspas quando houver vírgulas no texto:

```csv
cadeira,tema,frente,verso,fonte
Microeconomia II,Elasticidades,"Fórmula da elasticidade-preço da procura (notação do prof.)","ε = (ΔQ/Q)/(ΔP/P)","Slides Cap. 2, slide 8"
```

## Anki

`export-anki` gera um ficheiro de texto separado por tabulações (frente, verso com a fonte, tags). No Anki: Ficheiro → Importar → separador "Tab", com HTML ativo. A partir daí o Anki agenda as revisões sozinho. Se o aluno passar a usar o Anki, deixa de usar o `review` para essas cadeiras, para não haver dois agendamentos.
