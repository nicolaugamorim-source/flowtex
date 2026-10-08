#!/usr/bin/env python3
"""Gestão de estudo: cadeiras, horário, aulas (com as 2 etapas: aprender → estudar e
verificar), cartões (FSRS-4.5), resultados, proficiência e briefing diário.

Só usa a biblioteca padrão. Dados em CSV, legíveis e editáveis.
Uso: python3 faculdade.py --dir faculdade <comando> [...]
"""
import argparse
import csv
import datetime as dt
import json
import math
import os
import sys

# ---------------------------------------------------------------- FSRS-4.5
W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
     0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755]
DECAY = -0.5
FACTOR = 19 / 81
RETENCAO = 0.90          # retenção alvo normal
RETENCAO_EXAME = 0.95    # nos últimos 14 dias antes do exame
INTERVALO_MAX = 365


def retrievability(dias, estab):
    return (1 + FACTOR * dias / estab) ** DECAY


def intervalo(estab, retencao):
    return estab / FACTOR * (retencao ** (1 / DECAY) - 1)


def _clamp_d(d):
    return min(max(d, 1.0), 10.0)


def d_inicial(g):
    return _clamp_d(W[4] - (g - 3) * W[5])


def fsrs(estab, dific, dias, g):
    """Devolve (estabilidade, dificuldade) após responder com nota g (1–4)."""
    if estab is None:  # primeira revisão
        return W[g - 1], d_inicial(g)
    r = retrievability(dias, estab)
    if g == 1:
        nova_s = W[11] * dific ** -W[12] * ((estab + 1) ** W[13] - 1) * math.exp(W[14] * (1 - r))
        nova_s = min(nova_s, estab)
    else:
        bonus = W[15] if g == 2 else W[16] if g == 4 else 1.0
        nova_s = estab * (math.exp(W[8]) * (11 - dific) * estab ** -W[9]
                          * (math.exp(W[10] * (1 - r)) - 1) * bonus + 1)
    nova_d = _clamp_d(W[7] * d_inicial(3) + (1 - W[7]) * (dific - W[6] * (g - 3)))
    return max(nova_s, 0.1), nova_d


# ---------------------------------------------------------------- dados
CAMPOS = {
    "cadeiras": ["cadeira", "ano", "semestre", "estado", "tipo", "avaliacao", "data_exame"],
    "horario": ["cadeira", "dia", "inicio", "fim", "tipo", "sala"],
    "aulas": ["id", "data", "cadeira", "tipo", "materia", "dominio", "presenca",
              "etapa", "aprendida_em", "verificada_em", "nota_verif", "resumo", "notas"],
    "cartoes": ["id", "cadeira", "dominio", "subdominio", "aula", "frente", "verso", "fonte",
                "estabilidade", "dificuldade", "proxima", "ultima", "revisoes", "erros", "criado"],
    "resultados": ["data", "cadeira", "dominio", "subdominio", "origem", "acerto", "ref"],
}
DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"]
PESO_ORIGEM = {"cartao": 1.0, "quiz": 1.5, "explicacao": 1.5, "exercicio": 2.0,
               "verificacao": 3.0, "simulacao": 3.0}
# Etapas de cada aula: aprender → estudar → dominada (se a verificação falhar: recordar → estudar)
ETAPAS = ["aprender", "recordar", "estudar", "dominada"]
MARCA_ETAPA = {"aprender": "① aprender", "recordar": "① recordar", "estudar": "② estudar",
               "dominada": "✅ dominada"}
LIMIAR_DOMINIO = 0.80
ACERTO_NOTA = {0: 0.0, 1: 0.6, 2: 1.0, 3: 1.0}
MEIA_VIDA_DIAS = 21
NOVOS_POR_DIA = 20
HORIZONTE_MEMORIA = 7

DIR = "faculdade"


def hoje():
    return dt.date.today()


def caminho(nome):
    return os.path.join(DIR, f"{nome}.csv")


def ler(nome):
    p = caminho(nome)
    if not os.path.exists(p):
        return []
    with open(p, newline="", encoding="utf-8") as f:
        return [{c: (r.get(c) or "") for c in CAMPOS[nome]} for r in csv.DictReader(f)]


def escrever(nome, linhas):
    p = caminho(nome)
    tmp = p + ".tmp"
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS[nome])
        w.writeheader()
        w.writerows(linhas)
    os.replace(tmp, p)


def acrescentar(nome, linha):
    linhas = ler(nome)
    linhas.append(linha)
    escrever(nome, linhas)


def data(s):
    return dt.date.fromisoformat(s) if s else None


def novo_id(linhas):
    return str(max((int(l["id"]) for l in linhas if l["id"].isdigit()), default=0) + 1)


def mesma(a, b):
    return a.strip().lower() == b.strip().lower()


def cadeira_canonica(nome):
    for c in ler("cadeiras"):
        if mesma(c["cadeira"], nome):
            return c["cadeira"]
    return nome


def exames():
    return {c["cadeira"]: data(c["data_exame"]) for c in ler("cadeiras") if c["data_exame"]}


# ---------------------------------------------------------------- comandos: setup
def cmd_init(a):
    os.makedirs(DIR, exist_ok=True)
    for nome in CAMPOS:
        if not os.path.exists(caminho(nome)):
            escrever(nome, [])
    prog = os.path.join(DIR, "progresso.md")
    if not os.path.exists(prog):
        with open(prog, "w", encoding="utf-8") as f:
            f.write("# Progresso\n\n## Perfil e preferências\n\n## Pontos fracos\n\n"
                    "## Planos semanais\n\n## Registo de sessões\n")
    print(f"Pasta pronta: {DIR}")


def cmd_cadeira(a):
    linhas = ler("cadeiras")
    if a.exame:
        data(a.exame)
    atual = next((l for l in linhas if mesma(l["cadeira"], a.nome)), None)
    if atual is None:
        atual = {c: "" for c in CAMPOS["cadeiras"]}
        atual["cadeira"] = a.nome
        linhas.append(atual)
    for campo in ("ano", "semestre", "estado", "tipo", "avaliacao"):
        if getattr(a, campo) is not None:
            atual[campo] = getattr(a, campo)
    if a.exame is not None:
        atual["data_exame"] = a.exame
    escrever("cadeiras", linhas)
    print("Cadeira guardada: " + ", ".join(f"{k}={v}" for k, v in atual.items() if v))


def cmd_horario(a):
    linhas = ler("horario")
    if a.acao == "add":
        if a.dia not in DIAS:
            sys.exit(f"Dia inválido. Usa: {', '.join(DIAS)}")
        linhas.append({"cadeira": cadeira_canonica(a.cadeira), "dia": a.dia,
                       "inicio": a.inicio, "fim": a.fim, "tipo": a.tipo or "", "sala": a.sala or ""})
        escrever("horario", linhas)
        print("Bloco de horário adicionado.")
    elif a.acao == "rm":
        resto = [l for l in linhas if not (mesma(l["cadeira"], a.cadeira)
                                           and (not a.dia or l["dia"] == a.dia))]
        escrever("horario", resto)
        print(f"Removidos {len(linhas) - len(resto)} bloco(s).")
    else:
        for d in DIAS:
            bloco = sorted((l for l in linhas if l["dia"] == d), key=lambda l: l["inicio"])
            if bloco and (not a.dia or a.dia == d):
                print(f"{d}: " + " | ".join(
                    f"{l['inicio']}–{l['fim']} {l['cadeira']} {l['tipo']} {l['sala']}".strip()
                    for l in bloco))


def cmd_aula(a):
    linhas = ler("aulas")
    if a.acao == "add":
        l = {"id": novo_id(linhas), "data": a.data or hoje().isoformat(),
             "cadeira": cadeira_canonica(a.cadeira), "tipo": a.tipo or "",
             "materia": a.materia, "dominio": a.dominio or "", "presenca": a.presenca or "",
             "etapa": "aprender", "aprendida_em": "", "verificada_em": "", "nota_verif": "",
             "resumo": "", "notas": a.notas or ""}
        data(l["data"])
        linhas.append(l)
        escrever("aulas", linhas)
        print(f"Aula {l['id']} registada: {l['data']} · {l['cadeira']} · {l['materia']}")
    elif a.acao == "set":
        l = next((l for l in linhas if l["id"] == str(a.id)), None)
        if l is None:
            sys.exit(f"Aula {a.id} não existe.")
        for campo in ("materia", "dominio", "presenca", "etapa", "resumo", "notas", "tipo"):
            v = getattr(a, campo, None)
            if v is not None:
                l[campo] = v
        escrever("aulas", linhas)
        print(f"Aula {l['id']} atualizada ({MARCA_ETAPA.get(l['etapa'], l['etapa'])}).")
    else:
        sel = [l for l in linhas if (not a.cadeira or mesma(l["cadeira"], a.cadeira))
               and (not a.pendentes or l["etapa"] != "dominada")]
        sel.sort(key=lambda l: (l["cadeira"], l["data"]))
        atual = None
        for l in sel:
            if l["cadeira"] != atual:
                atual = l["cadeira"]
                print(f"\n== {atual}")
            marca = MARCA_ETAPA.get(l["etapa"], l["etapa"])
            falta = " ❗faltei" if l["presenca"] == "faltei" else ""
            dom = f" [{l['dominio']}]" if l["dominio"] else ""
            verif = f" · verificação {float(l['nota_verif']):.0%}" if l["nota_verif"] else ""
            print(f"  #{l['id']} {l['data']} {l['tipo']} {marca}{falta} · {l['materia']}{dom}{verif}")
        if not sel:
            print("Sem aulas registadas.")


def obter_aula(linhas, aid):
    l = next((l for l in linhas if l["id"] == str(aid)), None)
    if l is None:
        sys.exit(f"Aula {aid} não existe.")
    return l


def cmd_aprendida(a):
    """Fim da etapa 1: a aula foi aprendida (ou recordada) e passa a 'estudar'."""
    linhas = ler("aulas")
    l = obter_aula(linhas, a.id)
    l["etapa"] = "estudar"
    l["aprendida_em"] = hoje().isoformat()
    if a.resumo:
        l["resumo"] = a.resumo
    escrever("aulas", linhas)
    print(f"Aula {l['id']} → ② estudar. Verificação possível a partir de "
          f"{(hoje() + dt.timedelta(days=1)).isoformat()}.")


def aplicar_verificacao(linhas, aid, itens, cadeira_def=""):
    """Regista a verificação de uma aula e decide a etapa seguinte."""
    l = obter_aula(linhas, aid)
    for i in itens:
        registar_resultado(i.get("cadeira") or cadeira_def or l["cadeira"],
                           i.get("dominio") or l["dominio"], i.get("subdominio", ""),
                           "verificacao", i["acerto"], i.get("ref", f"aula#{aid}"))
    media = sum(float(i["acerto"]) for i in itens) / len(itens)
    h = hoje()
    l["nota_verif"] = f"{media:.2f}"
    l["verificada_em"] = h.isoformat()
    mesmo_dia = not l["aprendida_em"] or data(l["aprendida_em"]) >= h
    por_sub = {}
    for i in itens:
        por_sub.setdefault(i.get("subdominio", "") or "(geral)", []).append(float(i["acerto"]))
    fracos_sub = sorted(k for k, v in por_sub.items() if sum(v) / len(v) < 0.5)
    if media >= LIMIAR_DOMINIO and not mesmo_dia and not fracos_sub:
        l["etapa"] = "dominada"
        msg = f"✅ Aula {aid} dominada ({media:.0%}). Fica em manutenção (flashcards + verificações intercaladas)."
    elif media >= LIMIAR_DOMINIO and mesmo_dia:
        l["etapa"] = "estudar"
        msg = (f"Aula {aid}: {media:.0%}, mas no mesmo dia em que foi aprendida não conta. "
               f"Repete a verificação amanhã ou depois.")
    elif media >= LIMIAR_DOMINIO:
        l["etapa"] = "estudar"
        msg = f"Aula {aid}: {media:.0%} no total, mas há pontos que falharam. Treina-os e reverifica só esses."
    elif media >= 0.5:
        l["etapa"] = "estudar"
        msg = f"Aula {aid}: {media:.0%}. Continua na etapa ② e treina os pontos falhados antes de reverificar."
    else:
        l["etapa"] = "recordar"
        msg = f"Aula {aid}: {media:.0%}. Volta à etapa ① (recordar) nos pontos falhados."
    if fracos_sub:
        msg += " Pontos a trabalhar: " + ", ".join(fracos_sub) + "."
    return msg


def cmd_verificar(a):
    linhas = ler("aulas")
    msg = aplicar_verificacao(linhas, a.id, [{"subdominio": a.subdominio or "", "acerto": a.acerto,
                                               "dominio": a.dominio or ""}])
    escrever("aulas", linhas)
    print(msg)


# ---------------------------------------------------------------- cartões
def criar_cartao(cartoes, r):
    for campo in ("cadeira", "frente", "verso", "fonte"):
        if not (r.get(campo) or "").strip():
            sys.exit(f"Erro: cartão sem '{campo}' ({r.get('frente', '')[:40]}). Todo o cartão precisa de fonte.")
    c = {k: "" for k in CAMPOS["cartoes"]}
    c.update({"id": novo_id(cartoes), "cadeira": cadeira_canonica(r["cadeira"]),
              "dominio": r.get("dominio", "") or "", "subdominio": r.get("subdominio", "") or "",
              "aula": r.get("aula", "") or "", "frente": r["frente"].strip(),
              "verso": r["verso"].strip(), "fonte": r["fonte"].strip(),
              "proxima": hoje().isoformat(), "revisoes": "0", "erros": "0",
              "criado": hoje().isoformat()})
    cartoes.append(c)
    return c


def cmd_add(a):
    cartoes = ler("cartoes")
    c = criar_cartao(cartoes, vars(a))
    escrever("cartoes", cartoes)
    print(f"Cartão {c['id']} criado.")


def cmd_import(a):
    cartoes = ler("cartoes")
    existentes = {(c["cadeira"].lower(), c["frente"].strip().lower()) for c in cartoes}
    novos = saltados = 0
    with open(a.ficheiro, newline="", encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))
    for r in linhas:
        chave = (cadeira_canonica(r["cadeira"]).lower(), r["frente"].strip().lower())
        if chave in existentes:
            saltados += 1
            continue
        criar_cartao(cartoes, r)
        existentes.add(chave)
        novos += 1
    escrever("cartoes", cartoes)
    print(f"Importados: {novos}. Duplicados ignorados: {saltados}.")


def para_hoje(cadeira=None, limite=None, novos=NOVOS_POR_DIA):
    h = hoje()
    exs = exames()
    cartoes = [c for c in ler("cartoes") if data(c["proxima"]) <= h
               and (not cadeira or mesma(c["cadeira"], cadeira))]

    def prioridade(c):
        ex = exs.get(c["cadeira"])
        dias_ex = (ex - h).days if ex and ex >= h else 9999
        return (dias_ex, c["ultima"] == "", c["proxima"])

    cartoes.sort(key=prioridade)
    revisao = [c for c in cartoes if c["ultima"]]
    novos_l = [c for c in cartoes if not c["ultima"]][:novos]
    sel = revisao + novos_l
    return sel[:limite] if limite else sel, len(revisao), len(novos_l)


def cmd_due(a):
    sel, n_rev, n_nov = para_hoje(a.cadeira, a.limit, a.novos)
    print(f"Para hoje: {n_rev} revisões + {n_nov} novos. A mostrar {len(sel)}.")
    for c in sel:
        tag = "NOVO" if not c["ultima"] else f"S={float(c['estabilidade']):.1f}d"
        print(f"\n#{c['id']} [{c['cadeira']} · {c['dominio']} › {c['subdominio']}] {tag}")
        print(f"  FRENTE: {c['frente']}\n  VERSO:  {c['verso']}\n  FONTE:  {c['fonte']}")


def cmd_deck(a):
    sel, _, _ = para_hoje(a.cadeira, a.limit, a.novos)
    deck = [{k: c[k] for k in ("id", "cadeira", "dominio", "subdominio", "frente", "verso", "fonte")}
            | {"novo": not c["ultima"]} for c in sel]
    txt = json.dumps(deck, ensure_ascii=False)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(txt)
        print(f"Deck com {len(deck)} cartões em {a.out}")
    else:
        print(txt)


def rever(cartoes, cid, nota, exs):
    if nota not in (0, 1, 2, 3):
        return f"#{cid}: nota inválida ({nota})."
    c = next((c for c in cartoes if c["id"] == str(cid)), None)
    if c is None:
        return f"#{cid}: não existe."
    h = hoje()
    if c["ultima"] == h.isoformat():
        return f"#{cid}: já revisto hoje — repetição na sessão não altera o agendamento."
    estab = float(c["estabilidade"]) if c["estabilidade"] else None
    dific = float(c["dificuldade"]) if c["dificuldade"] else None
    dias = (h - data(c["ultima"])).days if c["ultima"] else 0
    s, d = fsrs(estab, dific, dias, nota + 1)
    ex = exs.get(c["cadeira"])
    ret = RETENCAO_EXAME if ex and 0 <= (ex - h).days <= 14 else RETENCAO
    dias_prox = 1 if nota == 0 else max(1, min(INTERVALO_MAX, round(intervalo(s, ret))))
    prox = h + dt.timedelta(days=dias_prox)
    if ex and ex > h:
        prox = min(prox, ex - dt.timedelta(days=1))
    prox = max(prox, h + dt.timedelta(days=1))
    c.update({"estabilidade": f"{s:.2f}", "dificuldade": f"{d:.2f}", "proxima": prox.isoformat(),
              "ultima": h.isoformat(), "revisoes": str(int(c["revisoes"]) + 1)})
    if nota == 0:
        c["erros"] = str(int(c["erros"]) + 1)
    acrescentar("resultados", {"data": h.isoformat(), "cadeira": c["cadeira"],
                               "dominio": c["dominio"], "subdominio": c["subdominio"],
                               "origem": "cartao", "acerto": str(ACERTO_NOTA[nota]),
                               "ref": f"cartao#{cid}"})
    return f"#{cid}: próxima revisão {prox.isoformat()} (estabilidade {s:.1f} dias)."


def cmd_review(a):
    cartoes = ler("cartoes")
    print(rever(cartoes, a.id, a.nota, exames()))
    escrever("cartoes", cartoes)


def registar_resultado(cadeira, dominio, subdominio, origem, acerto, ref=""):
    acerto = min(max(float(acerto), 0.0), 1.0)
    acrescentar("resultados", {"data": hoje().isoformat(), "cadeira": cadeira_canonica(cadeira),
                               "dominio": dominio or "", "subdominio": subdominio or "",
                               "origem": origem, "acerto": f"{acerto:.2f}", "ref": ref or ""})


def cmd_resultado(a):
    if a.origem not in PESO_ORIGEM:
        sys.exit(f"Origem inválida. Usa: {', '.join(PESO_ORIGEM)}")
    registar_resultado(a.cadeira, a.dominio, a.subdominio, a.origem, a.acerto, a.ref)
    print("Resultado registado.")


def cmd_registar(a):
    """Aplica o código de resultados copiado de um artifact (flashcards ou quiz)."""
    txt = a.codigo if a.codigo and a.codigo != "-" else sys.stdin.read()
    txt = txt.strip()
    if txt.upper().startswith("RESULTADOS:"):
        txt = txt.split(":", 1)[1]
    dados = json.loads(txt)
    if dados.get("tipo") == "flashcards":
        cartoes = ler("cartoes")
        exs = exames()
        for cid, nota in dados["notas"].items():
            print(rever(cartoes, int(cid), int(nota), exs))
        escrever("cartoes", cartoes)
    elif dados.get("tipo") == "verificacao":
        linhas = ler("aulas")
        print(aplicar_verificacao(linhas, dados["aula"], dados["itens"], dados.get("cadeira", "")))
        escrever("aulas", linhas)
    elif dados.get("tipo") in ("quiz", "exercicio", "simulacao"):
        origem = "quiz" if dados["tipo"] == "quiz" else dados["tipo"]
        for i in dados["itens"]:
            registar_resultado(i.get("cadeira") or dados.get("cadeira", ""), i.get("dominio"),
                               i.get("subdominio"), origem, i["acerto"], i.get("ref", ""))
        print(f"{len(dados['itens'])} resultado(s) de {origem} registado(s).")
    else:
        sys.exit("Código não reconhecido.")


# ---------------------------------------------------------------- proficiência
def nivel(p):
    if p is None:
        return "⚪ por avaliar"
    if p >= 85:
        return "✅ forte"
    if p >= 70:
        return "🟢 bom"
    if p >= 50:
        return "🟠 a melhorar"
    return "🔴 fraco"


def proficiencia(cadeira=None):
    """Árvore {cadeira: {dominio: {subdominio: métricas}}}."""
    h = hoje()
    arv = {}

    def no(c, d, s):
        return arv.setdefault(c, {}).setdefault(d or "(geral)", {}).setdefault(
            s or "(geral)", {"mem": [], "des": [], "cartoes": 0})

    for c in ler("cartoes"):
        if cadeira and not mesma(c["cadeira"], cadeira):
            continue
        n = no(c["cadeira"], c["dominio"], c["subdominio"])
        n["cartoes"] += 1
        if c["ultima"]:
            # memória = probabilidade de te lembrares daqui a HORIZONTE dias
            dias = (h - data(c["ultima"])).days + HORIZONTE_MEMORIA
            n["mem"].append(retrievability(dias, float(c["estabilidade"])))
    for r in ler("resultados"):
        if cadeira and not mesma(r["cadeira"], cadeira):
            continue
        idade = (h - data(r["data"])).days
        peso = PESO_ORIGEM.get(r["origem"], 1.0) * 0.5 ** (idade / MEIA_VIDA_DIAS)
        no(r["cadeira"], r["dominio"], r["subdominio"])["des"].append((float(r["acerto"]), peso))
    for au in ler("aulas"):
        if au["dominio"] and (not cadeira or mesma(au["cadeira"], cadeira)):
            no(au["cadeira"], au["dominio"], "")

    def metricas(n):
        mem = 100 * sum(n["mem"]) / len(n["mem"]) if n["mem"] else None
        pt = sum(p for _, p in n["des"])
        des = 100 * sum(x * p for x, p in n["des"]) / pt if pt else None
        if mem is not None and des is not None:
            score = 0.35 * mem + 0.65 * des
        else:
            score = mem if mem is not None else des
        evid = len(n["mem"]) + len(n["des"])
        return {"score": score, "memoria": mem, "desempenho": des, "evidencias": evid,
                "cartoes": n["cartoes"], "nivel": nivel(score), "confianca": "baixa" if evid < 5 else "ok"}

    def agrega(filhos):
        com = [f for f in filhos if f["score"] is not None]
        tot = sum(f["evidencias"] for f in com)
        score = sum(f["score"] * f["evidencias"] for f in com) / tot if tot else None
        evid = sum(f["evidencias"] for f in filhos)
        return {"score": score, "evidencias": evid, "cartoes": sum(f["cartoes"] for f in filhos),
                "nivel": nivel(score), "confianca": "baixa" if evid < 5 else "ok"}

    out = {}
    for c, doms in arv.items():
        out_c = {"dominios": {}}
        for d, subs in doms.items():
            ms = {s: metricas(n) for s, n in subs.items()}
            if len(ms) > 1 and "(geral)" in ms and ms["(geral)"]["evidencias"] == 0:
                del ms["(geral)"]
            out_c["dominios"][d] = agrega(list(ms.values())) | {"subdominios": ms}
        out_c.update(agrega([v for v in out_c["dominios"].values()]))
        out[c] = out_c
    return out


def fmt(p):
    return "  —" if p is None else f"{p:3.0f}%"


def cmd_proficiencia(a):
    arv = proficiencia(a.cadeira)
    if a.json:
        print(json.dumps(arv, ensure_ascii=False, indent=1))
        return
    if not arv:
        print("Ainda sem dados.")
        return
    for c, info in sorted(arv.items()):
        print(f"\n== {c}: {fmt(info['score'])} {info['nivel']}  ({info['evidencias']} evidências)")
        for d, di in sorted(info["dominios"].items(), key=lambda x: (x[1]["score"] is None, x[1]["score"] or 0)):
            print(f"  {fmt(di['score'])} {di['nivel']}  {d}")
            for s, si in sorted(di["subdominios"].items(), key=lambda x: (x[1]["score"] is None, x[1]["score"] or 0)):
                extra = f"mem {fmt(si['memoria'])} · aplic {fmt(si['desempenho'])} · {si['evidencias']} evid."
                aviso = " ⚠️ poucos dados" if si["confianca"] == "baixa" and si["score"] is not None else ""
                print(f"      {fmt(si['score'])} {si['nivel']}  {s}  ({extra}){aviso}")


def fracos(n=3):
    lst = []
    for c, info in proficiencia().items():
        for d, di in info["dominios"].items():
            for s, si in di["subdominios"].items():
                if si["score"] is not None and si["score"] < 70:
                    lst.append((si["score"], c, d, s))
    return sorted(lst)[:n]


# ---------------------------------------------------------------- briefing
def cmd_hoje(a):
    h = data(a.data) if a.data else hoje()
    dia = DIAS[h.weekday()]
    print(f"# Briefing · {dia} {h.strftime('%d/%m/%Y')}\n")

    aulas_h = sorted((l for l in ler("horario") if l["dia"] == dia), key=lambda l: l["inicio"])
    print("## Aulas de hoje")
    if aulas_h:
        for l in aulas_h:
            print(f"- {l['inicio']}–{l['fim']} · {l['cadeira']} {l['tipo']} {l['sala']}".rstrip())
    else:
        print("- Sem aulas no horário.")

    exs = {c: d for c, d in exames().items() if d and 0 <= (d - h).days <= 30}
    aulas = ler("aulas")

    def prio(l):
        ex = exs.get(l["cadeira"])
        return ((ex - h).days if ex else 999, l["presenca"] != "faltei", l["data"])

    et1 = sorted((l for l in aulas if l["etapa"] in ("aprender", "recordar")), key=prio)
    print("\n## Etapa ① Aprender / recordar")
    if et1:
        for l in et1[:5]:
            extra = " (faltaste)" if l["presenca"] == "faltei" else ""
            extra += " (recordar: falhou a verificação)" if l["etapa"] == "recordar" else ""
            print(f"- #{l['id']} {l['cadeira']}: {l['materia']}{extra}")
        if len(et1) > 5:
            print(f"- … e mais {len(et1) - 5}")
    else:
        print("- Nada em atraso.")

    et2 = sorted((l for l in aulas if l["etapa"] == "estudar"), key=prio)
    print("\n## Etapa ② Estudar e verificar")
    if et2:
        for l in et2[:5]:
            pronta = l["aprendida_em"] and data(l["aprendida_em"]) < h
            estado = "pronta para verificação" if pronta else "treinar (exercícios); verificar amanhã"
            nota = f" · última verificação {float(l['nota_verif']):.0%}" if l["nota_verif"] else ""
            print(f"- #{l['id']} {l['cadeira']}: {l['materia']} → {estado}{nota}")
        if len(et2) > 5:
            print(f"- … e mais {len(et2) - 5}")
    else:
        print("- Nada por verificar.")

    sel, n_rev, n_nov = para_hoje()
    print(f"\n## Manutenção: flashcards ({n_rev + n_nov}, ~{round(n_rev * 0.5 + n_nov * 1.5)} min)")
    grupos = {}
    for c in sel:
        grupos.setdefault((c["cadeira"], c["dominio"] or "(geral)"), []).append(c)
    for (cad, dom), cs in sorted(grupos.items(), key=lambda x: -len(x[1]))[:4]:
        print(f"- {cad} › {dom}: {len(cs)}")

    if exs:
        print("\n## Avaliações próximas")
        for c, d in sorted(exs.items(), key=lambda x: x[1]):
            print(f"- {c}: {d.strftime('%d/%m')} (faltam {(d - h).days} dias)")


    fr = fracos()
    if fr:
        print("\n## Pontos fracos a atacar")
        for score, c, d, s in fr:
            print(f"- {c} › {d} › {s}: {score:.0f}%")


# ---------------------------------------------------------------- anki
def cmd_export_anki(a):
    cartoes = [c for c in ler("cartoes") if not a.cadeira or mesma(c["cadeira"], a.cadeira)]
    out = a.out or os.path.join(DIR, "anki.txt")

    def limpo(s):
        return s.replace("\t", " ").replace("\n", "<br>")

    def tag(s):
        return s.strip().replace(" ", "_")

    with open(out, "w", encoding="utf-8") as f:
        f.write("#separator:tab\n#html:true\n#tags column:3\n")
        for c in cartoes:
            verso = f"{limpo(c['verso'])}<br><br><i>Fonte: {limpo(c['fonte'])}</i>"
            tags = " ".join(filter(None, [tag(c["cadeira"]), tag(c["dominio"]), tag(c["subdominio"])]))
            f.write(f"{limpo(c['frente'])}\t{verso}\t{tags}\n")
    print(f"Exportados {len(cartoes)} cartões para {out}")


# ---------------------------------------------------------------- CLI
def main():
    global DIR
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dir", default=os.environ.get("FACULDADE_DIR", "faculdade"))
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init").set_defaults(f=cmd_init)

    s = sub.add_parser("cadeira")
    s.add_argument("nome")
    for campo in ("ano", "semestre", "avaliacao"):
        s.add_argument(f"--{campo}")
    s.add_argument("--estado", choices=["atual", "atraso", "feita"])
    s.add_argument("--tipo", choices=["teorica", "pratica", "mista"])
    s.add_argument("--exame", help="AAAA-MM-DD (vazio para apagar)")
    s.set_defaults(f=cmd_cadeira)

    s = sub.add_parser("horario")
    s.add_argument("acao", choices=["add", "rm", "list"])
    s.add_argument("cadeira", nargs="?")
    s.add_argument("--dia")
    s.add_argument("--inicio")
    s.add_argument("--fim")
    s.add_argument("--tipo")
    s.add_argument("--sala")
    s.set_defaults(f=cmd_horario)

    s = sub.add_parser("aula")
    s.add_argument("acao", choices=["add", "set", "list"])
    s.add_argument("alvo", nargs="?", help="cadeira (add/list) ou id (set)")
    s.add_argument("--data")
    s.add_argument("--tipo")
    s.add_argument("--materia")
    s.add_argument("--dominio")
    s.add_argument("--presenca", choices=["assisti", "faltei"])
    s.add_argument("--etapa", choices=ETAPAS)
    s.add_argument("--resumo")
    s.add_argument("--notas")
    s.add_argument("--pendentes", action="store_true")
    s.set_defaults(f=cmd_aula)

    s = sub.add_parser("aprendida")
    s.add_argument("id")
    s.add_argument("--resumo")
    s.set_defaults(f=cmd_aprendida)

    s = sub.add_parser("verificar")
    s.add_argument("id")
    s.add_argument("--acerto", type=float, required=True, help="0 a 1 (média da verificação)")
    s.add_argument("--dominio")
    s.add_argument("--subdominio")
    s.set_defaults(f=cmd_verificar)

    s = sub.add_parser("add")
    for campo in ("cadeira", "frente", "verso", "fonte"):
        s.add_argument(f"--{campo}", required=True)
    for campo in ("dominio", "subdominio", "aula"):
        s.add_argument(f"--{campo}", default="")
    s.set_defaults(f=cmd_add)

    s = sub.add_parser("import")
    s.add_argument("ficheiro")
    s.set_defaults(f=cmd_import)

    for nome, fn in (("due", cmd_due), ("deck", cmd_deck)):
        s = sub.add_parser(nome)
        s.add_argument("--cadeira")
        s.add_argument("--limit", type=int)
        s.add_argument("--novos", type=int, default=NOVOS_POR_DIA)
        if nome == "deck":
            s.add_argument("--out")
        s.set_defaults(f=fn)

    s = sub.add_parser("review")
    s.add_argument("id", type=int)
    s.add_argument("nota", type=int)
    s.set_defaults(f=cmd_review)

    s = sub.add_parser("resultado")
    s.add_argument("--cadeira", required=True)
    s.add_argument("--dominio", default="")
    s.add_argument("--subdominio", default="")
    s.add_argument("--origem", required=True)
    s.add_argument("--acerto", type=float, required=True, help="0 a 1")
    s.add_argument("--ref", default="")
    s.set_defaults(f=cmd_resultado)

    s = sub.add_parser("registar")
    s.add_argument("codigo", nargs="?", help="código RESULTADOS:{...} (ou '-' para stdin)")
    s.set_defaults(f=cmd_registar)

    s = sub.add_parser("proficiencia")
    s.add_argument("--cadeira")
    s.add_argument("--json", action="store_true")
    s.set_defaults(f=cmd_proficiencia)

    s = sub.add_parser("hoje")
    s.add_argument("--data", help="AAAA-MM-DD (por omissão, hoje)")
    s.set_defaults(f=cmd_hoje)

    s = sub.add_parser("export-anki")
    s.add_argument("--cadeira")
    s.add_argument("--out")
    s.set_defaults(f=cmd_export_anki)

    a = p.parse_args()
    DIR = a.dir
    if a.cmd == "aula":
        if a.acao == "set":
            if not a.alvo:
                sys.exit("Indica o id da aula.")
            a.id = a.alvo
        else:
            a.cadeira = a.alvo
            if a.acao == "add" and (not a.cadeira or not a.materia):
                sys.exit("Uso: aula add CADEIRA --materia \"...\"")
    if a.cmd == "horario" and a.acao == "add" and not (a.cadeira and a.dia and a.inicio and a.fim):
        sys.exit("Uso: horario add CADEIRA --dia seg --inicio 09:00 --fim 11:00")
    if a.cmd != "init" and not os.path.exists(caminho("cartoes")):
        sys.exit(f"Pasta '{DIR}' não inicializada. Corre primeiro: init")
    a.f(a)


if __name__ == "__main__":
    main()
