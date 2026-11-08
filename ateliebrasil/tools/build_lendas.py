"""Gera js/lendas.js (versão nov/2026) a partir de tools/textos_v2.py (os mesmos textos gravados no Comfy)
e das coordenadas marcadas nas ilustrações novas (COORD abaixo; x,y de 0 a 1 na ilustração).
  python3 tools/build_lendas.py"""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(__file__))
from textos_v2 import T, REGIOES as RTX

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# palavras escondidas (na ordem de textos_v2), figurinhas [x, y, zoom] e rosto [x, y, zoom]
COORD = {
 "curupira": {"p": [(.38, .15), (.09, .57), (.4, .66), (.25, .88), (.8, .48)], "f": [(.75, .75, .5)], "r": (.45, .3, .35)},
 "iara": {"p": [(.28, .21), (.4, .86), (.08, .72), (.15, .78), (.2, .5)], "f": [(.85, .7, .45)], "r": (.48, .32, .32)},
 "boto": {"p": [(.48, .5), (.42, .27), (.09, .56), (.78, .85), (.68, .7)], "f": [(.5, .45, .7)], "r": (.5, .36, .4)},
 "caipora": {"p": [(.65, .72), (.86, .45), (.38, .15), (.18, .3), (.3, .55)], "f": [(.86, .45, .45), (.68, .7, .6)], "r": (.42, .4, .3)},
 "vitoria": {"p": [(.38, .48), (.78, .58), (.12, .66), (.2, .71), (.4, .4)], "f": [(.78, .58, .45)], "r": (.38, .48, .45)},
 "mapinguari": {"p": [(.42, .28), (.48, .41), None, None, (.46, .64)], "f": [(.75, .73, .5)], "r": (.48, .32, .38)},
 "matinta": {"p": [(.42, .18), (.85, .38), (.24, .75), (.5, .53), (.503, .736)], "f": [(.86, .38, .4)], "r": (.47, .32, .3)},
 "boi": {"p": [(.3, .58), (.859, .454), (.12, .55), (.38, .22), (.6, .45)], "f": [(.88, .82, .4)], "r": (.57, .38, .38)},
 "fulozinha": {"p": [(.12, .6), (.45, .68), (.25, .9), (.47, .18), (.82, .78)], "f": [(.82, .78, .4)], "r": (.45, .32, .3)},
 "caboclo": {"p": [(.4, .22), (.3, .83), (.42, .53), (.12, .56), (.11, .45)], "f": [(.85, .6, .5)], "r": (.45, .4, .35)},
 "caju": {"p": [(.2, .4), (.22, .5), (.85, .45), (.9, .33), (.83, .77)], "f": [(.2, .75, .45)], "r": (.47, .32, .3)},
 "maracatu": {"p": [(.5, .18), (.8, .75), (.15, .6), (.32, .48), (.65, .53)], "f": [(.8, .75, .5)], "r": (.5, .32, .3)},
 "ciranda": {"p": [(.52, .61), (.2, .7), (.08, .4), (.5, .86), (.82, .89)], "f": [(.5, .86, .4)], "r": (.5, .45, .3)},
 "joaodebarro": {"p": [(.6, .31), (.92, .67), None, (.3, .73), (.18, .83)], "f": [(.42, .42, .6)], "r": (.45, .32, .35)},
 "paidomato": {"p": [(.3, .22), (.6, .06), (.73, .47), (.3, .92), (.85, .83)], "f": [(.65, .4, .7)], "r": (.45, .35, .3)},
 "tuiuiu": {"p": [None, (.58, .38), (.35, .53), (.82, .37), (.85, .7)], "f": [(.25, .78, .45)], "r": (.52, .22, .3)},
 "cavalhadas": {"p": [(.7, .45), (.55, .57), (.8, .78), (.45, .12), (.68, .55)], "f": [(.7, .45, .55)], "r": (.42, .25, .3)},
 "pequi": {"p": [(.2, .52), (.85, .65), (.85, .45), (.7, .7), (.75, .88)], "f": [(.85, .45, .45)], "r": (.45, .37, .3)},
 "saci": {"p": [(.4, .2), (.2, .78), (.46, .838), (.5, .6), (.8, .75)], "f": [(.2, .78, .45)], "r": (.5, .33, .32)},
 "cuca": {"p": [(.55, .18), (.7, .71), (.47, .6), (.12, .63), (.55, .38)], "f": [(.6, .35, .6)], "r": (.55, .35, .35)},
 "lobisomem": {"p": [(.3, .3), (.07, .6), None, (.4, .88), (.56, .56)], "f": [(.5, .5, .7)], "r": (.52, .45, .4)},
 "mula": {"p": [(.4, .3), None, (.85, .55), (.6, .53), (.7, .3)], "f": [(.7, .3, .35)], "r": (.4, .32, .35)},
 "junina": {"p": [(.22, .37), (.12, .88), (.38, .22), (.5, .75), (.85, .9)], "f": [(.12, .88, .35)], "r": (.7, .42, .3)},
 "boitata": {"p": [(.59, .68), None, (.12, .55), (.88, .62), (.45, .85)], "f": [(.88, .65, .45)], "r": (.6, .4, .38)},
 "gralha": {"p": [(.68, .77), (.25, .6), (.57, .49), (.8, .62), (.65, .86)], "f": [(.8, .62, .5)], "r": (.5, .35, .38)},
 "teiniagua": {"p": [(.37, .26), (.12, .3), (.82, .42), (.1, .55), (.56, .45)], "f": [(.35, .4, .55)], "r": (.37, .38, .3)},
 "ervamate": {"p": [(.3, .5), (.75, .55), (.65, .35), (.05, .45), (.12, .73)], "f": [(.3, .5, .45)], "r": (.33, .37, .3)},
 "grupo": {"p": [(.55, .75), (.12, .38), (.8, .43), (.5, .38), (.85, .7), (.1, .8)], "f": [], "r": (.55, .7, .4)},
 "mapa": {"p": [], "f": [], "r": (.5, .5, 1)},
}
REG_PADRAO = {"norte": ("carimbo", "birds"), "nordeste": ("baiao", "crickets"), "centro": ("siriri", "araras"), "sudeste": ("modaviola", "birds"), "sul": ("vaneira", "wind")}
NOVOS = {  # telas que não existiam no jogo antigo
 "caju": {"sil": "CA-JU", "uf": "rn", "vida": "hop", "vidaE": ["🍎", "🌰", "🍃"], "brilho": ["🍃", "✨"]},
 "maracatu": {"sil": "MA-RA-CA-TU", "uf": "pe", "vida": "sway", "vidaE": ["👑", "🥁", "⭐"], "brilho": ["⭐", "✨"], "som": "tambor"},
 "ciranda": {"sil": "CI-RAN-DA", "uf": "pe", "musica": "ciranda", "amb": "waves", "vida": "spin", "vidaE": ["💃", "🌊", "⭐"], "brilho": ["🌊", "✨"]},
 "tuiuiu": {"sil": "TUI-UI-Ú", "uf": "mt", "vida": "sway", "vidaE": ["🐟", "🪶", "✨"], "brilho": ["🪶", "✨"]},
 "cavalhadas": {"sil": "CA-VA-LHA-DAS", "uf": "go", "vida": "hop", "vidaE": ["🐎", "👑", "🎀"], "brilho": ["🎀", "✨"], "som": "tambor"},
 "pequi": {"sil": "PE-QUI", "uf": "go", "vida": "hop", "vidaE": ["🟡", "🦜", "🍃"], "brilho": ["🍃", "✨"]},
 "mula": {"sil": "MU-LA", "uf": "es", "amb": "crickets", "vida": "hop", "vidaE": ["🔥", "✨", "🐴"], "brilho": ["🔥", "✨"], "som": "fogo"},
 "junina": {"sil": "FES-TA JU-NI-NA", "uf": "sp", "amb": "fogueira", "vida": "spin", "vidaE": ["🔥", "🌽", "🎉"], "brilho": ["🎉", "✨"]},
 "gralha": {"sil": "GRA-LHA", "uf": "pr", "vida": "hop", "vidaE": ["🌲", "🪶", "✨"], "brilho": ["🪶", "✨"]},
 "teiniagua": {"sil": "TEI-NI-A-GUÁ", "uf": "rs", "amb": "crickets", "vida": "twinkle", "vidaE": ["💎", "✨", "🦎"], "brilho": ["💎", "✨"]},
 "ervamate": {"sil": "ER-VA-MA-TE", "uf": "sc", "vida": "sway", "vidaE": ["🧉", "🍃", "✨"], "brilho": ["🍃", "✨"]},
}
VOZ_PITCH = {"saci": "saci", "curupira": "curupira", "iara": "iara", "boto": "boto", "caipora": "caipora", "cuca": "cuca", "lobisomem": "lobisomem", "boi": "boi", "boitata": "boitata"}

def js(v): return json.dumps(v, ensure_ascii=False)

src = open(f"{ROOT}/js/lendas.js").read()
head = src[:src.index("let TELAS = [")]
for r, d in RTX.items():   # textos das regiões = os gravados
    head = re.sub(r'(id: "' + r + r'".*?sotaque: )"[^"]*"', lambda m: m.group(1) + js(d["sotaque"]), head, flags=re.S, count=1)
    head = re.sub(r'(id: "' + r + r'".*?oi: )"[^"]*"', lambda m: m.group(1) + js(d["oi"]), head, flags=re.S, count=1)
tail = src[src.index("TELAS = TELAS.map("):]

import subprocess
EX = json.loads(subprocess.check_output(["node", "-e", r'''const fs=require("fs");const src=fs.readFileSync(process.argv[1],"utf8").replace(/^(const|let) /gm,"global.");eval(src);
const o={};for(const t of TELAS){const c={...t};c.voz=Object.keys(VOZ).find(k=>VOZ[k]===t.voz)||null;delete c.pos;delete c.lvl;delete c.need;o[t.k]=c;}console.log(JSON.stringify(o));''', f"{ROOT}/js/lendas.js"]))

linhas = []
for k, ex in EX.items():
    x = T[k]; c = COORD[k]; nv = NOVOS.get(k, {})
    reg = ex["reg"]; mus, amb = REG_PADRAO.get(reg, ("festa", "birds"))
    t = {"k": k, "nome": ex["nome"], "sil": ex.get("sil") or nv.get("sil"), "e": ex["e"], "reg": reg, "uf": ex.get("uf") or nv.get("uf")}
    vz = VOZ_PITCH.get(ex.get("voz") or "", None) or VOZ_PITCH.get(k)
    out = ["k", "nome", "sil", "e", "reg", "uf"]
    parts = [f"{f}: {js(t[f])}" for f in out if t.get(f)]
    if vz: parts.append(f"voz: VOZ.{vz}")
    parts.append(f'musica: {js(ex.get("musica") or nv.get("musica") or mus)}'); parts.append(f'amb: {js(ex.get("amb") or nv.get("amb") or amb)}')
    for f in ("semCrop", "perfeito", "final"):
        if ex.get(f): parts.append(f"{f}: 1")
    parts.append(f"\n    adv: {js(x['adv'])}"); parts.append(f"\n    fala: {js(x['fala'])}"); parts.append(f"\n    lenda: {js(x['lenda'])}")
    pal = [[p[0], round(xy[0], 3), round(xy[1], 3), p[1]] for p, xy in zip(x["palavras"], c["p"]) if xy]   # None: objeto preto (vira contorno, não dá para pintar)
    figs = [[f[0], *xyz, f[1]] for f, xyz in zip(x["fig"], c["f"])]
    if k != "mapa": parts.append(f"\n    palavras: {js(pal)}")
    parts.append(f"\n    fig: {js(figs)}"); parts.append(f"\n    rima: {js(x['rima'])}"); parts.append(f"\n    parlenda: {js(x['parlenda'])}")
    parts.append(f'\n    vida: {js(ex.get("vida") or nv.get("vida") or "hop")}, vidaE: {js(ex.get("vidaE") or nv.get("vidaE") or ["✨"])}, brilho: {js(ex.get("brilho") or nv.get("brilho") or ["✨"])}')
    if ex.get("som") or nv.get("som"): parts.append(f'som: {js(ex.get("som") or nv.get("som"))}')
    parts.append(f"rosto: {js(list(c['r']))}")
    if ex.get("especial"): parts.append(f'especial: {js(ex["especial"])}')
    if k == "grupo": parts.append("crops: [[.55, .7, .3]]")   # a cara do Saci (travessura)
    linhas.append("  { " + ", ".join(parts).replace(", \n", ",\n") + " },")
body = "let TELAS = [\n" + "\n".join(linhas) + "\n];\n"
open(f"{ROOT}/js/lendas.js", "w").write(head + body + tail)
print("js/lendas.js:", len(linhas), "telas")
