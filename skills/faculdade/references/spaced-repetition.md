# Spaced repetition: como funciona

## Algoritmo: FSRS-4.5

É o algoritmo moderno usado no Anki. Para a mesma retenção, pede menos revisões do que as caixas de Leitner ou o SM-2. Cada cartão tem:
- **Estabilidade (S):** número de dias até a probabilidade de te lembrares cair para 90%.
- **Dificuldade (D):** de 1 a 10. Quanto maior, menos a estabilidade cresce a cada acerto.
- **Retrievability:** R(t) = (1 + 19/81 · t/S)^-0,5, a probabilidade de te lembrares passados t dias.

A próxima revisão é marcada para quando R desce para a **retenção alvo**: 90% normalmente e **95% nos 14 dias antes do exame**, o que torna as revisões mais frequentes nessa fase. Nenhum intervalo passa da véspera do exame. Ao errar, o cartão volta no dia seguinte.

## Notas

| Nota | Botão | Quando usar |
|---|---|---|
| 0 | Errei | Não sabias ou estava errado |
| 1 | Difícil | Acertaste, mas com esforço ou de forma incompleta |
| 2 | Bem | Acertaste com segurança |
| 3 | Fácil | Imediato, sem pensar |

Se a resposta foi vaga ou "por sorte", a nota máxima é 1. **Só a primeira resposta do dia conta para o agendamento.** As repetições dentro da sessão servem para reaprender e o script ignora-as.

## Fluxo de revisão (preferido): artifact no chat

1. `deck --limit 30 --out deck.json` (ou sem `--out`, para ler o JSON).
2. Copia `assets/flashcards.html`, substitui o array entre `/*DECK*/` e `/*FIM*/` pelo JSON e mostra-o como artifact.
3. O aluno faz a sessão: escreve ou pensa a resposta, vira o cartão e dá a nota. Os errados voltam no fim.
4. No fim, o aluno cola no chat o código `RESULTADOS:{...}`.
5. `registar 'RESULTADOS:{...}'` reagenda tudo e regista para a proficiência.
6. Fecha com: % de acertos, temas fracos e o número de cartões para amanhã.

**Alternativa no chat**, se o aluno preferir ou se não houver artifacts: um cartão de cada vez (frente → resposta → verso e fonte → nota), seguido de `review ID NOTA`.

## Cartões novos
- No máximo **20 novos por dia** (opção `--novos`). Mais do que isso faz disparar as revisões dos dias seguintes.
- Os cartões só são criados **depois** de a matéria ter sido estudada ou ensinada.

## Regras para bons cartões
- **Uma ideia por cartão.** Pergunta precisa, resposta que se lê em menos de 10 segundos.
- **Notação do professor** e **fonte obrigatória** (`Slides Cap. 2, slide 14`, `Ficha 3, ex. 2`).
- Preenche sempre `dominio` (capítulo ou grande tema) e `subdominio` (tópico). É isso que alimenta a análise de proficiência.
- Varia os tipos:
  - **Definição / distinção:** "Diferença entre custo de oportunidade e custo contabilístico?"
  - **Porquê:** "Porque é que a procura tem inclinação negativa? (segundo os slides)"
  - **Gráfico / deslocamento:** "↑M: o que acontece à LM?"
  - **Passo de método:** "1.º passo para maximizar U sujeito à restrição orçamental?"
  - **Condição:** "Quando se usa o teste t em vez do z?"
  - **Armadilha:** um erro típico que os slides ou as correções assinalam.
  - **Cálculo rápido:** feito em menos de 1 minuto.
- Fórmulas em LaTeX entre `$...$` (o artifact mostra-as formatadas).
- Cadeiras práticas: os cartões apoiam os exercícios mas não os substituem.

## Ficheiro de importação

```csv
cadeira,dominio,subdominio,aula,frente,verso,fonte
Microeconomia I,Procura,Elasticidade,7,"Fórmula da elasticidade-preço da procura","$\varepsilon = \frac{\Delta Q/Q}{\Delta P/P}$","Slides Cap. 2, slide 8"
```

## Anki (opcional)
`export-anki` gera um ficheiro para importar no Anki (Ficheiro → Importar). Se o aluno passar a rever no Anki, deixa de usar `review` e `registar` para essas cadeiras, para não haver dois agendamentos em paralelo.
