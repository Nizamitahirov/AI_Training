#!/usr/bin/env python3
"""Build the public deck data from source/deck.json + source/slides/*.html.

Usage:  python3 tools/build.py
No external dependencies. Run it after editing any file in source/.

Output: public/assets/d/{az,en}-{light,dark}.js
- speaker notes (<aside>) are NOT included in the public build
- English text comes from source/i18n/en.json (+ per-slide overrides below)
- dark variants recolour the white slides and their animations
- each file is lightly obfuscated (XOR + base64) so the deck is not plain text
"""
import json, re, pathlib, base64, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "source"
PUB = ROOT / "public"
OUTDIR = PUB / "assets" / "d"

# Animations wait this many times longer between their steps (1.3 = +30%)
TIME_SCALE = 1.3

# Obfuscation key (must match KEY in public/assets/app.js)
KEY = b"amcham-nextgen-hr-2026"

# Uploaded images in the original deck -> files in public/assets/img
BLOBS = {
    "a6a7d053eccca6f184a25c4faeb69a0f": "assets/img/nizami.jpg",
    "8459a8db4c033556409b2f91d727a3ce": "assets/img/quiz-qr.png",
    "8b4b5c870911c4ca5e98b7fd22498b24": "assets/img/nizami.jpg",
}

# Feather-style icons (24x24, stroke)
ICONS = {
    "Lightbulb": '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    "Lightning": '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    "Chart": '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    "Book": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    "Lock": '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "Globe": '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "Warning": '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    "Verified": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    "CheckCircle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    "Activity": '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    "GraduationCap": '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    "Home": '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "Chat": '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    "Search": '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    "Users": '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "Star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    "Check": '<polyline points="20 6 9 17 4 12"/>',
}

ARROWS = {
    "arrow-right": ("0 0 100 50", "0,15 60,15 60,0 100,25 60,50 60,35 0,35"),
    "arrow-left": ("0 0 100 50", "100,15 40,15 40,0 0,25 40,50 40,35 100,35"),
    "arrow-down": ("0 0 50 100", "15,0 35,0 35,60 50,60 25,100 0,60 15,60"),
    "arrow-up": ("0 0 50 100", "15,100 35,100 35,40 50,40 25,0 0,40 15,40"),
}

# ---------- English: exact source -> replacement edits that the dictionary can't express
EN_RAW = {
    "llm": [
        ('var base="Yaxşı HR menecer";', 'var base="A good HR manager";'),
        ('[["işçilərini",46],["komandasını",31],["insanları",15],["hər",8]]', '[["listens",46],["talks",31],["reaches",15],["speaks",8]]'),
        ('[["dinləyir",41],["inkişaf",27],["motivasiya",19],["izləyir",13]]', '[["to",52],["closely",24],["first",14],["openly",10]]'),
        ('[["və",52],[",",24],["ki",14],[".",10]]', '[["people",41],["employees",27],["the",19],["every",13]]'),
        ('[["onlara",38],["onların",29],["vaxtında",20],["açıq",13]]', '[["and",44],[",",30],["before",16],["then",10]]'),
        ('[["dəstək",44],["rəy",30],["imkan",16],["inam",10]]', '[["gives",48],["offers",30],["shares",14],["acts",8]]'),
        ('[["olur.",48],["verir.",33],["göstərir.",12],["...",7]]', '[["feedback.",48],["support.",33],["clarity.",12],["...",7]]'),
    ],
    "how": [
        ('var words=["Menecer","hesabatı","direktora","göndərdi,","çünki","o,","rəqəmləri","tələb","etmişdi."];',
         'var words=["The","manager","sent","the","report","to","the","director","because","she","needed","the","figures."];'),
        ('var wt={"Menecer":21,"direktora":62,"rəqəmləri":9,"hesabatı":5};',
         'var wt={"manager":21,"director":62,"figures.":9,"report":5};'),
        ('w=="o,"', 'w=="she"'), ('w!="o,"', 'w!="she"'),
        ('var order=["direktora","Menecer","rəqəmləri","hesabatı"];', 'var order=["director","manager","figures.","report"];'),
        ('getElementById("w5")', 'getElementById("w9")'),
    ],
    "glossary": [("TERMİN ", "TERM "), ("</span>NÜMUNƏ", "</span>EXAMPLE")],
}


def translate(h, d):
    def tr(s):
        k = s.strip()
        if k in d:
            i = s.index(k)
            return s[:i] + d[k] + s[i + len(k):]
        return s
    h = re.sub(r">([^<>]+)<", lambda m: ">" + tr(m.group(1)) + "<", h)
    h = re.sub(r'"((?:[^"\\\n]|\\.)*)"', lambda m: '"' + tr(m.group(1)) + '"', h)
    h = re.sub(r"'((?:[^'\\\n<>]|\\.)*)'", lambda m: "'" + tr(m.group(1)) + "'", h)
    return h


# ---------- dark mode: recolour white slides (by CSS property)
DARK = {
    "bg": {"FFFFFF": "1A1D3A", "FFF": "1A1D3A", "F7F8FC": "1A1D3A", "F2F3F8": "22264A", "E7E9F2": "2C3055",
           "FDECEC": "3D1823", "FEEBD8": "3D2616", "FFF7F0": "2E2016", "0F1129": "080918", "1C1F3A": "0B0C1F",
           "DCFCE7": "123A24", "FEF3C7": "3A3110", "C9CCDB": "4A4E70"},
    "border": {"E7E9F2": "2E3256", "C9CCDB": "4A4E70", "2A2C45": "4A4E70", "FFFFFF": "2E3256", "FFF": "2E3256"},
    "color": {"0F1129": "F2F3F8", "2A2C45": "D7D9E6", "6B6F8A": "A3A6C2", "B91C1C": "FF8A92", "C2410C": "FFB07A",
              "166534": "86EFAC", "92400E": "FCD34D", "9A3412": "FFB07A", "16A34A": "4ADE80"},
}
HEX = re.compile(r"#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b")


def recolour(val, table):
    def r(m):
        x = m.group(1).upper()
        base, alpha = (x[:6], x[6:]) if len(x) == 8 else (x, "")
        return "#" + table[base] + alpha if base in table else m.group(0)
    return HEX.sub(r, val)


def darken(h):
    # the slide's own background
    h = re.sub(r'(<section[^>]*?background:)#(?:FFFFFF|ffffff)', r"\g<1>#0F1129", h, count=1)

    def prop(m):
        p, v = m.group(1), m.group(2)
        pl = p.lower()
        if pl in ("color", "fill", "stroke", "caret-color", "-webkit-text-fill-color"):
            t = DARK["color"]
        elif "background" in pl or pl in ("stop-color",):
            t = DARK["bg"]
        elif "border" in pl or pl in ("outline",):
            t = DARK["border"]
        else:
            return m.group(0)
        return p + ":" + recolour(v, t)
    h = re.sub(r"([A-Za-z-]+)\s*:\s*([^;\"'{}<>]*#[0-9A-Fa-f]{3,8}[^;\"'{}<>]*)", prop, h)
    # JS style assignments: el.style.color="#0F1129"
    h = re.sub(r'(\.style\.color\s*=\s*")([^"]+)"', lambda m: m.group(1) + recolour(m.group(2), DARK["color"]) + '"', h)
    h = re.sub(r'(\.style\.background(?:Color)?\s*=\s*")([^"]+)"', lambda m: m.group(1) + recolour(m.group(2), DARK["bg"]) + '"', h)
    return h


def obfuscate(text):
    b = text.encode("utf-8")
    x = bytes(c ^ KEY[i % len(KEY)] for i, c in enumerate(b))
    return base64.b64encode(x).decode("ascii")


def build():
    deck = json.loads((SRC / "deck.json").read_text(encoding="utf-8"))
    en = json.loads((SRC / "i18n" / "en.json").read_text(encoding="utf-8"))
    raw = {}
    for sid in deck["order"]:
        f = SRC / "slides" / (sid + ".html")
        if f.exists():
            h = f.read_text(encoding="utf-8")
            h = re.sub(r"<aside>.*?</aside>", "", h, flags=re.S)   # notes never leave source/
            raw[sid] = h

    OUTDIR.mkdir(parents=True, exist_ok=True)
    sizes = []
    for lang in ("az", "en"):
        for mode in ("light", "dark"):
            slides, embeds = [], []

            def embed_sub(m):
                style, doc = m.group(1), m.group(2)
                steps = ' data-steps="1"' if "/*STEPPABLE*/" in doc else ""
                doc = doc.replace("/*STEPPABLE*/", "")
                doc = doc.replace("<head>", "<head><script>(function(){var s=window.setTimeout;window.setTimeout=function(f,d){return s(f,(+d||0)*%s)}})();</script>" % TIME_SCALE, 1)
                doc = doc.replace("<head>", "<head><style>*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}</style>"
                                  "<script>['contextmenu','copy','cut','dragstart','selectstart'].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault()})});</script>", 1)
                embeds.append(doc)
                return ('<iframe class="xe"%s data-e="%d" style="%s;border:0;background:transparent" '
                        'sandbox="allow-scripts" scrolling="no" tabindex="-1" title="animation"></iframe>'
                        % (steps, len(embeds) - 1, style))

            def icon_sub(m):
                name, style = m.group(1), m.group(2)
                body = ICONS.get(name, ICONS["Star"])
                return ('<svg class="xi" style="%s;flex:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
                        % (style, body))

            def shape_sub(m):
                kind, style = m.group(1), m.group(2)
                color = "#E4202E"
                cm = re.search(r"background(?:-color)?\s*:\s*([^;]+)", style)
                if cm:
                    color = cm.group(1).strip()
                    style = style.replace(cm.group(0), "")
                vb, pts = ARROWS.get(kind, ARROWS["arrow-right"])
                return ('<svg class="xs" style="%s;flex:none" viewBox="%s" preserveAspectRatio="none" aria-hidden="true">'
                        '<polygon points="%s" fill="%s"/></svg>' % (style, vb, pts, color))

            for sid, h in raw.items():
                if lang == "en":
                    for a, b in EN_RAW.get(sid, []):
                        if a not in h:
                            raise SystemExit("EN override not found in %s: %s" % (sid, a[:60]))
                        h = h.replace(a, b)
                    h = translate(h, en)
                light = bool(re.search(r"<section[^>]*background:#(?:FFFFFF|ffffff)", h))
                if mode == "dark" and light:
                    h = darken(h)
                h = re.sub(r'<x-embed style="([^"]*)">(.*?)</x-embed>', embed_sub, h, flags=re.S)
                h = re.sub(r'<x-icon name="([A-Za-z]+)" style="([^"]*)"></x-icon>', icon_sub, h)
                h = re.sub(r'<x-shape kind="([a-z-]+)" style="([^"]*)"></x-shape>', shape_sub, h)
                for bid, path in BLOBS.items():
                    h = h.replace("/_blob/" + bid, path)
                h = re.sub(r"<img ", '<img draggable="false" ', h)
                cls = "slide" + (" lt" if light else "")
                h = h.replace("<section ", '<section class="%s" ' % cls, 1).strip()
                slides.append({"id": sid, "html": h})

            data = {"slides": slides, "embeds": embeds}
            payload = obfuscate(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
            out = OUTDIR / ("%s-%s.js" % (lang, mode))
            out.write_text("window.__deck&&window.__deck(\"%s\");\n" % payload, encoding="ascii")
            sizes.append("%s %dKB" % (out.name, out.stat().st_size // 1024))
    # cache-busting version for the loader
    ver = hashlib.sha1("".join((OUTDIR / n).read_text() for n in sorted(p.name for p in OUTDIR.glob("*.js"))).encode()).hexdigest()[:8]
    (PUB / "assets" / "ver.js").write_text('window.__V="%s";\n' % ver, encoding="ascii")
    print("built %d slides x 4 variants (%s), notes removed, v=%s" % (len(raw), ", ".join(sizes), ver))


if __name__ == "__main__":
    build()
