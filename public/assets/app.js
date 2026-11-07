/* NextGen HR Leaders · AI training deck player (public build: no speaker notes) */
(function () {
  "use strict";
  var KEY = "amcham-nextgen-hr-2026";
  var body = document.body, stage = document.getElementById("stage");
  var D = null, N = 0, cur = -1, slideEls = [], numBuf = "", numTimer = null, ovBuilt = false;
  var touch = matchMedia("(pointer: coarse)").matches || ("ontouchstart" in window);
  var canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  var prefs = { lang: "az", mode: "light" };
  try { var sp = JSON.parse(localStorage.getItem("deck-prefs") || "null"); if (sp && sp.lang) prefs = sp; } catch (e) {}
  if (!prefs.mode) prefs.mode = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  /* ---------- UI strings ---------- */
  var T = {
    az: {
      title: "Süni İntellekt HR-da · NextGen HR Leaders", brand: "AmCham Azərbaycan · NextGen HR Leaders", h1: "Süni İntellekt HR-da",
      sub: "Təqdimata başlamazdan əvvəl dil və görünüşü seçin", lang: "Dil", mode: "Görünüş",
      light: "İşıqlı", dark: "Qaranlıq", go: "Başla →", resume: "Davam et →",
      tip: touch ? "Sürüşdürün və ya ekrana toxunun: sağ tərəf - növbəti, sol kənar - əvvəlki" : "← → düymələri ilə keçid · ? - bütün qısayollar",
      rotate: "Daha rahat baxmaq üçün telefonu üfüqi çevirin", ok: "Bağla",
      prev: "Əvvəlki", next: "Növbəti", grid: "Bütün slaydlar", set: "Dil və görünüş", full: "Tam ekran", help: "Qısayollar",
      helpH: "Klaviatura qısayolları",
      rows: [["→ Space PgDn", "Növbəti slayd"], ["← PgUp Backspace", "Əvvəlki slayd"], ["↑ / Z", "Animasiyada bir addım geri"], ["↓ / X", "Animasiyada bir addım irəli"],
        ["Home / End", "İlk / son slayd"], ["1 2 … + Enter", "Nömrə ilə slayda keç"], ["F", "Tam ekran"], ["O / G", "Bütün slaydlar"],
        ["R", "Animasiyanı yenidən başlat"], ["B / .", "Ekranı qaraltmaq"], ["?  /  Esc", "Bu pəncərə / bağla"]]
    },
    en: {
      title: "AI in HR · NextGen HR Leaders", brand: "AmCham Azerbaijan · NextGen HR Leaders", h1: "AI in HR",
      sub: "Choose a language and a look before you start", lang: "Language", mode: "Appearance",
      light: "Light", dark: "Dark", go: "Start →", resume: "Continue →",
      tip: touch ? "Swipe or tap: right side - next, left edge - previous" : "Use ← → to move · ? - all shortcuts",
      rotate: "Turn your phone sideways for a better view", ok: "Close",
      prev: "Previous", next: "Next", grid: "All slides", set: "Language and look", full: "Full screen", help: "Shortcuts",
      helpH: "Keyboard shortcuts",
      rows: [["→ Space PgDn", "Next slide"], ["← PgUp Backspace", "Previous slide"], ["↑ / Z", "One step back in an animation"], ["↓ / X", "One step forward in an animation"],
        ["Home / End", "First / last slide"], ["1 2 … + Enter", "Go to slide number"], ["F", "Full screen"], ["O / G", "All slides"],
        ["R", "Restart the animation"], ["B / .", "Black out the screen"], ["?  /  Esc", "This window / close"]]
    }
  };
  function $(id) { return document.getElementById(id); }
  function applyUI(lang, started) {
    var t = T[lang];
    document.documentElement.lang = lang;
    document.title = t.title;
    $("st-brand").textContent = t.brand; $("st-title").textContent = t.h1; $("st-sub").textContent = t.sub; $("st-lang").textContent = t.lang; $("st-mode").textContent = t.mode;
    $("st-light").textContent = t.light; $("st-dark").textContent = t.dark; $("st-go").textContent = started ? t.resume : t.go; $("st-tip").textContent = t.tip;
    $("rotate-t").textContent = t.rotate; $("rotate-x").textContent = t.ok;
    [["b-prev", "prev"], ["b-next", "next"], ["b-grid", "grid"], ["b-set", "set"], ["b-full", "full"], ["b-help", "help"]].forEach(function (p) { $(p[0]).title = t[p[1]]; $(p[0]).setAttribute("aria-label", t[p[1]]); });
    $("help-h").textContent = t.helpH;
    $("help-t").innerHTML = t.rows.map(function (r) { return "<tr><td>" + r[0].split(" ").filter(Boolean).map(function (k) { return k === "/" || k === "…" || k === "+" ? k : "<kbd>" + k + "</kbd>"; }).join(" ") + "</td><td>" + r[1] + "</td></tr>"; }).join("");
  }

  /* ---------- start modal ---------- */
  var sel = { lang: prefs.lang, mode: prefs.mode };
  function markSel() {
    document.querySelectorAll("#start .opts").forEach(function (g) {
      var k = g.getAttribute("data-k");
      g.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === sel[k]); b.setAttribute("aria-pressed", b.getAttribute("data-v") === sel[k]); });
    });
    body.classList.toggle("ui-light", sel.mode === "light");
    applyUI(sel.lang, !!D);
  }
  document.querySelectorAll("#start .opts button").forEach(function (b) {
    b.addEventListener("click", function () { sel[b.parentNode.getAttribute("data-k")] = b.getAttribute("data-v"); markSel(); });
  });
  function openStart() { sel = { lang: prefs.lang, mode: prefs.mode }; markSel(); $("start").classList.add("open"); body.classList.add("modal"); }
  function closeStart() { $("start").classList.remove("open"); body.classList.remove("modal"); }
  $("st-go").addEventListener("click", function () {
    var same = D && sel.lang === prefs.lang && sel.mode === prefs.mode;
    prefs = { lang: sel.lang, mode: sel.mode };
    try { localStorage.setItem("deck-prefs", JSON.stringify(prefs)); } catch (e) {}
    closeStart();
    if (!same) load(prefs.lang, prefs.mode);
    if (touch && canFull && !document.fullscreenElement) { try { fullscreen(); } catch (e) {} }
  });

  /* ---------- loading the (obfuscated) deck ---------- */
  function decode(p) {
    var bin = atob(p), n = bin.length, out = new Uint8Array(n), k = KEY.length;
    for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i) ^ KEY.charCodeAt(i % k);
    return JSON.parse(new TextDecoder("utf-8").decode(out));
  }
  var pending = null;
  window.__deck = function (p) { var cb = pending; pending = null; if (cb) cb(decode(p)); };
  function load(lang, mode) {
    body.classList.add("loading");
    pending = function (data) { body.classList.remove("loading"); init(data, mode); };
    var s = document.createElement("script");
    s.src = "assets/d/" + lang + "-" + mode + ".js?v=" + (window.__V || "1");
    s.onload = function () { s.remove(); };
    document.head.appendChild(s);
  }

  /* ---------- helpers ---------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function prepare(node) {
    node.querySelectorAll("[data-build-in]").forEach(function (e) {
      var m = /(\d+)/.exec(e.getAttribute("data-build-in") || ""); var n = m ? +m[1] : 1;
      e.style.setProperty("--bi-delay", (0.25 + n * 0.15) + "s");
    });
    node.querySelectorAll("iframe.xe").forEach(function (f) { f.style.pointerEvents = "none"; });
    node.querySelectorAll("img").forEach(function (i) { i.draggable = false; });
    var seenFlow = false;
    Array.prototype.forEach.call(node.children, function (c) {
      var pinned = (c.style.position === "absolute");
      if (!pinned) { seenFlow = true; if (!c.style.position) c.style.position = "relative"; c.style.zIndex = "1"; }
      else c.style.zIndex = seenFlow ? "2" : "0";
    });
    return node;
  }
  function startEmbeds(node) { node.querySelectorAll("iframe.xe").forEach(function (f) { f.srcdoc = D.embeds[+f.getAttribute("data-e")]; }); }
  function stopEmbeds(node) { node.querySelectorAll("iframe.xe").forEach(function (f) { f.removeAttribute("srcdoc"); f.src = "about:blank"; }); }
  function clamp(i) { return Math.max(0, Math.min(N - 1, i)); }
  function transOf(node) { return (node && node.getAttribute("data-transition")) || "fade"; }

  function init(data, mode) {
    var keep = cur;
    D = data; N = D.slides.length;
    slideEls.forEach(stopEmbeds);
    stage.innerHTML = ""; slideEls = []; cur = -1;
    $("overview").innerHTML = ""; ovBuilt = false;
    body.classList.toggle("theme-dark", mode === "dark");
    body.classList.toggle("theme-light", mode !== "dark");
    D.slides.forEach(function (s) { var n = prepare(el(s.html)); stage.appendChild(n); slideEls.push(n); });
    applyUI(prefs.lang, true);
    fit();
    var h = parseInt(location.hash.slice(1), 10);
    go(keep >= 0 ? keep : (isNaN(h) ? 0 : h - 1), { force: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    checkRotate();
  }

  /* ---------- main view ---------- */
  function fit() {
    var w = innerWidth, h = innerHeight, s = Math.min(w / 1920, h / 1080);
    stage.style.transform = "scale(" + s + ")";
    stage.style.left = ((w - 1920 * s) / 2) + "px";
    stage.style.top = ((h - 1080 * s) / 2) + "px";
    if (body.classList.contains("show-overview")) fitThumbs();
  }

  function go(i, opts) {
    if (!D) return;
    opts = opts || {};
    i = clamp(i);
    if (i === cur && !opts.force) return;
    var dir = i >= cur ? "fwd" : "back";
    var prev = slideEls[cur], next = slideEls[i];
    var tr = dir === "fwd" ? transOf(prev || next) : transOf(next);
    var base = function (n) { return n.className.replace(/\s*(active|leaving|t-\w+|fwd|back)\b/g, "").trim(); };
    if (prev && prev !== next) {
      prev.className = base(prev) + " leaving t-" + tr + " " + dir;
      (function (p) { setTimeout(function () { if (!p.classList.contains("active")) { p.className = base(p); stopEmbeds(p); } }, 650); })(prev);
    }
    next.className = base(next);
    void next.offsetWidth;
    next.className = base(next) + " active t-" + tr + " " + dir;
    startEmbeds(next);
    cur = i;
    $("progress").style.width = ((i + 1) / N * 100) + "%";
    $("counter").textContent = (i + 1) + " / " + N;
    document.querySelectorAll(".thumb").forEach(function (t, k) { t.classList.toggle("current", k === i); });
    try { history.replaceState(null, "", location.pathname + location.search + "#" + (i + 1)); } catch (e) {}
  }

  function step(cmd) {
    var host = slideEls[cur];
    var fs = host ? Array.prototype.slice.call(host.querySelectorAll("iframe.xe[data-steps]")) : [];
    if (!fs.length) { go(cur + (cmd === "next" ? 1 : -1)); return; }
    fs.forEach(function (f) { if (f.contentWindow) f.contentWindow.postMessage({ cmd: cmd }, "*"); });
  }
  function restartCurrent() {
    var n = slideEls[cur]; if (!n) return;
    stopEmbeds(n); var b = n.className.replace(/\s*(active|leaving|t-\w+|fwd|back)\b/g, "").trim();
    n.className = b; void n.offsetWidth; n.className = b + " active t-fade fwd"; startEmbeds(n);
  }

  /* ---------- overview ---------- */
  var ov = $("overview");
  function buildOverview() {
    D.slides.forEach(function (s, k) {
      var t = document.createElement("div"); t.className = "thumb";
      var mini = document.createElement("div"); mini.className = "mini";
      var n = prepare(el(s.html)); n.querySelectorAll("iframe").forEach(function (f) { f.remove(); });
      mini.appendChild(n); t.appendChild(mini);
      t.insertAdjacentHTML("beforeend", '<span class="num">' + (k + 1) + "</span>");
      t.addEventListener("click", function (e) { e.stopPropagation(); toggle("show-overview", false); go(k); });
      ov.appendChild(t);
    });
    ovBuilt = true;
  }
  function fitThumbs() { document.querySelectorAll(".thumb").forEach(function (t) { t.querySelector(".mini").style.transform = "scale(" + (t.clientWidth / 1920) + ")"; }); }
  function toggle(cls, force) {
    var on = body.classList.toggle(cls, force);
    if (cls === "show-overview" && on && D) {
      if (!ovBuilt) buildOverview();
      requestAnimationFrame(function () {
        fitThumbs();
        document.querySelectorAll(".thumb").forEach(function (t, k) { t.classList.toggle("current", k === cur); });
        var c = document.querySelector(".thumb.current"); if (c) c.scrollIntoView({ block: "center" });
      });
    }
    return on;
  }

  /* ---------- input ---------- */
  function fullscreen() {
    var d = document.documentElement;
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) { var r = d.requestFullscreen || d.webkitRequestFullscreen; if (r) { var p = r.call(d); if (p && p.catch) p.catch(function () {}); } }
    else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }
  function showJump() { var j = $("jump"); j.textContent = "→ " + numBuf; j.style.display = numBuf ? "block" : "none"; }

  document.addEventListener("keydown", function (e) {
    if (guardKey(e)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if ($("start").classList.contains("open")) { if (k === "Enter") { $("st-go").click(); e.preventDefault(); } else if (k === "Escape" && D) closeStart(); return; }
    if (/^[0-9]$/.test(k)) { numBuf += k; showJump(); clearTimeout(numTimer); numTimer = setTimeout(function () { numBuf = ""; showJump(); }, 2500); return; }
    if (k === "Enter" && numBuf) { go(+numBuf - 1); numBuf = ""; showJump(); e.preventDefault(); return; }
    if (k === "Escape") { body.classList.remove("show-overview", "show-help", "blacked"); return; }
    if (body.classList.contains("show-overview") && !/^(o|O|g|G)$/.test(k)) {
      if (k === "ArrowRight") { cur = clamp(cur + 1); }
      else if (k === "ArrowLeft") { cur = clamp(cur - 1); }
      else if (k === "Enter" || k === " ") { toggle("show-overview", false); go(cur, { force: true }); e.preventDefault(); return; }
      document.querySelectorAll(".thumb").forEach(function (t, j) { t.classList.toggle("current", j === cur); });
      return;
    }
    switch (k) {
      case "ArrowRight": case "PageDown": case " ": case "Enter": case "l": case "L": go(cur + 1); e.preventDefault(); break;
      case "ArrowLeft": case "PageUp": case "Backspace": case "h": case "H": go(cur - 1); e.preventDefault(); break;
      case "ArrowUp": case "[": case "z": case "Z": step("prev"); e.preventDefault(); break;
      case "ArrowDown": case "]": case "x": case "X": step("next"); e.preventDefault(); break;
      case "Home": go(0); e.preventDefault(); break;
      case "End": go(N - 1); e.preventDefault(); break;
      case "f": case "F": fullscreen(); break;
      case "o": case "O": case "g": case "G": toggle("show-overview"); break;
      case "r": case "R": restartCurrent(); break;
      case "b": case "B": case ".": toggle("blacked"); break;
      case "?": case "/": toggle("show-help"); break;
    }
  });

  var vp = $("viewport");
  var sx = null, sy = null, swiped = false;
  vp.addEventListener("click", function (e) {
    if (swiped) { swiped = false; return; }
    if (e.clientX < innerWidth * 0.25) go(cur - 1); else go(cur + 1);
  });
  vp.addEventListener("touchstart", function (e) { if (e.touches.length > 1) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  vp.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (window.visualViewport && visualViewport.scale > 1.05) return;   /* user is pinch-zoomed: let them pan */
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(cur + (dx < 0 ? 1 : -1)); }
    else if (Math.abs(dy) > 60) { swiped = true; step(dy < 0 ? "next" : "prev"); }
    if (swiped) setTimeout(function () { swiped = false; }, 400);
  });
  if (touch) body.classList.add("touch");
  if (!canFull) body.classList.add("no-full");
  var hudT = null;
  document.addEventListener("mousemove", function () {
    if (touch) return;
    body.classList.add("show-hud"); body.classList.remove("cursor-hidden");
    clearTimeout(hudT); hudT = setTimeout(function () { body.classList.remove("show-hud"); body.classList.add("cursor-hidden"); }, 2500);
  });
  function btn(id, fn) { $(id).addEventListener("click", function (e) { e.stopPropagation(); fn(); }); }
  btn("b-prev", function () { go(cur - 1); });
  btn("b-next", function () { go(cur + 1); });
  btn("b-grid", function () { toggle("show-overview"); });
  btn("b-set", openStart);
  btn("b-full", fullscreen);
  btn("b-help", function () { toggle("show-help"); });
  $("help").addEventListener("click", function () { toggle("show-help", false); });
  $("start").addEventListener("click", function (e) { if (e.target === $("start") && D) closeStart(); });

  /* phone held upright: suggest rotating */
  var rotateDismissed = false;
  function checkRotate() { body.classList.toggle("show-rotate", touch && !rotateDismissed && innerHeight > innerWidth * 1.15 && !!D && !$("start").classList.contains("open")); }
  btn("rotate-x", function () { rotateDismissed = true; checkRotate(); });
  $("rotate").addEventListener("click", function () { rotateDismissed = true; checkRotate(); });

  addEventListener("resize", function () { fit(); checkRotate(); });
  addEventListener("orientationchange", function () { setTimeout(function () { fit(); checkRotate(); }, 250); });
  addEventListener("hashchange", function () { var h = parseInt(location.hash.slice(1), 10); if (h) go(h - 1); });

  /* ---------- content protection (deterrent) ---------- */
  function guardKey(e) {
    var k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    var block = k === "f12" ||
      (mod && /^(c|x|s|u|p|a)$/.test(k)) ||
      (mod && e.shiftKey && /^(i|j|c|k)$/.test(k)) ||
      (e.metaKey && e.altKey && /^(i|j|c|u)$/.test(k)) ||
      (e.ctrlKey && e.shiftKey && k === "delete" && false);
    if (block) { e.preventDefault(); e.stopPropagation(); return true; }
    return false;
  }
  ["contextmenu", "copy", "cut", "paste", "dragstart", "selectstart", "drop"].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); }, true);
  });
  addEventListener("beforeprint", function () { body.classList.add("noprint"); });

  /* ---------- boot ---------- */
  markSel();
  body.classList.add("modal");
  fit();
})();
