/*
 * Claude Code CLI training mock — script playback engine.
 * All content comes from demo-data.js (window.CLAUDE_CODE_MOCK_DATA) via MockKit.
 * See the header of demo-data.js for the step reference.
 */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const CANCEL = Symbol("cancel");
  const $ = (s) => document.querySelector(s);
  const el = {
    win: $("#window"), term: $("#term"), transcript: $("#transcript"), live: $("#live"),
    promptArea: $("#prompt-area"), inputBox: $("#input-box"), inputText: $("#input-text"), cursor: $("#cursor"),
    placeholder: $("#placeholder"), capture: $("#input-capture"), slash: $("#slash-menu"),
    statusLeft: $("#status-left"), statusRight: $("#status-right"), caption: $("#caption"),
    sessionSelect: $("#session-select"), speedSelect: $("#speed-select"), stepCount: $("#step-count"),
    playBtn: document.querySelector('[data-ctl="toggle"]'), help: $("#help-card")
  };

  let data = {};
  const state = {
    sessionId: null, steps: [], index: 0, playing: false, busy: false, gen: 0,
    speed: Number(params.get("speed")) || 1, mode: "default", working: false, claudeRunning: true,
    input: "", turn: 0, spinner: null, permissionOpen: false, interactive: false
  };

  /* ---------- helpers ---------- */
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const scroll = () => { el.term.scrollTop = el.term.scrollHeight; };
  const append = (node) => { el.transcript.append(node); scroll(); return node; };
  const asLines = (v) => (Array.isArray(v) ? v : v == null ? [] : String(v).split("\n"));
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  function makeWait(anim, gen) {
    return (ms) => {
      if (!anim) return Promise.resolve();
      return new Promise((resolve, reject) => {
        setTimeout(() => (gen === state.gen ? resolve() : reject(CANCEL)), Math.max(0, ms / state.speed));
      });
    };
  }
  // deterministic jitter so recordings are repeatable
  const jitter = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

  /* ---------- light markdown ---------- */
  function inline(text) {
    return esc(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="perm">$1</span>');
  }
  function md(text) {
    const out = [];
    let inFence = false;
    for (const line of String(text ?? "").split("\n")) {
      if (/^```/.test(line)) { inFence = !inFence; continue; }
      if (inFence) { out.push(`<div class="dim">${esc(line) || "&nbsp;"}</div>`); continue; }
      let m;
      if (!line.trim()) out.push("<div>&nbsp;</div>");
      else if ((m = line.match(/^#{1,6}\s+(.*)$/))) out.push(`<div class="h">${inline(m[1])}</div>`);
      else if ((m = line.match(/^(\s*)[-*]\s+(.*)$/))) out.push(`<div class="li" style="padding-left:${m[1].length}ch"><span class="mk">-</span><span>${inline(m[2])}</span></div>`);
      else if ((m = line.match(/^(\s*)(\d+\.)\s+(.*)$/))) out.push(`<div class="li" style="padding-left:${m[1].length}ch"><span class="mk" style="width:${m[2].length + 1}ch">${m[2]}</span><span>${inline(m[3])}</span></div>`);
      else out.push(`<div>${inline(line)}</div>`);
    }
    return `<div class="md">${out.join("")}</div>`;
  }

  /* ---------- window, theme, status ---------- */
  function applyWindow() {
    const w = data.window || {};
    el.win.dataset.chrome = params.get("chrome") || state.chromeOverride || w.chrome || "windows";
    const theme = params.get("theme") || state.themeOverride || w.theme || "dark";
    document.documentElement.dataset.theme = theme;
    const fs = Number(params.get("font")) || w.fontSize || 15;
    document.documentElement.style.setProperty("--fs", `${fs}px`);
    const title = params.get("title") || w.title || "claude";
    document.querySelectorAll('[data-bind="title"]').forEach((n) => (n.textContent = title));
    document.querySelectorAll('[data-bind="macTitle"]').forEach((n) => (n.textContent = `${data.project?.name || "project"} — ${title}`));
    document.body.classList.toggle("full", params.get("full") === "1");
    document.title = `${title} — Claude Code training mock`;
  }
  const MODES = {
    default: () => ({ cls: "", text: data.input?.hint || "? for shortcuts" }),
    acceptEdits: () => ({ cls: "mode-accept", text: "⏵⏵ accept edits on (shift+tab to cycle)" }),
    plan: () => ({ cls: "mode-plan", text: "⏸ plan mode on (shift+tab to cycle)" }),
    bypass: () => ({ cls: "mode-bypass", text: "⏵⏵ bypass permissions on (shift+tab to cycle)" })
  };
  function renderStatus() {
    const m = (MODES[state.mode] || MODES.default)();
    el.statusLeft.className = m.cls;
    el.statusLeft.textContent = m.text;
    el.statusRight.textContent = data.input?.statusRight || "";
  }
  function renderInput() {
    const ph = state.input ? "" : data.input?.placeholder || "";
    el.inputText.textContent = state.input;
    el.cursor.textContent = ph ? ph[0] : " ";
    el.placeholder.textContent = ph.slice(1);
    el.promptArea.style.display = state.claudeRunning ? "" : "none";
    el.promptArea.classList.toggle("hidden-input", state.permissionOpen);
    renderSlashMenu();
  }
  function renderSlashMenu() {
    const q = state.input.startsWith("/") && !/\s/.test(state.input) ? state.input.toLowerCase() : null;
    const items = q == null ? [] : (data.slashMenu || []).filter((c) => c.command.startsWith(q)).slice(0, 8);
    el.slash.classList.toggle("open", items.length > 0);
    el.slash.innerHTML = items.map((c, i) => `<div class="cmd${i === 0 ? " active" : ""}"><span class="name">${esc(c.command)}</span><span>${esc(c.description)}</span></div>`).join("");
    if (items.length) el.statusLeft.textContent = ""; else renderStatus();
  }

  /* ---------- spinner ---------- */
  const GLYPHS = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
  function startSpinner(verb) {
    state.working = true;
    const v = verb || pickVerb();
    if (state.spinner) { state.spinner.verb = v; paintSpinner(); return; }
    state.spinner = { verb: v, start: performance.now(), frame: 0, timer: null };
    state.spinner.timer = setInterval(() => { if (state.spinner) { state.spinner.frame++; paintSpinner(); } }, 120);
    paintSpinner();
  }
  function paintSpinner() {
    const s = state.spinner;
    if (state.permissionOpen) return; // the dialog owns the live area
    if (!s) { el.live.innerHTML = ""; return; }
    const secs = Math.floor(((performance.now() - s.start) / 1000) * state.speed);
    const tokens = Math.round(secs * 47 + (secs > 0 ? 12 : 0));
    const tok = tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
    const meta = secs < 2 ? "(esc to interrupt)" : `(${secs}s · ↓ ${tok} tokens · esc to interrupt)`;
    el.live.innerHTML = `<div class="spinner"><span class="glyph">${GLYPHS[s.frame % GLYPHS.length]}</span><span class="verb">${esc(s.verb)}…</span><span class="meta">${meta}</span></div>`;
  }
  function stopSpinner() {
    if (state.spinner) clearInterval(state.spinner.timer);
    state.spinner = null; state.working = false; el.live.innerHTML = "";
  }
  function pickVerb() {
    const verbs = data.spinnerVerbs?.length ? data.spinnerVerbs : ["Thinking"];
    return verbs[state.turn % verbs.length];
  }

  /* ---------- building blocks ---------- */
  function toolBlock(name, args, running) {
    return append(h(`<div class="block tool"><div class="row"><span class="bullet ${running ? "running" : "done"}">⏺</span><span class="body"><span class="tool-name">${esc(name)}</span>${args != null && args !== "" ? `(${esc(args)})` : ""}</span></div></div>`));
  }
  function resultHtml(html) { return `<div class="result"><span class="elbow">⎿</span><div class="rbody">${html}</div></div>`; }
  function finishTool(block, html, status) {
    const b = block.querySelector(".bullet");
    b.classList.remove("running");
    b.classList.add(status === "error" ? "error" : "done");
    if (html != null) block.insertAdjacentHTML("beforeend", resultHtml(html));
    scroll();
  }
  function outputLines(lines, max, cls = "out") {
    const all = asLines(lines);
    if (!all.length) return `<div class="${cls}">(No content)</div>`;
    const shown = max && all.length > max ? all.slice(0, max) : all;
    const more = all.length - shown.length;
    return shown.map((l) => `<div class="${cls}">${esc(l) || "&nbsp;"}</div>`).join("") + (more > 0 ? `<div class="more">… +${plural(more, "line")} (ctrl+o to expand)</div>` : "");
  }
  function parseDiff(rows) {
    return (rows || []).map((r) => {
      if (typeof r === "object") return { op: r.op || " ", n: r.n ?? "", text: r.text ?? "" };
      const m = String(r).match(/^([+-]?)(\d*) ?(.*)$/);
      return { op: m[1] || " ", n: m[2], text: m[3] };
    });
  }
  function diffHtml(rows) {
    return `<div class="diff">${rows.map((r) => {
      const cls = r.op === "+" ? "add" : r.op === "-" ? "del" : "ctx";
      return `<div class="dl ${cls}"><span class="ln">${esc(r.n)}</span><span class="sg">${r.op === " " ? " " : r.op}</span><span class="tx">${esc(r.text) || " "}</span></div>`;
    }).join("")}</div>`;
  }
  const TODO_BOX = { completed: "☒", in_progress: "☐", pending: "☐" };
  function shellPrompt(step) {
    const kind = step.shell || data.window?.shell || "powershell";
    const p = data.project || {};
    if (kind === "bash") return `<span class="user">${esc(data.user?.handle || "user")}@devbox</span>:<span class="path">${esc(step.cwd || p.posixCwd || "~")}</span>$ `;
    if (kind === "zsh") return `<span>${esc(data.user?.handle || "user")}@MacBook ${esc(p.name || "")} % </span>`;
    return `<span class="ps">PS ${esc(step.cwd || p.cwd || "C:\\")}&gt; </span>`;
  }
  function welcomeHtml() {
    const w = data.welcome || {}, p = data.project || {};
    const cwd = data.window?.shell === "powershell" || !data.window?.shell ? p.cwd : p.posixCwd;
    const tips = (w.tips || []).map((t) => `<p>${inline(t)}</p>`).join("");
    const recent = (w.recent || []).map((t) => `<p class="${/^\//.test(t) ? "dim" : ""}">${inline(t)}</p>`).join("");
    return `<div class="block welcome" data-part="welcome">
      <div class="welcome-title">Claude Code <span class="dim">v${esc(w.version || "2")}</span></div>
      <div class="welcome-left">
        <div class="hello">Welcome back ${esc(data.user?.name || "")}!</div>
        <div class="mascot"> ▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝</div>
        <div class="dim">${esc(w.model || "")}${w.plan ? ` · ${esc(w.plan)}` : ""}</div>
        <div class="dim">${esc(cwd || "")}</div>
      </div>
      <div class="welcome-divider"></div>
      <div class="welcome-right">
        <h4>Tips for getting started</h4>${tips}
        <div class="sep"></div>
        <h4>Recent activity</h4>${recent || '<p class="dim">No recent activity</p>'}
      </div></div>`;
  }
  function echoUser(text) {
    append(h(`<div class="block user-msg"><span class="bullet">&gt;</span><span class="body">${esc(text)}</span></div>`));
  }
  function dismissPermission() {
    if (!state.permissionOpen) return;
    state.permissionOpen = false;
    el.live.innerHTML = "";
    renderInput();
    if (state.spinner) paintSpinner();
  }

  async function typeInto(text, wait, anim) {
    state.input = "";
    if (!anim) { state.input = text; renderInput(); return; }
    el.cursor.classList.remove("blink");
    for (let i = 0; i < text.length; i++) {
      state.input += text[i];
      renderInput();
      const ch = text[i];
      await wait(28 + jitter(i) * 38 + (ch === " " ? 18 : 0) + (/[,.?!]/.test(ch) ? 120 : 0));
    }
    el.cursor.classList.add("blink");
  }

  /* ---------- step runners ---------- */
  const runners = {
    async shell(step, anim, wait) {
      state.claudeRunning = false; renderInput();
      const line = append(h(`<div class="block shell-line ${esc(step.shell || data.window?.shell || "powershell")}">${shellPrompt(step)}<span class="cmd"></span></div>`));
      const cmd = line.querySelector(".cmd");
      const text = step.command || "";
      if (!anim) { cmd.textContent = text; return; }
      await wait(350);
      for (let i = 0; i < text.length; i++) { cmd.textContent += text[i]; scroll(); await wait(70 + jitter(i) * 60); }
      await wait(450);
    },
    async welcome(step, anim, wait) {
      append(h(welcomeHtml()));
      state.claudeRunning = true; state.input = ""; renderInput(); renderStatus();
      await wait(300);
    },
    async user(step, anim, wait) {
      stopSpinner();
      await typeInto(step.text || "", wait, anim);
      await wait(380);
      state.input = ""; renderInput();
      echoUser(step.text || "");
      state.turn++;
      startSpinner(step.verb);
      await wait(250);
    },
    async slash(step, anim, wait) {
      stopSpinner();
      const command = step.command || "/help";
      await typeInto(command, wait, anim);
      await wait(600);
      state.input = ""; renderInput();
      echoUser(command);
      const name = command.split(/\s/)[0];
      if (name === "/clear") { await wait(200); el.transcript.innerHTML = ""; return; }
      const output = step.output ?? data.slashCommands?.[name];
      if (output) append(h(`<div class="block">${resultHtml(outputLines(output))}</div>`));
      else { state.turn++; startSpinner(step.verb); }
      await wait(250);
    },
    async thinking(step, anim, wait) {
      startSpinner(step.verb);
      await wait(step.ms ?? 1200);
      if (step.text) append(h(`<div class="block row thinking-block"><span class="bullet">✻</span><span class="body">Thinking…\n${esc(step.text)}</span></div>`));
    },
    async text(step, anim, wait) {
      const block = append(h(`<div class="block row"><span class="bullet a-bullet">⏺</span><span class="body"></span></div>`));
      const body = block.querySelector(".body");
      const text = step.text || "";
      if (!anim) { body.innerHTML = md(text); return; }
      const parts = text.split(/(\s+)/);
      let shown = "";
      for (let i = 0; i < parts.length; i += 6) {
        shown += parts.slice(i, i + 6).join("");
        body.innerHTML = md(shown); scroll();
        await wait(45);
      }
      body.innerHTML = md(text); scroll();
      await wait(300);
    },
    async tool(step, anim, wait) {
      const block = toolBlock(step.name || "Tool", step.args, anim);
      await wait(step.ms ?? 700);
      let html = step.result != null ? `<div class="out">${inline(step.result)}</div>` : "";
      if (step.lines) html += outputLines(step.lines, step.expand ? 0 : step.maxLines ?? 6);
      finishTool(block, html || null, step.status);
      await wait(200);
    },
    read(step, anim, wait) { return runners.tool({ name: "Read", args: step.file, result: `Read **${step.lines ?? 0}** lines`, ms: step.ms ?? 450 }, anim, wait); },
    search(step, anim, wait) {
      const args = `pattern: "${step.pattern || ""}"${step.path ? `, path: "${step.path}"` : ""}`;
      return runners.tool({ name: "Search", args, result: `${step.result || "Found 0 files"} (ctrl+o to expand)`, ms: step.ms ?? 550 }, anim, wait);
    },
    async edit(step, anim, wait) {
      const rows = parseDiff(step.diff);
      const adds = rows.filter((r) => r.op === "+").length, dels = rows.filter((r) => r.op === "-").length;
      const block = toolBlock("Update", step.file, anim);
      await wait(step.ms ?? 650);
      const summary = step.summary || `Updated <strong>${esc(step.file)}</strong> with ${plural(adds, "addition")} and ${plural(dels, "removal")}`;
      finishTool(block, `<div class="out">${summary}</div>${diffHtml(rows)}`);
      await wait(350);
    },
    async write(step, anim, wait) {
      const lines = asLines(step.content);
      const block = toolBlock("Write", step.file, anim);
      await wait(step.ms ?? 650);
      const max = step.preview ?? 8;
      const shown = lines.slice(0, max);
      const more = lines.length - shown.length;
      const preview = shown.map((l, i) => `<div class="dl"><span class="ln">${i + 1}</span><span class="sg"> </span><span class="tx">${esc(l) || " "}</span></div>`).join("");
      finishTool(block, `<div class="out">Wrote <strong>${lines.length}</strong> lines to <strong>${esc(step.file)}</strong></div><div class="diff">${preview}</div>${more > 0 ? `<div class="more">… +${plural(more, "line")} (ctrl+o to expand)</div>` : ""}`);
      await wait(300);
    },
    async bash(step, anim, wait) {
      const block = toolBlock("Bash", step.command, anim);
      await wait(step.ms ?? 1100);
      const cls = step.status === "error" ? "err" : "out";
      finishTool(block, outputLines(step.output, step.expand ? 0 : step.maxLines ?? 12, cls), step.status);
      await wait(300);
    },
    async todos(step, anim, wait) {
      const block = toolBlock("Update Todos", "", anim);
      await wait(step.ms ?? 350);
      const list = (step.items || []).map((t) => `<div class="todo ${esc(t.status || "pending")}"><span class="box">${TODO_BOX[t.status] || "☐"}</span><span>${esc(t.text)}</span></div>`).join("");
      finishTool(block, list);
      await wait(250);
    },
    async permission(step, anim, wait, ctx) {
      const opts = step.options || ["Yes", "No, and tell Claude what to do differently (esc)"];
      const choose = Math.min(step.choose ?? 0, opts.length - 1);
      const isPlan = step.variant === "plan" || (step.variant == null && state.mode === "plan");
      state.permissionOpen = true;
      renderInput();
      const paint = (sel) => {
        el.live.innerHTML = `<div class="perm-box${isPlan ? " plan" : ""}">
          <div class="ptitle">${esc(step.title || "Permission")}</div>
          ${step.detail ? `<div class="pdetail">${inline(step.detail)}</div>` : ""}
          ${step.body ? `<div class="pbody">${md(asLines(step.body).join("\n"))}</div>` : ""}
          ${step.diff ? diffHtml(parseDiff(step.diff)) : ""}
          <div class="pq">${esc(step.question || "Do you want to proceed?")}</div>
          ${opts.map((o, i) => `<div class="opt${i === sel ? " active" : ""}"><span class="sel">${i === sel ? "❯" : " "}</span><span class="num">${i + 1}.</span><span>${esc(o)}</span></div>`).join("")}
        </div>`;
        scroll();
      };
      if (!anim) {
        // Keep the dialog on screen only when it is the last step rendered (useful for stills).
        if (ctx && ctx.last) paint(0); else { state.permissionOpen = false; renderInput(); }
        return;
      }
      paint(0);
      await wait(step.ms ?? 1300);
      for (let i = 1; i <= choose; i++) { paint(i); await wait(320); }
      await wait(450);
      dismissPermission();
      await wait(200);
    },
    async mode(step, anim, wait) {
      state.mode = step.mode || "default";
      renderStatus();
      await wait(450);
    },
    async caption(step) { showCaption(step.text, step.position); },
    async highlight(step) {
      document.querySelectorAll(".hl").forEach((n) => n.classList.remove("hl"));
      const map = { input: el.inputBox, status: el.statusLeft, last: el.transcript.lastElementChild, welcome: el.transcript.querySelector('[data-part="welcome"]') };
      map[step.target]?.classList.add("hl");
    },
    async pause(step, anim, wait) { await wait(step.ms ?? 800); },
    async clear() { el.transcript.innerHTML = ""; stopSpinner(); },
    async done(step, anim, wait) {
      stopSpinner();
      if (step.summary) append(h(`<div class="block dim">${inline(step.summary)}</div>`));
      await wait(200);
    }
  };

  function showCaption(text, position) {
    el.caption.textContent = text || "";
    el.caption.classList.toggle("show", !!text);
    el.caption.classList.toggle("top", position === "top");
  }

  /* ---------- playback control ---------- */
  function resetScreen() {
    stopSpinner();
    state.permissionOpen = false;
    state.mode = "default"; state.turn = 0; state.input = "";
    state.claudeRunning = state.steps[0]?.type !== "shell";
    el.transcript.innerHTML = ""; el.live.innerHTML = "";
    showCaption("");
    renderInput(); renderStatus();
    el.cursor.classList.add("blink");
  }
  async function runStep(i, anim, ctx) {
    const step = state.steps[i];
    const runner = runners[step?.type];
    if (!runner) { console.warn("[claude-code mock] unknown step type", step); return; }
    dismissPermission();
    const gen = state.gen;
    await runner(step, anim, makeWait(anim, gen), ctx);
  }
  async function goto(n) {
    const gen = ++state.gen;
    state.busy = false;
    n = Math.max(0, Math.min(n, state.steps.length));
    resetScreen();
    for (let i = 0; i < n; i++) {
      if (gen !== state.gen) return;
      await runStep(i, false, { last: i === n - 1 });
    }
    if (gen !== state.gen) return;
    state.index = n;
    el.cursor.classList.add("blink");
    updateControls();
  }
  async function stepForward() {
    if (state.index >= state.steps.length) return false;
    if (state.busy) { await goto(state.index + 1); return true; } // fast-forward the step in progress
    state.busy = true;
    const gen = state.gen;
    try {
      await runStep(state.index, true);
      if (gen === state.gen) state.index++;
    } catch (e) {
      if (e !== CANCEL) console.error(e);
      return false;
    } finally {
      if (gen === state.gen) state.busy = false;
      updateControls();
    }
    return gen === state.gen;
  }
  async function play() {
    if (state.playing) return;
    if (state.index >= state.steps.length) await goto(0);
    state.playing = true; updateControls();
    while (state.playing && state.index < state.steps.length) {
      const ok = await stepForward();
      if (!ok) break;
    }
    state.playing = false; updateControls();
  }
  function pause() { state.playing = false; updateControls(); }
  function toggle() { state.playing ? pause() : play(); }
  function next() { pause(); stepForward(); }
  function prev() { pause(); goto(Math.max(0, state.index - 1)); }
  function restart() { pause(); goto(0); }

  function load(id, opts = {}) {
    const sessions = data.sessions || {};
    const key = sessions[id] ? id : sessions[data.defaultSession] ? data.defaultSession : Object.keys(sessions)[0];
    state.sessionId = key;
    state.steps = sessions[key]?.steps || [];
    el.sessionSelect.value = key || "";
    if (opts.updateUrl) { const u = new URL(location.href); u.searchParams.set("session", key); u.searchParams.delete("step"); history.replaceState(null, "", u); }
    pause();
    return goto(opts.step ?? 0);
  }

  async function runSequence(steps, anim = true) {
    pause();
    const gen = state.gen;
    state.busy = true;
    try {
      for (const step of steps || []) {
        const runner = runners[step.type];
        if (!runner) continue;
        dismissPermission();
        await runner(step, anim, makeWait(anim, gen));
      }
    } catch (e) { if (e !== CANCEL) console.error(e); }
    finally { if (gen === state.gen) state.busy = false; }
  }

  /* ---------- interactive typing ---------- */
  function submitTyped(text) {
    text = text.trim();
    state.input = ""; el.capture.value = ""; renderInput();
    if (!text) return;
    pause();
    if (text.startsWith("/")) {
      const name = text.split(/\s/)[0];
      if (name === "/clear") { echoUser(text); el.transcript.innerHTML = ""; return; }
      if (name === "/exit") { echoUser(text); state.claudeRunning = false; renderInput(); return; }
      const sessionKey = name.slice(1);
      if (data.sessions?.[sessionKey]) {
        const steps = data.sessions[sessionKey].steps.filter((s) => !["welcome", "shell", "caption"].includes(s.type));
        if (steps[0]?.type === "slash") steps.shift();
        echoUser(text); state.turn++; startSpinner();
        return runSequence(steps);
      }
      const out = data.slashCommands?.[name];
      echoUser(text);
      append(h(`<div class="block">${resultHtml(out ? outputLines(out) : `<div class="err">Unknown slash command: ${esc(name.slice(1))}</div>`)}</div>`));
      return;
    }
    echoUser(text); state.turn++; startSpinner();
    const match = (data.responses || []).find((r) => { try { return new RegExp(r.match, "i").test(text); } catch { return text.toLowerCase().includes(String(r.match).toLowerCase()); } });
    return runSequence(match ? match.steps : data.fallbackResponse || []);
  }
  function cycleMode() {
    const order = ["default", "acceptEdits", "plan"];
    state.mode = order[(order.indexOf(state.mode) + 1) % order.length];
    renderStatus();
  }
  function interrupt() {
    if (!state.busy && !state.working) return;
    state.gen++; state.busy = false; pause();
    dismissPermission(); stopSpinner();
    append(h(`<div class="block">${resultHtml('<div class="err">Interrupted · What should Claude do instead?</div>')}</div>`));
  }

  el.inputBox.addEventListener("click", () => el.capture.focus());
  el.capture.addEventListener("focus", () => { el.cursor.classList.add("blink"); });
  el.capture.addEventListener("input", () => { state.input = el.capture.value.replace(/\n/g, ""); renderInput(); scroll(); });
  el.capture.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitTyped(el.capture.value); }
    else if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); cycleMode(); }
    else if (e.key === "Tab" && state.input.startsWith("/")) {
      e.preventDefault();
      const first = (data.slashMenu || []).find((c) => c.command.startsWith(state.input.toLowerCase()));
      if (first) { el.capture.value = state.input = `${first.command} `; renderInput(); }
    } else if (e.key === "Escape") { e.preventDefault(); if (state.input) { el.capture.value = state.input = ""; renderInput(); } else interrupt(); }
  });

  /* ---------- controls ---------- */
  function updateControls() {
    el.stepCount.textContent = `${state.index} / ${state.steps.length}`;
    el.playBtn.textContent = state.playing ? "⏸" : "▶";
  }
  function populateSessions() {
    el.sessionSelect.innerHTML = Object.entries(data.sessions || {}).map(([id, s]) => `<option value="${esc(id)}">${esc(s.title || id)}</option>`).join("");
  }
  document.querySelector("#controls").addEventListener("click", (e) => {
    const ctl = e.target.closest("[data-ctl]")?.dataset.ctl;
    if (ctl) control(ctl);
  });
  el.help.addEventListener("click", (e) => { if (e.target.closest('[data-ctl="help"]')) control("help"); });
  function control(ctl) {
    if (ctl === "toggle") toggle();
    if (ctl === "next") next();
    if (ctl === "prev") prev();
    if (ctl === "restart") restart();
    if (ctl === "data") window.MockKit?.openEditor();
    if (ctl === "help") el.help.hidden = !el.help.hidden;
    if (ctl === "theme") { state.themeOverride = document.documentElement.dataset.theme === "light" ? "dark" : "light"; params.delete("theme"); applyWindow(); }
    if (ctl === "chrome") { const order = ["windows", "mac", "none"]; state.chromeOverride = order[(order.indexOf(el.win.dataset.chrome) + 1) % order.length]; params.delete("chrome"); applyWindow(); }
  }
  el.sessionSelect.addEventListener("change", () => load(el.sessionSelect.value, { updateUrl: true }));
  el.speedSelect.addEventListener("change", () => { state.speed = Number(el.speedSelect.value) || 1; });
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT")) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " ") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key === "r" || e.key === "R") restart();
    else if (e.key === "?") control("help");
    else if (e.key === "Escape") interrupt();
    else if (e.key === "/" ) { e.preventDefault(); el.capture.focus(); el.capture.value = state.input = "/"; renderInput(); }
  });

  /* ---------- public API ---------- */
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));
  window.TrainingMock = {
    ready,
    load: (id, step) => load(id, { step, updateUrl: true }),
    sessions: () => Object.keys(data.sessions || {}),
    play, pause, toggle, next, prev, restart, goto,
    setSpeed(x) { state.speed = Number(x) || 1; el.speedSelect.value = String(state.speed); },
    setTheme(t) { state.themeOverride = t; params.delete("theme"); applyWindow(); },
    setChrome(c) { state.chromeOverride = c; params.delete("chrome"); applyWindow(); },
    setMode(m) { state.mode = m; renderStatus(); },
    caption: showCaption,
    run: (steps) => runSequence(steps, true),
    render: (steps) => runSequence(steps, false),
    typePrompt: (text) => runSequence([{ type: "user", text }], true),
    submit: (text) => submitTyped(text),
    state: () => ({ session: state.sessionId, index: state.index, total: state.steps.length, playing: state.playing, mode: state.mode, speed: state.speed })
  };

  /* ---------- boot ---------- */
  function onData(next) {
    data = next;
    applyWindow(); populateSessions(); renderStatus();
    const keep = data.sessions?.[state.sessionId] ? state.sessionId : null;
    load(keep || state.sessionId, { step: keep ? state.index : 0 });
  }
  window.MockKit.init({ product: "claude-code", defaults: window.CLAUDE_CODE_MOCK_DATA, onChange: onData }).then(async (initial) => {
    data = initial;
    if (params.get("speed")) el.speedSelect.value = params.get("speed");
    applyWindow(); populateSessions(); renderStatus();
    const stepParam = params.get("step");
    const total = (data.sessions?.[params.get("session")] || data.sessions?.[data.defaultSession] || {}).steps?.length || 0;
    await load(params.get("session"), { step: stepParam === "end" ? total : Number(stepParam) || 0 });
    resolveReady(window.TrainingMock);
    if (params.get("autoplay") === "1") setTimeout(play, Number(params.get("delay")) || 600);
  });
})();
