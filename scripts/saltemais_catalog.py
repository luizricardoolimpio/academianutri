"""Gera src/data/saltemais.json: id do vídeo -> título (via oEmbed do YouTube) e programa.

Uso: python3 -I scripts/saltemais_catalog.py
Os PDFs da SalteMais não são versionados; os links foram copiados para scripts/saltemais_links.txt.
"""
import json, pathlib, re, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ID_RE = re.compile(r'(?:youtu\.be/|[?&]v=|/shorts/)([\w-]{11})')


def parse_video_id(url: str) -> str:
    m = ID_RE.search(url)
    if not m:
        raise ValueError(f'URL sem id de vídeo: {url}')
    return m.group(1)


def parse_links(text: str) -> list[tuple[str, str]]:
    seen, out = set(), []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        program, url = line.split(maxsplit=1)
        vid = parse_video_id(url)
        if vid not in seen:
            seen.add(vid)
            out.append((program, vid))
    return out


def fetch_title(vid: str) -> str | None:
    q = urllib.parse.urlencode({'url': f'https://www.youtube.com/watch?v={vid}', 'format': 'json'})
    try:
        with urllib.request.urlopen(f'https://www.youtube.com/oembed?{q}', timeout=15) as r:
            return json.load(r)['title'].strip()
    except Exception:
        return None


def main() -> None:
    rows = parse_links((ROOT / 'scripts/saltemais_links.txt').read_text(encoding='utf-8'))
    catalog = [{'id': vid, 'program': prog, 'url': f'https://youtu.be/{vid}', 'title': fetch_title(vid)} for prog, vid in rows]
    out = ROOT / 'src/data/saltemais.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    missing = [c['id'] for c in catalog if not c['title']]
    print(f'{len(catalog)} vídeos, {len(missing)} sem título: {missing}')


if __name__ == '__main__':
    main()
