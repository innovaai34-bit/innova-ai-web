/* Innova AI Assistance: interacción del sitio (sin dependencias). */
(function () {
  "use strict";

  var CONTACT_ENDPOINT = "https://forja-starter-71742d.innovaai34.workers.dev/contact";
  var WA_NUMBER = "573054110761";
  var ICONS = "assets/icons.svg";
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LANG = "es";

  /* ---------- medición ----------
     Sin cookies, sin terceros y sin guardar la IP: el servidor cuenta eventos,
     no personas (ver centro-mando/src/web.ts). Por eso esta página no necesita
     banner de consentimiento — y por eso no se manda NADA de lo que alguien
     escriba: ni su mensaje a la demo, ni sus datos del formulario, ni los
     números que ponga en la calculadora.

     Lo que se mide es el embudo: entra, abre la demo, la usa, llega al
     formulario, lo manda. "1.200 visitas" no se puede accionar; "de 1.200 que
     entraron, 80 abrieron la demo y 3 mandaron el formulario" dice dónde está
     el problema.

     Si falla, falla en silencio: una página no se rompe por no poder contar. */
  var MEDIR = "https://centro-mando-innova.innovaai34.workers.dev/t";
  var medidos = {};
  function medir(evento, detalle, repetible) {
    try {
      if (!repetible) { if (medidos[evento]) return; medidos[evento] = 1; }
      var cuerpo = JSON.stringify({
        e: evento,
        p: location.pathname,
        r: document.referrer || "",
        w: window.innerWidth || 0,
        d: detalle || ""
      });
      // Se manda como text/plain, no como JSON, A PROPOSITO: con JSON el
      // navegador exige una peticion de permiso previa (preflight), y
      // sendBeacon la hace pidiendo enviar credenciales — lo que el servidor
      // rechaza, con razon, porque esto es anonimo. Con text/plain no hay
      // permiso previo que pedir: el golpe sale directo y el servidor lo lee
      // igual. Comprobado en un navegador de verdad; con curl no se nota.
      //
      // sendBeacon ademas sobrevive a que la persona cierre la pestaña.
      var tipo = "text/plain;charset=UTF-8";
      if (navigator.sendBeacon) {
        navigator.sendBeacon(MEDIR, new Blob([cuerpo], { type: tipo }));
      } else {
        fetch(MEDIR, { method: "POST", headers: { "content-type": tipo }, body: cuerpo, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* medir nunca puede romper la página */ }
  }

  /* ---------- utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function t(k) { var v = I18N[LANG][k]; return v === undefined ? I18N.es[k] : v; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function icon(name) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "i"); svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", ICONS + "#" + name); svg.appendChild(use); return svg;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function onVisible(node, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opts || { threshold: 0.25 }).observe(node);
  }
  function once(node, cb, threshold) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); cb(); } }, { threshold: threshold || 0.3 });
    io.observe(node);
  }
  function bubble(dir, text) { return el("div", "bubble " + dir, text); }
  function typingDots() { var d = el("div", "typing-dots"); d.setAttribute("aria-hidden", "true"); d.appendChild(el("i")); d.appendChild(el("i")); d.appendChild(el("i")); return d; }

  /* ---------- idioma ---------- */
  function captureSpanish() {
    document.querySelectorAll("[data-i18n]").forEach(function (n) { var k = n.getAttribute("data-i18n"); if (I18N.es[k] === undefined) I18N.es[k] = n.textContent; });
    document.querySelectorAll("[data-i18n-html]").forEach(function (n) { var k = n.getAttribute("data-i18n-html"); if (I18N.es[k] === undefined) I18N.es[k] = n.innerHTML; });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (n) { var k = n.getAttribute("data-i18n-ph"); if (I18N.es[k] === undefined) I18N.es[k] = n.placeholder; });
  }
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach(function (n) { var v = t(n.getAttribute("data-i18n")); if (typeof v === "string") n.textContent = v; });
    document.querySelectorAll("[data-i18n-html]").forEach(function (n) { var v = t(n.getAttribute("data-i18n-html")); if (typeof v === "string") n.innerHTML = v; });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (n) { var v = t(n.getAttribute("data-i18n-ph")); if (typeof v === "string") n.placeholder = v; });
    $("langBtn").setAttribute("aria-label", t("lang.aria"));
    $("menuBtn").setAttribute("aria-label", t("menu.aria"));
  }
  var builders = [];
  function setLang(lang) {
    LANG = lang === "en" ? "en" : "es";
    applyStatic();
    builders.forEach(function (b) { b(); });
    try { localStorage.setItem("iai_lang", LANG); } catch (e) {}
  }
  $("langBtn").addEventListener("click", function () { setLang(LANG === "es" ? "en" : "es"); });

  /* ---------- navegación ---------- */
  var nav = $("navbar"), menuBtn = $("menuBtn"), links = $("navLinks");
  function closeMenu() { links.classList.remove("open"); nav.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    nav.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  var sentinel = el("div"); sentinel.style.cssText = "position:absolute;top:0;height:24px;width:1px;pointer-events:none";
  document.body.prepend(sentinel);
  onVisible(sentinel, function (v) { nav.classList.toggle("scrolled", !v); }, { threshold: 0 });

  /* ---------- en qué bloque estás ----------
     El menú marca el bloque que está en pantalla: bajando se sabe dónde se está. */
  var navMap = {};
  links.querySelectorAll('a[href^="#"]').forEach(function (a) { navMap[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var blockIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(navMap).forEach(function (k) { navMap[k].classList.toggle("on", k === e.target.id); if (k === e.target.id) navMap[k].setAttribute("aria-current", "true"); else navMap[k].removeAttribute("aria-current"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "plataforma", "sectores", "resultados", "empieza"].forEach(function (id) { if ($(id)) blockIO.observe($(id)); });
  }

  /* ---------- aparición al hacer scroll ---------- */
  var revealIO = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  function observeReveals() { document.querySelectorAll(".reveal:not(.in)").forEach(function (n) { if (revealIO) revealIO.observe(n); else n.classList.add("in"); }); }

  /* ---------- no es un chatbot ---------- */
  function buildCompare() {
    var o = $("cmpOld"), n = $("cmpNew"); o.textContent = ""; n.textContent = "";
    t("cmp.old").forEach(function (x) { var li = el("li"); li.appendChild(icon("x")); li.appendChild(el("span", "", x)); o.appendChild(li); });
    t("cmp.new").forEach(function (x) { var li = el("li"); li.appendChild(icon("check")); li.appendChild(el("span", "", x)); n.appendChild(li); });
  }
  once($("mfHead"), function () { $("mfHead").classList.add("in"); }, 0.5);

  /* ---------- demo interactiva ---------- */
  var lab = { industry: "restaurante", engine: DemoEngine.create(), run: 0, busy: false, started: false, awaiting: null };
  var labThread = $("labThread"), labChat = $("labChat"), labInput = $("labInput");
  function scrollThread() { labThread.scrollTop = labThread.scrollHeight; }
  function buildLabTabs() {
    var box = $("labInds"); box.textContent = "";
    DemoEngine.order.forEach(function (key, i) {
      var info = DemoEngine.info(key, LANG);
      var b = el("button", "ind-btn"); b.type = "button"; b.setAttribute("role", "tab"); b.id = "lab-tab-" + key;
      b.setAttribute("aria-selected", key === lab.industry ? "true" : "false"); b.tabIndex = key === lab.industry ? 0 : -1;
      b.appendChild(icon(info.icon)); b.appendChild(el("span", "", info.label));
      b.addEventListener("click", function () { medir("industria", key, true); selectIndustry(key, true); });
      b.addEventListener("keydown", function (e) { tabKeys(e, box, i); });
      box.appendChild(b);
    });
  }
  function tabKeys(e, box, i) {
    var btns = box.querySelectorAll("[role=tab]"), n = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % btns.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + btns.length) % btns.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = btns.length - 1;
    if (n !== null) { e.preventDefault(); btns[n].focus(); btns[n].click(); }
  }
  function resetBrain() {
    ["bIntent", "bData", "bDecision", "bHuman"].forEach(function (id) { $(id).textContent = "-"; $(id).classList.remove("warn"); });
    $("brainLog").textContent = "";
  }
  function setBrain(a) {
    var map = { bIntent: a.intent, bData: a.data, bDecision: a.decision, bHuman: a.human };
    Object.keys(map).forEach(function (id) {
      var dd = $(id); dd.textContent = map[id] || "-";
      dd.classList.toggle("warn", !!a.warn && (id === "bData" || id === "bDecision"));
      var row = dd.parentNode; row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash");
      setTimeout(function () { row.classList.remove("flash"); }, 900);
    });
  }
  function logAction(a) {
    var li = el("li", a[2] ? "hot" : ""); li.appendChild(icon(a[0])); li.appendChild(el("span", "", a[1]));
    var log = $("brainLog"); log.appendChild(li); log.scrollTop = log.scrollHeight;
  }
  function renderSuggestions() {
    var box = $("labSuggest"); box.textContent = "";
    var info = DemoEngine.info(lab.industry, LANG), list = info.sugg.slice();
    if (lab.awaiting === "name") list.unshift(info.nameSugg);
    else if (lab.awaiting === "slot") list.unshift(info.slotSugg);
    list.forEach(function (s) {
      var b = el("button", "sugg", s); b.type = "button";
      b.addEventListener("click", function () { send(s); });
      box.appendChild(b);
    });
  }
  async function exchange(text, my) {
    labThread.appendChild(bubble("in", text)); scrollThread();
    labChat.classList.add("is-typing");
    var dots = typingDots();
    await sleep(350); if (my !== lab.run) return false;
    labThread.appendChild(dots); scrollThread();
    var r = await lab.engine.reply({ industry: lab.industry, lang: LANG, message: text });
    await sleep(Math.min(1500, 650 + r.reply.length * 9));
    if (my !== lab.run) { dots.remove(); return false; }
    dots.remove(); labChat.classList.remove("is-typing");
    labThread.appendChild(bubble("out", r.reply));
    setBrain(r.analysis || {});
    (r.actions || []).forEach(function (a, i) { setTimeout(function () { if (my === lab.run) logAction(a); }, 150 + i * 220); });
    if (r.hot) {
      setTimeout(function () {
        if (my !== lab.run) return;
        var s = el("div", "bubble sys"); s.appendChild(document.createTextNode(DemoEngine.common(LANG).opp)); labThread.appendChild(s); scrollThread();
      }, 700);
    }
    lab.awaiting = r.awaiting || null;
    scrollThread();
    return true;
  }
  async function send(text) {
    text = (text || "").trim();
    if (!text || lab.busy) return;
    if (lab.autoplaying) { lab.autoplaying = false; lab.run++; labChat.classList.remove("is-typing"); var d = labThread.querySelector(".typing-dots"); if (d) d.remove(); }
    lab.busy = true; labInput.value = "";
    var my = lab.run;
    await exchange(text, my);
    lab.busy = false;
    renderSuggestions();
  }
  async function selectIndustry(key, user) {
    lab.industry = key; lab.run++; lab.busy = false; lab.awaiting = null;
    var my = lab.run;
    if (lab.engine.reset) lab.engine.reset();
    document.querySelectorAll("#labInds [role=tab]").forEach(function (b) {
      var on = b.id === "lab-tab-" + key; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1;
    });
    var info = DemoEngine.info(key, LANG);
    $("labBiz").textContent = info.biz;
    var av = $("labAvatar"); av.textContent = ""; av.appendChild(icon(info.icon));
    labThread.textContent = ""; labChat.classList.remove("is-typing"); resetBrain();
    $("labSuggest").textContent = "";
    labThread.appendChild(bubble("out", info.greet));
    // Conversación de ejemplo de la industria, luego el turno es del visitante.
    lab.autoplaying = true;
    for (var i = 0; i < info.script.length; i++) {
      await sleep(REDUCED ? 0 : 900); if (my !== lab.run) return;
      var ok = await exchange(info.script[i], my); if (!ok) return;
    }
    lab.autoplaying = false;
    await sleep(REDUCED ? 0 : 700); if (my !== lab.run) return;
    labThread.appendChild(el("div", "bubble sys", DemoEngine.common(LANG).tryNow)); scrollThread();
    renderSuggestions();
  }
  // El evento, NO lo que escribió: lo que la gente le dice a la demo es suyo.
  $("labForm").addEventListener("submit", function (e) { e.preventDefault(); medir("demo_mensaje", "", true); send(labInput.value); });
  $("labReset").addEventListener("click", function () { lab.engine = DemoEngine.create(); selectIndustry(lab.industry, true); });
  $("openRealBot").addEventListener("click", function () {
    var host = document.querySelector("[data-forja-widget]");
    var btn = host && host.shadowRoot && host.shadowRoot.querySelector(".burbuja");
    if (btn) { btn.click(); return; }
    window.open("https://wa.me/" + WA_NUMBER, "_blank", "noopener");
  });
  // La demo abre con los agentes; el chat del asistente arranca cuando se elige su pestaña.

  /* ---------- cómo funciona ---------- */
  var flowRun = 0;
  function buildCaps() {
    var caps = $("caps"); caps.textContent = "";
    t("caps").forEach(function (g) {
      var d = el("div", "cap"); var h = el("h3"); h.appendChild(icon(g[0])); h.appendChild(el("span", "", g[1])); d.appendChild(h);
      var ul = el("ul"); g[2].forEach(function (x) { var li = el("li"); li.appendChild(icon("check")); li.appendChild(el("span", "", x)); ul.appendChild(li); }); d.appendChild(ul);
      caps.appendChild(d);
    });
  }
  async function playFlow() {
    var my = ++flowRun, stages = document.querySelectorAll("#flow .stage");
    stages.forEach(function (s) { s.classList.remove("on", "active"); });
    for (var i = 0; i < stages.length; i++) {
      if (my !== flowRun) return;
      stages.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      stages[i].classList.add("on");
      await sleep(REDUCED ? 0 : 1100);
    }
    stages.forEach(function (s) { s.classList.remove("active"); });
  }
  once($("flow"), function () { playFlow(); }, 0.35);
  $("flowReplay").addEventListener("click", function () { playFlow(); });

  /* ---------- tu equipo ---------- */
  function buildTeam() {
    var box = $("team"); box.textContent = "";
    t("team").forEach(function (m, i) {
      var a = el("article", "tm tm-" + m.cls + " reveal"); a.style.setProperty("--i", i);
      var top = el("div", "tm-top");
      var ic = el("span", "tm-ic"); ic.appendChild(icon(m.icon)); top.appendChild(ic);
      var nm = el("div"); nm.appendChild(el("span", "tm-kind", m.kind)); nm.appendChild(el("h3", "", m.name)); top.appendChild(nm);
      if (m.tag) top.appendChild(el("span", "tm-tag", m.tag));
      a.appendChild(top);
      a.appendChild(el("p", "tm-what", m.what));
      var tl = el("div", "tm-row"); tl.appendChild(el("b", "", t("team.tools")));
      var ul = el("ul", "tm-tools"); m.tools.forEach(function (x) { ul.appendChild(el("li", "", x)); }); tl.appendChild(ul); a.appendChild(tl);
      var g = el("div", "tm-row"); g.appendChild(el("b", "", t("team.gives"))); g.appendChild(el("p", "", m.gives)); a.appendChild(g);
      var n = el("div", "tm-row tm-never"); n.appendChild(el("b", "", t("team.never"))); var np = el("p"); np.appendChild(icon("shield-check")); np.appendChild(el("span", "", m.never)); n.appendChild(np); a.appendChild(n);
      box.appendChild(a);
    });
    observeReveals();
  }

  /* ---------- demo: encargar a un agente ---------- */
  var alab = { idx: 0, run: 0, started: false };
  function buildAlabList() {
    var box = $("alabList"); box.textContent = "";
    t("alab").forEach(function (d, i) {
      var b = el("button", "alab-btn alab-" + d.cls); b.type = "button"; b.setAttribute("role", "tab"); b.id = "alab-tab-" + i;
      b.setAttribute("aria-selected", i === alab.idx ? "true" : "false"); b.tabIndex = i === alab.idx ? 0 : -1;
      var ic = el("span", "alab-ic"); ic.appendChild(icon(d.icon)); b.appendChild(ic);
      var tx = el("span", "alab-tx"); tx.appendChild(el("b", "", d.who)); tx.appendChild(el("small", "", d.task)); b.appendChild(tx);
      b.addEventListener("click", function () { medir("agente", d.key, true); playAgent(i); });
      b.addEventListener("keydown", function (e) { tabKeys(e, box, i); });
      box.appendChild(b);
    });
  }
  async function playAgent(i) {
    alab.idx = i; alab.started = true;
    var my = ++alab.run, alive = function () { return my === alab.run; };
    var d = t("alab")[i];
    $("alabList").querySelectorAll("[role=tab]").forEach(function (b, k) { b.setAttribute("aria-selected", k === i ? "true" : "false"); b.tabIndex = k === i ? 0 : -1; });
    var work = document.querySelector(".alab-work"); work.className = "alab-work alab-" + d.cls;
    var av = $("alabAv"); av.textContent = ""; av.appendChild(icon(d.icon));
    $("alabWho").textContent = d.who; $("alabBiz").textContent = d.biz; $("alabTask").textContent = d.task;
    var tools = $("alabTools"); tools.textContent = ""; d.tools.forEach(function (x) { tools.appendChild(el("li", "", x)); });
    var steps = $("alabSteps"); steps.textContent = "";
    var res = $("alabResult"); res.textContent = ""; res.classList.remove("show");
    var fast = REDUCED;
    for (var k = 0; k < d.steps.length; k++) {
      await sleep(fast ? 0 : (k ? 900 : 400)); if (!alive()) return;
      var st = d.steps[k], li = el("li", "alab-step working");
      var ic = el("span", "as-ic"); ic.appendChild(icon(st[0])); li.appendChild(ic);
      var tx = el("div"); tx.appendChild(el("b", "", st[1])); tx.appendChild(el("span", "", st[2])); li.appendChild(tx);
      steps.appendChild(li);
      await sleep(fast ? 0 : 650); if (!alive()) return;
      li.classList.remove("working"); li.classList.add("done");
    }
    await sleep(fast ? 0 : 500); if (!alive()) return;
    var r = d.result, card = el("div", "ar-card");
    var head = el("div", "ar-head"); head.appendChild(el("span", "ar-k", r.k)); head.appendChild(el("span", "ar-status", r.status)); card.appendChild(head);
    card.appendChild(el("h4", "", r.t));
    var dl = el("dl", "ar-rows"); r.rows.forEach(function (x) { var w = el("div"); w.appendChild(el("dt", "", x[0])); w.appendChild(el("dd", "", x[1])); dl.appendChild(w); }); card.appendChild(dl);
    if (r.critic) { var c = el("p", "ar-critic"); c.appendChild(icon("magnifying-glass")); c.appendChild(el("span", "", r.critic)); card.appendChild(c); }
    var acts = el("div", "ar-acts");
    var ok = el("button", "btn btn-primary btn-sm", r.ok); ok.type = "button";
    var adj = el("button", "btn btn-ghost btn-sm", r.adjust); adj.type = "button";
    var msg = el("p", "ar-msg"); msg.setAttribute("role", "status");
    function answer(text, okd) { msg.textContent = ""; msg.appendChild(icon(okd ? "check-circle" : "arrows-clockwise")); msg.appendChild(el("span", "", text)); msg.classList.add("show"); ok.disabled = adj.disabled = true; card.classList.add(okd ? "approved" : "adjusting"); }
    ok.addEventListener("click", function () { medir("agente_aprobar", d.key, true); answer(r.okMsg, true); });
    adj.addEventListener("click", function () { answer(r.adjustMsg, false); });
    acts.appendChild(ok); acts.appendChild(adj); card.appendChild(acts); card.appendChild(msg);
    res.appendChild(card); res.classList.add("show");
  }
  $("alabReplay").addEventListener("click", function () { playAgent(alab.idx); });
  once($("agentLab"), function () { if (!alab.started) { medir("demo_agentes"); playAgent(alab.idx); } }, 0.25);
  function setMode(agent) {
    $("modeAsis").setAttribute("aria-selected", agent ? "false" : "true"); $("modeAsis").tabIndex = agent ? -1 : 0;
    $("modeAgent").setAttribute("aria-selected", agent ? "true" : "false"); $("modeAgent").tabIndex = agent ? 0 : -1;
    $("lab").hidden = agent; $("agentLab").hidden = !agent;
    if (agent) { medir("demo_agentes"); if (!alab.started) playAgent(alab.idx); }
    else if (!lab.started) { lab.started = true; medir("demo"); selectIndustry(lab.industry, false); }
  }
  $("modeAsis").addEventListener("click", function () { setMode(false); });
  $("modeAgent").addEventListener("click", function () { setMode(true); });
  [$("modeAsis"), $("modeAgent")].forEach(function (b) {
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); var other = b.id === "modeAsis" ? $("modeAgent") : $("modeAsis"); other.focus(); other.click(); }
    });
  });

  /* ---------- ADN ---------- */
  var dnaVisible = false, dnaIdx = 0;
  function buildDna() {
    var ul = $("dnaIn"); ul.textContent = "";
    t("dna.in").forEach(function (d, i) { var li = el("li"); li.style.setProperty("--i", i); li.appendChild(icon(d[0])); li.appendChild(el("span", "", d[1])); ul.appendChild(li); });
  }
  once($("dnaMap"), function () { $("dnaMap").classList.add("in"); }, 0.3);
  onVisible($("dnaMap"), function (v) { dnaVisible = v; });
  if (!REDUCED) setInterval(function () {
    if (!dnaVisible) return;
    var lis = $("dnaIn").children; if (!lis.length) return;
    Array.prototype.forEach.call(lis, function (l) { l.classList.remove("pulse"); });
    lis[dnaIdx % lis.length].classList.add("pulse"); lis[(dnaIdx + 3) % lis.length].classList.add("pulse"); dnaIdx++;
  }, 1100);

  /* ---------- integraciones ---------- */
  var orbitVisible = false, orbitIdx = 0;
  function buildOrbit() {
    var nodes = t("int.nodes"), ul = $("orbitNodes"), svg = $("orbitLines");
    ul.textContent = ""; svg.textContent = "";
    var n = nodes.length;
    nodes.forEach(function (d, i) {
      var ang = (-90 + i * 360 / n) * Math.PI / 180, x = 50 + 41 * Math.cos(ang), y = 50 + 41 * Math.sin(ang);
      var li = el("li"); li.style.setProperty("--x", x.toFixed(2) + "%"); li.style.setProperty("--y", y.toFixed(2) + "%");
      var node = el("span", "node"); node.appendChild(icon(d[0])); li.appendChild(node); li.appendChild(el("small", "", d[1])); ul.appendChild(li);
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      // La línea va del borde del núcleo al borde del nodo, sin cruzar el logo ni la etiqueta.
      line.setAttribute("x1", (50 + 12.5 * Math.cos(ang)).toFixed(2)); line.setAttribute("y1", (50 + 12.5 * Math.sin(ang)).toFixed(2));
      line.setAttribute("x2", (50 + 35 * Math.cos(ang)).toFixed(2)); line.setAttribute("y2", (50 + 35 * Math.sin(ang)).toFixed(2));
      svg.appendChild(line);
    });
    showOrbitEvent(orbitIdx);
  }
  function showOrbitEvent(i) {
    var evs = t("int.events"), ev = evs[i % evs.length], lis = $("orbitNodes").children, lines = $("orbitLines").children;
    Array.prototype.forEach.call(lis, function (l, k) { l.classList.toggle("on", ev[0].indexOf(k) !== -1); });
    Array.prototype.forEach.call(lines, function (l, k) { l.classList.toggle("on", ev[0].indexOf(k) !== -1); });
    var live = $("integLive"); live.style.opacity = "0";
    setTimeout(function () { live.textContent = ev[1]; live.style.opacity = "1"; }, REDUCED ? 0 : 200);
  }
  onVisible($("orbit"), function (v) { orbitVisible = v; });
  if (!REDUCED) setInterval(function () { if (orbitVisible) showOrbitEvent(++orbitIdx); }, 2600);

  /* ---------- industrias ---------- */
  var indIdx = 0;
  function buildIndustries() {
    var list = $("indList"); list.textContent = "";
    t("ind").forEach(function (d, i) {
      var b = el("button", "ind-btn"); b.type = "button"; b.setAttribute("role", "tab"); b.id = "ind-tab-" + i;
      b.setAttribute("aria-controls", "indPanel");
      b.appendChild(icon(d.icon)); b.appendChild(el("span", "", d.name));
      b.addEventListener("click", function () { showIndustry(i); });
      b.addEventListener("keydown", function (e) { tabKeys(e, list, i); });
      list.appendChild(b);
    });
    showIndustry(indIdx, true);
  }
  function showIndustry(i, silent) {
    indIdx = i;
    var d = t("ind")[i], p = $("indPanel");
    $("indList").querySelectorAll("[role=tab]").forEach(function (b, k) { b.setAttribute("aria-selected", k === i ? "true" : "false"); b.tabIndex = k === i ? 0 : -1; });
    p.setAttribute("aria-labelledby", "ind-tab-" + i);
    p.textContent = "";
    var head = el("div", "ip-head"); var av = el("span", "avatar"); av.appendChild(icon(d.icon)); head.appendChild(av); head.appendChild(el("h3", "", d.name)); p.appendChild(head);
    var g = el("div", "ip-grid");
    var b1 = el("div", "ip-block"); b1.appendChild(el("h4", "", t("ind.problem"))); b1.appendChild(el("p", "", d.problem)); g.appendChild(b1);
    if (d.agents && d.agents.length) {
      var b5 = el("div", "ip-block ip-agents"); b5.appendChild(el("h4", "", t("ind.agents"))); var ul2 = el("ul");
      d.agents.forEach(function (x) { var li = el("li"); li.appendChild(icon("brain")); li.appendChild(el("span", "", x)); ul2.appendChild(li); }); b5.appendChild(ul2); g.appendChild(b5);
    }
    var b2 = el("div", "ip-block"); b2.appendChild(el("h4", "", t("ind.does"))); var ul = el("ul");
    d.does.forEach(function (x) { var li = el("li"); li.appendChild(icon("check")); li.appendChild(el("span", "", x)); ul.appendChild(li); }); b2.appendChild(ul); g.appendChild(b2);
    var b3 = el("div", "ip-block ip-chat"); b3.appendChild(el("h4", "", t("ind.chat")));
    d.chat.forEach(function (m) { b3.appendChild(bubble(m[0], m[1])); }); g.appendChild(b3);
    var b4 = el("div", "ip-benefit"); var bp = el("p"); bp.appendChild(el("b", "", t("ind.benefit") + ":")); bp.appendChild(document.createTextNode(d.benefit)); b4.appendChild(bp);
    var tryBtn = el("a", "btn btn-ghost btn-sm"); tryBtn.href = "#demo"; tryBtn.appendChild(el("span", "", t("ind.try"))); tryBtn.appendChild(icon("arrow-right"));
    tryBtn.addEventListener("click", function () { setMode(false); lab.started = true; selectIndustry(d.key, true); });
    b4.appendChild(tryBtn); g.appendChild(b4);
    p.appendChild(g);
    if (!silent) { p.classList.remove("swap"); void p.offsetWidth; p.classList.add("swap"); }
  }

  /* ---------- calculadora ---------- */
  var roiIds = ["r-msgs", "r-leads", "r-ticket", "r-conv", "r-lost"];
  function fmt(n) { return new Intl.NumberFormat(LANG === "en" ? "en-US" : "es-CO", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n))); }
  function money(n) { return "$" + fmt(n); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function syncRange(r) {
    var p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty("--p", Math.max(0, Math.min(100, p)) + "%");
  }
  function calcRoi() {
    var leads = num("r-leads"), ticket = num("r-ticket"), conv = Math.min(100, num("r-conv")) / 100, lost = Math.min(100, num("r-lost")) / 100;
    $("oOpp").textContent = fmt(leads);
    $("oRev").textContent = money(leads * conv * ticket);
    $("oLost").textContent = fmt(leads * lost);
    $("oLostRev").textContent = money(leads * lost * conv * ticket);
  }
  // Solo que la tocó. Los números que ponga son de su negocio y no viajan.
  $("roiForm").addEventListener("input", function () { medir("calculadora"); });
  document.querySelectorAll("#roiForm input[type=range]").forEach(function (r) {
    var input = $(r.dataset.for);
    r.value = input.value; syncRange(r);
    r.addEventListener("input", function () { input.value = r.value; syncRange(r); calcRoi(); });
    input.addEventListener("input", function () { r.value = input.value; syncRange(r); calcRoi(); });
  });
  $("roiForm").addEventListener("submit", function (e) { e.preventDefault(); });
  $("roiCta").addEventListener("click", function () {
    var need = $("f-necesidad");
    if (need.value.trim()) return;
    need.value = t("roi.summary").replace("{msgs}", fmt(num("r-msgs"))).replace("{leads}", fmt(num("r-leads"))).replace("{ticket}", money(num("r-ticket"))).replace("{conv}", fmt(num("r-conv"))).replace("{lost}", fmt(num("r-lost"))) + " ";
  });

  /* ---------- video ---------- */
  var film = $("filmFrame"), filmVisible = false, filmRun = 0;
  if (film.dataset.videoSrc) {
    var v = document.createElement("video");
    v.src = film.dataset.videoSrc; v.controls = true; v.playsInline = true; v.preload = "metadata";
    if (film.dataset.poster) v.poster = film.dataset.poster;
    film.appendChild(v); film.classList.add("has-video");
  } else {
    onVisible(film, function (vis) { filmVisible = vis; if (vis) playFilm(); }, { threshold: 0.4 });
  }
  async function playFilm() {
    if (filmRun) return;
    var parts = film.querySelectorAll(".film-chat > *");
    if (REDUCED) { parts.forEach(function (p) { p.classList.add("show"); }); return; }
    filmRun = 1;
    while (filmVisible) {
      parts.forEach(function (p) { p.classList.remove("show"); });
      await sleep(900);
      for (var i = 0; i < parts.length && filmVisible; i++) { parts[i].classList.add("show"); await sleep(i === 0 ? 1600 : 1900); }
      await sleep(4200);
    }
    filmRun = 0;
  }

  /* ---------- casos ---------- */
  function buildCases() {
    var box = $("cases"); box.textContent = "";
    t("cases").forEach(function (c, i) {
      var a = el("article", "case reveal"); a.style.setProperty("--i", i);
      var top = el("div", "case-top"); var h = el("h3"); h.appendChild(icon(c.icon)); h.appendChild(el("span", "", c.title)); top.appendChild(h);
      top.appendChild(el("span", "case-badge", c.real ? t("case.badgeReal") : t("case.badge"))); a.appendChild(top);
      var ba = el("div", "ba");
      var pb = el("p", "before"); pb.appendChild(el("b", "", t("case.before"))); pb.appendChild(document.createTextNode(c.before));
      var pa = el("p", "after"); pa.appendChild(el("b", "", t("case.after"))); pa.appendChild(document.createTextNode(c.after));
      ba.appendChild(pb); ba.appendChild(pa); a.appendChild(ba);
      var m = el("div", "measure");
      if (c.real && c.results && c.results.length) {
        // Solo cifras reales y verificadas: { v: "+X%", l: "conversaciones atendidas" }
        m.appendChild(el("b", "", t("case.results"))); var r = el("div", "results");
        c.results.forEach(function (x) { var d = el("div"); d.appendChild(el("b", "", x.v)); d.appendChild(el("span", "", x.l)); r.appendChild(d); });
        m.appendChild(r);
      } else {
        m.appendChild(el("b", "", t("case.measure"))); var ul = el("ul");
        c.measure.forEach(function (x) { ul.appendChild(el("li", "", x)); }); m.appendChild(ul);
      }
      a.appendChild(m); box.appendChild(a);
    });
    observeReveals();
  }

  /* ---------- proceso ---------- */
  function buildTimeline() {
    var ol = $("timeline"); ol.textContent = "";
    t("steps").forEach(function (s, i) {
      var li = el("li", "tl-step"); li.dataset.n = String(i + 1);
      var h = el("h3"); h.appendChild(icon(s[0])); h.appendChild(el("span", "", s[1])); li.appendChild(h); li.appendChild(el("p", "", s[2]));
      ol.appendChild(li);
      if (REDUCED || !("IntersectionObserver" in window)) li.classList.add("on");
      else once(li, function () { li.classList.add("on"); updateFill(); }, 0.6);
    });
    updateFill();
  }
  function updateFill() {
    var ol = $("timeline"), steps = ol.children, on = ol.querySelectorAll(".on").length;
    ol.style.setProperty("--fill", steps.length ? (on / steps.length * 100) + "%" : "0%");
  }

  /* ---------- formulario (se conserva el flujo existente) ---------- */
  function buildChips() {
    var box = $("chips"), pressed = {};
    box.querySelectorAll(".chip").forEach(function (c, i) { pressed[i] = c.getAttribute("aria-pressed") === "true"; });
    box.textContent = "";
    t("topics").forEach(function (x, i) {
      var b = el("button", "chip", x); b.type = "button"; b.setAttribute("aria-pressed", pressed[i] ? "true" : "false");
      b.addEventListener("click", function () { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); });
      box.appendChild(b);
    });
  }
  function setErr(id, msg) {
    var e = $("e-" + id); e.textContent = msg || "";
    var fg = e.closest(".fg"); if (fg) fg.classList.toggle("bad", !!msg);
  }
  function collect() {
    var f = $("leadForm");
    return {
      nombre: f.nombre.value.trim(), empresa: f.empresa.value.trim(), sector: f.sector.value ? f.sector.options[f.sector.selectedIndex].text : "",
      contacto: f.contacto.value.trim(), necesidad: f.necesidad.value.trim(), website: f.website.value,
      temas: Array.prototype.map.call(document.querySelectorAll('#chips .chip[aria-pressed="true"]'), function (c) { return c.textContent; }),
      acepta: f.acepta.checked
    };
  }
  function validate(d) {
    var ok = true;
    setErr("nombre", d.nombre.length < 2 ? (ok = false, t("e.name")) : "");
    var contactOk = /@/.test(d.contacto) || d.contacto.replace(/\D/g, "").length >= 7;
    setErr("contacto", contactOk ? "" : (ok = false, t("e.contact")));
    setErr("necesidad", d.necesidad.length < 5 ? (ok = false, t("e.need")) : "");
    setErr("acepta", d.acepta ? "" : (ok = false, t("e.consent")));
    return ok;
  }
  function waLink(d) {
    var lines = [t("wa.intro"), d.nombre && (t("wa.name") + ": " + d.nombre), d.empresa && (t("wa.company") + ": " + d.empresa), d.sector && (t("wa.biz") + ": " + d.sector),
      d.contacto && (t("wa.contact") + ": " + d.contacto), d.temas.length && (t("wa.topics") + ": " + d.temas.join(", ")), d.necesidad && (t("wa.need") + ": " + d.necesidad)].filter(Boolean);
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
  }
  $("leadForm").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var form = this, d = collect(), msg = $("formMsg"), btn = $("sendBtn");
    msg.className = "form-msg"; msg.textContent = "";
    if (!validate(d)) { var bad = form.querySelector(".fg.bad input, .fg.bad textarea"); if (bad) bad.focus(); return; }
    btn.disabled = true; var label = btn.querySelector("span"); label.textContent = t("f.sending");
    try {
      var res = await fetch(CONTACT_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.ok) throw new Error(data.error || "http_" + res.status);
      medir("formulario_enviado");
      form.classList.add("is-sent");
    } catch (err) {
      msg.className = "form-msg error";
      msg.appendChild(document.createTextNode(t("e.send") + " "));
      var a = el("a", "", t("e.sendLink")); a.href = waLink(d); a.target = "_blank"; a.rel = "noopener"; msg.appendChild(a);
    } finally {
      btn.disabled = false; label.textContent = t("f.send");
    }
  });
  ["nombre", "contacto", "necesidad"].forEach(function (id) { $("f-" + id).addEventListener("input", function () { setErr(id, ""); }); });
  $("f-acepta").addEventListener("change", function () { setErr("acepta", ""); });

  /* ---------- arranque ---------- */
  builders.push(buildCompare, buildCaps, buildTeam, buildDna, buildOrbit, buildIndustries, calcRoi, buildCases, buildTimeline, buildChips,
    function () { buildAlabList(); if (alab.started) playAgent(alab.idx); },
    function () {
      buildLabTabs();
      if (lab.started) { selectIndustry(lab.industry, false); return; }
      var info = DemoEngine.info(lab.industry, LANG), av = $("labAvatar");
      $("labBiz").textContent = info.biz; av.textContent = ""; av.appendChild(icon(info.icon));
    });
  medir("vista");
  // Cuando el formulario entra en pantalla: es el paso del embudo que dice
  // cuántos LLEGARON a pedirlo, frente a cuántos lo mandaron.
  if ($("leadForm")) once($("leadForm"), function () { medir("formulario_visto"); }, 0.2);

  // ── LOS CLICS A WHATSAPP, TODOS ──────────────────────────────────────
  //
  // Delegado en el documento y no botón por botón: hay enlaces a WhatsApp
  // en la burbuja fija, en la portada, en el cierre y en el pie, y uno
  // nuevo mañana no tendría por qué acordarse de medirse.
  //
  // `repetible` queda en falso: lo que se quiere saber es cuánta GENTE se
  // va por ahí, no cuántas veces pulsó. Una persona que vuelve y pulsa
  // otra vez sigue siendo una persona.
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me/"]') : null;
      if (a) medir("whatsapp");
    },
    true,
  );
  captureSpanish();
  var saved = null; try { saved = localStorage.getItem("iai_lang"); } catch (e) {}
  setLang(saved === "en" ? "en" : "es");
  observeReveals();
})();
