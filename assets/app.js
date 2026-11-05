/* NextGen HR Leaders · AI training deck player
   Keyboard: ← → Space PgUp PgDn Home End, numbers+Enter, F, O/G, S, P, R, B, ?, Esc */
(function () {
  "use strict";
  var D = window.DECK, N = D.slides.length;
  var body = document.body, stage = document.getElementById("stage");
  var isPresenter = /[?&]presenter/.test(location.search);
  var cur = -1, numBuf = "", numTimer = null;
  var chan = ("BroadcastChannel" in window) ? new BroadcastChannel("ai-training-deck") : null;

  /* ---------- helpers ---------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function prepare(node) {
    node.querySelectorAll("[data-build-in]").forEach(function (e) {
      var m = /(\d+)/.exec(e.getAttribute("data-build-in") || ""); var n = m ? +m[1] : 1;
      e.style.setProperty("--bi-delay", (0.25 + n * 0.15) + "s");
    });
    node.querySelectorAll("iframe.xe").forEach(function (f) { f.style.pointerEvents = "none"; });
    return node;
  }
  function startEmbeds(node) { node.querySelectorAll("iframe.xe").forEach(function (f) { f.srcdoc = D.embeds[+f.getAttribute("data-e")]; }); }
  function stopEmbeds(node) { node.querySelectorAll("iframe.xe").forEach(function (f) { f.removeAttribute("srcdoc"); f.src = "about:blank"; }); }
  function clamp(i) { return Math.max(0, Math.min(N - 1, i)); }
  function transOf(node) { return (node && node.getAttribute("data-transition")) || "fade"; }

  /* ---------- main view ---------- */
  var slideEls = [];
  if (!isPresenter) {
    D.slides.forEach(function (s) { var n = prepare(el(s.html)); stage.appendChild(n); slideEls.push(n); });
  }

  function fit() {
    if (isPresenter) { fitPresenter(); return; }
    var w = innerWidth, h = innerHeight, s = Math.min(w / 1920, h / 1080);
    stage.style.transform = "scale(" + s + ")";
    stage.style.left = ((w - 1920 * s) / 2) + "px";
    stage.style.top = ((h - 1080 * s) / 2) + "px";
    stage.style.marginLeft = stage.style.marginTop = "0";
    if (body.classList.contains("show-overview")) fitThumbs();
  }

  function go(i, opts) {
    opts = opts || {};
    i = clamp(i);
    if (i === cur && !opts.force) return;
    var dir = i >= cur ? "fwd" : "back";
    if (isPresenter) { cur = i; renderPresenter(); }
    else {
      var prev = slideEls[cur], next = slideEls[i];
      var tr = dir === "fwd" ? transOf(prev || next) : transOf(next);
      if (prev && prev !== next) {
        prev.className = "slide leaving t-" + tr + " " + dir;
        (function (p) { setTimeout(function () { if (!p.classList.contains("active")) { p.className = "slide"; stopEmbeds(p); } }, 650); })(prev);
      }
      next.className = "slide";
      void next.offsetWidth;
      next.className = "slide active t-" + tr + " " + dir;
      startEmbeds(next);
      cur = i;
      document.getElementById("progress").style.width = ((i + 1) / N * 100) + "%";
      document.getElementById("counter").textContent = (i + 1) + " / " + N;
      document.getElementById("notes-body").textContent = D.slides[i].notes || "-";
      document.querySelectorAll(".thumb").forEach(function (t, k) { t.classList.toggle("current", k === i); });
    }
    try { history.replaceState(null, "", location.pathname + location.search + "#" + (i + 1)); } catch (e) {}
    if (chan && !opts.remote) chan.postMessage({ i: i });
  }

  function restartCurrent() {
    if (isPresenter) { renderPresenter(); return; }
    var n = slideEls[cur]; stopEmbeds(n); n.className = "slide"; void n.offsetWidth; n.className = "slide active t-fade fwd"; startEmbeds(n);
  }

  /* ---------- overview ---------- */
  var ov = document.getElementById("overview"), ovBuilt = false;
  function buildOverview() {
    D.slides.forEach(function (s, k) {
      var t = document.createElement("div"); t.className = "thumb";
      var mini = document.createElement("div"); mini.className = "mini";
      mini.appendChild(prepare(el(s.html)));
      t.appendChild(mini);
      t.insertAdjacentHTML("beforeend", '<span class="num">' + (k + 1) + "</span>");
      t.addEventListener("click", function () { toggle("show-overview", false); go(k); });
      ov.appendChild(t);
    });
    ovBuilt = true;
  }
  function fitThumbs() { document.querySelectorAll(".thumb").forEach(function (t) { t.querySelector(".mini").style.transform = "scale(" + (t.clientWidth / 1920) + ")"; }); }
  function toggle(cls, force) {
    var on = body.classList.toggle(cls, force);
    if (cls === "show-overview" && on) {
      if (!ovBuilt) buildOverview();
      requestAnimationFrame(function () {
        fitThumbs();
        document.querySelectorAll(".thumb").forEach(function (t, k) { t.classList.toggle("current", k === cur); });
        var c = document.querySelector(".thumb.current"); if (c) c.scrollIntoView({ block: "center" });
      });
    }
    return on;
  }

  /* ---------- presenter ---------- */
  var t0 = Date.now();
  function renderInto(boxId, idx, live) {
    var host = document.getElementById(boxId); host.innerHTML = "";
    if (idx < 0 || idx >= N) { host.style.background = "#000"; return; }
    var n = prepare(el(D.slides[idx].html)); n.className = "slide active"; host.appendChild(n);
    if (live) startEmbeds(n);
  }
  function renderPresenter() {
    renderInto("pv-cur-stage", cur, true);
    renderInto("pv-next-stage", cur + 1, false);
    document.getElementById("pv-notes").textContent = D.slides[cur].notes || "-";
    document.getElementById("pv-count").textContent = (cur + 1) + " / " + N;
    fitPresenter();
  }
  function fitPresenter() {
    ["pv-cur", "pv-next"].forEach(function (id) {
      var b = document.getElementById(id), s = b.clientWidth / 1920;
      b.style.height = (1080 * s) + "px";
      b.querySelector(".pv-stage").style.transform = "scale(" + s + ")";
    });
  }
  if (isPresenter) {
    body.classList.add("presenter");
    document.title = "Natiq rejimi · " + document.title;
    setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      document.getElementById("pv-timer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    }, 500);
    document.getElementById("pv-reset").addEventListener("click", function () { t0 = Date.now(); });
  }

  /* ---------- input ---------- */
  function fullscreen() {
    if (!document.fullscreenElement) (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    else document.exitFullscreen();
  }
  function openPresenter() {
    window.open(location.pathname + "?presenter#" + (cur + 1), "ai-presenter", "width=1400,height=820");
  }
  function showJump() { var j = document.getElementById("jump"); j.textContent = "→ " + numBuf; j.style.display = numBuf ? "block" : "none"; }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
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
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ": case "Enter": case "l": case "L":
        go(cur + 1); e.preventDefault(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace": case "h": case "H":
        go(cur - 1); e.preventDefault(); break;
      case "Home": go(0); e.preventDefault(); break;
      case "End": go(N - 1); e.preventDefault(); break;
      case "f": case "F": fullscreen(); break;
      case "o": case "O": case "g": case "G": if (!isPresenter) toggle("show-overview"); break;
      case "s": case "S": case "n": case "N": if (!isPresenter) toggle("show-notes"); break;
      case "p": case "P": if (!isPresenter) openPresenter(); break;
      case "r": case "R": restartCurrent(); break;
      case "b": case "B": case ".": toggle("blacked"); break;
      case "?": case "/": toggle("show-help"); break;
    }
  });

  if (!isPresenter) {
    var vp = document.getElementById("viewport");
    vp.addEventListener("click", function (e) {
      if (e.clientX < innerWidth * 0.25) go(cur - 1); else go(cur + 1);
    });
    var tx = null;
    vp.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener("touchend", function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    });
    var hudT = null;
    document.addEventListener("mousemove", function () {
      body.classList.add("show-hud"); body.classList.remove("cursor-hidden");
      clearTimeout(hudT); hudT = setTimeout(function () { body.classList.remove("show-hud"); body.classList.add("cursor-hidden"); }, 2500);
    });
    function btn(id, fn) { document.getElementById(id).addEventListener("click", function (e) { e.stopPropagation(); fn(); }); }
    btn("b-prev", function () { go(cur - 1); });
    btn("b-next", function () { go(cur + 1); });
    btn("b-grid", function () { toggle("show-overview"); });
    btn("b-notes", function () { toggle("show-notes"); });
    btn("b-pres", openPresenter);
    btn("b-full", fullscreen);
    btn("b-help", function () { toggle("show-help"); });
    document.getElementById("help").addEventListener("click", function () { toggle("show-help", false); });
  }

  if (chan) chan.onmessage = function (m) { if (m.data && typeof m.data.i === "number") go(m.data.i, { remote: true }); };

  addEventListener("resize", fit);
  addEventListener("hashchange", function () { var h = parseInt(location.hash.slice(1), 10); if (h) go(h - 1); });

  var start = parseInt(location.hash.slice(1), 10);
  fit();
  go(isNaN(start) ? 0 : start - 1, { force: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
