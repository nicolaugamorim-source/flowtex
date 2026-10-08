#!/usr/bin/env python3
"""Spaced repetition (caixas de Leitner) com limite pela data de exame.

Só usa a biblioteca padrão. Dados em CSV, legíveis e editáveis.
Uso: python3 srs.py --dir faculdade <comando> [...]
"""
import argparse
import csv
import datetime as dt
import os
import sys

INTERVALOS = [0, 1, 3, 7, 14, 30, 60]  # dias por caixa
CAIXA_MAX = len(INTERVALOS) - 1

CARTAO_CAMPOS = ["id", "cadeira", "tema", "frente", "verso", "fonte",
                 "caixa", "proxima", "ultima", "revisoes", "erros", "criado"]
CADEIRA_CAMPOS = ["cadeira", "ano", "estado", "avaliacao", "data_exame"]


def hoje():
    return dt.date.today()


def ler(path, campos):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return [{c: r.get(c, "") for c in campos} for r in csv.DictReader(f)]


def escrever(path, campos, linhas):
    tmp = path + ".tmp"
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(linhas)
    os.replace(tmp, path)


def paths(d):
    return (os.path.join(d, "cartoes.csv"), os.path.join(d, "cadeiras.csv"),
            os.path.join(d, "progresso.md"))


def exames(d):
    out = {}
    for c in ler(paths(d)[1], CADEIRA_CAMPOS):
        if c["data_exame"]:
            out[c["cadeira"]] = dt.date.fromisoformat(c["data_exame"])
    return out


def agendar(caixa, cadeira, exs, base):
    prox = base + dt.timedelta(days=INTERVALOS[caixa])
    ex = exs.get(cadeira)
    if ex and ex > base:
        prox = min(prox, ex - dt.timedelta(days=1))
    return max(prox, base)


def cmd_init(a):
    os.makedirs(a.dir, exist_ok=True)
    cart, cad, prog = paths(a.dir)
    if not os.path.exists(cart):
        escrever(cart, CARTAO_CAMPOS, [])
    if not os.path.exists(cad):
        escrever(cad, CADEIRA_CAMPOS, [])
    if not os.path.exists(prog):
        with open(prog, "w", encoding="utf-8") as f:
            f.write("# Progresso\n\n## Pontos fracos\n\n## Sessões\n\n## Planos semanais\n")
    print(f"Pasta pronta: {a.dir}")


def cmd_cadeira(a):
    path = paths(a.dir)[1]
    linhas = ler(path, CADEIRA_CAMPOS)
    if a.exame:
        dt.date.fromisoformat(a.exame)  # valida
    atual = next((l for l in linhas if l["cadeira"].lower() == a.nome.lower()), None)
    if atual is None:
        atual = {c: "" for c in CADEIRA_CAMPOS}
        atual["cadeira"] = a.nome
        linhas.append(atual)
    for campo, valor in (("ano", a.ano), ("estado", a.estado),
                         ("avaliacao", a.avaliacao), ("data_exame", a.exame)):
        if valor is not None:
            atual[campo] = valor
    escrever(path, CADEIRA_CAMPOS, linhas)
    print(f"Cadeira guardada: {atual}")


def novo_id(cartoes):
    return str(max((int(c["id"]) for c in cartoes if c["id"].isdigit()), default=0) + 1)


def criar(cartoes, cadeira, tema, frente, verso, fonte):
    if not fonte.strip():
        raise SystemExit("Erro: todo o cartão precisa de fonte.")
    c = {"id": novo_id(cartoes), "cadeira": cadeira, "tema": tema,
         "frente": frente, "verso": verso, "fonte": fonte, "caixa": "0",
         "proxima": hoje().isoformat(), "ultima": "", "revisoes": "0",
         "erros": "0", "criado": hoje().isoformat()}
    cartoes.append(c)
    return c


def cmd_add(a):
    path = paths(a.dir)[0]
    cartoes = ler(path, CARTAO_CAMPOS)
    c = criar(cartoes, a.cadeira, a.tema, a.frente, a.verso, a.fonte)
    escrever(path, CARTAO_CAMPOS, cartoes)
    print(f"Cartão {c['id']} criado.")


def cmd_import(a):
    path = paths(a.dir)[0]
    cartoes = ler(path, CARTAO_CAMPOS)
    existentes = {(c["cadeira"], c["frente"].strip()) for c in cartoes}
    novos = saltados = 0
    with open(a.ficheiro, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            chave = (r["cadeira"], r["frente"].strip())
            if chave in existentes:
                saltados += 1
                continue
            criar(cartoes, r["cadeira"], r.get("tema", ""), r["frente"],
                  r["verso"], r.get("fonte", ""))
            existentes.add(chave)
            novos += 1
    escrever(path, CARTAO_CAMPOS, cartoes)
    print(f"Importados: {novos}. Duplicados ignorados: {saltados}.")


def cmd_due(a):
    cartoes = ler(paths(a.dir)[0], CARTAO_CAMPOS)
    exs = exames(a.dir)
    h = hoje()
    due = [c for c in cartoes if dt.date.fromisoformat(c["proxima"]) <= h
           and (not a.cadeira or c["cadeira"].lower() == a.cadeira.lower())]

    def prioridade(c):
        ex = exs.get(c["cadeira"])
        dias_exame = (ex - h).days if ex and ex >= h else 9999
        atraso = (h - dt.date.fromisoformat(c["proxima"])).days
        return (dias_exame, -atraso, int(c["caixa"]))

    due.sort(key=prioridade)
    total = len(due)
    if a.limit:
        due = due[:a.limit]
    print(f"Para hoje: {total} cartão(ões). A mostrar {len(due)}.")
    for c in due:
        print(f"\n#{c['id']} [{c['cadeira']} · {c['tema']}] caixa {c['caixa']}")
        print(f"  FRENTE: {c['frente']}")
        print(f"  VERSO:  {c['verso']}")
        print(f"  FONTE:  {c['fonte']}")


def cmd_review(a):
    if a.nota not in (0, 1, 2, 3):
        raise SystemExit("Nota tem de ser 0, 1, 2 ou 3.")
    path = paths(a.dir)[0]
    cartoes = ler(path, CARTAO_CAMPOS)
    c = next((c for c in cartoes if c["id"] == str(a.id)), None)
    if c is None:
        raise SystemExit(f"Cartão {a.id} não existe.")
    caixa = int(c["caixa"])
    if a.nota == 0:
        caixa = 1
        c["erros"] = str(int(c["erros"]) + 1)
    elif a.nota == 1:
        caixa = max(caixa, 1)
    elif a.nota == 2:
        caixa = min(caixa + 1, CAIXA_MAX)
    else:
        caixa = min(caixa + 2, CAIXA_MAX)
    h = hoje()
    c["caixa"] = str(caixa)
    c["proxima"] = agendar(caixa, c["cadeira"], exames(a.dir), h).isoformat()
    c["ultima"] = h.isoformat()
    c["revisoes"] = str(int(c["revisoes"]) + 1)
    escrever(path, CARTAO_CAMPOS, cartoes)
    print(f"Cartão {c['id']}: caixa {caixa}, próxima revisão {c['proxima']}.")


def cmd_stats(a):
    cartoes = ler(paths(a.dir)[0], CARTAO_CAMPOS)
    cadeiras = {c["cadeira"]: c for c in ler(paths(a.dir)[1], CADEIRA_CAMPOS)}
    exs = exames(a.dir)
    h = hoje()
    nomes = sorted(set(cadeiras) | {c["cadeira"] for c in cartoes})
    if not nomes:
        print("Sem cadeiras nem cartões.")
        return
    for nome in nomes:
        cs = [c for c in cartoes if c["cadeira"] == nome]
        info = cadeiras.get(nome, {})
        ex = exs.get(nome)
        linha = f"\n== {nome}"
        if info.get("estado"):
            linha += f" ({info['estado']})"
        if ex:
            linha += f" · exame {ex.isoformat()} ({(ex - h).days} dias)"
        print(linha)
        if not cs:
            print("  Sem cartões.")
            continue
        due = sum(dt.date.fromisoformat(c["proxima"]) <= h for c in cs)
        dominados = sum(int(c["caixa"]) >= 3 for c in cs)
        caixas = [sum(int(c["caixa"]) == i for c in cs) for i in range(CAIXA_MAX + 1)]
        print(f"  Cartões: {len(cs)} · para hoje: {due} · dominados (caixa≥3): "
              f"{dominados} ({100 * dominados // len(cs)}%)")
        print(f"  Por caixa 0–{CAIXA_MAX}: {caixas}")
        temas = {}
        for c in cs:
            t = temas.setdefault(c["tema"] or "(sem tema)", [0, 0])
            t[0] += int(c["erros"])
            t[1] += int(c["revisoes"])
        fracos = sorted(((e / r, tema, e, r) for tema, (e, r) in temas.items() if r and e),
                        reverse=True)[:3]
        if fracos:
            print("  Temas fracos: " + "; ".join(
                f"{tema} ({e}/{r} erros)" for _, tema, e, r in fracos))


def cmd_export_anki(a):
    cartoes = ler(paths(a.dir)[0], CARTAO_CAMPOS)
    if a.cadeira:
        cartoes = [c for c in cartoes if c["cadeira"].lower() == a.cadeira.lower()]
    out = a.out or os.path.join(a.dir, "anki.txt")

    def limpo(s):
        return s.replace("\t", " ").replace("\n", "<br>")

    def tag(s):
        return s.replace(" ", "_")

    with open(out, "w", encoding="utf-8") as f:
        f.write("#separator:tab\n#html:true\n#tags column:3\n")
        for c in cartoes:
            verso = f"{limpo(c['verso'])}<br><br><i>Fonte: {limpo(c['fonte'])}</i>"
            tags = " ".join(filter(None, [tag(c["cadeira"]), tag(c["tema"])]))
            f.write(f"{limpo(c['frente'])}\t{verso}\t{tags}\n")
    print(f"Exportados {len(cartoes)} cartões para {out}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dir", default=os.environ.get("FACULDADE_DIR", "faculdade"))
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init").set_defaults(f=cmd_init)

    s = sub.add_parser("cadeira")
    s.add_argument("nome")
    s.add_argument("--ano")
    s.add_argument("--estado", choices=["atual", "atraso"])
    s.add_argument("--avaliacao")
    s.add_argument("--exame", help="AAAA-MM-DD")
    s.set_defaults(f=cmd_cadeira)

    s = sub.add_parser("add")
    for campo in ("cadeira", "frente", "verso", "fonte"):
        s.add_argument(f"--{campo}", required=True)
    s.add_argument("--tema", default="")
    s.set_defaults(f=cmd_add)

    s = sub.add_parser("import")
    s.add_argument("ficheiro")
    s.set_defaults(f=cmd_import)

    s = sub.add_parser("due")
    s.add_argument("--cadeira")
    s.add_argument("--limit", type=int)
    s.set_defaults(f=cmd_due)

    s = sub.add_parser("review")
    s.add_argument("id", type=int)
    s.add_argument("nota", type=int)
    s.set_defaults(f=cmd_review)

    sub.add_parser("stats").set_defaults(f=cmd_stats)

    s = sub.add_parser("export-anki")
    s.add_argument("--cadeira")
    s.add_argument("--out")
    s.set_defaults(f=cmd_export_anki)

    a = p.parse_args()
    if a.cmd != "init" and not os.path.exists(paths(a.dir)[0]):
        sys.exit(f"Pasta '{a.dir}' não inicializada. Corre primeiro: init")
    a.f(a)


if __name__ == "__main__":
    main()
