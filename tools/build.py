#!/usr/bin/env python3
"""Build assets/slides.js from source/deck.json + source/slides/*.html.

Usage:  python3 tools/build.py
No external dependencies. Run it after editing any file in source/.
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "source"
OUT = ROOT / "assets" / "slides.js"

# Uploaded images in the original deck -> files in assets/img
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


def build():
    deck = json.loads((SRC / "deck.json").read_text(encoding="utf-8"))
    slides, embeds = [], []

    def embed_sub(m):
        style, doc = m.group(1), m.group(2)
        embeds.append(doc)
        return ('<iframe class="xe" data-e="%d" style="%s;border:0;background:transparent" '
                'sandbox="allow-scripts" scrolling="no" tabindex="-1" title="animasiya"></iframe>'
                % (len(embeds) - 1, style))

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

    for sid in deck["order"]:
        f = SRC / "slides" / (sid + ".html")
        if not f.exists():
            continue
        h = f.read_text(encoding="utf-8")
        notes = ""
        am = re.search(r"<aside>(.*?)</aside>", h, re.S)
        if am:
            notes = am.group(1).strip()
            h = h[:am.start()] + h[am.end():]
        h = re.sub(r'<x-embed style="([^"]*)">(.*?)</x-embed>', embed_sub, h, flags=re.S)
        h = re.sub(r'<x-icon name="([A-Za-z]+)" style="([^"]*)"></x-icon>', icon_sub, h)
        h = re.sub(r'<x-shape kind="([a-z-]+)" style="([^"]*)"></x-shape>', shape_sub, h)
        for bid, path in BLOBS.items():
            h = h.replace("/_blob/" + bid, path)
        h = h.replace("<section ", '<section class="slide" ', 1).strip()
        slides.append({"id": sid, "html": h, "notes": notes})

    data = {"title": deck.get("title", ""), "slides": slides, "embeds": embeds}
    OUT.write_text("window.DECK=" + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
    print("built %d slides, %d animations -> %s" % (len(slides), len(embeds), OUT.relative_to(ROOT)))


if __name__ == "__main__":
    build()
