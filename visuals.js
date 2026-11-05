/* =====================================================================
   visuals.js - the big pictures of CodeFlix
   ---------------------------------------------------------------------
   loopScene()   -> a large for/while loop diagram with a loop-back arrow
   laptopScene() -> print() shown on a laptop screen
   parseLoop()   -> splits a loop line into Initialize / Condition / Update
   mountHome()   -> animated hero demo + the "every idea as a picture" cards
   Colours:  INITIALIZE = green   CONDITION = amber   UPDATE = pink
   ===================================================================== */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clip = (t, n) => { t = String(t); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

  /* ---------- split one source line into the three loop parts ---------- */
  function parseLoop(line, lang) {
    let m;
    if (lang === "c") {
      if ((m = line.match(/^(\s*)for\s*\(([^;]*);([^;]*);([^)]*)\)(.*)$/)))
        return { type: "for", pre: m[1] + "for (", init: m[2], cond: m[3], upd: m[4], post: ")" + m[5], v: (m[2].match(/(\w+)\s*=/) || [])[1] || "" };
      if ((m = line.match(/^(\s*)while\s*\((.*)\)(.*)$/)))
        return { type: "while", pre: m[1] + "while (", cond: m[2], post: ")" + m[3], v: "" };
    } else {
      if ((m = line.match(/^(\s*)for\s+(\w+)\s+in\s+(.+?):(.*)$/)))
        return { type: "pyfor", pre: m[1] + "for ", init: m[2], mid: " in ", cond: m[3], post: ":" + m[4], v: m[2] };
      if ((m = line.match(/^(\s*)while\s+(.+?):(.*)$/)))
        return { type: "while", pre: m[1] + "while ", cond: m[2], post: ":" + m[3], v: "" };
    }
    return null;
  }
  // The line of code with the 3 parts coloured (cz = the site's normal syntax colouriser)
  function loopLineHtml(p, cz) {
    const w = (cls, t) => `<span class="${cls}">${cz(t)}</span>`;
    if (p.type === "for") return cz(p.pre) + w("lp-init", p.init) + cz(";") + w("lp-cond", p.cond) + cz(";") + w("lp-upd", p.upd) + cz(p.post);
    if (p.type === "pyfor") return cz(p.pre) + w("lp-init", p.init) + cz(p.mid) + w("lp-cond", p.cond) + cz(p.post);
    return cz(p.pre) + w("lp-cond", p.cond) + cz(p.post);
  }

  /* ---------- the loop diagram (SVG) ---------- */
  function node(cls, on, x, y, w, h, tag, code) {
    return `<g class="lpn ${cls}${on ? " on" : ""}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/>
      <text class="tag" x="${x + w / 2}" y="${y + 23}" text-anchor="middle">${tag}</text>
      <text class="code" x="${x + w / 2}" y="${y + 49}" text-anchor="middle">${esc(clip(code, 15))}</text></g>`;
  }
  let uidN = 0;
  function loopSvg(o) {
    const u = "m" + (++uidN) + "_";
    const on = (k) => o.active.indexOf(k) >= 0;
    const mk = { "a-back": "ahp", "a-true": "ahg", "a-false": "ahr" };
    const arrow = (d, cls) => `<path class="lpa ${cls || ""}" d="${d}" marker-end="url(#${u}${mk[(cls || "").split(" ")[0]] || "ah"})"/>`;
    const res = o.result === true ? `<text class="chipT yes" x="280" y="96" text-anchor="middle">TRUE ✓</text>` : o.result === false ? `<text class="chipT no" x="280" y="96" text-anchor="middle">FALSE ✕</text>` : "";
    return `<svg class="lp-svg" viewBox="0 0 580 275" role="img" aria-label="Loop diagram: initialize, check condition, run body, update, then loop back">
      <defs><marker id="${u}ah" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" orient="auto"><path d="M0 0L10 5L0 10z" fill="#64748b"/></marker><marker id="${u}ahp" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ec4899"/></marker><marker id="${u}ahg" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" orient="auto"><path d="M0 0L10 5L0 10z" fill="#10b981"/></marker><marker id="${u}ahr" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ef4444"/></marker></defs>
      ${node("n-init", on("init"), 8, 22, 150, 66, "① INITIALIZE", o.init)}
      <g class="lpn n-cond${on("cond") ? " on" : ""}"><path d="M280 6L388 60L280 114L172 60z"/>
        <text class="tag" x="280" y="40" text-anchor="middle">② CONDITION</text>
        <text class="code" x="280" y="68" text-anchor="middle">${esc(clip(o.cond, 13))}</text>${res}</g>
      <g class="lpn n-body${on("body") ? " on" : ""}"><rect x="422" y="22" width="150" height="66" rx="16"/>
        <text class="tag" x="497" y="45" text-anchor="middle">▶ BODY</text><text class="code" x="497" y="71" text-anchor="middle">${esc(clip(o.body || "run the lines", 15))}</text></g>
      ${node("n-upd", on("upd"), 205, 195, 150, 66, "③ UPDATE", o.upd)}
      <g class="lpn n-exit${o.exit ? " on" : ""}"><rect x="12" y="195" width="140" height="66" rx="33"/><text class="tag" x="82" y="224" text-anchor="middle">EXIT</text><text class="code" x="82" y="249" text-anchor="middle">${o.exit ? "✓ done" : "leave loop"}</text></g>
      ${arrow("M158 55L172 58", "a-init")}
      ${arrow("M388 60L422 55", "a-true")}<text class="lbl yes" x="404" y="46" text-anchor="middle">TRUE</text>
      ${arrow("M497 90C497 160 460 228 358 228", "a-body")}
      ${arrow("M280 193L280 118", "a-back" + (o.exit ? " off" : ""))}
      <text class="loopback" x="294" y="162">↺ LOOP BACK</text>
      ${arrow("M205 92C150 120 110 150 92 192", "a-false")}<text class="lbl no" x="104" y="128" text-anchor="middle">FALSE</text>
    </svg>`;
  }
  const trailHtml = (name, vals, exit) => vals.length ? `<div class="trail"><span class="tr-lab">${esc(name || "value")}</span>${vals.map((v, i) =>
    `<span class="tr-chip${!exit && i === vals.length - 1 ? " now" : ""}"><small>pass ${i + 1}</small><b>${esc(clip(v, 8))}</b></span>`).join('<i class="tr-arr">→</i>')}${exit ? `<i class="tr-arr">→</i><span class="tr-chip fin"><small>exit</small><b>✓</b></span>` : ""}</div>` : "";
  const legendHtml = () => `<div class="lp-legend"><span class="lg-init"><b>①</b> Initialize<small>start value</small></span><span class="lg-cond"><b>②</b> Condition<small>keep going?</small></span><span class="lg-upd"><b>③</b> Update<small>next value</small></span></div>`;

  function loopScene(m, state, valueOf, esc2, clip2, boxFn, cz) {
    const p = parseLoop(m.src || "", state.lang) || { type: "while", cond: m.cond || "keep going?", v: "" };
    let v = p.v;
    if (!v && m.iterVar) v = m.iterVar;
    if (!v) { const ids = (p.cond || "").match(/[A-Za-z_]\w*/g) || []; const vars = state.steps[m.i].vars || []; v = (ids.find((id) => vars.some((x) => x.name === id)) || ""); }
    const vals = [];
    if (v) for (let k = 0; k <= m.i; k++) {
      const mk = state.meta[k];
      if (!mk || mk.kind !== "loop" || mk.exit || mk.line !== m.line || mk.depth !== m.depth) continue;
      const hit = state.steps[k].vars.find((x) => x.name === v);
      vals.push(hit ? valueOf(hit) : mk.iterVal || "");
    }
    const active = m.exit ? ["cond"] : m.iter <= 1 ? ["init", "cond"] : ["upd", "cond"];
    const py = p.type === "pyfor";
    const condText = py ? "more items?" : (m.cond || p.cond || "keep going?");
    const result = m.exit ? false : (m.result === null || m.result === undefined ? (py ? true : null) : m.result);
    const svg = loopSvg({
      init: p.type === "for" ? p.init.trim() : py ? p.init + " = first" : "set before loop",
      cond: condText, upd: p.type === "for" ? p.upd.trim() : py ? "next item" : "change in body",
      active, exit: m.exit, result, body: "run the lines"
    });
    const czf = cz ? (t) => cz(t).replace(/\n $/, "") : esc;
    const codeLine = p.pre !== undefined ? loopLineHtml(p, czf) : esc(m.src || "");
    const out = String(state.steps[m.i].output || "").replace(/\n$/, "").split("\n");
    const tag = m.exit ? `finished · ${m.iter} pass${m.iter === 1 ? "" : "es"}` : `pass ${m.iter}`;
    return `<div class="demo-frame hd lp-live"><div class="demo-bar"><i></i><i></i><i></i><span>CodeFlix · live preview</span><em class="lp-tag${m.exit ? " fin" : ""}">${tag}</em></div>
      <div class="hd-code"><code>${codeLine}</code></div>
      <div class="hd-body"><div class="hd-loop">${svg}</div><div class="hd-lt">${laptopSvg(out, true)}</div></div>
      ${trailHtml(v, vals, m.exit)}${legendHtml()}</div>`;
  }


  /* =====================================================================
     GLOW-BOX SCENES  (variables, arrays, functions)
     Same look as the CodeFlix illustrations: glass boxes on a shelf, orange
     digital numbers, green text, a value dropping in from above.
     ===================================================================== */
  function valKind(t) {
    t = String(t == null ? "" : t).trim();
    if (/^(true|false)$/i.test(t)) return "bool";
    if (/^(["']).*\1$/.test(t)) return "str";
    if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(t)) return "num";
    return "oth";
  }
  function valHtml(t, max) {
    const k = valKind(t), s = clip(t, max || 9);
    if (k === "bool") { const y = /^true$/i.test(String(t).trim()); return `<span class="gx-bool ${y ? "yes" : "no"}"><span class="gx-chk">${y ? "✓" : "✕"}</span><b>${y ? "TRUE" : "FALSE"}</b></span>`; }
    return `<b class="gx-val v-${k}">${esc(s)}</b>`;
  }
  const dropHtml = (t, cls) => `<div class="gx-drop ${cls || ""}"><span class="gx-pill">${esc(clip(String(t).replace(/^["']|["']$/g, ""), 8))}</span><svg viewBox="0 0 40 46" aria-hidden="true"><defs><linearGradient id="gxg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#38e1ff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><path d="M12 2h16v20h9L20 44 3 22h9z" fill="url(#gxg)" stroke="#e0f2fe" stroke-width="2" stroke-linejoin="round"/></svg></div>`;
  function cellHtml(label, plate, value, opts) {
    opts = opts || {};
    const k = opts.kind || valKind(value);
    return `<div class="gx-cell t-${opts.tag || k}${opts.hot ? " hot" : ""}${opts.cls ? " " + opts.cls : ""}">
      <div class="gx-box${opts.hot ? " active" : ""}">${opts.drop != null ? dropHtml(opts.drop) : ""}<i class="gx-fl l"></i><i class="gx-fl r"></i>
        <span class="gx-tag">${esc(clip(label, 13))}</span>
        ${opts.old != null ? `<div class="gx-v gx-old">${valHtml(opts.old)}</div>` : ""}
        <div class="gx-v gx-new${opts.old != null ? " late" : ""}">${valHtml(value)}</div></div>
      <span class="gx-plate">${esc(clip(plate == null ? label : plate, 13))}</span></div>`;
  }

  /* variable(s): one glowing box per changed variable (up to 4) */
  function varScene(m, state) {
    const list = (m.changes || []).filter((c) => !c.items).slice(0, 4);
    if (!list.length) return null;
    const cells = list.map((c, i) => {
      const to = c.to == null ? "?" : c.to, from = c.from == null ? null : c.from;
      const rep = from !== null && String(from) !== String(to);
      return `<div class="gx-cell t-${valKind(to)} hot">
        <div class="gx-box active">
          <i class="gx-fl l"></i><i class="gx-fl r"></i>
          <span class="gx-tag">${esc(clip(c.name || "variable", 13))}</span>
          ${rep ? `<div class="gx-update-flow"><span class="gx-old-value">${valHtml(from)}</span><span class="gx-update-arrow" aria-hidden="true">↓</span><span class="gx-new-value">${valHtml(to)}</span></div>` : `<div class="gx-v gx-new">${valHtml(to)}</div>`}
        </div>
        <span class="gx-plate">${esc(clip(c.name || "variable", 13))}</span>
      </div>`;
    }).join("");
    const c0 = list[0], rep0 = c0.from != null && String(c0.from) !== String(c0.to);
    const cap = rep0 ? `OLD VALUE ${esc(clip(c0.from, 10))} &nbsp;↓&nbsp; NEW VALUE <em>${esc(clip(c0.to, 10))}</em>` : `INSERT <em>${esc(clip(c0.to, 10))}</em> INTO <b>${esc(clip(c0.name, 14))}</b>`;
    return `<div class="gx gx-var" role="img" aria-label="Variable ${esc(c0.name)} now holds ${esc(c0.to)}">
      <div class="gx-code"><span class="n">${esc(clip(c0.name, 14))}</span><span class="eq">=</span><span class="v">${esc(clip(c0.to, 12))}</span></div>
      <div class="gx-row gx-shelf">${cells}</div><div class="gx-cap">${cap}</div></div>`;
  }

  /* array / list: a row of numbered boxes, the changed one lights up */
  function arrayScene(m, state) {
    const c = (m.changes || []).find((x) => x.items);
    if (!c) return null;
    const MAX = 8, items = c.items.slice(0, MAX), more = c.items.length - items.length;
    const changed = c.changedItems || [];
    const firstHot = changed.findIndex(Boolean);
    const cells = items.map((t, i) => cellHtml("Index " + i, "", t, { tag: "idx", kind: valKind(t), hot: !!changed[i], drop: changed[i] ? t : null })).join("")
      .replace(/<span class="gx-plate"><\/span>/g, "");
    const lang = state && state.lang === "c";
    const head = (lang && c.type ? c.type.replace(/\s*\[\]?$/, "") + "[] " : "") + c.name;
    const cap = firstHot >= 0 ? `Item at <b>index ${firstHot}</b> is now <em>${esc(clip(c.items[firstHot], 10))}</em>` : `An ordered collection of <b>${c.items.length}</b> item${c.items.length === 1 ? "" : "s"}, found by index`;
    return `<div class="gx gx-arr" role="img" aria-label="Array ${esc(c.name)} with ${c.items.length} items">
      <div class="gx-arrhead"><span>${esc(clip(head, 22))}</span><i></i></div>
      <div class="gx-row gx-shelf">${cells}${more > 0 ? `<div class="gx-more">+${more}<small>more</small></div>` : ""}</div>
      <div class="gx-cap">${cap}</div></div>`;
  }

  /* functions: a little factory.  inputs on a belt -> machine -> output belt */
  const gearSvg = (cls) => `<svg class="gx-gear ${cls}" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="19" fill="none" stroke="#7dd3fc" stroke-width="9" stroke-dasharray="7 6"/><circle cx="30" cy="30" r="14" fill="#1e293b" stroke="#7dd3fc" stroke-width="3"/><circle cx="30" cy="30" r="4" fill="#7dd3fc"/></svg>`;
  const miniHtml = (n, v, i) => `<div class="gx-mini" style="--i:${i}"><small>${esc(clip(n, 8))}</small>${valHtml(v, 7)}</div>`;
  function funcScene(m) {
    const name = m.callee ? ((m.callee.name === "main" ? "main" : m.callee.name) + "()") : esc(m.defName || "function") + "()";
    const label = m.kind === "define" ? esc(clip(m.defName || "function", 14)) + "()" : esc(clip(name, 16));
    let ins = "", outs = "", cap = "", state = "";
    if (m.kind === "call") {
      const ps = (m.changes || []).slice(0, 4);
      ins = ps.length ? ps.map((c, i) => miniHtml(c.name, c.to, i)).join("") : `<div class="gx-note">no inputs</div>`;
      outs = `<div class="gx-note wait">working…</div>`; state = "run";
      cap = `<b>${esc(m.caller ? (m.caller.name === "main" ? "main()" : m.caller.name + "()") : "main()")}</b> calls <b>${label}</b> · stack depth ${m.depth}`;
    } else if (m.kind === "return") {
      ins = `<div class="gx-note">finished</div>`;
      outs = miniHtml("returns", m.retVal || "✓", 0).replace('class="gx-mini"', 'class="gx-mini out"'); state = "done";
      cap = `<b>${label}</b> hands back <em>${esc(clip(m.retVal || "nothing", 12))}</em> and its frame is removed`;
    } else {
      ins = `<div class="gx-note">waiting</div>`; outs = `<div class="gx-note wait">not run yet</div>`; state = "idle";
      cap = `The recipe <b>${label}</b> is saved. It only runs when it is <b>called</b>.`;
    }
    return `<div class="gx gx-fn st-${state}" role="img" aria-label="Function ${label}: inputs go in, a result comes out">
      <div class="gx-fnrow">
        <div class="gx-belt in"><small class="gx-bl">INPUTS</small><div class="gx-items">${ins}</div></div>
        <div class="gx-machine"><span class="gx-mt">FUNCTION</span><b>${label}</b>${gearSvg("g1")}${gearSvg("g2")}</div>
        <div class="gx-belt out"><small class="gx-bl">OUTPUT</small><div class="gx-items">${outs}</div></div>
      </div><div class="gx-cap">${cap}</div></div>`;
  }

  /* ---------- print() on a laptop ---------- */
  function laptopSvg(lines, hot) {
    const rows = lines.slice(-4).map((t, i, arr) => `<text class="lt-line${hot && i === arr.length - 1 ? " hot" : ""}" x="104" y="${74 + i * 25}">${esc(clip(t, 24))}</text>`).join("");
    const caret = `<rect class="lt-caret" x="104" y="${74 + (Math.min(lines.length, 4) - 1) * 25 + 8}" width="11" height="18"/>`;
    return `<svg class="lt-svg" viewBox="0 0 460 260" role="img" aria-label="Laptop screen showing the printed text">
      <ellipse cx="230" cy="246" rx="190" ry="8" class="lt-shadow"/>
      <rect x="66" y="8" width="328" height="196" rx="18" class="lt-lid"/><rect x="82" y="22" width="296" height="168" rx="8" class="lt-screen"/>
      <circle cx="230" cy="15" r="2.5" fill="#7c83b8"/>
      <text x="96" y="38" class="lt-prompt">▮▮▮ output</text>${rows}${caret}
      <path d="M30 210h400l-18 28a10 10 0 0 1-9 5H57a10 10 0 0 1-9-5z" class="lt-base"/><rect x="190" y="212" width="80" height="9" rx="4" class="lt-notch"/>
    </svg>`;
  }
  function laptopScene(m, state, esc2, clip2) {
    const out = String(state.steps[m.i].output || "").replace(/\n$/, "").split("\n");
    return `<div class="lt"><div class="lt-code"><small>this line</small><code>${esc(clip(m.src || "print(...)", 30))}</code><span class="lt-wire"><i></i></span></div>${laptopSvg(out, true)}</div>`;
  }

  /* ---------- the home page ---------- */
  const SVGW = (v, inner) => `<svg viewBox="${v}" class="cc-svg" aria-hidden="true">${inner}</svg>`;
  const CONCEPTS = [
    ["Variables are boxes", "A name on the label, a value inside.", "c1", SVGW("0 0 200 130", `<ellipse cx="100" cy="116" rx="62" ry="7" class="sh"/><path d="M44 52l56-20 56 20v48l-56 20-56-20z" class="bx"/><path d="M44 52l56 20 56-20M100 72v48" class="ln"/><rect x="68" y="78" width="64" height="24" rx="7" fill="#fff" stroke="#6366f1" stroke-width="2"/><text x="100" y="95" text-anchor="middle" class="tx">age</text><g class="bob"><circle cx="100" cy="26" r="19" fill="#f59e0b"/><text x="100" y="33" text-anchor="middle" class="tw">18</text></g>`)],
    ["print() shows on the laptop", "Printed text appears on the screen.", "c2", SVGW("0 0 200 130", `<rect x="42" y="10" width="116" height="78" rx="9" fill="#0b0f26" stroke="#2f7de8" stroke-width="4"/><text x="54" y="38" class="tg">$ Hello!</text><rect x="54" y="48" width="8" height="12" fill="#7dffb2" class="blink"/><path d="M20 94h160l-9 16H29z" fill="#2f7de8"/>`)],
    ["for loops go round", "Initialize, check, update, loop back.", "c3", SVGW("0 0 200 130", `<rect x="10" y="14" width="56" height="30" rx="9" fill="#22c55e"/><path d="M100 8l32 20-32 20-32-20z" fill="#f59e0b"/><rect x="134" y="14" width="56" height="30" rx="9" fill="#3b82f6"/><rect x="72" y="86" width="56" height="30" rx="9" fill="#ec4899"/><path d="M100 84V52" class="lp2"/><path d="M66 28h2M132 28h2M162 46q0 40-34 54" class="lp2 thin"/><text x="100" y="33" class="tw s" text-anchor="middle">i&lt;3</text>`)],
    ["if / else picks a path", "Only one road is taken.", "c4", SVGW("0 0 200 130", `<path d="M100 6l36 24-36 24-36-24z" fill="#f59e0b"/><text x="100" y="36" class="tw" text-anchor="middle">?</text><path d="M100 54v12M100 66L50 84M100 66l50 18" class="ln2"/><rect x="18" y="84" width="64" height="30" rx="9" fill="#22c55e"/><text x="50" y="104" class="tw s" text-anchor="middle">TRUE</text><rect x="118" y="84" width="64" height="30" rx="9" fill="#ef4444" opacity=".55"/><text x="150" y="104" class="tw s" text-anchor="middle">FALSE</text>`)],
    ["Functions stack up", "Each call gets its own frame.", "c5", SVGW("0 0 200 130", `<rect x="30" y="86" width="140" height="30" rx="9" fill="#cbd5ff"/><text x="100" y="106" class="tx" text-anchor="middle">main()</text><rect x="42" y="52" width="116" height="30" rx="9" fill="#10b981"/><text x="100" y="72" class="tw s" text-anchor="middle">add(2, 3)</text><g class="bob"><rect x="54" y="18" width="92" height="30" rx="9" fill="#06b6d4"/><text x="100" y="38" class="tw s" text-anchor="middle">helper()</text></g>`)],
    ["Lists are egg cartons", "Numbered slots, one value each.", "c6", SVGW("0 0 200 130", [0, 1, 2, 3].map((i) => `<rect x="${14 + i * 44}" y="48" width="40" height="44" rx="9" fill="${["#fde68a", "#fbcfe8", "#bbf7d0", "#bae6fd"][i]}" stroke="#6366f1" stroke-width="2"/><text x="${34 + i * 44}" y="77" class="tx" text-anchor="middle">${[4, 8, 15, 16][i]}</text><text x="${34 + i * 44}" y="110" class="tx sm" text-anchor="middle">${i}</text>`).join("") + `<text x="100" y="30" class="tx" text-anchor="middle">numbers</text>`)]
  ];

  function mountHome() {
    const g = document.getElementById("conceptGrid");
    const PIC = { c1: ["concept-variables.jpg", "Variables are glowing boxes with a name and a value", "Variables are boxes", "A name on the label, a value inside."],
      c5: ["concept-functions.jpg", "A function as a factory: inputs in, result out", "Functions are factories", "Inputs go in, a result comes out."],
      c6: ["concept-arrays.jpg", "An array as a row of numbered boxes", "Arrays are numbered boxes", "Index 0, 1, 2 ... one value each."] };
    if (g) g.innerHTML = CONCEPTS.map((c) => { const p = PIC[c[2]]; return p
      ? `<article class="card concept ${c[2]}"><div class="cc-art"><img class="cc-img" src="assets/${p[0]}" alt="${p[1]}" loading="lazy" width="1024" height="559"></div><h3>${p[2]}</h3><p>${p[3]}</p></article>`
      : `<article class="card concept ${c[2]}"><div class="cc-art">${c[3]}</div><h3>${c[0]}</h3><p>${c[1]}</p></article>`; }).join("");
    const hd = document.getElementById("heroDemo");
    if (!hd) return;
    const outs = [[], ["0"], ["0", "1"], ["0", "1", "2"]];
    const frames = [
      { active: ["init", "cond"], i: "0", out: [], n: 1 }, { active: ["body"], i: "0", out: ["0"], n: 1 },
      { active: ["upd", "cond"], i: "1", out: ["0"], n: 2 }, { active: ["body"], i: "1", out: ["0", "1"], n: 2 },
      { active: ["upd", "cond"], i: "2", out: ["0", "1"], n: 3 }, { active: ["body"], i: "2", out: ["0", "1", "2"], n: 3 },
      { active: ["cond"], i: "2", out: ["0", "1", "2"], n: 3, exit: true }
    ];
    let k = 0;
    const draw = () => {
      const f = frames[k % frames.length];
      const vals = ["0", "1", "2"].slice(0, f.n);
      hd.innerHTML = `<div class="demo-frame hd"><div class="demo-bar"><i></i><i></i><i></i><span>CodeFlix · live preview</span></div>
        <div class="hd-code"><code><span class="tk-k">for</span> <span class="lp-init">i</span> <span class="tk-k">in</span> <span class="lp-cond"><span class="tk-b">range</span>(<span class="tk-n">3</span>)</span>:<br>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tk-b">print</span>(i)</code></div>
        <div class="hd-body"><div class="hd-loop">${loopSvg({ init: "i = first", cond: f.exit ? "no items" : "more items?", upd: "next item", active: f.active, exit: !!f.exit, result: f.exit ? false : f.active.indexOf("cond") >= 0 ? true : null, body: "print(i)" })}</div>
        <div class="hd-lt">${laptopSvg(f.out, true)}</div></div>${trailHtml("i", vals, !!f.exit)}</div>`;
      k++;
    };
    draw(); setInterval(draw, 1500);
  }

  window.CFVisuals = { parseLoop, loopLineHtml, loopScene, laptopScene, mountHome, varScene, arrayScene, funcScene };
})();
