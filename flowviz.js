/* flowviz.js - adds (1) small variable boxes at the top, (2) a clear loop flowchart,
   (3) a side box where the old value goes out and the new value comes in.
   Called from app.js renderStep(): CFFlow.render(state, step, viz) */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clip = (t, n) => { t = String(t).trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  let top, main, leftStack, lastSteps = null, lastIndex = -1, info = null;

  function mount(viz) {
    if (top) return;
    top = document.createElement("div"); top.className = "cf-top"; top.id = "cfTop";
    main = document.createElement("div"); main.className = "cf-main"; main.id = "cfMain";
    viz.stage.parentNode.insertBefore(top, viz.stage);
    /* Keep the flowchart in the unused space directly below the code editor,
       beside the visualizer's variable boxes, rather than in a new bottom row. */
    const grid = viz.stage.closest(".app-grid");
    const codePanel = grid && grid.querySelector(".area-code");
    if (grid && codePanel) {
      leftStack = document.createElement("div");
      leftStack.className = "cf-left-stack";
      grid.insertBefore(leftStack, codePanel);
      leftStack.appendChild(codePanel);
      leftStack.appendChild(main);
    } else {
      viz.stage.parentNode.insertBefore(main, viz.stage);
    }
  }
  function hide() { if (top) { if (main && main.parentNode) main.parentNode.classList.remove("cf-on"); top.innerHTML = ""; main.innerHTML = ""; } lastSteps = null; }

  /* find the loop that matters + its pieces, from the source code */
  function analyse(code, lang, steps) {
    const lines = String(code || "").split("\n"), P = window.CFVisuals && window.CFVisuals.parseLoop;
    if (!P) return null;
    const loops = [];
    lines.forEach((t, i) => { const p = P(t, lang); if (p) loops.push({ p, at: i + 1 }); });
    if (!loops.length) return { loops: [], lines };
    return { loops, lines };
  }
  function pickLoop(a, line) {
    let best = a.loops[0];
    a.loops.forEach((l) => { if (l.at <= line) best = l; });
    const L = best, lines = a.lines, ind = (s) => (s.match(/^\s*/) || [""])[0].length, base = ind(lines[L.at - 1]);
    let end = L.at, c = L.at;
    const isC = L.p.type === "for" || (L.p.type === "while" && /\{\s*$/.test(lines[L.at - 1]) || /\{/.test(lines[L.at - 1]));
    if (isC && /\{/.test(lines[L.at - 1])) {
      let d = 0;
      for (let i = L.at - 1; i < lines.length; i++) { for (const ch of lines[i]) { if (ch === "{") d++; if (ch === "}") d--; } if (i >= L.at - 1 && d <= 0) { end = i + 1; break; } }
    } else {
      for (let i = L.at; i < lines.length; i++) { if (lines[i].trim() === "") continue; if (ind(lines[i]) <= base) break; end = i + 1; }
    }
    const clean = (t) => t.trim().replace(/[{}]\s*$/, "").trim();
    const body = lines.slice(L.at, end).map(clean).filter((t) => t && t !== "}");
    const setup = lines.slice(0, L.at - 1).map(clean).filter((t) => t && !/^#|^(int|void)\s+main|^def\s|^import|^from/.test(t));
    const post = lines.slice(end).map(clean).filter((t) => t && !/^return\s+0/.test(t));
    return { L, end, body, setup, post };
  }

  function pickWatch(steps, loop) {
    const names = {}; steps.forEach((s) => { s.vars.forEach((v) => { if (!v.items) names[v.name] = 1; }); });
    const pref = ["result", "total", "sum", "fact", "factorial", "answer", "count", "product", "ans", "res"];
    for (const p of pref) if (names[p]) return p;
    const lv = loop && loop.L.p.v, cnt = {};
    steps.forEach((s, i) => { if (!i || !loop || s.line <= loop.L.at || s.line > loop.end) return; s.vars.forEach((v) => { if (v.changed && !v.items && v.name !== lv) cnt[v.name] = (cnt[v.name] || 0) + 1; }); });
    const k = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    return k || null;
  }

  function stepNode(s, loop) {
    const note = String(s.note || "");
    if (!loop) return { node: "", cond: null };
    const ln = s.line, L = loop.L;
    if (ln === L.at) {
      let cond = null; const m = note.match(/->\s*(True|False)/i);
      if (m) cond = /true/i.test(m[1]); else if (/leave the loop|No items left|loop is finished/i.test(note)) cond = false; else if (/takes the next value|Start the loop/i.test(note)) cond = true;
      if (/^Update/i.test(note)) return { node: "upd", cond };
      if (/^Start/i.test(note)) return { node: "init", cond };
      return { node: "cond", cond };
    }
    if (ln > L.at && ln <= loop.end) return { node: "body", cond: null };
    if (ln > loop.end) return { node: "post", cond: null };
    return { node: "setup", cond: null };
  }

  function drawFlow(loop, st) {
    const L = loop.L, p = L.p;
    const isPy = p.type === "pyfor", isWhile = p.type === "while";
    const initT = isPy ? "get first item" : isWhile ? "" : (p.init || "").trim();
    const condT = isPy ? "items left in " + clip(p.cond, 10) + "?" : (p.cond || "").trim();
    const updT = isPy ? "take next " + p.init : isWhile ? "(body changes it)" : (p.upd || "").trim();
    const on = (n) => (st.node === n || (n === "cond" && (st.node === "init" || st.node === "upd")) ? " on" : "") + (n === "cond" && st.cond != null && (st.node === "cond" || st.node === "init" || st.node === "upd") ? (st.cond ? " t" : " f") : "");
    const g = (cls, id, y, txt) => `<g class="cf-n ${cls}${on(id)}"><rect x="70" y="${y}" width="220" height="44" rx="12"/><text x="180" y="${y + 28}">${esc(clip(txt, 24))}</text></g>`;
    const hot = (c) => (c ? " hot" : "");
    const goingUp = st.node === "upd" || (st.node === "init" && false);
    const yes = st.cond === true && (st.node === "cond" || st.node === "init" || st.node === "upd"), no = st.cond === false && (st.node === "cond" || st.node === "init" || st.node === "upd");
    const bodyT = loop.body.join("; ") || "loop body";
    return `<svg viewBox="0 0 380 640" role="img" aria-label="Loop flowchart"><defs><marker id="cfah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6c79c9"/></marker></defs>
    <g class="cf-n${st.node === "setup" ? " on" : ""}"><rect x="70" y="8" width="220" height="44" rx="12"/><text x="180" y="36">${esc(clip(loop.setup.join(" ") || "start", 24))}</text></g>
    <path class="cf-e" d="M180 52V72" marker-end="url(#cfah)"/>
    ${isWhile ? "" : g("init", "init", 72, initT || "start")}
    ${isWhile ? "" : `<path class="cf-e${hot(st.node === "init")}" d="M180 116V140" marker-end="url(#cfah)"/>`}
    <g class="cf-n cond${on("cond")}"><polygon points="180,140 305,205 180,270 55,205"/><text x="180" y="211">${esc(clip(condT, 18))}</text></g>
    <path class="cf-e${hot(yes)}" d="M180 270V306" marker-end="url(#cfah)"/>
    <text class="cf-t" x="192" y="296" fill="#14a44d" style="fill:#14a44d">Yes</text>
    <g class="cf-n${st.node === "body" ? " on" : ""}"><rect x="70" y="306" width="220" height="56" rx="12"/><text x="180" y="338">${esc(clip(bodyT, 24))}</text></g>
    <path class="cf-e${hot(st.node === "body")}" d="M180 362V390" marker-end="url(#cfah)"/>
    ${g("upd", "upd", 390, updT)}
    <path class="cf-e back${hot(st.node === "upd" || st.node === "body" && false)}" d="M290 412H345V205H310" marker-end="url(#cfah)"/>
    <text class="cf-t" x="300" y="398" style="fill:#e0408a">repeat</text>
    <path class="cf-e${hot(no)}" d="M55 205H22V520H68" marker-end="url(#cfah)"/>
    <text class="cf-t" x="26" y="194" style="fill:#e0344b">No</text>
    <g class="cf-n${st.node === "post" ? " on" : ""}"><rect x="70" y="498" width="220" height="44" rx="12"/><text x="180" y="526">${esc(clip(loop.post.join(" ") || "after the loop", 24))}</text></g>
    <path class="cf-e" d="M180 542V568" marker-end="url(#cfah)"/>
    <g class="cf-n"><rect x="125" y="568" width="110" height="36" rx="18"/><text x="180" y="592">End</text></g></svg>`;
  }

  function render(state, s, viz) {
    const steps = state.steps; if (!steps || !steps.length) { hide(); return; }
    mount(viz);
    const root = main.parentNode || top.parentNode; root.classList.add("cf-on");
    const i = state.index, prev = i > 0 ? steps[i - 1] : null, forward = lastSteps === steps && i === lastIndex + 1;
    if (lastSteps !== steps) { info = analyse(state.ranCode, state.lang, steps); }
    const loop = info && info.loops.length ? pickLoop(info, s.line || 0) : null;

    /* 1. variable boxes (small, at the top) */
    const was = {}; if (prev && prev.stack.length === s.stack.length) prev.vars.forEach((v) => { was[v.name] = v; });
    top.innerHTML = `<span class="cf-cap">Variables</span>` + (s.vars.length ? s.vars.map((v) => {
      const ch = v.changed || (v.changedItems && v.changedItems.some(Boolean)), p = was[v.name];
      if (v.items) return `<div class="cf-vbox${ch ? " chg" : ""}"><b>${esc(v.name)}<small>${esc(v.type)}</small></b><div class="cf-cells">${v.items.slice(0, 10).map((t, k) => `<em class="${v.changedItems && v.changedItems[k] ? "c" : ""}">${esc(clip(t, 5))}</em>`).join("")}${v.items.length > 10 ? "<em>…</em>" : ""}</div></div>`;
      const old = v.changed && p && !p.items && p.text !== v.text && forward ? `<i>${esc(clip(p.text, 10))}</i>` : "";
      return `<div class="cf-vbox${ch && forward ? " chg" : ""}"><b>${esc(v.name)}<small>${esc(v.type)}</small></b><span>${esc(clip(v.text, 8))}</span>${old}</div>`;
    }).join("") : `<span class="cf-cap" style="font-weight:500">none yet</span>`);

    /* 2 + 3. flowchart and result box */
    if (!loop) { main.className = "cf-main"; main.innerHTML = ""; }
    else {
      const watch = pickWatch(steps, loop), st = stepNode(s, loop);
      const cur = watch && s.vars.find((v) => v.name === watch), pv = watch && prev && prev.vars.find((v) => v.name === watch);
      const hist = watch ? steps.slice(0, i + 1).map((x) => x.vars.find((v) => v.name === watch)).filter(Boolean).map((v) => v.text).filter((t, k, a) => k === 0 || t !== a[k - 1]) : [];
      let box = `<em class="n" style="animation:none">${cur ? esc(clip(cur.text, 7)) : "–"}</em>`;
      if (cur && pv && pv.text !== cur.text && forward) box = `<em class="o">${esc(clip(pv.text, 7))}</em><em class="n">${esc(clip(cur.text, 7))}</em>`;
      main.className = "cf-main has-loop";
      main.innerHTML = `<div class="cf-fc"><h4>Loop flowchart</h4>${drawFlow(loop, st)}</div>` +
        (watch ? `<div class="cf-res"><h4>${esc(watch)}</h4><div class="cf-rbox">${box}</div><div class="cf-hist">${hist.length > 1 ? hist.map((t, k) => k === hist.length - 1 ? `<b>${esc(clip(t, 8))}</b>` : esc(clip(t, 8))).join(" → ") : ""}</div><small>Old value goes out, new value comes in.</small></div>` : "");
    }
    lastSteps = steps; lastIndex = i;
  }
  window.CFFlow = { render, hide };
})();
