/*
 * Claude desktop training mock — app logic.
 * All visible content comes from window.CLAUDE_MOCK_DATA (demo-data.js),
 * loaded through MockKit (../shared/mockkit.js). This file only contains
 * rendering, interaction and the window.TrainingMock recording API.
 */
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const $ = (sel, root = document) => root.querySelector(sel);
  const els = {
    app: $("#app"), sidebar: $("#sidebar"), topbar: $("#topbar"), stage: $("#stage"), panel: $("#side-panel"),
    popover: $("#popover"), search: $("#search-overlay"), searchInput: $("#search-input"), searchResults: $("#search-results"),
    studio: $("#studio"), backdrop: $("#studio-backdrop"), toast: $("#toast")
  };

  /* ------------------------------------------------------------------ scenes */
  const SCENES = ["home", "response", "chat", "task-running", "task-complete", "artifact", "research", "project", "code", "scheduled", "chats", "artifacts"];
  const SCENE_LABELS = {
    home: "Home", response: "Conversation response", chat: "Multi-turn chat", "task-running": "Task in progress",
    "task-complete": "Completed task", artifact: "Artifact side panel", research: "Research report", project: "Project workspace",
    code: "Claude Code session", scheduled: "Scheduled tasks", chats: "Chat history", artifacts: "Artifacts gallery"
  };
  const PAGE_SCENES = new Set(["home", "project", "scheduled", "chats", "artifacts"]);

  let data = {};
  const state = {
    scene: "home",
    chatId: null,
    artifactId: null,
    artifactTab: "preview",
    artifactVersion: null,
    taskState: null,
    projectId: null,
    userName: params.get("name") || "",
    prompt: params.get("prompt") || "",
    modelOverride: params.get("model") || "",
    permission: params.get("permission") === "auto" ? "Auto" : "Manual",
    thinking: params.get("thinking") === "1",
    sidebarCollapsed: params.get("sidebar") === "collapsed",
    mobileSidebar: false,
    studioOpen: params.get("studio") === "1",
    chipOpen: -1,
    permissionGranted: false,
    streaming: false,
    popFor: null,
    feedback: {}
  };

  /* ----------------------------------------------------------------- helpers */
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const icon = (name, cls = "") => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ui = (key, fallback = "") => (data.ui && data.ui[key]) || fallback;
  const userName = () => state.userName || data.user?.name || "You";
  const firstName = () => userName().trim().split(/\s+/)[0] || "there";
  const initials = () => userName().trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";
  const getConv = (id) => (id && data.conversations ? data.conversations[id] : null);
  const getArtifact = (id) => (id && data.artifacts ? data.artifacts[id] : null);
  const getProject = (id) => (data.projects || []).find((p) => p.id === id) || (data.projects || [])[0];

  function dedent(text) {
    const s = String(text ?? "").replace(/\r\n?/g, "\n").replace(/^\n+/, "").replace(/\s+$/, "");
    const indents = s.split("\n").filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const min = indents.length ? Math.min(...indents) : 0;
    return min ? s.split("\n").map((l) => l.slice(min)).join("\n") : s;
  }

  function normalize(raw) {
    const d = raw && typeof raw === "object" ? raw : {};
    d.user = d.user || { name: "Demo User", plan: "" };
    d.ui = d.ui || {};
    d.models = Array.isArray(d.models) && d.models.length ? d.models.map((m) => (typeof m === "string" ? { name: m, short: m.replace(/^Claude\s+/, "") } : m)) : [{ name: "Claude", short: "Claude" }];
    d.sidebar = d.sidebar || {};
    ["nav", "starred", "recents"].forEach((k) => { d.sidebar[k] = Array.isArray(d.sidebar[k]) ? d.sidebar[k] : []; });
    ["chips", "plusMenu", "toolsMenu", "connectors", "projects", "schedules"].forEach((k) => { d[k] = Array.isArray(d[k]) ? d[k] : []; });
    d.conversations = d.conversations || {};
    d.artifacts = d.artifacts || {};
    d.code = d.code || {};
    d.code.sessions = Array.isArray(d.code.sessions) ? d.code.sessions : [];
    d.scenes = d.scenes || {};
    d.greeting = d.greeting || {};
    Object.values(d.conversations).forEach((c) => {
      c.messages = Array.isArray(c.messages) ? c.messages : [];
      c.messages.forEach((m) => {
        if (typeof m.text === "string") m.text = dedent(m.text);
        if (typeof m.after === "string") m.after = dedent(m.after);
      });
    });
    Object.values(d.artifacts).forEach((a) => { if (typeof a.content === "string") a.content = dedent(a.content); });
    return d;
  }

  function currentModel() {
    const conv = getConv(state.chatId);
    const name = state.modelOverride || conv?.model || data.models[0].name;
    const lower = String(name).toLowerCase();
    return data.models.find((m) => m.name.toLowerCase() === lower || String(m.short || "").toLowerCase() === lower) || { name, short: String(name).replace(/^Claude\s+/, "") };
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove("show"), 1900);
  }

  /* --------------------------------------------------------------- markdown */
  const KEYWORDS = {
    js: "import export default from const let var function return if else for while do switch case break continue new class extends await async try catch finally throw typeof instanceof of in true false null undefined this",
    py: "import from as def return if elif else for while in not and or is None True False class with try except finally raise lambda yield pass break continue global self",
    sh: "npm npx cd git ls echo export sudo pip python node cat"
  };
  const LANG_ALIAS = { javascript: "js", jsx: "js", ts: "js", tsx: "js", typescript: "js", json: "js", js: "js", python: "py", py: "py", bash: "sh", shell: "sh", sh: "sh", zsh: "sh", console: "sh", css: "css", scss: "css", html: "html", xml: "html", svg: "html" };
  const RE_STR = /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/.source;
  const RE_NUM = /\b\d+(?:\.\d+)?\b/.source;
  const RE_ID = /[A-Za-z_$][\w$]*/.source;
  const RE_COMMENT = { py: /#[^\n]*/.source, sh: /#[^\n]*/.source, css: /\/\*[\s\S]*?\*\//.source, js: /\/\/[^\n]*|\/\*[\s\S]*?\*\//.source };

  function highlight(code, lang) {
    const l = LANG_ALIAS[String(lang || "").toLowerCase()];
    if (!l) return esc(code);
    let re;
    if (l === "html") re = /(<!--[\s\S]*?-->)|("[^"\n]*")|(<\/?[A-Za-z][\w-]*|\/?>)|([A-Za-z-]+(?==))/g;
    else re = new RegExp(`(${RE_COMMENT[l] || RE_COMMENT.js})|(${RE_STR})|(${RE_NUM})|(${RE_ID})`, "g");
    const kw = new Set((KEYWORDS[l] || "").split(" ").filter(Boolean));
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const t = m[0];
      if (m[1]) out += `<span class="tk-c">${esc(t)}</span>`;
      else if (m[2]) out += `<span class="tk-s">${esc(t)}</span>`;
      else if (m[3]) out += `<span class="${l === "html" ? "tk-k" : "tk-n"}">${esc(t)}</span>`;
      else if (m[4]) {
        if (l === "html") out += `<span class="tk-f">${esc(t)}</span>`;
        else if (kw.has(t)) out += `<span class="tk-k">${esc(t)}</span>`;
        else if (code[re.lastIndex] === "(") out += `<span class="tk-f">${esc(t)}</span>`;
        else if (/^[A-Z]/.test(t)) out += `<span class="tk-t">${esc(t)}</span>`;
        else out += esc(t);
      }
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function codeBlock(code, lang) {
    return `<div class="code-block"><div class="cb-head"><span>${esc(lang || "text")}</span><button class="cb-copy" data-action="copy-code">${icon("copy")}<span>Copy</span></button></div><pre><code>${highlight(code, lang)}</code></pre></div>`;
  }

  function inline(src) {
    const codes = [];
    let s = String(src).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = esc(s);
    s = s.replace(/\[\[([^\]]+)\]\]/g, (_, site) => `<span class="cite">${site}</span>`);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => (/^(https?:|mailto:|#|\/)/i.test(url) ? `<a href="${url}" target="_blank" rel="noopener">${text}</a>` : text));
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/__(.+?)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<em>$2</em>").replace(/(^|[^\w])_(?!\s)([^_]+?)_(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  }

  const RE_FENCE = /^\s*(```|~~~)\s*([\w+#.-]*)\s*$/;
  const RE_LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const isTableStart = (lines, i) => /^\s*\|.*\|\s*$/.test(lines[i] || "") && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] || "");
  const isBlockStart = (lines, i) => RE_FENCE.test(lines[i]) || /^#{1,6}\s/.test(lines[i]) || /^\s*>/.test(lines[i]) || RE_LIST.test(lines[i]) || /^\s*(-{3,}|\*{3,})\s*$/.test(lines[i]) || isTableStart(lines, i);

  function renderList(block) {
    const items = [];
    block.forEach((line) => {
      const m = line.match(RE_LIST);
      if (m) items.push({ indent: m[1].replace(/\t/g, "  ").length, ordered: /\d/.test(m[2]), num: parseInt(m[2], 10), text: m[3] });
      else if (items.length && line.trim()) items[items.length - 1].text += "\n" + line.trim();
    });
    const build = (idx) => {
      const { indent, ordered, num } = items[idx];
      let html = ordered ? `<ol${num > 1 ? ` start="${num}"` : ""}>` : "<ul>";
      while (idx < items.length && items[idx].indent >= indent) {
        if (items[idx].indent > indent) { const [sub, next] = build(idx); html += sub; idx = next; continue; }
        html += `<li>${inline(items[idx].text).replace(/\n/g, "<br>")}`;
        idx++;
        if (idx < items.length && items[idx].indent > indent) { const [sub, next] = build(idx); html += sub; idx = next; }
        html += "</li>";
      }
      return [html + (ordered ? "</ol>" : "</ul>"), idx];
    };
    let out = "", idx = 0;
    while (idx < items.length) { const [h, n] = build(idx); out += h; idx = n; }
    return out;
  }

  function md(src) {
    const lines = dedent(src).split("\n");
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      let m;
      if ((m = line.match(RE_FENCE))) {
        const fence = m[1], lang = m[2], buf = [];
        i++;
        const close = new RegExp("^\\s*" + fence + "\\s*$");
        while (i < lines.length && !close.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push(codeBlock(dedent(buf.join("\n")), lang));
        continue;
      }
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
      if (/^\s*>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
        out.push(`<blockquote>${md(buf.join("\n"))}</blockquote>`);
        continue;
      }
      if (isTableStart(lines, i)) {
        const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        const head = cells(lines[i]);
        const aligns = cells(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? "center" : /-+:$/.test(c) ? "right" : ""));
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
        const td = (tag, c, k) => `<${tag}${aligns[k] ? ` style="text-align:${aligns[k]}"` : ""}>${inline(c)}</${tag}>`;
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c, k) => td("th", c, k)).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, k) => td("td", c, k)).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      if (RE_LIST.test(line)) {
        const buf = [];
        while (i < lines.length) {
          if (RE_LIST.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && buf.length)) buf.push(lines[i++]);
          else if (!lines[i].trim() && i + 1 < lines.length && (RE_LIST.test(lines[i + 1]) || /^\s{2,}\S/.test(lines[i + 1]))) i++;
          else break;
        }
        out.push(renderList(buf));
        continue;
      }
      const buf = [lines[i++]];
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines, i)) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join("\n")).replace(/\n/g, "<br>")}</p>`);
    }
    return out.join("");
  }

  /* ---------------------------------------------------------------- sidebar */
  function sidebarRow(entry, activeId) {
    const id = typeof entry === "string" ? entry : entry?.chat || "";
    const conv = getConv(id);
    const title = conv?.title || entry?.title || id;
    const attrs = conv ? `data-chat="${esc(id)}"` : `data-action="decor" data-title="${esc(title)}"`;
    return `<button class="sb-row${id && id === activeId ? " active" : ""}" ${attrs} title="${esc(title)}"><span class="sb-row-text">${esc(title)}</span><span class="sb-row-more" aria-hidden="true">${icon("more")}</span></button>`;
  }

  function renderSidebar() {
    const inCode = state.scene === "code" || getConv(state.chatId)?.mode === "code";
    const navActive = { chats: state.scene === "chats", project: state.scene === "project", artifacts: state.scene === "artifacts", code: inCode, scheduled: state.scene === "scheduled" };
    const nav = data.sidebar.nav.map((n) => `<button class="sb-nav${navActive[n.scene] ? " active" : ""}" data-scene="${esc(n.scene)}" title="${esc(n.label)}">${icon(n.icon || "chats")}<span class="sb-label">${esc(n.label)}</span></button>`).join("");
    let lists;
    if (inCode) {
      lists = `<section><h3>${esc(ui("sessions", "Sessions"))}</h3>${data.code.sessions.map((s) => sidebarRow(s, state.chatId)).join("")}</section>`;
    } else {
      lists = (data.sidebar.starred.length ? `<section><h3>${esc(ui("starred", "Starred"))}</h3>${data.sidebar.starred.map((s) => sidebarRow(s, state.chatId)).join("")}</section>` : "")
        + `<section><h3>${esc(ui("recents", "Recents"))}</h3>${data.sidebar.recents.map((s) => sidebarRow(s, state.chatId)).join("")}</section>`;
    }
    els.sidebar.innerHTML = `
      <div class="sb-top">
        <button class="sb-logo" data-action="home" aria-label="Claude home"><span class="wordmark">Claude</span></button>
        <button class="icon-btn sb-toggle" data-action="toggle-sidebar" aria-label="Toggle sidebar" title="Toggle sidebar">${icon("panel")}</button>
      </div>
      <button class="sb-new" data-action="new" title="${esc(inCode ? ui("newSession", "New session") : ui("newChat", "New chat"))}"><span class="new-dot">${icon("plus")}</span><span class="sb-label">${esc(inCode ? ui("newSession", "New session") : ui("newChat", "New chat"))}</span></button>
      <nav class="sb-navs">${nav}</nav>
      <div class="sb-scroll">${lists}</div>
      <button class="sb-account" data-action="account" title="${esc(userName())}"><span class="avatar">${esc(initials())}</span><span class="sb-who"><strong>${esc(userName())}</strong><small>${esc(data.user.plan || "")}</small></span>${icon("updown", "sb-updown")}</button>`;
  }

  /* ----------------------------------------------------------------- topbar */
  function renderTopbar() {
    const conv = PAGE_SCENES.has(state.scene) ? null : getConv(state.chatId);
    const menu = `<button class="icon-btn mobile-only" data-action="open-sidebar" aria-label="Open sidebar">${icon("menu")}</button>`;
    const badge = `<span class="training-badge mock-badge">${esc(ui("badge", "TRAINING MOCK · FICTIONAL DATA"))}</span>`;
    let left = "", right = badge;
    if (conv) {
      const project = conv.project ? getProject(conv.project) : null;
      if (conv.mode === "code" && conv.workspace) {
        left = `<div class="tb-code"><span class="tb-chip">${icon("folder")}${esc(conv.workspace.repo || "")}</span><span class="tb-chip">${icon("branch")}${esc(conv.workspace.branch || "")}</span></div><button class="tb-title" data-action="title-menu"><span>${esc(conv.title)}</span>${icon("chevron-down")}</button>`;
      } else {
        left = (project ? `<button class="tb-crumb" data-scene="project">${esc(project.name)}</button><span class="tb-sep">/</span>` : "")
          + `<button class="tb-title" data-action="title-menu"><span>${esc(conv.title)}</span>${icon("chevron-down")}</button>`;
      }
      right += `<button class="btn-outline tb-share" data-action="share">${icon("share")}<span>${esc(ui("share", "Share"))}</span></button>`;
      document.title = `${conv.title} - Claude`;
    } else {
      document.title = "Claude";
    }
    els.topbar.innerHTML = `<div class="tb-left">${menu}${left}</div><div class="tb-right">${right}</div>`;
  }

  /* --------------------------------------------------------------- composer */
  function composer({ placeholder, value = "", variant = "chat" }) {
    const model = currentModel();
    const stop = state.streaming || state.taskState === "running";
    const hasText = Boolean(String(value).trim());
    let left;
    if (variant === "code") {
      left = `<button type="button" class="c-btn" data-action="plus" aria-label="Add context">${icon("plus")}</button>
        <button type="button" class="c-pill${state.permission === "Auto" ? " on" : ""}" data-action="permission" title="Permission mode">${icon(state.permission === "Auto" ? "check-circle" : "lock")}<span>${esc((data.code.permissionModes || {})[state.permission] || state.permission)}</span></button>`;
    } else {
      left = `<button type="button" class="c-btn" data-action="plus" aria-label="Add files and more">${icon("plus")}</button>
        <button type="button" class="c-btn" data-action="tools" aria-label="Search and tools">${icon("sliders")}</button>
        <button type="button" class="c-btn${state.thinking ? " on" : ""}" data-action="thinking" aria-pressed="${state.thinking}" aria-label="Extended thinking" title="Extended thinking">${icon("clock")}</button>`;
    }
    return `<form class="composer composer-${variant}" data-composer>
      <textarea rows="1" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">${esc(value)}</textarea>
      <div class="c-row">
        <div class="c-left">${left}</div>
        <div class="c-right">
          <button type="button" class="c-model" data-action="model">${esc(model.short || model.name)}${icon("chevron-down")}</button>
          ${stop
            ? `<button type="button" class="c-send is-stop" data-action="stop" aria-label="Stop">${icon("stop")}</button>`
            : `<button type="submit" class="c-send${hasText ? " ready" : ""}" aria-label="Send message">${icon("arrow-up")}</button>`}
        </div>
      </div>
    </form>`;
  }

  /* ------------------------------------------------------------------- home */
  function greetingText() {
    const g = data.greeting || {};
    if (g.fixed) return g.fixed.replace("{firstName}", firstName()).replace("{name}", userName());
    const forced = params.get("time");
    const h = new Date().getHours();
    const part = forced || (h < 12 ? "morning" : h < 18 ? "afternoon" : "evening");
    const word = g[part] || g.afternoon || "Hello";
    return (g.format || "{greeting}, {firstName}").replace("{greeting}", word).replace("{firstName}", firstName()).replace("{name}", userName());
  }

  function renderHome() {
    const chips = data.chips.map((c, i) => `<button class="chip${state.chipOpen === i ? " active" : ""}" data-chip="${i}">${icon(c.icon || "sparkle")}<span>${esc(c.label)}</span></button>`).join("");
    const open = data.chips[state.chipOpen];
    const suggestions = open ? `<div class="chip-panel"><header>${icon(open.icon || "sparkle")}<span>${esc(open.label)}</span><button class="icon-btn" data-action="close-chip" aria-label="Close">${icon("close")}</button></header>${(open.suggestions || []).map((s) => `<button class="chip-suggestion" data-suggestion="${esc(s)}">${esc(s)}</button>`).join("")}</div>` : "";
    els.stage.className = "stage stage-home";
    els.stage.innerHTML = `<div class="home"><div class="home-inner">
      <h1 class="greeting"><span class="greet-spark">${icon("spark")}</span><span>${esc(greetingText())}</span></h1>
      ${composer({ placeholder: ui("homePlaceholder", "How can I help you today?"), value: state.prompt, variant: "home" })}
      ${open ? suggestions : `<div class="chips">${chips}</div>`}
    </div></div>`;
  }

  /* ----------------------------------------------------------- conversation */
  const kindClass = (kind) => `k-${String(kind || "file").toLowerCase().replace(/[^a-z]/g, "")}`;
  const fileCard = (f) => `<div class="file-card"><span class="fc-kind ${kindClass(f.kind)}">${esc(f.kind || "FILE")}</span><span class="fc-text"><strong>${esc(f.name)}</strong>${f.detail ? `<small>${esc(f.detail)}</small>` : ""}</span></div>`;
  const userText = (t) => String(t || "").split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

  function thinkingBlock(t, live) {
    return `<details class="thinking"${live ? " open" : ""}><summary>${icon("clock", "th-icon")}<span>${esc(live ? "Thinking…" : t.label || "Thought process")}</span>${icon("chevron-down", "th-chev")}</summary>${t.text ? `<div class="thinking-body">${md(t.text)}</div>` : ""}</details>`;
  }

  function toolRow(t, { running = false, code = false } = {}) {
    const label = running && t.runningLabel ? t.runningLabel : t.label;
    const hasBody = Boolean(t.output || t.diff || (t.results && t.results.length));
    const lead = running ? `<span class="spinner" aria-hidden="true"></span>` : icon(t.icon || "check", "tool-icon");
    const head = `${lead}<span class="tool-label">${esc(label)}</span>${t.detail ? `<span class="tool-detail">${esc(t.detail)}</span>` : ""}`;
    let body = "";
    if (t.results && t.results.length) body += `<ul class="result-list">${t.results.map((r) => `<li><span class="favicon">${esc((r.site || "?")[0].toUpperCase())}</span><span class="rl-title">${esc(r.title)}</span><span class="rl-site">${esc(r.site || "")}</span></li>`).join("")}</ul>`;
    if (t.diff) body += `<div class="diff"><div class="diff-head">${icon("file")}${esc(t.diff.file || "")}</div>${(t.diff.lines || []).map((l) => { const s = l[0]; const cls = s === "+" ? "add" : s === "-" ? "del" : "ctx"; return `<div class="dl ${cls}"><span class="dl-sign">${s === "+" || s === "-" ? s : ""}</span><span class="dl-code">${highlight(l.slice(1), t.diff.file?.split(".").pop() || "")}</span></div>`; }).join("")}</div>`;
    if (t.output) body += `<pre class="tool-output">${esc(t.output)}</pre>`;
    if (!hasBody) return `<div class="tool${running ? " running" : ""}${code ? " tool-code" : ""}"><div class="tool-head">${head}</div></div>`;
    return `<details class="tool${code ? " tool-code" : ""}"${code ? " open" : ""}><summary class="tool-head">${head}${icon("chevron-down", "tool-chev")}</summary><div class="tool-body">${body}</div></details>`;
  }

  function researchBlock(r) {
    const results = r.results || [];
    return `<details class="research-card"><summary>
        <span class="rc-icon">${icon("research")}</span>
        <span class="rc-text"><strong>${esc(r.status || "Research")}</strong><small>${[r.sources, r.duration].filter(Boolean).map(esc).join(" · ")}</small></span>
        <span class="rc-favs">${results.slice(0, 4).map((x) => `<span class="favicon">${esc((x.site || "?")[0].toUpperCase())}</span>`).join("")}</span>
        ${icon("chevron-down", "tool-chev")}
      </summary>
      <div class="rc-body">
        <ol class="rc-steps">${(r.steps || []).map((s) => `<li>${icon("check-circle")}<span>${esc(s)}</span></li>`).join("")}</ol>
        <ul class="result-list">${results.map((x) => `<li><span class="favicon">${esc((x.site || "?")[0].toUpperCase())}</span><span class="rl-title">${esc(x.title)}</span><span class="rl-site">${esc(x.site || "")}</span></li>`).join("")}</ul>
      </div></details>`;
  }

  function artifactCard(id) {
    const a = getArtifact(id);
    if (!a) return "";
    const ic = a.kind === "document" ? "document" : "code";
    return `<button class="artifact-card${state.artifactId === id ? " active" : ""}" data-artifact="${esc(id)}"><span class="ac-thumb">${icon(ic)}</span><span class="ac-text"><strong>${esc(a.title)}</strong><small>${esc(a.type || "Artifact")}${a.versions > 1 ? ` · Version ${a.versions}` : ""}</small></span></button>`;
  }

  function messageFooter(streaming) {
    if (streaming) return `<div class="msg-footer"><span class="foot-spark working">${icon("spark")}</span></div>`;
    return `<div class="msg-footer"><span class="foot-spark">${icon("spark")}</span><div class="msg-actions"><span class="disclaimer">${esc(ui("disclaimer", ""))}</span>
      <button class="icon-btn sm" data-action="copy-response" aria-label="Copy" title="Copy">${icon("copy")}</button>
      <button class="icon-btn sm${state.feedback.up ? " on" : ""}" data-action="thumb-up" aria-label="Good response" title="Give positive feedback">${icon("thumb-up")}</button>
      <button class="icon-btn sm${state.feedback.down ? " on" : ""}" data-action="thumb-down" aria-label="Bad response" title="Give negative feedback">${icon("thumb-down")}</button>
      <button class="btn-ghost sm" data-action="retry" title="Retry">${icon("retry")}<span>Retry</span>${icon("chevron-down")}</button></div></div>`;
  }

  function assistantMsg(m, { last = false, streaming = false, running = false, mode = "chat" } = {}) {
    const code = mode === "code";
    let tools = m.tools || [];
    let showText = true;
    if (running) { showText = false; }
    const toolsFirst = m.toolsFirst ?? !code;
    const toolsHtml = tools.length ? `<div class="tools">${tools.map((t, i) => toolRow(t, { running: running && i === tools.length - 1, code })).join("")}</div>` : "";
    let h = `<div class="msg msg-assistant${streaming ? " is-streaming" : ""}">`;
    if (m.thinking) h += thinkingBlock(m.thinking, streaming && !m.text);
    if (m.research) h += researchBlock(m.research);
    if (toolsFirst) h += toolsHtml;
    if (showText && (m.text || streaming)) h += `<div class="md"${streaming ? " data-stream" : ""}>${md(m.text || "")}</div>`;
    if (!toolsFirst) h += toolsHtml;
    if (showText && m.artifact) h += artifactCard(m.artifact);
    if (showText && m.after) h += `<div class="md">${md(m.after)}</div>`;
    if (last) h += messageFooter(streaming || running);
    return h + "</div>";
  }

  function userMsg(m) {
    const files = m.attachments?.length ? `<div class="attach-row">${m.attachments.map(fileCard).join("")}</div>` : "";
    return `<div class="msg msg-user">${files}<div class="user-bubble"><span class="avatar sm">${esc(initials())}</span><div class="user-text">${userText(m.text)}</div></div></div>`;
  }

  /* Build the list of messages to show, applying task/code staging rules. */
  function viewMessages(conv) {
    let msgs = conv.messages.map((m) => ({ ...m }));
    const flags = new Map();
    if (conv.mode === "task" && state.taskState === "running") {
      const idx = msgs.map((m) => m.role).lastIndexOf("assistant");
      if (idx >= 0) {
        const step = Math.max(0, Number(conv.task?.runningStep ?? 1));
        msgs[idx].tools = (msgs[idx].tools || []).slice(0, step + 1);
        msgs = msgs.slice(0, idx + 1);
        flags.set(idx, { running: true });
      }
    }
    let permissionCard = "";
    const req = conv.permissionRequest;
    if (req && conv.mode === "code") {
      if (state.permission === "Auto" || state.permissionGranted) msgs.push({ role: "assistant", tools: req.result ? [req.result] : [], text: req.followUp || "", toolsFirst: true });
      else permissionCard = `<div class="permission-card"><div class="pc-head">${icon("terminal")}<strong>${esc(req.title || "Allow this action?")}</strong></div>
        <pre class="pc-command">${esc(req.command || "")}</pre>${req.description ? `<p>${esc(req.description)}</p>` : ""}
        <div class="pc-options">${(req.options || ["Yes", "No"]).map((o, i) => `<button class="pc-option${i === 0 ? " primary" : ""}" data-action="${i === (req.options || []).length - 1 ? "deny" : "allow"}"><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join("")}</div></div>`;
    }
    return { msgs, flags, permissionCard };
  }

  function renderConversation(scrollMode) {
    const conv = getConv(state.chatId);
    els.stage.className = "stage stage-thread";
    if (!conv) {
      els.stage.innerHTML = `<div class="empty-state">${icon("spark")}<h2>Conversation not found</h2><p>Add a conversation with id <code>${esc(state.chatId)}</code> to <code>conversations</code> in demo-data.js.</p></div>`;
      return;
    }
    const mode = conv.mode || "chat";
    const { msgs, flags, permissionCard } = viewMessages(conv);
    const lastIdx = msgs.length - 1;
    const body = msgs.map((m, i) => {
      if (m.role === "user") return userMsg(m);
      const f = flags.get(i) || {};
      return assistantMsg(m, { last: i === lastIdx && !permissionCard, streaming: Boolean(m._streaming), running: f.running, mode });
    }).join("") + permissionCard + (permissionCard ? `<div class="msg-footer solo"><span class="foot-spark">${icon("spark")}</span></div>` : "");
    const prevScroll = scrollMode === "keep" ? $("#thread-scroll")?.scrollTop : null;
    const placeholder = mode === "code" ? ui("codePlaceholder", "Ask Claude to change something…") : ui("replyPlaceholder", "Reply to Claude…");
    els.stage.innerHTML = `<div class="thread-scroll" id="thread-scroll"><div class="thread thread-${mode}">${body}</div>
      <div class="dock"><div class="dock-inner">${composer({ placeholder, value: state.prompt, variant: mode === "code" ? "code" : "chat" })}</div></div></div>`;
    if (prevScroll != null) { $("#thread-scroll").scrollTop = prevScroll; return; }
    positionThread(scrollMode);
  }

  function positionThread(mode = "last-user") {
    const scroller = $("#thread-scroll");
    if (!scroller) return;
    requestAnimationFrame(() => {
      if (mode === "bottom") { scroller.scrollTop = scroller.scrollHeight; return; }
      if (mode === "top") { scroller.scrollTop = 0; return; }
      const users = scroller.querySelectorAll(".msg-user");
      const lastUser = users[users.length - 1];
      scroller.scrollTop = lastUser ? Math.max(0, lastUser.offsetTop - 24) : 0;
    });
  }

  /* ------------------------------------------------------------------ pages */
  function convRows(ids) {
    return ids.map((entry) => {
      const id = typeof entry === "string" ? entry : entry.chat;
      const conv = getConv(id);
      const title = conv?.title || entry.title || id;
      const when = conv?.updated || entry.time || "";
      return `<button class="list-row" ${conv ? `data-chat="${esc(id)}"` : `data-action="decor" data-title="${esc(title)}"`}><span class="lr-title">${esc(title)}</span>${when ? `<small>${esc(ui("lastMessage", "Last message"))} ${esc(when.charAt(0).toLowerCase() + when.slice(1))}</small>` : ""}</button>`;
    }).join("");
  }

  function renderChats() {
    const all = [...new Set([...data.sidebar.starred, ...data.sidebar.recents].map((e) => (typeof e === "string" ? e : JSON.stringify(e))))].map((e) => (e.startsWith("{") ? JSON.parse(e) : e));
    Object.keys(data.conversations).forEach((id) => { if (!all.includes(id) && data.conversations[id].mode !== "code") all.push(id); });
    els.stage.className = "stage stage-page";
    els.stage.innerHTML = `<div class="page"><div class="page-inner narrow">
      <div class="page-head"><h1>${esc(ui("chatsTitle", "Chats"))}</h1><button class="btn-dark" data-action="new">${icon("plus")}<span>${esc(ui("newChat", "New chat"))}</span></button></div>
      <label class="page-search">${icon("search")}<input data-filter="chat-list" placeholder="${esc(ui("chatsSearch", "Search your chats…"))}" aria-label="${esc(ui("chatsSearch", "Search your chats…"))}" /></label>
      <p class="page-meta">${esc(ui("chatsCount", "You have {count} previous chats with Claude").replace("{count}", all.length))}</p>
      <div class="list" id="chat-list">${convRows(all)}</div>
    </div></div>`;
  }

  function artifactThumb(a) {
    if (a.kind === "dashboard") return `<div class="thumb thumb-dash"><i></i><i></i><i></i><b style="width:88%"></b><b style="width:72%"></b><b style="width:80%"></b><b style="width:54%"></b></div>`;
    if (a.kind === "html") return `<div class="thumb thumb-html"><iframe title="" tabindex="-1" sandbox="" srcdoc="${esc(a.html || "")}"></iframe></div>`;
    return `<div class="thumb thumb-doc"><strong></strong><span></span><span></span><span style="width:70%"></span><span></span><span style="width:55%"></span></div>`;
  }

  function renderArtifactsPage() {
    const cards = Object.entries(data.artifacts).map(([id, a]) => `<button class="art-tile" data-artifact-open="${esc(id)}">${artifactThumb(a)}<span class="art-meta"><strong>${esc(a.title)}</strong><small>${esc(a.updated || a.type || "")}</small></span></button>`).join("");
    els.stage.className = "stage stage-page";
    els.stage.innerHTML = `<div class="page"><div class="page-inner">
      <div class="page-head"><h1>${esc(ui("artifactsTitle", "Artifacts"))}</h1><button class="btn-dark" data-action="new">${icon("plus")}<span>${esc(ui("newArtifact", "New artifact"))}</span></button></div>
      <div class="tabs"><button class="tab" data-action="decor" data-title="Inspiration">Inspiration</button><button class="tab active">Your artifacts</button></div>
      <div class="art-grid">${cards}</div>
    </div></div>`;
  }

  function renderProject() {
    const p = getProject(state.projectId);
    els.stage.className = "stage stage-page";
    if (!p) { els.stage.innerHTML = `<div class="empty-state"><h2>No projects</h2><p>Add one to <code>projects</code> in demo-data.js.</p></div>`; return; }
    const cap = Math.max(0, Math.min(100, Number(p.capacity) || 0));
    els.stage.innerHTML = `<div class="page project-page"><div class="project-main">
        <button class="crumb" data-scene="chats">${icon("arrow-left")}<span>${esc(ui("allProjects", "All projects"))}</span></button>
        <div class="project-title"><h1>${esc(p.name)}</h1>${p.visibility ? `<span class="pill">${icon("lock")}${esc(p.visibility)}</span>` : ""}</div>
        <p class="project-desc">${esc(p.description || "")}</p>
        ${composer({ placeholder: ui("projectPlaceholder", "How can I help you today?"), value: state.prompt, variant: "home" })}
        <div class="list project-chats">${(p.chats || []).length ? convRows(p.chats) : `<p class="page-meta">Start a chat to keep conversations organized and re-use project knowledge.</p>`}</div>
      </div>
      <aside class="project-side">
        <section class="ps-card"><header><strong>Instructions</strong><button class="icon-btn sm" data-action="decor" data-title="Edit instructions" aria-label="Edit instructions">${icon("pen")}</button></header><p>${esc(p.instructions || "")}</p></section>
        <section class="ps-card"><header><strong>Files</strong><button class="icon-btn sm" data-action="decor" data-title="Add files" aria-label="Add files">${icon("plus")}</button></header>
          <div class="capacity"><i style="width:${cap}%"></i></div><small class="cap-label">${cap}% of project capacity used</small>
          <div class="file-grid">${(p.files || []).map((f) => `<div class="file-tile"><strong>${esc(f.name)}</strong><small>${esc(f.detail || "")}</small><span class="fc-kind ${kindClass(f.kind)}">${esc(f.kind || "FILE")}</span></div>`).join("")}</div>
        </section>
      </aside></div>`;
  }

  function renderScheduled() {
    els.stage.className = "stage stage-page";
    els.stage.innerHTML = `<div class="page"><div class="page-inner narrow">
      <div class="page-head"><h1>${esc(ui("scheduledTitle", "Scheduled"))}</h1><button class="btn-dark" data-action="decor" data-title="New scheduled task">${icon("plus")}<span>${esc(ui("newTask", "New task"))}</span></button></div>
      <p class="page-meta">${esc(ui("scheduledSubtitle", ""))}</p>
      <div class="sched-list">${data.schedules.map((s, i) => `<article class="sched">
        <span class="sched-icon">${icon("calendar")}</span>
        <div class="sched-text"><strong>${esc(s.title)}</strong><p>${esc(s.prompt || "")}</p><small>${esc(s.cadence || "")}${s.next ? ` · Next run ${esc(s.next)}` : ""}</small></div>
        <button class="switch${s.status !== "Paused" ? " on" : ""}" data-schedule="${i}" role="switch" aria-checked="${s.status !== "Paused"}" aria-label="Toggle ${esc(s.title)}"><i></i></button>
      </article>`).join("")}</div>
    </div></div>`;
  }

  /* ------------------------------------------------------------ side panels */
  function renderArtifactBody(a) {
    if (state.artifactTab === "code") {
      const src = a.kind === "html" ? a.html : a.kind === "document" ? a.content : a.code;
      const lang = a.kind === "html" ? "html" : a.kind === "document" ? "markdown" : a.language || "";
      const lines = highlight(String(src || ""), lang).split("\n");
      return `<pre class="ap-code"><code>${lines.map((l, i) => `<span class="ln">${i + 1}</span>${l || " "}`).join("\n")}</code></pre>`;
    }
    if (a.kind === "html") return `<iframe class="ap-frame" title="${esc(a.title)}" sandbox="allow-scripts" srcdoc="${esc(a.html || "")}"></iframe>`;
    if (a.kind === "document") return `<article class="ap-doc md">${md(a.content || "")}</article>`;
    const c = a.content || {};
    const max = Math.max(100, ...((c.bars?.items || []).map((b) => Number(b.value) || 0)));
    return `<article class="dash">
      ${c.eyebrow ? `<span class="dash-eyebrow">${esc(c.eyebrow)}</span>` : ""}<h2>${esc(c.heading || a.title)}</h2>${c.subheading ? `<p class="dash-sub">${esc(c.subheading)}</p>` : ""}
      <div class="dash-metrics">${(c.metrics || []).map((m) => `<section class="dash-metric"><small>${esc(m.label)}</small><strong>${esc(m.value)}</strong><em class="tone-${esc(m.tone || "flat")}">${esc(m.change || "")}</em></section>`).join("")}</div>
      ${c.bars ? `<section class="dash-card"><h3>${esc(c.bars.title || "")}</h3>${(c.bars.items || []).map((b) => { const v = Number(b.value) || 0; return `<div class="dash-bar" title="${esc(b.owner || "")}"><span>${esc(b.label)}</span><div class="track"><i class="${v >= 85 ? "good" : v >= 75 ? "mid" : "low"}" style="width:${(v / max) * 100}%"></i></div><b>${v}%</b></div>`; }).join("")}</section>` : ""}
      ${c.list ? `<section class="dash-card"><h3>${esc(c.list.title || "")}</h3><ul class="dash-list">${(c.list.items || []).map((x) => `<li><span class="dot"></span>${esc(x)}</li>`).join("")}</ul></section>` : ""}
    </article>`;
  }

  function renderArtifactPanel(a) {
    const versions = Math.max(1, Number(a.versions) || 1);
    const v = state.artifactVersion || versions;
    els.panel.className = "side-panel artifact-panel";
    els.panel.innerHTML = `<header class="ap-head">
        <div class="seg" role="tablist"><button class="${state.artifactTab === "preview" ? "active" : ""}" data-tab="preview" aria-label="Preview" title="Preview">${icon("eye")}</button><button class="${state.artifactTab === "code" ? "active" : ""}" data-tab="code" aria-label="Code" title="Code">${icon("code")}</button></div>
        <div class="ap-title"><strong>${esc(a.title)}</strong>${versions > 1 ? `<button class="ap-version" data-action="version">v${v}${icon("chevron-down")}</button>` : ""}</div>
        <div class="ap-actions">
          <button class="btn-outline sm" data-action="copy-artifact">${icon("copy")}<span>Copy</span></button>
          <button class="icon-btn" data-action="download-artifact" aria-label="Download" title="Download">${icon("download")}</button>
          <button class="btn-dark sm" data-action="publish">Publish</button>
          <button class="icon-btn" data-action="close-panel" aria-label="Close artifact" title="Close">${icon("close")}</button>
        </div>
      </header>
      <div class="ap-body${state.artifactTab === "code" ? " is-code" : ""}">${renderArtifactBody(a)}</div>`;
  }

  function renderTaskPanel(conv) {
    const t = conv.task || {};
    const running = state.taskState === "running";
    const step = Number(t.runningStep ?? 1);
    const steps = (t.steps || []).map((s, i) => {
      const st = !running || i < step ? "done" : i === step ? "current" : "todo";
      const lead = st === "done" ? icon("check-circle") : st === "current" ? `<span class="spinner"></span>` : icon("circle");
      return `<li class="step ${st}">${lead}<span>${esc(s.label || s)}</span></li>`;
    }).join("");
    const outputs = running ? (t.outputs || []).slice(0, Math.max(0, step - 1)) : t.outputs || [];
    const ctx = t.context || {};
    els.panel.className = "side-panel task-panel";
    els.panel.innerHTML = `<div class="tp-scroll">
      <section class="tp-card"><header><strong>Progress</strong><small>${running ? `${Math.min(step, (t.steps || []).length)} of ${(t.steps || []).length}` : "Done"}</small></header><ol class="steps">${steps}</ol></section>
      <section class="tp-card"><header><strong>Outputs</strong><small>${outputs.length}</small></header>${outputs.length ? outputs.map(fileCard).join("") : `<p class="tp-empty">Files Claude creates will appear here.</p>`}</section>
      <section class="tp-card"><header><strong>Context</strong></header>
        ${ctx.folder ? `<div class="ctx-row">${icon("folder")}<span>${esc(ctx.folder)}</span></div>` : ""}
        ${(ctx.files || []).map((f) => `<div class="ctx-row">${icon("file")}<span>${esc(f)}</span></div>`).join("")}
        ${(ctx.connectors || []).map((c) => `<div class="ctx-row">${icon("plug")}<span>${esc(c)}</span></div>`).join("")}
      </section></div>`;
  }

  function renderPanel() {
    const conv = PAGE_SCENES.has(state.scene) ? null : getConv(state.chatId);
    const a = getArtifact(state.artifactId);
    let open = false;
    if (a && conv) { renderArtifactPanel(a); open = true; }
    else if (conv && conv.mode === "task" && conv.task) { renderTaskPanel(conv); open = true; }
    els.panel.hidden = !open;
    els.app.classList.toggle("has-panel", open);
    els.app.classList.toggle("has-artifact", open && Boolean(a));
  }

  /* ------------------------------------------------------------------ render */
  function renderStage(scrollMode) {
    closePopover();
    const s = state.scene;
    if (s === "home") renderHome();
    else if (s === "chats") renderChats();
    else if (s === "artifacts") renderArtifactsPage();
    else if (s === "project") renderProject();
    else if (s === "scheduled") renderScheduled();
    else renderConversation(scrollMode || (data.scenes[s] || {}).scroll);
    autosizeAll();
  }

  function render(scrollMode) {
    els.app.classList.toggle("sb-collapsed", state.sidebarCollapsed);
    els.app.classList.toggle("sb-open", state.mobileSidebar);
    els.app.dataset.scene = state.scene;
    renderSidebar();
    renderTopbar();
    renderStage(scrollMode);
    renderPanel();
    if (state.studioOpen) syncStudio();
  }

  function setScene(scene, opts = {}) {
    if (!SCENES.includes(scene)) scene = "home";
    const cfg = data.scenes[scene] || {};
    state.scene = scene;
    state.chatId = opts.chat || cfg.chat || null;
    state.artifactId = opts.artifact !== undefined ? opts.artifact : cfg.openArtifact || null;
    state.taskState = cfg.taskState || (getConv(state.chatId)?.mode === "task" ? "complete" : null);
    state.projectId = cfg.project || state.projectId || data.projects[0]?.id;
    state.permissionGranted = false;
    state.chipOpen = -1;
    state.artifactTab = "preview";
    state.artifactVersion = null;
    state.mobileSidebar = false;
    state.feedback = {};
    if (opts.keepPrompt !== true && opts.prompt === undefined) state.prompt = scene === "home" ? state.prompt : "";
    if (opts.prompt !== undefined) state.prompt = opts.prompt;
    render();
  }

  function openChat(id, opts = {}) {
    const conv = getConv(id);
    if (!conv) { toast(`No conversation "${id}" in demo data`); return false; }
    const scene = conv.mode === "code" ? "code" : conv.mode === "task" ? (opts.running ? "task-running" : "task-complete") : "chat";
    setScene(scene, { chat: id, artifact: opts.artifact || null });
    return true;
  }

  /* --------------------------------------------------------------- popovers */
  function closePopover() { els.popover.hidden = true; state.popFor = null; }

  function openPopover(anchor, html, { align = "left", key } = {}) {
    if (state.popFor && state.popFor === key) { closePopover(); return; }
    els.popover.innerHTML = html;
    els.popover.hidden = false;
    state.popFor = key;
    const r = anchor.getBoundingClientRect();
    const pw = els.popover.offsetWidth, ph = els.popover.offsetHeight;
    let left = align === "right" ? r.right - pw : r.left;
    left = Math.min(Math.max(8, left), innerWidth - pw - 8);
    let top = r.bottom + 6;
    if (top + ph > innerHeight - 8) top = r.top - ph - 6;
    els.popover.style.left = `${left}px`;
    els.popover.style.top = `${Math.max(8, top)}px`;
  }

  const menuItem = (ic, label, extra = "", attrs = "") => `<button class="menu-item" ${attrs}>${ic ? icon(ic) : ""}<span class="mi-label">${esc(label)}</span>${extra}</button>`;
  const toggleSwitch = (on) => `<span class="switch sm${on ? " on" : ""}"><i></i></span>`;

  function modelMenu() {
    const cur = currentModel().name;
    return `<div class="menu menu-models">${data.models.map((m, i) => `<button class="menu-item model-item" data-model="${i}"><span class="mi-stack"><strong>${esc(m.name)}</strong><small>${esc(m.description || "")}</small></span>${m.name === cur ? icon("check", "mi-check") : ""}</button>`).join("")}</div>`;
  }
  function plusMenu() {
    return `<div class="menu">${data.plusMenu.map((p, i) => menuItem(p.icon, p.label, p.submenu ? icon("chevron-right", "mi-end") : "", `data-plus="${i}"`)).join("")}</div>`;
  }
  function toolsMenu() {
    const tools = data.toolsMenu.map((t, i) => menuItem(t.icon, t.label, t.toggle ? toggleSwitch(t.on) : t.submenu ? icon("chevron-right", "mi-end") : "", `data-tool="${i}"`)).join("");
    const conns = data.connectors.map((c, i) => menuItem("plug", c.name, toggleSwitch(c.on), `data-connector="${i}"`)).join("");
    return `<div class="menu">${tools}${conns ? `<div class="menu-sep"></div>${conns}` : ""}</div>`;
  }
  function accountMenu() {
    const dark = document.documentElement.dataset.theme === "dark";
    return `<div class="menu"><div class="menu-head"><strong>${esc(userName())}</strong><small>${esc(data.user.plan || "")}</small></div><div class="menu-sep"></div>
      ${menuItem("sliders", "Settings", "", `data-action="decor" data-title="Settings"`)}
      ${menuItem(dark ? "sun" : "moon", dark ? "Light mode" : "Dark mode", "", `data-action="theme"`)}
      ${menuItem("bulb", "Get help", "", `data-action="decor" data-title="Help center"`)}
      <div class="menu-sep"></div>${menuItem("", "Log out", "", `data-action="decor" data-title="Log out"`)}</div>`;
  }
  function titleMenu() {
    return `<div class="menu">${menuItem("star", "Star", "", `data-action="decor" data-title="Starred"`)}${menuItem("pen", "Rename", "", `data-action="decor" data-title="Rename"`)}${menuItem("folder", "Add to project", "", `data-action="decor" data-title="Add to project"`)}<div class="menu-sep"></div>${menuItem("close", "Delete", "", `data-action="decor" data-title="Delete (disabled in demo)"`)}</div>`;
  }

  /* ----------------------------------------------------- composer behaviour */
  function autosize(ta) {
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
    const send = ta.form?.querySelector(".c-send:not(.is-stop)");
    if (send) send.classList.toggle("ready", Boolean(ta.value.trim()));
  }
  function autosizeAll() { document.querySelectorAll("[data-composer] textarea").forEach(autosize); }
  const activeTextarea = () => $("#stage [data-composer] textarea");

  function newConversation(firstText) {
    const id = `new-${Date.now().toString(36)}`;
    const title = String(firstText || "New chat").replace(/\s+/g, " ").slice(0, 48);
    data.conversations[id] = { title, model: currentModel().name, updated: "Just now", messages: [] };
    data.sidebar.recents.unshift(id);
    return id;
  }

  function ensureConversation(text) {
    const conv = PAGE_SCENES.has(state.scene) ? null : getConv(state.chatId);
    if (conv) return conv;
    const id = newConversation(text);
    state.scene = "chat";
    state.chatId = id;
    state.artifactId = null;
    state.taskState = null;
    return getConv(id);
  }

  async function submitComposer(text) {
    const value = String(text || "").trim();
    if (!value || state.streaming) return;
    state.prompt = "";
    addMessage("user", value);
    const reply = data.simulatedReply || {};
    await sleep(450);
    await streamReply(reply.text || "…", { thinking: state.thinking ? reply.thinking : undefined });
  }

  function scrollToBottom(smooth) {
    const s = $("#thread-scroll");
    if (s) s.scrollTo({ top: s.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function addMessage(role, text, extra = {}) {
    const conv = ensureConversation(text);
    conv.messages.push({ role: role === "assistant" ? "assistant" : "user", text: dedent(text), ...extra });
    render("bottom");
    scrollToBottom();
    return conv.messages.length - 1;
  }

  async function streamReply(markdown, opts = {}) {
    const conv = ensureConversation("New chat");
    const full = dedent(markdown);
    const msg = { role: "assistant", text: "", _streaming: true };
    if (opts.thinking) msg.thinking = opts.thinking;
    if (opts.artifact) msg.artifact = opts.artifact;
    conv.messages.push(msg);
    state.streaming = true;
    render("bottom");
    scrollToBottom();
    const speed = Number(opts.speed ?? 45);
    if (opts.thinking) {
      await sleep(Math.min(2200, speed * 25));
      msg.text = " ";
      renderStage("bottom");
    }
    const tokens = full.split(/(\s+)/);
    let acc = "";
    for (const tok of tokens) {
      acc += tok;
      if (!tok.trim()) continue;
      msg.text = acc;
      const target = $("#stage .msg-assistant.is-streaming [data-stream]");
      if (!target || !state.streaming) break;
      target.innerHTML = md(acc);
      const s = $("#thread-scroll");
      if (s) s.scrollTop = s.scrollHeight;
      await sleep(speed);
    }
    msg.text = full;
    delete msg._streaming;
    state.streaming = false;
    render("bottom");
    scrollToBottom();
    return conv.messages.length - 1;
  }

  async function typePrompt(text, opts = {}) {
    let ta = activeTextarea();
    if (!ta) { setScene("home"); ta = activeTextarea(); }
    if (!ta) return;
    const speed = Number(opts.speed ?? 38);
    ta.focus();
    ta.value = "";
    autosize(ta);
    for (const ch of String(text)) {
      ta.value += ch;
      state.prompt = ta.value;
      autosize(ta);
      const jitter = opts.jitter === false ? 1 : 0.6 + Math.random() * 0.8;
      await sleep(speed * (ch === " " ? 0.7 : 1) * jitter);
    }
    if (opts.submit) await submitComposer(ta.value);
  }

  /* ------------------------------------------------------------------ search */
  function openSearch(force) {
    const open = typeof force === "boolean" ? force : els.search.hidden;
    els.search.hidden = !open;
    if (open) {
      els.searchInput.placeholder = ui("searchPlaceholder", "Search chats and projects…");
      els.searchInput.value = "";
      renderSearchResults("");
      setTimeout(() => els.searchInput.focus(), 0);
    }
  }
  function renderSearchResults(q) {
    const query = q.trim().toLowerCase();
    const items = [
      ...Object.entries(data.conversations).map(([id, c]) => ({ id, title: c.title, meta: c.updated ? `${ui("lastMessage", "Last message")} ${c.updated.charAt(0).toLowerCase() + c.updated.slice(1)}` : "Chat", type: "chat" })),
      ...data.projects.map((p) => ({ id: p.id, title: p.name, meta: "Project", type: "project" }))
    ].filter((x) => !query || x.title.toLowerCase().includes(query));
    els.searchResults.innerHTML = items.map((x) => `<button class="search-result" ${x.type === "chat" ? `data-chat="${esc(x.id)}"` : `data-scene="project"`}>${icon(x.type === "chat" ? "chats" : "folder")}<span><strong>${esc(x.title)}</strong><small>${esc(x.meta)}</small></span></button>`).join("") || `<p class="search-empty">No demo results found.</p>`;
  }

  /* ------------------------------------------------------------------ studio */
  function syncStudioOptions() {
    const sceneSel = $("#studio-scene"), chatSel = $("#studio-chat"), modelSel = $("#studio-model");
    sceneSel.innerHTML = SCENES.map((s) => `<option value="${s}">${esc(SCENE_LABELS[s] || s)}</option>`).join("");
    chatSel.innerHTML = `<option value="">— scene default —</option>` + Object.entries(data.conversations).map(([id, c]) => `<option value="${esc(id)}">${esc(c.title)} (${esc(id)})</option>`).join("");
    modelSel.innerHTML = data.models.map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join("");
  }
  function syncStudio() {
    $("#studio-scene").value = state.scene;
    $("#studio-chat").value = state.chatId && state.chatId !== (data.scenes[state.scene] || {}).chat ? state.chatId : "";
    $("#studio-name").value = userName();
    $("#studio-prompt").value = state.prompt;
    $("#studio-model").value = currentModel().name;
    $("#studio-permission").value = state.permission;
    $("#studio-theme").value = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }
  function openStudio(force) {
    state.studioOpen = typeof force === "boolean" ? force : !state.studioOpen;
    els.studio.classList.toggle("open", state.studioOpen);
    els.studio.setAttribute("aria-hidden", String(!state.studioOpen));
    els.backdrop.hidden = !state.studioOpen;
    if (state.studioOpen) syncStudio();
  }
  function applyStudio() {
    state.userName = $("#studio-name").value.trim();
    state.modelOverride = $("#studio-model").value;
    state.permission = $("#studio-permission").value;
    setTheme($("#studio-theme").value);
    const chat = $("#studio-chat").value;
    const prompt = $("#studio-prompt").value;
    if (chat) openChat(chat); else setScene($("#studio-scene").value);
    state.prompt = prompt;
    render();
    toast("Tutorial scene updated");
  }
  function copyLink() {
    const u = new URL(location.href);
    ["scene", "chat", "name", "prompt", "model", "permission", "theme"].forEach((k) => u.searchParams.delete(k));
    const chat = $("#studio-chat").value;
    if (chat) u.searchParams.set("chat", chat); else u.searchParams.set("scene", $("#studio-scene").value);
    const name = $("#studio-name").value.trim();
    if (name && name !== data.user.name) u.searchParams.set("name", name);
    const prompt = $("#studio-prompt").value.trim();
    if (prompt) u.searchParams.set("prompt", prompt);
    u.searchParams.set("model", $("#studio-model").value);
    u.searchParams.set("permission", $("#studio-permission").value.toLowerCase());
    u.searchParams.set("theme", $("#studio-theme").value);
    navigator.clipboard?.writeText(u.toString()).then(() => toast("Scene link copied")).catch(() => toast("Copy the URL from the address bar"));
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  }

  function resetAll() {
    state.userName = "";
    state.prompt = "";
    state.modelOverride = "";
    state.permission = "Manual";
    state.thinking = false;
    state.sidebarCollapsed = false;
    if (window.MockKit) { window.MockKit.reset(); } else { data = normalize(JSON.parse(JSON.stringify(window.CLAUDE_MOCK_DATA))); }
    setScene("home");
    toast("Fake data reset");
  }

  /* ------------------------------------------------------------------ events */
  function copyText(text, message) {
    navigator.clipboard?.writeText(text).catch(() => {});
    toast(message);
  }

  document.addEventListener("click", (event) => {
    const t = event.target;
    const b = t.closest("button, [data-action]");
    if (!t.closest("#popover") && !b?.dataset.action?.match(/^(model|plus|tools|account|title-menu|version)$/)) closePopover();
    if (!b) return;
    const d = b.dataset;

    if ((d.chat || d.scene) && b.closest("#search-overlay")) els.search.hidden = true;
    if (d.chat) { openChat(d.chat); return; }
    if (d.scene) { if (d.scene === "code") openChat((data.scenes.code || {}).chat) || setScene("code"); else setScene(d.scene); return; }
    if (d.artifact) { state.artifactId = state.artifactId === d.artifact ? null : d.artifact; state.artifactTab = "preview"; renderPanel(); renderStage("keep"); return; }
    if (d.artifactOpen) {
      const owner = Object.entries(data.conversations).find(([, c]) => c.messages.some((m) => m.artifact === d.artifactOpen));
      if (owner) { openChat(owner[0], { artifact: d.artifactOpen }); } else toast("Artifact preview ready to stage");
      return;
    }
    if (d.tab) { state.artifactTab = d.tab; renderPanel(); return; }
    if (d.chip !== undefined) { state.prompt = activeTextarea()?.value || state.prompt; state.chipOpen = state.chipOpen === Number(d.chip) ? -1 : Number(d.chip); renderHome(); autosizeAll(); return; }
    if (d.suggestion) { state.prompt = d.suggestion; state.chipOpen = -1; renderHome(); autosizeAll(); activeTextarea()?.focus(); return; }
    if (d.model !== undefined) { state.modelOverride = data.models[Number(d.model)].name; closePopover(); render("keep"); toast(`${state.modelOverride} selected`); return; }
    if (d.plus !== undefined) { const p = data.plusMenu[Number(d.plus)]; closePopover(); toast(`${p.label} — ready to stage`); return; }
    if (d.tool !== undefined) { const tool = data.toolsMenu[Number(d.tool)]; if (tool.toggle) { tool.on = !tool.on; b.querySelector(".switch")?.classList.toggle("on", tool.on); } else toast(`${tool.label} — ready to stage`); return; }
    if (d.connector !== undefined) { const c = data.connectors[Number(d.connector)]; c.on = !c.on; b.querySelector(".switch")?.classList.toggle("on", c.on); return; }
    if (d.schedule !== undefined) { const s = data.schedules[Number(d.schedule)]; s.status = s.status === "Paused" ? "Active" : "Paused"; renderScheduled(); toast(`${s.title}: ${s.status}`); return; }

    switch (d.action) {
      case "home": setScene("home"); break;
      case "new": state.prompt = ""; if (state.scene === "code" || getConv(state.chatId)?.mode === "code") toast("New Claude Code session ready to stage"); else setScene("home"); break;
      case "toggle-sidebar":
        if (innerWidth <= 760) { state.mobileSidebar = false; } else { state.sidebarCollapsed = !state.sidebarCollapsed; }
        els.app.classList.toggle("sb-collapsed", state.sidebarCollapsed); els.app.classList.toggle("sb-open", state.mobileSidebar); break;
      case "open-sidebar": state.mobileSidebar = true; els.app.classList.add("sb-open"); break;
      case "close-sidebar": state.mobileSidebar = false; els.app.classList.remove("sb-open"); break;
      case "account": openPopover(b, accountMenu(), { key: "account" }); break;
      case "title-menu": openPopover(b, titleMenu(), { key: "title-menu" }); break;
      case "model": openPopover(b, modelMenu(), { align: "right", key: "model" }); break;
      case "plus": openPopover(b, plusMenu(), { key: "plus" }); break;
      case "tools": openPopover(b, toolsMenu(), { key: "tools" }); break;
      case "thinking": state.thinking = !state.thinking; b.classList.toggle("on", state.thinking); b.setAttribute("aria-pressed", String(state.thinking)); toast(`Extended thinking ${state.thinking ? "on" : "off"}`); break;
      case "permission": state.permission = state.permission === "Manual" ? "Auto" : "Manual"; render("keep"); toast(`${(data.code.permissionModes || {})[state.permission] || state.permission}`); break;
      case "theme": setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); closePopover(); break;
      case "stop": state.streaming = false; if (state.taskState === "running") { state.taskState = "complete"; render("keep"); } toast("Stopped"); break;
      case "close-chip": state.chipOpen = -1; renderHome(); autosizeAll(); break;
      case "copy-code": copyText(b.closest(".code-block")?.querySelector("code")?.textContent || "", "Copied code"); break;
      case "copy-response": copyText(b.closest(".msg-assistant")?.querySelector(".md")?.textContent || "", "Copied to clipboard"); break;
      case "thumb-up": state.feedback = { up: !state.feedback.up }; renderStage("keep"); toast("Thanks for the feedback"); break;
      case "thumb-down": state.feedback = { down: !state.feedback.down }; renderStage("keep"); toast("Feedback noted"); break;
      case "retry": {
        const conv = getConv(state.chatId);
        const last = conv?.messages[conv.messages.length - 1];
        if (last?.role === "assistant" && !state.streaming) { conv.messages.pop(); streamReply(last.text || "", { thinking: last.thinking, artifact: last.artifact }); }
        break;
      }
      case "allow": state.permissionGranted = true; renderStage("bottom"); scrollToBottom(true); break;
      case "deny": toast("Claude will wait for your instructions"); break;
      case "share": toast("Share dialog ready to stage"); break;
      case "close-panel": state.artifactId = null; renderPanel(); renderStage("keep"); break;
      case "copy-artifact": toast("Artifact copied"); break;
      case "download-artifact": toast("Artifact download ready to stage"); break;
      case "publish": toast("Publish dialog ready to stage"); break;
      case "version": {
        const a = getArtifact(state.artifactId);
        const n = Math.max(1, Number(a?.versions) || 1);
        openPopover(b, `<div class="menu">${Array.from({ length: n }, (_, i) => n - i).map((v) => `<button class="menu-item" data-version="${v}"><span class="mi-label">Version ${v}</span>${(state.artifactVersion || n) === v ? icon("check", "mi-check") : ""}</button>`).join("")}</div>`, { align: "right", key: "version" });
        break;
      }
      case "search": openSearch(true); break;
      case "close-search": openSearch(false); break;
      case "decor": toast(`${d.title || "This item"} — ready to stage`); break;
      case "close-studio": openStudio(false); break;
      case "apply-studio": applyStudio(); break;
      case "copy-link": copyLink(); break;
      case "edit-data": if (window.MockKit?.openEditor) { openStudio(false); window.MockKit.openEditor(); } else toast("MockKit not loaded"); break;
      case "reset": resetAll(); syncStudio(); break;
      default: break;
    }
  });

  els.popover.addEventListener("click", (e) => {
    const v = e.target.closest("[data-version]");
    if (v) { state.artifactVersion = Number(v.dataset.version); closePopover(); renderPanel(); toast(`Showing version ${v.dataset.version}`); }
  });

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    const ta = e.target.querySelector("textarea");
    if (ta) submitComposer(ta.value);
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.matches("[data-composer] textarea")) { autosize(t); state.prompt = t.value; }
    if (t.matches("[data-filter]")) {
      const q = t.value.trim().toLowerCase();
      document.querySelectorAll(`#${t.dataset.filter} .list-row`).forEach((row) => { row.hidden = q && !row.textContent.toLowerCase().includes(q); });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.matches?.("[data-composer] textarea") && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submitComposer(e.target.value); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "d" || e.key === "D" || e.code === "KeyD")) { e.preventDefault(); openStudio(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
    if (e.key === "Escape") { closePopover(); openSearch(false); openStudio(false); }
  });

  els.searchInput.addEventListener("input", (e) => renderSearchResults(e.target.value));
  els.search.addEventListener("click", (e) => { if (e.target === els.search) openSearch(false); });
  $("#open-studio").addEventListener("click", () => openStudio());
  els.backdrop.addEventListener("click", () => openStudio(false));
  window.addEventListener("resize", closePopover);

  /* ------------------------------------------------------------- WebMCP */
  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = [
      { name: "read_claude_demo_state", title: "Read Claude demo state", description: "Read the current Claude training scene and its editable fake values.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => window.TrainingMock.getState() },
      { name: "stage_claude_demo_scene", title: "Stage Claude demo scene", description: "Display a deterministic Claude tutorial scene or conversation using fake data.", inputSchema: { type: "object", properties: { scene: { type: "string", enum: SCENES }, chat: { type: "string" }, name: { type: "string" }, prompt: { type: "string" }, model: { type: "string" }, permission: { type: "string", enum: ["Manual", "Auto"] } }, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input = {}) => { if (input.name) state.userName = String(input.name); if (input.model) state.modelOverride = String(input.model); if (input.permission) state.permission = input.permission; if (input.chat) openChat(input.chat); else setScene(input.scene || "home"); if (typeof input.prompt === "string") window.TrainingMock.setPrompt(input.prompt); return { scene: state.scene, chat: state.chatId, status: "staged" }; } },
      { name: "stream_claude_demo_reply", title: "Stream Claude demo reply", description: "Append a user message and stream a fake Claude reply in the current conversation.", inputSchema: { type: "object", properties: { prompt: { type: "string", minLength: 1 }, reply: { type: "string", minLength: 1 } }, required: ["prompt", "reply"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input) => { addMessage("user", input.prompt); await streamReply(input.reply, { speed: 20 }); return { chat: state.chatId, status: "streamed" }; } }
    ];
    tools.forEach((tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) { /* unsupported host */ } });
  }

  /* ---------------------------------------------------- TrainingMock API */
  window.TrainingMock = {
    /** Current scene, conversation and staging values. */
    getState: () => ({ scene: state.scene, chat: state.chatId, artifact: state.artifactId, name: userName(), prompt: state.prompt, model: currentModel().name, permission: state.permission, theme: document.documentElement.dataset.theme || "light", scenes: SCENES.slice(), conversations: Object.keys(data.conversations) }),
    /** Show a scene by key, e.g. setScene("artifact"). */
    setScene: (scene, opts) => setScene(scene, opts),
    /** Open any conversation id from demo data. opts: { artifact, running }. */
    openChat: (id, opts) => openChat(id, opts),
    /** Change the display name (initials follow). */
    setUser: (name) => { state.userName = String(name || ""); render("keep"); },
    /** Pre-fill the composer on the current scene. */
    setPrompt: (text) => { state.prompt = String(text || ""); const ta = activeTextarea(); if (ta) { ta.value = state.prompt; autosize(ta); } },
    /** Select a model by full or short name. */
    setModel: (name) => { state.modelOverride = String(name || ""); render("keep"); },
    /** "Manual" or "Auto" (Claude Code permission mode). */
    setPermission: (mode) => { state.permission = String(mode).toLowerCase() === "auto" ? "Auto" : "Manual"; render("keep"); },
    /** "light" or "dark". */
    setTheme: (theme) => setTheme(theme),
    /** Open the side panel for an artifact id. */
    openArtifact: (id) => { state.artifactId = id; state.artifactTab = "preview"; renderPanel(); },
    /** Append a message to the current conversation (starts a new one on pages). */
    addMessage: (role, text, extra) => addMessage(role, text, extra),
    /** Animate typing into the composer. opts: { speed (ms/char), submit, jitter }. */
    typePrompt: (text, opts) => typePrompt(text, opts),
    /** Stream an assistant reply word by word. opts: { speed (ms/word), thinking, artifact }. */
    streamReply: (markdown, opts) => streamReply(markdown, opts),
    /** Type a prompt, send it, then stream a reply (defaults to data.simulatedReply). */
    demo: async (prompt, reply, opts = {}) => { await typePrompt(prompt, opts); state.prompt = ""; addMessage("user", prompt); await sleep(400); return streamReply(reply || data.simulatedReply?.text || "", opts); },
    openStudio: () => openStudio(true),
    openEditor: () => window.MockKit?.openEditor(),
    reset: () => resetAll(),
    /** Render markdown to HTML with the built-in renderer. */
    markdown: (text) => md(text)
  };

  /* ------------------------------------------------------------------ boot */
  function boot() {
    syncStudioOptions();
    const chat = params.get("chat");
    const scene = params.get("scene");
    if (chat && getConv(chat)) openChat(chat, { artifact: params.get("artifact") || null, running: scene === "task-running" });
    else setScene(SCENES.includes(scene) ? scene : "home", { prompt: state.prompt });
    const art = params.get("artifact");
    if (art && getArtifact(art) && !chat) { state.artifactId = art; renderPanel(); }
    openStudio(state.studioOpen);
    registerWebMcpTools();
  }

  const defaults = window.CLAUDE_MOCK_DATA || {};
  const onChange = (next) => {
    data = normalize(next);
    syncStudioOptions();
    render("keep");
  };
  if (window.MockKit?.init) {
    window.MockKit.init({ product: "claude", defaults, onChange })
      .then((d) => { data = normalize(d); boot(); })
      .catch((err) => { console.error("[claude mock] MockKit init failed", err); data = normalize(JSON.parse(JSON.stringify(defaults))); boot(); });
  } else {
    data = normalize(JSON.parse(JSON.stringify(defaults)));
    boot();
  }
})();
