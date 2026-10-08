# Aprendizagem visual e interativa (artifacts no chat)

O aluno aprende melhor a **ver e mexer**. Sempre que ajudar a perceber, cria um artifact HTML que aparece no próprio chat. Os modelos prontos estão em `assets/`.

| Modelo | Para quê | O que substituis |
|---|---|---|
| `flashcards.html` | Sessão de revisão (spaced repetition) | O array entre `/*DECK*/` e `/*FIM*/` (output de `deck`) |
| `quiz.html` | Mini-quiz depois de uma aula, quiz diagnóstico ou simulação (`modo: "exame"`) | O objeto entre `/*QUIZ*/` e `/*FIM*/` |
| `grafico.html` | Gráfico com sliders: curvas, equilíbrios, deslocamentos | O objeto entre `/*CONFIG*/` e `/*FIM*/` |

Copia o ficheiro, substitui **só** o bloco de dados e mantém o resto. Para outros visuais (painel de proficiência, árvore de conceitos, linha do tempo, simulação estatística) escreve um artifact novo com o mesmo estilo: variáveis de cor em `:root`, modo escuro, largura de telemóvel e sem bibliotecas pesadas.

## Regra de ouro: os dados vêm dos materiais
- Funções, parâmetros, nomes de eixos e notação **saem dos slides**. Se o professor usa P = a − bQ, o gráfico usa isso.
- Mostra sempre a **fonte** no artifact.
- Os valores numéricos de exemplo devem ser os dos exercícios dos materiais, quando existirem.

## Como tornar o visual útil (e não só bonito)
1. **Prevê antes de mexer.** Usa o campo `desafio`: uma pergunta ("o que acontece a Y* se ↑G?"). O aluno responde no chat ou para si, depois mexe e confirma. Isto transforma o gráfico em prática de recuperação.
2. **Uma ideia por gráfico.** Nada de elementos decorativos (princípio de coerência de Mayer).
3. **Leituras numéricas** ao lado do gráfico (equilíbrio, excedentes, multiplicadores) para ligar o desenho ao cálculo.
4. No fim, cria um cartão de deslocamento ou de efeito para cada conclusão importante.

## Ideias por cadeira (adaptar sempre aos materiais)
- **Micro:** procura/oferta com deslocamentos e impostos; restrição orçamental e curvas de indiferença; custos (CMg, CMe) e escolha de produção; monopólio vs concorrência.
- **Macro:** cruz keynesiana e multiplicador; IS-LM / AD-AS com política orçamental e monetária; crescimento (Solow) com sliders de s, n e δ.
- **Matemática:** função com sliders dos coeficientes, reta tangente num ponto (derivada), curvas de nível, ótimos com restrição.
- **Estatística:** normal com μ e σ (área entre dois valores); simulação do Teorema do Limite Central; intervalos de confiança a variar com n e com o nível; regressão com pontos arrastáveis.
- **Teóricas (Direito, etc.):** árvore de conceitos clicável, quadros comparativos que abrem ao clicar, linha do tempo e fluxograma de decisão ("o caso cai no regime X ou Y?"), tudo com base nos materiais.

## `grafico.html`: referência do CONFIG
```js
{
  titulo, fonte,
  x: {label, min, max}, y: {label, min, max},
  params: [{id, label, min, max, step, valor}],
  curvas: [{nome, f: (x, p) => y, cor?: "--c1".."--c5", tracejado?: true, inversa?: true}],
  pontos: [{nome, calc: p => ({x, y}), guias?: true}],
  leituras: p => ({"Rótulo": valor}),
  desafio: {pergunta, explicacao}   // opcional
}
```
Para curvas verticais ou definidas como x = g(y) (por exemplo, LM vertical), usa `inversa: true` com `f(y, p)` a devolver x.

## Painel de proficiência
Usa `proficiencia --json` com: barras por cadeira, uma grelha de subdomínios colorida por nível (vermelho, laranja, verde, azul para forte, cinzento para por avaliar), a memória e a aplicação lado a lado no subdomínio selecionado e o top 5 dos pontos fracos com o próximo passo sugerido.
