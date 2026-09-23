/*
 * ChatGPT desktop training mock: renderer.
 * All visible content comes from window.CHATGPT_MOCK_DATA (demo-data.js) through MockKit.
 * This file only holds layout, behaviour, and a tiny markdown renderer.
 */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);

  /* ---------- Scenes ---------- */
  const SCENES = {
    "chat-home": "Chat home",
    "chat-response": "Chat response (launch plan)",
    "chat": "Long multi-turn conversation",
    "chat-code": "Code answer",
    "chat-search": "Web search with sources",
    "chat-image": "Image generation",
    "work-home": "Work home",
    "work-running": "Work task in progress",
    "work-complete": "Completed Work task",
    "codex-home": "Codex home",
    "codex-task": "Codex task with diff",
    "search": "Search chats",
    "project": "Project workspace",
    "library": "Library",
    "gpts": "GPTs",
    "sora": "Sora",
    "plugins": "Plugin directory",
    "scheduled": "Scheduled tasks",
    "sites": "Sites gallery"
  };
  const sceneKeys = Object.keys(SCENES);
  const THREAD_SCENES = ["chat-response", "chat", "chat-code", "chat-search", "chat-image"];
  const PAGE_SCENES = ["library", "gpts", "sora", "plugins", "scheduled", "sites"];

  let data = {};
  const state = {
    scene: "chat-home",
    product: "chatgpt",
    experience: "chat",
    userName: "",
    prompt: params.get("prompt") || "",
    model: "",
    chatId: null,       // conversation id when a thread is open ("__live" for an ad-hoc chat)
    limit: null,        // show only the first N messages of the conversation (used while replaying)
    extra: [],          // messages added at runtime (addMessage / streamReply / typed prompts)
    live: null,         // ad-hoc conversation { title, model, messages }
    codexTask: null,
    projectIndex: 0,
    sidebarCollapsed: false,
    mobileNav: false,
    studioOpen: params.get("studio") === "1",
    streaming: false,
    gen: 0              // bumped to cancel an in-flight stream (scene change, stop button)
  };

  /* ---------- DOM helpers ---------- */
  const $ = (s, root = document) => root.querySelector(s);
  const workspace = $("#workspace");
  const shell = $(".desktop-shell");
  const toastNode = $("#toast");
  const icon = (name, cls = "") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const clone = (v) => JSON.parse(JSON.stringify(v ?? null));
  const arr = (v) => (Array.isArray(v) ? v : []);
  const ui = (key, fallback = "") => (data.ui && data.ui[key] != null ? data.ui[key] : fallback);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const initials = () => (data.user?.initials && state.userName === data.user.name ? data.user.initials : state.userName.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "U");
  function toast(message) { toastNode.textContent = message; toastNode.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => toastNode.classList.remove("show"), 1800); }
  function hashColor(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${h % 360} 55% 45%)`; }

  /* ======================================================================
   * Markdown renderer (headings, emphasis, code, lists, tables, quotes, links, citation pills)
   * ====================================================================== */
  const KEYWORDS = new Set("import from export default def class return if elif else for while in not and or is None True False try except finally with as pass break continue lambda yield raise global async await const let var function new this typeof instanceof null undefined true false switch case do throw catch extends static public private interface type enum echo fi then".split(" "));
  const HASH_COMMENT = /^(py|python|bash|sh|shell|zsh|yaml|yml|ruby|rb|toml|r|powershell|ps1)$/i;
  function highlight(code, lang) {
    const comment = HASH_COMMENT.test(lang || "") ? "#[^\\n]*" : "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
    const re = new RegExp(`(${comment})|("""[\\s\\S]*?"""|"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'|\`(?:\\\\.|[^\`\\\\])*\`)|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Za-z_]\\w*)\\b`, "g");
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const [tok, c, s, n, w] = m;
      if (c) out += `<span class="hl-comment">${esc(tok)}</span>`;
      else if (s) out += `<span class="hl-string">${esc(tok)}</span>`;
      else if (n) out += `<span class="hl-number">${esc(tok)}</span>`;
      else if (w && KEYWORDS.has(w)) out += `<span class="hl-keyword">${esc(tok)}</span>`;
      else if (w && /^\s*\(/.test(code.slice(re.lastIndex))) out += `<span class="hl-title">${esc(tok)}</span>`;
      else out += esc(tok);
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }
  function codeBlock(code, lang) {
    return `<div class="code-block"><div class="code-head"><span>${esc(lang || "text")}</span><button class="code-copy" data-action="copy-code">${icon("copy")}<span>${esc(ui("copyCode", "Copy code"))}</span></button></div><pre><code>${highlight(code, lang)}</code></pre></div>`;
  }
  function inline(src) {
    const codes = [];
    let s = String(src).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = esc(s);
    s = s.replace(/\{\{([^}]+)\}\}/g, (_, n) => `<span class="cite">${n.trim()}</span>`);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${/^(https?:|mailto:|#|\/)/i.test(u) ? u : "#"}" target="_blank" rel="noopener">${t}</a>`);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/__(.+?)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>").replace(/(^|[^\w])_(?!\s)(.+?)_(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
    return s.replace(/\u0000(\d+)\u0000/g, (_, n) => `<code>${esc(codes[n])}</code>`);
  }
  const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  function list(buf) {
    const items = [];
    for (const l of buf) {
      const m = l.match(LIST_RE);
      if (m) items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), num: parseInt(m[2], 10) || 1, text: m[3] });
      else if (items.length) items[items.length - 1].text += " " + l.trim();
    }
    let pos = 0;
    const build = (level) => {
      const { ordered, num } = items[pos];
      let html = ordered ? `<ol${num > 1 ? ` start="${num}"` : ""}>` : "<ul>";
      while (pos < items.length && items[pos].indent >= level) {
        if (items[pos].indent > level) { html = html.replace(/<\/li>$/, "") + build(items[pos].indent) + "</li>"; continue; }
        html += `<li>${inline(items[pos].text)}</li>`; pos++;
      }
      return html + (ordered ? "</ol>" : "</ul>");
    };
    let out = "";
    while (pos < items.length) out += build(items[pos].indent);
    return out;
  }
  const splitRow = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isTableStart = (l, next) => l.includes("|") && next != null && /^\s*\|?\s*:?-{2,}/.test(next);
  const isBlockStart = (l, next) => /^\s*```/.test(l) || /^#{1,6}\s/.test(l) || /^\s*>/.test(l) || LIST_RE.test(l) || /^\s*(---|\*\*\*|___)\s*$/.test(l) || isTableStart(l, next);
  function md(src) {
    const lines = String(src || "").replace(/\r/g, "").split("\n");
    let i = 0, out = "", m;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if ((m = line.match(/^\s*```\s*([\w+#.-]*)\s*$/))) {
        const buf = []; i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) buf.push(lines[i++]);
        i++; out += codeBlock(buf.join("\n"), m[1]); continue;
      }
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { const n = m[1].length; out += `<h${n}>${inline(m[2])}</h${n}>`; i++; continue; }
      if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { out += "<hr>"; i++; continue; }
      if (/^\s*>/.test(line)) {
        const buf = []; while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
        out += `<blockquote>${md(buf.join("\n"))}</blockquote>`; continue;
      }
      if (isTableStart(line, lines[i + 1])) {
        const head = splitRow(line); i += 2; const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
        out += `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, k) => `<td>${inline(r[k] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        continue;
      }
      if (LIST_RE.test(line)) {
        const buf = []; while (i < lines.length && (LIST_RE.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) buf.push(lines[i++]);
        out += list(buf); continue;
      }
      const buf = []; while (i < lines.length && lines[i].trim() && (!buf.length || !isBlockStart(lines[i], lines[i + 1]))) buf.push(lines[i++]);
      out += `<p>${buf.map(inline).join("<br>")}</p>`;
    }
    return out;
  }

  /* ======================================================================
   * Data access
   * ====================================================================== */
  const conversations = () => data.conversations || {};
  function getConv(id) { return id === "__live" ? state.live : conversations()[id] || null; }
  function convTitle(ref) {
    if (ref && typeof ref === "object") return ref.title || (ref.chat && conversations()[ref.chat]?.title) || "";
    return conversations()[ref]?.title || String(ref ?? "");
  }
  const refId = (ref) => (typeof ref === "string" ? (conversations()[ref] ? ref : null) : ref?.chat || null);
  function currentMessages() {
    const conv = getConv(state.chatId);
    let msgs = conv ? clone(arr(conv.messages)) : [];
    if (state.limit != null) msgs = msgs.slice(0, state.limit);
    if (state.scene === "chat-response" && state.prompt && state.chatId === data.sceneChats?.["chat-response"]) {
      const first = msgs.find((m) => m.role === "user"); if (first) first.text = state.prompt;
    }
    return msgs.concat(state.extra);
  }
  const modelNames = () => arr(data.models).map((m) => (typeof m === "string" ? m : m.name));

  /* ======================================================================
   * Sidebar + header
   * ====================================================================== */
  function navRow(item, activeKey) {
    const active = item.action === activeKey ? " active" : "";
    return `<button class="nav-row${active}" data-action="${esc(item.action)}" title="${esc(item.label)}">${icon(item.icon || "chat")}<span class="label">${esc(item.label)}</span>${item.shortcut ? `<kbd>${esc(item.shortcut)}</kbd>` : ""}</button>`;
  }
  function activeNavKey() {
    const s = state.scene;
    if (s.startsWith("codex")) return "codex";
    if (s.startsWith("work")) return "work";
    if (PAGE_SCENES.includes(s)) return s;
    if (s === "chat-home") return "new";
    return "";
  }
  function renderSidebar() {
    const sb = data.sidebar || {};
    const key = activeNavKey();
    $("#nav-primary").innerHTML = arr(sb.primary).map((x) => navRow(x, key)).join("");
    $("#nav-apps").innerHTML = arr(sb.apps).concat(arr(sb.more)).map((x) => navRow(x, key)).join("");
    $("#projects-section").innerHTML = `<h3>${esc(sb.projectsLabel || "")}</h3>
      <button class="nav-row" data-action="new-project">${icon("folder-plus")}<span class="label">${esc(ui("newProjectLabel", "New project"))}</span></button>
      ${arr(data.projects).map((p, i) => `<button class="nav-row${state.scene === "project" && state.projectIndex === i ? " active" : ""}" data-open-project="${i}"><svg aria-hidden="true" style="color:${esc(p.color || "currentColor")}"><use href="#i-folder"></use></svg><span class="label">${esc(p.title)}</span></button>`).join("")}`;
    $("#chats-section").innerHTML = `<h3>${esc(sb.chatsLabel || "")}</h3>` + arr(sb.chats).map((ref, i) => {
      const id = refId(ref);
      const active = id && id === state.chatId && THREAD_SCENES.includes(state.scene) ? " active" : "";
      return `<button class="history-row${active}" data-open-chat="${esc(id || "")}" data-history="${i}"><span>${esc(convTitle(ref))}</span>${icon("more", "row-more")}</button>`;
    }).join("");
    $("#account-avatar").textContent = initials();
    $("#account-avatar").style.background = data.user?.avatarColor || "#7d5b45";
    $("#account-name").textContent = state.userName;
    $("#account-plan").textContent = data.user?.plan || "";
    shell.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    shell.classList.toggle("mobile-nav-open", state.mobileNav);
  }

  function renderHeader() {
    const isCodex = state.product === "codex";
    const label = isCodex ? data.codex?.title || "Codex" : state.model;
    const appName = data.app?.name || "ChatGPT";
    $("#model-label").innerHTML = !isCodex && label.startsWith(appName + " ") ? `${esc(appName)} <span class="model-version">${esc(label.slice(appName.length + 1))}</span>` : esc(label);
    $(".model-picker").classList.toggle("static", isCodex);
    const toggle = arr(ui("chatToggle", []));
    const showToggle = toggle.length === 2 && (state.scene === "chat-home" || state.scene.startsWith("work"));
    $("#mode-toggle").innerHTML = showToggle ? toggle.map((t, i) => `<button role="tab" data-experience="${i ? "work" : "chat"}" class="${(i ? "work" : "chat") === state.experience ? "active" : ""}">${esc(t)}</button>`).join("") : "";
    $("#mode-toggle").hidden = !showToggle;
    const badge = $(".training-badge"); badge.textContent = data.app?.badge || ""; badge.hidden = !data.app?.badge;
    const inThread = THREAD_SCENES.includes(state.scene) || state.scene === "work-running" || state.scene === "work-complete";
    let actions = "";
    if (inThread) actions = `<button class="pill-button" data-action="share">${icon("share")}<span>${esc(ui("share", "Share"))}</span></button><button class="icon-button" data-action="more" aria-label="More">${icon("more")}</button>`;
    else if (state.scene === "chat-home") actions = `<button class="icon-button" data-action="temporary" aria-label="${esc(ui("temporaryChat", "Temporary chat"))}" title="${esc(ui("temporaryChat", "Temporary chat"))}">${icon("temp")}</button>`;
    $("#topbar-actions").innerHTML = actions;
  }

  /* ======================================================================
   * Composer
   * ====================================================================== */
  function composer({ id = "prompt-form", value = "", placeholder = ui("placeholder", "Ask anything"), extraClass = "" } = {}) {
    return `<form class="composer${extraClass ? " " + extraClass : ""}${value ? " has-text" : ""}" id="${id}">
      <button type="button" class="composer-btn composer-plus" data-action="attach" aria-label="Add photos and files">${icon("plus")}</button>
      <textarea rows="1" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">${esc(value)}</textarea>
      <div class="composer-trail">
        <button type="button" class="composer-btn" data-action="dictate" aria-label="Dictate">${icon("mic")}</button>
        <button type="submit" class="send-btn" aria-label="Send">${icon("voice", "ic-voice")}${icon("arrow-up", "ic-send")}${icon("stop", "ic-stop")}</button>
      </div>
    </form>`;
  }
  function syncComposer(form) {
    if (!form) return;
    const ta = form.querySelector("textarea"); if (!ta) return;
    const has = ta.value.trim().length > 0;
    form.classList.toggle("has-text", has);
    if (!ta.value) form.classList.remove("expanded");
    ta.style.height = "auto";
    const line = parseFloat(getComputedStyle(ta).lineHeight) || 24;
    if (!form.classList.contains("expanded") && (ta.scrollHeight > line * 1.6 || ta.value.includes("\n"))) { form.classList.add("expanded"); ta.style.height = "auto"; }
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  }
  function syncAllComposers() { document.querySelectorAll("form.composer").forEach(syncComposer); document.querySelectorAll("form.composer").forEach((f) => f.classList.toggle("streaming", state.streaming)); }

  /* ======================================================================
   * Chat scenes
   * ====================================================================== */
  function renderChatHome() {
    workspace.className = "workspace home-view";
    const chips = arr(data.suggestions);
    workspace.innerHTML = `<div class="home-center">
      <h1 class="home-heading">${esc(ui("homeHeading", ""))}</h1>
      ${composer({ value: state.prompt, extraClass: "home-composer" })}
      ${chips.length ? `<div class="chip-row">${chips.map((s) => `<button class="chip" data-suggestion="${esc(s.prompt || s.label)}">${icon(s.icon || "spark")}<span>${esc(s.label)}</span></button>`).join("")}</div>` : ""}
    </div>`;
  }

  const KIND_TONE = { pdf: ["#fa423e", "PDF"], doc: ["#0285ff", "Document"], sheet: ["#04b84c", "Spreadsheet"], slides: ["#fb6a22", "Presentation"], image: ["#924ff7", "Image"], code: ["#5d5d5d", "Code"], file: ["#5d5d5d", "File"] };
  function fileCard(a) {
    const [color, label] = KIND_TONE[a.kind] || KIND_TONE.file;
    const ic = a.kind === "sheet" ? "chart" : a.kind === "slides" ? "slides" : a.kind === "image" ? "image" : a.kind === "code" ? "code" : "document";
    return `<div class="file-card"><span class="file-glyph" style="background:${color}">${icon(ic)}</span><span><strong>${esc(a.name)}</strong><small>${esc(a.label || label)}</small></span></div>`;
  }
  function imageArt(img) {
    const p = arr(img.palette).length >= 3 ? img.palette : ["#9ec5ff", "#6b8cff", "#2b2d6e"];
    return `<figure class="gen-image"><div class="gen-art" style="--c1:${esc(p[0])};--c2:${esc(p[1])};--c3:${esc(p[2])}"><span class="sun"></span><span class="hill h1"></span><span class="hill h2"></span></div>${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}</figure>`;
  }
  function favicon(domain, i = 0) { const d = String(domain || "?"); return `<span class="fav" style="background:${hashColor(d)};z-index:${10 - i}">${esc(d.replace(/^www\./, "")[0].toUpperCase())}</span>`; }
  function messageHtml(m, idx, { last = false, grouped = false } = {}) {
    if (m.role === "user") {
      return `<div class="msg user" data-msg="${idx}">
        ${arr(m.attachments).length ? `<div class="attach-row">${m.attachments.map(fileCard).join("")}</div>` : ""}
        ${m.text ? `<div class="bubble">${esc(m.text).replace(/\n/g, "<br>")}</div>` : ""}
        <div class="msg-actions user-actions"><button data-action="copy-msg" aria-label="Copy">${icon("copy")}</button><button data-action="edit-msg" aria-label="Edit message">${icon("edit")}</button></div>
      </div>`;
    }
    const pending = m._pending;
    const reasoning = m.reasoning ? `<div class="thought${m._open ? " open" : ""}"><button class="thought-toggle${pending === "thinking" ? " shimmer" : ""}" data-action="toggle-thought">${esc(pending === "thinking" ? ui("thinkingLabel", "Thinking") : m.reasoning.label || "")}${icon("chevron-right")}</button><div class="thought-body">${md(m.reasoning.text)}</div></div>` : "";
    const search = m.search ? `<div class="search-status${pending === "thinking" ? " shimmer" : ""}">${icon("globe")}<span>${esc(m.search)}</span></div>` : "";
    const image = m.image ? (pending === "image" ? `<div class="gen-image loading"><div class="gen-art placeholder"></div><span class="shimmer">${esc(ui("creatingImageLabel", "Creating image"))}</span></div>` : imageArt(m.image)) : "";
    const body = pending === "thinking" && !m.reasoning && !m.search ? `<div class="markdown"><span class="stream-dot solo"></span></div>` : m.text ? `<div class="markdown">${md(m.text)}</div>` : "";
    const sources = arr(m.sources).length && !pending && !grouped ? `<button class="sources-pill" data-action="sources"><span class="favs">${m.sources.slice(0, 3).map((s, i) => favicon(s.domain, i)).join("")}</span><span>${esc(ui("sourcesLabel", "Sources"))}</span></button>` : "";
    const actions = pending || grouped ? "" : `<div class="msg-actions${last ? " visible" : ""}"><button data-action="copy-msg" aria-label="Copy">${icon("copy")}</button><button data-action="good" aria-label="Good response">${icon("thumb-up")}</button><button data-action="bad" aria-label="Bad response">${icon("thumb-down")}</button><button data-action="read-aloud" aria-label="Read aloud">${icon("speaker")}</button><button data-action="share" aria-label="Share">${icon("share")}</button><button data-action="regenerate" aria-label="Try again">${icon("refresh")}</button></div>`;
    return `<div class="msg assistant${pending ? " pending" : ""}${grouped ? " grouped" : ""}" data-msg="${idx}">${reasoning}${search}${image}${body}${sources}${actions}</div>`;
  }
  function renderThread() {
    const msgs = currentMessages();
    const lastAssistant = msgs.map((m) => m.role).lastIndexOf("assistant");
    // Consecutive assistant messages form one turn: only the final one carries the action row.
    const html = msgs.map((m, i) => messageHtml(m, i, { last: i === lastAssistant, grouped: m.role === "assistant" && msgs[i + 1]?.role === "assistant" })).join("");
    workspace.className = "workspace thread-view";
    workspace.innerHTML = `<div class="thread">${html}</div>
      <div class="thread-footer"><div class="thread-footer-inner">${composer({ id: "followup-form" })}<p class="disclaimer">${esc(data.app?.disclaimer || "")}</p></div></div>`;
    syncAllComposers();
  }
  // Like the real app: pin the latest user turn near the top (clamps to the bottom for short replies).
  function scrollToLastTurn() {
    const users = workspace.querySelectorAll(".thread > .msg.user");
    const last = users[users.length - 1];
    workspace.scrollTop = last && users.length > 1 ? last.offsetTop - 16 : 0;
  }
  function scrollThread(smooth) { workspace.scrollTo({ top: workspace.scrollHeight, behavior: smooth ? "smooth" : "auto" }); }

  /* ======================================================================
   * Work scenes
   * ====================================================================== */
  function renderWorkHome() {
    const w = data.work || {};
    workspace.className = "workspace home-view work-home";
    workspace.innerHTML = `<div class="home-center">
      <h1 class="home-heading">${esc(w.heading)}</h1>
      <form class="composer work-composer expanded${state.prompt ? " has-text" : ""}" id="work-form">
        <textarea rows="2" placeholder="${esc(w.placeholder)}" aria-label="${esc(w.placeholder)}">${esc(state.prompt)}</textarea>
        <div class="work-bar"><button type="button" class="composer-btn composer-plus" data-action="attach" aria-label="Add files">${icon("plus")}</button><span class="spacer"></span>
          ${w.reasoningLabel ? `<button type="button" class="reasoning-pill" data-action="reasoning">${icon("bulb")}${esc(w.reasoningLabel)}${icon("chevron")}</button>` : ""}
          <button type="button" class="composer-btn" data-action="dictate" aria-label="Dictate">${icon("mic")}</button>
          <button type="submit" class="send-btn" aria-label="Start">${icon("voice", "ic-voice")}${icon("arrow-up", "ic-send")}${icon("stop", "ic-stop")}</button></div>
      </form>
      ${arr(w.suggestions).length ? `<div class="chip-row">${w.suggestions.map((s) => `<button class="chip" data-work-suggestion="${esc(s.prompt || s.label)}">${icon(s.icon || "spark")}<span>${esc(s.label)}</span></button>`).join("")}</div>` : ""}
      ${arr(w.connections).length ? `<div class="work-connections"><span class="connections-label">${esc(w.connectionsLabel)}</span>${w.connections.map((c) => `<button class="connection-row" data-work-suggestion="${esc(c.name)}"><span class="connection-logo ${esc(c.tone)}">${esc(c.logo)}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.detail)}</small></span><em class="${c.status === "Connected" ? "on" : ""}">${esc(c.status)}</em></button>`).join("")}</div>` : ""}
    </div>`;
  }
  function renderWorkTask(complete) {
    const t = data.work?.task || {}; const prompt = state.prompt || t.prompt;
    const cur = t.currentStep ?? 2;
    const steps = arr(t.steps).map((step, i) => { const st = complete || i < cur ? "done" : i === cur ? "current" : ""; return `<div class="step ${st}"><span class="step-dot">${st === "done" ? icon("check") : st === "current" ? '<i class="spinner"></i>' : ""}</span><p>${esc(step)}</p></div>`; }).join("");
    workspace.className = "workspace task-view";
    workspace.innerHTML = `<section class="task-main"><div class="task-inner">
      <div class="msg user"><div class="bubble">${esc(prompt)}</div></div>
      <div class="task-card">
        <div class="task-titlebar"><span class="work-icon">${icon("work")}</span><span><strong>${esc(t.title)}</strong><small>${esc(complete ? t.completeStatus : t.runningStatus)}</small></span><span class="status-pill${complete ? " done" : ""}">${esc(complete ? t.completePill : t.runningPill)}</span></div>
        <div class="progress-bar"><i style="width:${complete ? 100 : t.progress ?? 50}%"></i></div>
        <h2>${esc(complete ? t.completeHeading : t.runningHeading)}</h2>
        <div class="step-list">${steps}</div>
      </div>
      ${complete ? `${t.summary ? `<div class="markdown">${md(t.summary)}</div>` : ""}<div class="task-output">${arr(t.outputs).map((o) => `<article class="output-card">${fileCard({ name: o.name, kind: o.kind, label: o.detail })}<button class="pill-button outline" data-action="preview-output">${esc(o.action || "Open")}</button></article>`).join("")}</div>` : ""}
    </div></section>
    <aside class="task-side"><h2>${esc(t.detailsTitle)}</h2>${arr(t.details).map((d) => `<div class="details-section"><header><span>${esc(d.label)}</span><span>${esc(d.count || "")}</span></header>${d.text ? `<p>${esc(d.text)}</p>` : ""}${arr(d.chips).map((c) => `<span class="details-chip">${esc(c)}</span>`).join("")}</div>`).join("")}</aside>`;
  }

  /* ======================================================================
   * Codex scenes
   * ====================================================================== */
  const cx = () => data.codex || {};
  const statNums = (t) => (t.additions != null ? `<span class="cx-stat"><b class="add">+${esc(t.additions)}</b><b class="del">−${esc(t.deletions ?? 0)}</b></span>` : "");
  function renderCodexHome() {
    const c = cx(); const tabs = arr(c.tabs);
    workspace.className = "workspace codex-page";
    workspace.innerHTML = `<div class="codex-inner">
      <h1 class="home-heading">${esc(c.heading)}</h1>
      <form class="codex-composer" id="codex-form">
        <textarea rows="2" placeholder="${esc(c.placeholder)}" aria-label="${esc(c.placeholder)}">${esc(state.prompt)}</textarea>
        <div class="cx-bar">
          <button type="button" class="cx-pill" data-action="cx-repo">${icon("folder")}<span>${esc(String(c.repo || "").split("/").pop())}</span>${icon("chevron")}</button>
          <button type="button" class="cx-pill" data-action="cx-branch">${icon("branch")}<span>${esc(c.branch)}</span>${icon("chevron")}</button>
          <button type="button" class="cx-pill hide-sm" data-action="cx-env">${icon("globe")}<span>${esc(c.environment)}</span>${icon("chevron")}</button>
          <span class="spacer"></span>
          <button type="button" class="cx-btn ghost" data-action="codex-ask">${esc(c.askLabel || "Ask")}</button>
          <button type="submit" class="cx-btn solid">${esc(c.codeLabel || "Code")}</button>
        </div>
      </form>
      <div class="cx-tabs">${tabs.map((t, i) => `<button class="${i ? "" : "active"}" data-action="cx-tab">${esc(t)}</button>`).join("")}</div>
      <div class="cx-list">${arr(c.tasks).map((t) => `<button class="cx-row" data-codex-task="${esc(t.id)}"><span class="cx-row-main"><strong>${esc(t.title)}</strong><small>${esc(t.time)} · ${esc(t.repo)}</small></span>${t.status ? `<span class="cx-status s-${esc(String(t.status).toLowerCase())}">${esc(t.status)}</span>` : ""}${statNums(t)}</button>`).join("")}</div>
    </div>`;
  }
  function diffTable(file) {
    let oldN = 0, newN = 0;
    const rows = arr(file.lines).map((raw) => {
      const l = String(raw);
      const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (h) { oldN = +h[1]; newN = +h[2]; return `<tr class="hunk"><td colspan="3">${esc(l)}</td></tr>`; }
      const kind = l[0] === "+" ? "add" : l[0] === "-" ? "del" : "ctx";
      const a = kind === "add" ? "" : oldN++; const b = kind === "del" ? "" : newN++;
      return `<tr class="${kind}"><td class="ln">${a}</td><td class="ln">${b}</td><td class="code"><span class="sign">${kind === "add" ? "+" : kind === "del" ? "−" : " "}</span>${esc(l.slice(1))}</td></tr>`;
    }).join("");
    return `<div class="diff-file"><header>${icon("chevron")}<span class="path">${esc(file.path)}</span>${statNums(file)}</header><table class="diff-table">${rows}</table></div>`;
  }
  function renderCodexTask() {
    const c = cx(); const tasks = arr(c.tasks);
    const t = tasks.find((x) => x.id === (state.codexTask || c.activeTask)) || tasks.find((x) => arr(x.files).length) || tasks[0] || {};
    const prompt = state.prompt || t.prompt || t.title;
    const files = arr(t.files);
    workspace.className = "workspace codex-task-view";
    workspace.innerHTML = `<div class="cx-task">
      <header class="cx-task-head">
        <div class="cx-task-title"><h1>${esc(t.title)}</h1><small>${esc(t.time)} · ${esc(c.repo)} · ${icon("branch")} ${esc(c.branch)}</small></div>
        <div class="cx-task-actions"><button class="icon-button" data-action="cx-archive" aria-label="Archive">${icon("archive")}</button><button class="pill-button outline" data-action="share">${icon("share")}<span>${esc(ui("share", "Share"))}</span></button><button class="cx-btn solid" data-action="create-pr">${icon("pr")}<span>${esc(t.prLabel || "Create PR")}</span></button></div>
      </header>
      <div class="cx-split">
        <section class="cx-convo"><div class="cx-convo-scroll">
          <div class="msg user"><div class="bubble">${esc(prompt)}</div></div>
          <div class="msg assistant">
            ${t.worked ? `<div class="thought open"><button class="thought-toggle" data-action="toggle-thought">${esc(t.worked)}${icon("chevron-right")}</button><div class="thought-body"><ul class="cx-log">${arr(t.log).map((l) => `<li class="${l.done ? "done" : "running"}">${icon(l.done ? "check" : "terminal")}<span>${esc(l.text)}</span></li>`).join("")}</ul></div></div>` : ""}
            ${t.summary ? `<div class="markdown">${md(t.summary)}</div>` : ""}
            ${files.length ? `<div class="cx-file-chips">${files.map((f) => `<span>${icon("document")}${esc(f.path)} ${statNums(f)}</span>`).join("")}</div>` : ""}
          </div>
        </div>
        <form class="codex-composer small" id="codex-followup"><textarea rows="1" placeholder="${esc(c.followupPlaceholder || "Request changes or ask a question")}"></textarea><div class="cx-bar"><span class="spacer"></span><button type="button" class="cx-btn ghost" data-action="codex-ask">${esc(c.askLabel || "Ask")}</button><button type="submit" class="cx-btn solid">${esc(c.codeLabel || "Code")}</button></div></form>
        </section>
        <section class="cx-diff">
          <div class="cx-diff-head"><div class="cx-tabs compact">${arr(c.diffTabs || ["Diff", "Logs"]).map((x, i) => `<button class="${i ? "" : "active"}" data-action="cx-tab">${esc(x)}</button>`).join("")}</div><span class="spacer"></span>${statNums(t)}</div>
          <div class="cx-diff-body">${files.map(diffTable).join("")}</div>
        </section>
      </div>
    </div>`;
  }

  /* ======================================================================
   * Project, pages, search
   * ====================================================================== */
  function renderProject() {
    const p = arr(data.projects)[state.projectIndex] || arr(data.projects)[0] || {};
    const tabs = arr(data.projectTabs);
    workspace.className = "workspace project-view";
    workspace.innerHTML = `<div class="project-inner">
      <div class="project-title" style="--pc:${esc(p.color || "currentColor")}">${icon("folder")}<h1>${esc(p.title)}</h1></div>
      ${p.description ? `<p class="project-desc">${esc(p.description)}</p>` : ""}
      ${composer({ id: "project-form", placeholder: `${ui("placeholder", "Ask anything")}` })}
      <div class="cx-tabs">${tabs.map((t, i) => `<button class="${i ? "" : "active"}" data-action="project-tab" data-tab="${i}">${esc(t)}</button>`).join("")}</div>
      <div class="project-list">${arr(p.chats).map((ref) => {
        const id = refId(ref); const conv = id ? conversations()[id] : null;
        const snippet = ref.snippet || (conv ? String(arr(conv.messages).find((m) => m.role === "assistant" && m.text)?.text || "").replace(/[#*|>`{}_-]/g, "").replace(/\s+/g, " ").trim().slice(0, 180) : "");
        return `<button class="project-row" data-open-chat="${esc(id || "")}"><span><strong>${esc(convTitle(ref))}</strong><small>${esc(snippet)}</small></span><em>${esc(ref.time || conv?.time || "")}</em></button>`;
      }).join("")}</div>
      ${arr(p.files).length ? `<div class="project-files">${p.files.map((f) => fileCard({ name: f, kind: /\.pdf$/i.test(f) ? "pdf" : /\.pptx?$/i.test(f) ? "slides" : /\.xlsx?$|\.csv$/i.test(f) ? "sheet" : "doc" })).join("")}</div>` : ""}
    </div>`;
  }
  function renderPage(key) {
    const pg = data.pages?.[key] || { title: key, items: [] };
    workspace.className = "workspace page-view";
    const items = arr(pg.items);
    const isGallery = items.some((x) => x.palette);
    workspace.innerHTML = `<div class="page-inner"><h1>${esc(pg.title)}</h1>${pg.subtitle ? `<p class="page-sub">${esc(pg.subtitle)}</p>` : ""}
      ${isGallery ? `<div class="gallery">${items.map((x) => `<button class="gallery-item" data-action="open-card">${imageArt({ palette: x.palette })}<span>${esc(x.title)}</span><small>${esc(x.detail || "")}</small></button>`).join("")}</div>`
        : `<div class="page-list">${items.map((x) => `<button class="page-row" data-action="open-card"><span class="page-icon">${icon(x.icon || "spark")}</span><span class="page-text"><strong>${esc(x.title)}</strong><small>${esc(x.detail || "")}</small></span>${x.status ? `<span class="cx-status s-${esc(String(x.status).toLowerCase())}">${esc(x.status)}</span>` : ""}${icon("chevron-right", "row-chev")}</button>`).join("")}</div>`}
    </div>`;
  }
  function renderSearchResults(query = "") {
    const q = query.toLowerCase().trim();
    const groups = arr(data.search?.groups).map((g) => ({ label: g.label, items: arr(g.items).filter((ref) => !q || `${convTitle(ref)} ${ref.snippet || ""}`.toLowerCase().includes(q)) })).filter((g) => g.items.length);
    $("#search-results").innerHTML = `<button class="search-row" data-action="new">${icon("compose")}<span><strong>${esc(ui("searchNewChat", "New chat"))}</strong></span></button>` +
      groups.map((g) => `<h4>${esc(g.label)}</h4>${g.items.map((ref) => `<button class="search-row" data-open-chat="${esc(refId(ref) || "")}">${icon("chat")}<span><strong>${esc(convTitle(ref))}</strong>${ref.snippet ? `<small>${esc(ref.snippet)}</small>` : ""}</span></button>`).join("")}`).join("");
  }
  function openSearch(open = true) {
    const ov = $("#search-overlay"); ov.hidden = !open;
    if (open) { const input = $("#global-search"); input.placeholder = ui("searchPlaceholder", "Search chats..."); renderSearchResults(input.value); setTimeout(() => input.focus(), 0); }
  }
  function renderSearchScene() {
    renderChatHome();
    $("#global-search").value = state.prompt || "";
    openSearch(true);
  }

  /* ======================================================================
   * Model menu
   * ====================================================================== */
  function toggleModelMenu(force) {
    const menu = $("#model-menu");
    const open = typeof force === "boolean" ? force : menu.hidden;
    if (!open || state.product === "codex") { menu.hidden = true; return; }
    const r = $(".model-picker").getBoundingClientRect();
    menu.style.left = `${Math.max(8, r.left)}px`; menu.style.top = `${r.bottom + 6}px`;
    menu.innerHTML = `${data.modelMenuTitle ? `<h4>${esc(data.modelMenuTitle)}</h4>` : ""}` + arr(data.models).map((m) => {
      const name = typeof m === "string" ? m : m.name; const detail = typeof m === "string" ? "" : m.detail;
      return `<button role="menuitemradio" data-model="${esc(name)}" aria-checked="${name === state.model}"><span><strong>${esc(name)}</strong>${detail ? `<small>${esc(detail)}</small>` : ""}</span>${name === state.model ? icon("check") : ""}</button>`;
    }).join("");
    menu.hidden = false;
  }

  /* ======================================================================
   * Scene router
   * ====================================================================== */
  function setScene(scene, opts = {}) {
    if (!sceneKeys.includes(scene)) scene = "chat-home";
    const changed = scene !== state.scene || opts.reset;
    state.scene = scene;
    state.gen++; state.streaming = false;
    $("#search-overlay").hidden = true; toggleModelMenu(false);
    state.product = scene.startsWith("codex") ? "codex" : "chatgpt";
    state.experience = scene.startsWith("work") ? "work" : "chat";
    if (THREAD_SCENES.includes(scene)) {
      const wanted = opts.chatId || (changed || !state.chatId ? data.sceneChats?.[scene] : state.chatId);
      if (wanted !== state.chatId || changed) { state.extra = []; state.limit = null; }
      state.chatId = wanted || Object.keys(conversations())[0] || null;
      const conv = getConv(state.chatId);
      if (conv?.model && modelNames().includes(conv.model) && !opts.keepModel) state.model = conv.model;
    }
    if (window.innerWidth < 768) state.mobileNav = false;
    render();
    if (THREAD_SCENES.includes(scene)) scrollToLastTurn(); else workspace.scrollTop = 0;
  }
  function render() {
    renderSidebar(); renderHeader();
    const s = state.scene;
    if (s === "chat-home") renderChatHome();
    else if (THREAD_SCENES.includes(s)) renderThread();
    else if (s === "work-home") renderWorkHome();
    else if (s === "work-running") renderWorkTask(false);
    else if (s === "work-complete") renderWorkTask(true);
    else if (s === "codex-home") renderCodexHome();
    else if (s === "codex-task") renderCodexTask();
    else if (s === "search") renderSearchScene();
    else if (s === "project") renderProject();
    else if (PAGE_SCENES.includes(s)) renderPage(s);
    document.documentElement.dataset.scene = s;
    syncAllComposers();
  }
  function openChat(id) {
    if (!getConv(id)) { toast(`No conversation "${id}"`); return false; }
    state.scene = "chat"; state.chatId = null;
    setScene("chat", { chatId: id, reset: true });
    return true;
  }

  /* ======================================================================
   * Live interaction: add messages, typing, streaming
   * ====================================================================== */
  function ensureThread() {
    if (THREAD_SCENES.includes(state.scene)) return;
    state.live = { title: "New chat", model: state.model, messages: [] };
    state.scene = "chat"; state.chatId = "__live"; state.extra = []; state.limit = null;
    render();
  }
  function addMessage(role, text, extra = {}) {
    ensureThread();
    const msg = typeof text === "object" && text ? { role, ...text } : { role: role === "user" ? "user" : "assistant", text: String(text ?? ""), ...extra };
    state.extra.push(msg); renderThread(); scrollThread(true);
    return msg;
  }
  function streamMessage(msg, { speed = 28, thinking = 900 } = {}) {
    ensureThread();
    const full = msg.text || "";
    const live = { ...msg, text: "", _pending: "thinking" };
    state.extra.push(live); state.streaming = true; renderThread(); scrollThread(true);
    const idx = currentMessages().length - 1;
    const gen = state.gen;
    return new Promise((resolve) => {
      const aborted = () => {
        if (gen === state.gen) return false;
        delete live._pending; if (!live.text && !msg.image) live.text = "";
        if (state.extra.includes(live)) { state.streaming = false; renderThread(); }
        resolve(live); return true;
      };
      const tokens = full.match(/\s+|[^\s]+/g) || [];
      const run = async () => {
        await sleep(msg.reasoning ? Math.max(thinking, 1400) : thinking);
        if (aborted()) return;
        if (msg.image) { live._pending = "image"; renderThread(); scrollThread(true); await sleep(1600); if (aborted()) return; }
        live._pending = "streaming";
        renderThread();
        let node = workspace.querySelector(`[data-msg="${idx}"]`);
        if (node && !node.querySelector(".markdown") && full) { node.insertAdjacentHTML("beforeend", `<div class="markdown"></div>`); }
        let n = 0;
        while (n < tokens.length) {
          n = Math.min(tokens.length, n + 2);
          live.text = tokens.slice(0, n).join("");
          const target = workspace.querySelector(`[data-msg="${idx}"] .markdown`);
          if (target) { target.innerHTML = md(live.text); appendCursor(target); }
          if (workspace.scrollHeight - workspace.scrollTop - workspace.clientHeight < 240) scrollThread(false);
          await sleep(speed * 2);
          if (aborted()) return;
        }
        delete live._pending; live.text = full;
        state.streaming = false; renderThread(); scrollThread(true);
        resolve(live);
      };
      run();
    });
  }
  function appendCursor(target) {
    // Walk down the trailing edge of the rendered markdown so the dot sits right after the last word.
    let el = target;
    for (;;) {
      const last = el.lastChild;
      if (!last || last.nodeType !== 1) break;
      if (last.classList.contains("code-block")) { el = last.querySelector("code") || last; break; }
      if (["TABLE", "HR", "BR", "DIV"].includes(last.tagName) && !last.classList.contains("code-block")) break;
      el = last;
    }
    el.insertAdjacentHTML("beforeend", '<span class="stream-dot"></span>');
  }
  function streamReply(markdown, opts = {}) {
    const msg = typeof markdown === "object" && markdown ? { role: "assistant", ...markdown } : { role: "assistant", text: String(markdown ?? ""), ...(opts.message || {}) };
    return streamMessage(msg, opts);
  }
  async function typePrompt(text, { speed = 45, send = false, selector } = {}) {
    let form = selector ? $(selector) : workspace.querySelector("form.composer, form.codex-composer");
    if (!form) { setScene("chat-home"); form = workspace.querySelector("form.composer"); }
    const ta = form.querySelector("textarea"); ta.focus(); ta.value = "";
    for (const ch of String(text)) {
      ta.value += ch; syncComposer(form);
      await sleep(speed * (0.6 + Math.random() * 0.8) + (/[,.?!]/.test(ch) ? speed * 2 : 0));
    }
    if (send) { await sleep(450); form.requestSubmit(); }
    return true;
  }
  async function submitChat(value) {
    if (state.streaming) return;
    const norm = (s) => String(s || "").trim().toLowerCase();
    const match = Object.entries(conversations()).find(([, c]) => norm(arr(c.messages)[0]?.text) === norm(value) && arr(c.messages)[0]?.role === "user");
    if (match && !THREAD_SCENES.includes(state.scene)) {
      // Replay a known conversation: show its first prompt, then stream the assistant turn(s).
      const [id, conv] = match; const msgs = arr(conv.messages);
      state.scene = "chat"; state.chatId = id; state.extra = []; state.limit = 1; state.prompt = "";
      if (conv.model && modelNames().includes(conv.model)) state.model = conv.model;
      render();
      const gen = state.gen;
      for (let i = 1; i < msgs.length && msgs[i].role === "assistant"; i++) {
        await streamMessage(clone(msgs[i]));
        if (gen !== state.gen) return;
        state.extra = []; state.limit = i + 1; renderThread();
      }
      state.limit = null; renderSidebar(); return;
    }
    state.prompt = "";
    if (!THREAD_SCENES.includes(state.scene)) { ensureThread(); state.live.title = value.slice(0, 40); }
    addMessage("user", value);
    await streamReply(data.autoReply || "");
  }

  /* ======================================================================
   * Studio (Alt+D)
   * ====================================================================== */
  function fillStudio() {
    $("#studio-scene").innerHTML = sceneKeys.map((s) => `<option value="${s}">${esc(SCENES[s])} · ${s}</option>`).join("");
    $("#studio-chat").innerHTML = `<option value="">(scene default)</option>` + Object.entries(conversations()).map(([id, c]) => `<option value="${esc(id)}">${esc(c.title || id)} · ${esc(id)}</option>`).join("");
    $("#studio-model").innerHTML = modelNames().map((m) => `<option>${esc(m)}</option>`).join("");
  }
  function syncStudio() {
    $("#studio-scene").value = state.scene; $("#studio-name").value = state.userName; $("#studio-prompt").value = state.prompt;
    $("#studio-model").value = state.model; $("#studio-chat").value = THREAD_SCENES.includes(state.scene) && state.chatId !== "__live" ? state.chatId || "" : "";
    $("#studio-theme").value = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }
  function openStudio(force) {
    state.studioOpen = typeof force === "boolean" ? force : !state.studioOpen;
    const st = $("#studio"); st.classList.toggle("open", state.studioOpen); st.setAttribute("aria-hidden", String(!state.studioOpen));
    $("#studio-backdrop").hidden = !state.studioOpen;
    if (state.studioOpen) syncStudio();
  }
  function applyStudio() {
    state.userName = $("#studio-name").value.trim() || data.user?.name || "";
    state.prompt = $("#studio-prompt").value.trim();
    setTheme($("#studio-theme").value);
    const chat = $("#studio-chat").value;
    if (chat) openChat(chat); else setScene($("#studio-scene").value, { reset: true });
    state.model = $("#studio-model").value; render();
    toast("Tutorial scene updated");
  }
  function copyLink() {
    const u = new URL(location.href); [...u.searchParams.keys()].forEach((k) => { if (k !== "d" && k !== "data") u.searchParams.delete(k); });
    const chat = $("#studio-chat").value;
    if (chat) u.searchParams.set("chat", chat); else u.searchParams.set("scene", $("#studio-scene").value);
    if ($("#studio-name").value.trim() && $("#studio-name").value.trim() !== data.user?.name) u.searchParams.set("name", $("#studio-name").value.trim());
    if ($("#studio-prompt").value.trim()) u.searchParams.set("prompt", $("#studio-prompt").value.trim());
    if ($("#studio-model").value !== modelNames()[0]) u.searchParams.set("model", $("#studio-model").value);
    if ($("#studio-theme").value === "dark") u.searchParams.set("theme", "dark");
    navigator.clipboard?.writeText(u.toString()).then(() => toast("Scene link copied")).catch(() => prompt("Copy this link", u.toString()));
  }
  function setTheme(theme) { document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light"; }

  /* ======================================================================
   * Events
   * ====================================================================== */
  document.addEventListener("click", (event) => {
    const b = event.target.closest("button"); if (!b) { if (!event.target.closest("#model-menu")) toggleModelMenu(false); return; }
    if (!b.closest("#model-menu") && b.dataset.action !== "model") toggleModelMenu(false);
    if (b.dataset.model) { state.model = b.dataset.model; toggleModelMenu(false); renderHeader(); return; }
    if (b.dataset.experience) { setScene(b.dataset.experience === "work" ? "work-home" : "chat-home"); return; }
    if (b.dataset.suggestion) { typePrompt(b.dataset.suggestion, { speed: 18 }); return; }
    if (b.dataset.workSuggestion) { state.prompt = b.dataset.workSuggestion; setScene("work-running"); return; }
    if (b.dataset.openProject !== undefined) { state.projectIndex = +b.dataset.openProject; setScene("project", { reset: true }); return; }
    if (b.dataset.openChat !== undefined) { $("#search-overlay").hidden = true; if (b.dataset.openChat) openChat(b.dataset.openChat); else toast("History-only row (add it to conversations to open it)"); return; }
    if (b.dataset.codexTask) { const t = arr(cx().tasks).find((x) => x.id === b.dataset.codexTask); if (t && arr(t.files).length) { state.codexTask = t.id; state.prompt = ""; setScene("codex-task", { reset: true }); } else toast(`${t?.title || "Task"} · ${t?.status || ""}`); return; }
    const a = b.dataset.action;
    switch (a) {
      case "collapse": if (window.innerWidth < 768) state.mobileNav = !state.mobileNav; else state.sidebarCollapsed = !state.sidebarCollapsed; renderSidebar(); break;
      case "new": state.prompt = ""; state.chatId = null; state.live = null; setScene("chat-home", { reset: true }); break;
      case "search": openSearch(true); break;
      case "close-search": openSearch(false); break;
      case "codex": state.prompt = ""; setScene("codex-home"); break;
      case "work": state.prompt = ""; setScene("work-home"); break;
      case "library": case "gpts": case "sora": case "plugins": case "scheduled": case "sites": setScene(a); break;
      case "model": toggleModelMenu(); break;
      case "toggle-thought": b.closest(".thought")?.classList.toggle("open"); break;
      case "copy-code": { const code = b.closest(".code-block")?.querySelector("code")?.textContent || ""; navigator.clipboard?.writeText(code).catch(() => {}); const s = b.querySelector("span"); const old = s.textContent; s.textContent = "Copied!"; setTimeout(() => (s.textContent = old), 1500); break; }
      case "copy-msg": toast("Copied to clipboard"); break;
      case "good": case "bad": b.classList.toggle("on"); toast("Thanks for your feedback!"); break;
      case "regenerate": { const last = [...currentMessages()].reverse().find((m) => m.role === "assistant"); if (last && !state.streaming) streamReply(last.text || ""); break; }
      case "attach": toast("Add photos and files"); break;
      case "dictate": b.classList.toggle("recording"); toast(b.classList.contains("recording") ? "Listening…" : "Dictation stopped"); break;
      case "temporary": document.documentElement.classList.toggle("temp-chat"); toast(document.documentElement.classList.contains("temp-chat") ? "Temporary chat on" : "Temporary chat off"); break;
      case "share": toast("Share link created"); break;
      case "sources": toast("Sources panel opened"); break;
      case "create-pr": b.innerHTML = `${icon("check")}<span>${esc(cx().prCreatedLabel || "View PR")}</span>`; toast("Pull request created"); break;
      case "cx-tab": case "project-tab": b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b)); break;
      case "new-project": toast("New project"); break;
      case "account": toast(`${state.userName} · ${data.user?.plan || ""}`); break;
      case "close-studio": openStudio(false); break;
      case "apply-studio": applyStudio(); break;
      case "copy-link": copyLink(); break;
      case "edit-data": openStudio(false); window.MockKit?.openEditor(); break;
      case "studio-type": { const p = $("#studio-prompt").value.trim() || arr(data.suggestions)[0]?.prompt || ""; openStudio(false); if (!workspace.querySelector("form.composer")) setScene("chat-home"); typePrompt(p, { send: true }); break; }
      case "studio-stream": openStudio(false); streamReply(data.autoReply || ""); break;
      case "reset": state.userName = data.user?.name || ""; state.prompt = ""; state.model = modelNames()[0] || ""; state.extra = []; setScene("chat-home", { reset: true }); syncStudio(); toast("Fake data reset"); break;
      default: if (a) toast(b.getAttribute("aria-label") || b.textContent.trim() || "Opened");
    }
  });
  document.addEventListener("input", (e) => { if (e.target.matches("form.composer textarea")) syncComposer(e.target.closest("form")); if (e.target.id === "global-search") renderSearchResults(e.target.value); });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("form textarea") && e.key === "Enter" && !e.shiftKey && !e.target.closest(".studio")) { e.preventDefault(); e.target.closest("form").requestSubmit(); return; }
    if (e.altKey && !e.ctrlKey && (e.key === "d" || e.key === "D" || e.code === "KeyD")) { e.preventDefault(); openStudio(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(true); }
    if (e.key === "Escape") { openSearch(false); openStudio(false); toggleModelMenu(false); }
  });
  document.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target; const value = form.querySelector("textarea")?.value.trim() || "";
    if (form.id === "work-form") { if (value) state.prompt = value; setScene("work-running"); return; }
    if (form.id === "codex-form" || form.id === "codex-followup") { if (value) state.prompt = value; setScene("codex-task", { reset: true }); return; }
    if (state.streaming) { state.gen++; state.streaming = false; syncAllComposers(); return; } // stop button
    if (!value) { toast("Voice mode"); return; }
    submitChat(value);
  });
  $("#open-studio").addEventListener("click", () => openStudio());
  $("#studio-backdrop").addEventListener("click", () => openStudio(false));
  $("#search-overlay").addEventListener("click", (e) => { if (e.target.id === "search-overlay") openSearch(false); });
  window.addEventListener("resize", () => toggleModelMenu(false));

  /* ======================================================================
   * WebMCP tools (optional host integration)
   * ====================================================================== */
  function registerWebMcpTools() {
    const context = document.modelContext; if (!context?.registerTool) return;
    const tools = [
      { name: "read_chatgpt_demo_state", title: "Read ChatGPT demo state", description: "Read the current ChatGPT, Work, or Codex training scene.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => window.TrainingMock.getState() },
      { name: "stage_chatgpt_demo_scene", title: "Stage ChatGPT demo scene", description: "Show a deterministic tutorial scene using fictional data.", inputSchema: { type: "object", properties: { scene: { type: "string", enum: sceneKeys }, chat: { type: "string" }, name: { type: "string" }, prompt: { type: "string" }, model: { type: "string" } }, required: ["scene"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input) => { if (input.name) state.userName = String(input.name); if (typeof input.prompt === "string") state.prompt = input.prompt; if (input.chat) openChat(input.chat); else setScene(input.scene, { reset: true }); if (input.model && modelNames().includes(input.model)) window.TrainingMock.setModel(input.model); return { scene: state.scene, chat: state.chatId }; } },
      { name: "stream_chatgpt_demo_reply", title: "Stream a demo reply", description: "Stream a markdown reply into the current conversation.", inputSchema: { type: "object", properties: { markdown: { type: "string" } }, required: ["markdown"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input) => { await streamReply(input.markdown); return { ok: true }; } }
    ];
    tools.forEach((tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) { /* unsupported host */ } });
  }

  /* ======================================================================
   * Public API
   * ====================================================================== */
  window.TrainingMock = {
    getState: () => ({ scene: state.scene, product: state.product, experience: state.experience, chat: state.chatId, name: state.userName, prompt: state.prompt, model: state.model, theme: document.documentElement.dataset.theme || "light" }),
    scenes: () => sceneKeys.slice(),
    setScene: (scene) => setScene(scene, { reset: true }),
    setUser: (name) => { state.userName = String(name || data.user?.name || ""); render(); },
    setPrompt: (prompt) => { state.prompt = String(prompt || ""); render(); },
    setModel: (model) => { state.model = String(model || modelNames()[0] || ""); renderHeader(); },
    setProduct: (product) => setScene(product === "codex" ? "codex-home" : product === "work" ? "work-home" : "chat-home", { reset: true }),
    setTheme,
    openChat,
    addMessage,
    typePrompt,
    streamReply,
    openStudio: () => openStudio(true),
    closeStudio: () => openStudio(false),
    openEditor: () => window.MockKit?.openEditor(),
    reset: () => { state.userName = data.user?.name || ""; state.prompt = ""; state.model = modelNames()[0] || ""; state.extra = []; state.live = null; setScene("chat-home", { reset: true }); }
  };

  /* ======================================================================
   * Boot
   * ====================================================================== */
  let prevUser = "";
  function adopt(next) {
    const prevDefaultModel = modelNames()[0];
    data = next || {};
    if (!state.userName) state.userName = params.get("name") || data.user?.name || "";
    else if (state.userName === prevUser) state.userName = data.user?.name || state.userName;
    prevUser = data.user?.name || "";
    if (!state.model || !modelNames().includes(state.model) || state.model === prevDefaultModel) {
      const want = params.get("model");
      state.model = want && modelNames().includes(want) ? want : modelNames()[0] || "";
    }
    fillStudio();
  }
  const onChange = (next) => {
    adopt(next);
    if (state.chatId && state.chatId !== "__live" && !getConv(state.chatId)) state.chatId = null;
    render(); if (state.studioOpen) syncStudio();
  };
  const boot = (initial) => {
    adopt(initial);
    if (!params.get("theme")) setTheme(data.app?.theme || "light");
    const chat = params.get("chat");
    const scene = sceneKeys.includes(params.get("scene")) ? params.get("scene") : "chat-home";
    state.scene = "";
    if (chat && getConv(chat)) openChat(chat); else setScene(scene, { reset: true });
    if (params.get("model") && modelNames().includes(params.get("model"))) { state.model = params.get("model"); renderHeader(); }
    openStudio(state.studioOpen);
    registerWebMcpTools();
  };
  if (window.MockKit) window.MockKit.init({ product: "chatgpt", defaults: window.CHATGPT_MOCK_DATA, onChange }).then(boot);
  else boot(clone(window.CHATGPT_MOCK_DATA));
})();
