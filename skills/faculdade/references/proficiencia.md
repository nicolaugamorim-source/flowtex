# Proficiência: medir e melhorar

## Hierarquia
**Cadeira › Domínio › Subdomínio.** Exemplo: Macroeconomia I › Modelo IS-LM › Política monetária.
- Domínio corresponde normalmente a um capítulo ou grande tema do programa.
- Subdomínio é um tópico avaliável dentro dele.
- Define a lista de domínios a partir do **programa ou índice dos slides** de cada cadeira e mantém os nomes consistentes. Nomes diferentes para o mesmo tópico estragam a análise.

## Como se calcula (`proficiencia`)
Para cada subdomínio:
- **Memória:** média, nos cartões revistos, da probabilidade de te lembrares **daqui a 7 dias** (FSRS).
- **Aplicação:** média ponderada dos resultados, com peso por origem (cartão 1 · quiz 1,5 · explicação 1,5 · exercício 2 · verificação 3 · simulação 3) e decaimento temporal com meia-vida de 21 dias. Os resultados recentes contam mais.
- **Score** = 35% memória + 65% aplicação. Se só houver uma das duas, usa essa.
- Domínio e cadeira: média ponderada pelo número de evidências.

| Score | Nível |
|---|---|
| ≥ 85% | ✅ forte |
| 70–84% | 🟢 bom |
| 50–69% | 🟠 a melhorar |
| < 50% | 🔴 fraco |
| sem dados | ⚪ por avaliar |

Com menos de 5 evidências aparece "⚠️ poucos dados": trata o valor como indicativo.

## Registar evidências
Tudo o que mede desempenho deve ser registado:
- **Cartões:** automático, via `review` ou `registar`.
- **Quizzes, verificações de domínio e simulações** no artifact: `registar 'RESULTADOS:{...}'`.
- **Exercícios no chat:** `resultado --cadeira X --dominio D --subdominio S --origem exercicio --acerto 0.75`. Escala do acerto: 1 = certo e sozinho, 0,75 = com uma pista, 0,5 = com várias pistas ou erro menor, 0,25 = só com a solução, 0 = não conseguiu.
- **Perguntas de verificação nas aulas:** `--origem explicacao`, com a mesma escala.
- **Notas reais** de frequências ou testes, se o aluno as der: `--origem simulacao` com acerto = nota/20, no domínio "(geral)" ou nos domínios avaliados.

## Diagnóstico (modo "como estou?")
1. Corre `proficiencia` (ou `--json` para um painel visual).
2. Mostra um **painel** em artifact: barras por cadeira, um mapa de calor domínio × subdomínio com a cor do nível e os 5 subdomínios mais fracos. Segue as regras de `references/visual.md`.
3. Interpreta:
   - **Memória alta e aplicação baixa:** sabe as definições mas não as usa. Precisa de exercícios e casos.
   - **Memória baixa e aplicação alta:** percebe mas esquece. Precisa de mais cartões e de cumprir as revisões.
   - **Ambas baixas:** voltar à etapa ① (recordar, `references/etapa1-aprender.md`).
   - **Por avaliar:** matéria dada sem nenhuma evidência. Fazer um quiz diagnóstico curto.
4. Propõe um **plano de ataque** com no máximo 3 focos para a semana, ordenados por: peso no exame × fraqueza × proximidade do exame.
5. Regista em `progresso.md` → "Pontos fracos" com a data, para comparar a evolução no check-in seguinte.
