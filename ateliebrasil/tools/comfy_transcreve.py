"""Confere as falas geradas: transcreve tudo com o ElevenLabs Scribe (via Comfy Cloud) e compara com o texto esperado.
Junta as falas em blocos de ~60 (com 1,5 s de silêncio entre elas) para pagar poucos minutos, e separa de volta pelo tempo.
  COMFY_CLOUD_API_KEY=... python3 tools/comfy_transcreve.py [filtro]   -> comfy/out/transcricao.json
Custo: ~US$ 0,0073 por minuto de áudio."""
import os, sys, json, subprocess, uuid, urllib.request, urllib.parse, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(__file__))
import comfy_teste as ct

ROOT = ct.ROOT; OUT = f"{ROOT}/comfy/out"; TMP = f"{OUT}/.stt"; os.makedirs(TMP, exist_ok=True)
GAP = 1.5
D = json.load(open(f"{ROOT}/comfy/atelie_comfy.json"))

def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)

def upload(path):
    b = uuid.uuid4().hex; nome = os.path.basename(path)
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{nome}"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + open(path, "rb").read() + \
           f'\r\n--{b}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode()
    r = urllib.request.urlopen(urllib.request.Request(ct.BASE + "/api/upload/image", data=body, method="POST",
        headers={"X-API-Key": ct.KEY, "Content-Type": f"multipart/form-data; boundary={b}"}), timeout=300)
    return json.loads(r.read())["name"]

def bloco(i, falas):
    """Decodifica cada fala para PCM (16 kHz mono), mede pelo número de amostras e concatena com silêncio: sem deriva de tempo."""
    import wave, array
    SR = 16000; pcm = bytearray(); mapa = []
    sil = bytes(int(SR * GAP) * 2)
    for f in falas:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{OUT}/{f['arquivo']}", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
        t0 = len(pcm) / 2 / SR; pcm += raw; mapa.append((f["id"], t0, len(pcm) / 2 / SR)); pcm += sil
    wav = f"{TMP}/bloco_{i}.wav"
    with wave.open(wav, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(pcm))
    mp3 = f"{TMP}/bloco_{i}.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-b:a", "48k", mp3], check=True)
    nome = upload(mp3)
    stt = ct.defaults("ElevenLabsSpeechToText", {"model": "scribe_v2", "language_code": "pt", "model.timestamps_granularity": "word", "model.tag_audio_events": False})
    stt["audio"] = ["1", 0]
    wf = {"1": {"class_type": "LoadAudio", "inputs": {"audio": nome}},
          "2": {"class_type": "ElevenLabsSpeechToText", "inputs": stt},
          "3": {"class_type": "SaveText", "inputs": {"text": ["2", 2], "filename_prefix": f"stt/bloco_{i}", "format": "json"}}}
    j = dict(id=f".stt/res_{i}", ext=".json", wf=wf)
    ct.OUT = OUT
    r = ct.rodar_um(j)
    return i, mapa, r

def separa(words, mapa):
    res = {k: [] for k, _, _ in mapa}
    for w in words:
        if w.get("type", "word") != "word": continue
        s = w.get("start", 0); e = w.get("end", s); m = (s + e) / 2
        alvo = min(mapa, key=lambda x: 0 if x[1] - .05 <= m <= x[2] + .05 else min(abs(m - x[1]), abs(m - x[2])))
        res[alvo[0]].append(w["text"])
    return {k: " ".join(v) for k, v in res.items()}

if __name__ == "__main__":
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    falas = [f for f in D["falas"] if filtro in f["id"]]
    vistos, uniq = set(), []
    for f in falas:
        if f["arquivo"] not in vistos: vistos.add(f["arquivo"]); uniq.append(f)
    blocos = [uniq[i:i + 60] for i in range(0, len(uniq), 60)]
    saida = f"{OUT}/transcricao.json"
    try: T = json.load(open(saida))
    except Exception: T = {}
    with cf.ThreadPoolExecutor(4) as ex:
        for fut in cf.as_completed([ex.submit(bloco, i, b) for i, b in enumerate(blocos)]):
            i, mapa, r = fut.result(); print("bloco", i, r[1], flush=True)
            p = f"{OUT}/.stt/res_{i}"
            arq = next((p + e for e in (".json", ".txt") if os.path.exists(p + e)), None)
            if not arq: continue
            raw = open(arq).read()
            try: words = json.loads(raw)
            except Exception: words = json.loads(json.loads(raw))
            if isinstance(words, dict): words = words.get("words", [])
            T.update(separa(words, mapa))
    json.dump(T, open(saida, "w"), ensure_ascii=False, indent=1)
    print(saida, len(T))
