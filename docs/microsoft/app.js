/*
 * Microsoft 365 Copilot (Chat + Cowork) training mock.
 *
 * All fake content comes from demo-data.js (window.COWORK_DEMO_DATA) through
 * MockKit (../shared/mockkit.js). This file only contains product chrome
 * (real UI labels such as "New chat") and behaviour.
 *
 * Scripting API: window.TrainingMock (alias window.CoworkDemo), see bottom.
 */
(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    sidebar: $("#sidebar"),
    topbar: $("#topbar"),
    workspace: $("#workspace"),
    shell: $(".app-shell"),
    modelMenu: $("#model-menu"),
    studioPanel: $("#studio-panel"),
    studioBackdrop: $("#studio-backdrop"),
    toast: $("#toast-region"),
    apps: $("#apps-launcher")
  };

  /* Scene keys (scripts/verify.mjs checks the original twelve are present). */
  const SCENES = [
    ["home", "Cowork · home"],
    ["running", "Cowork · task in progress"],
    ["approval", "Cowork · approval request"],
    ["complete", "Cowork · completed task"],
    ["tasks", "Cowork · my tasks"],
    ["scheduled", "Cowork · scheduled"],
    ["customize", "Cowork · customize"],
    ["chat", "Chat · home"],
    ["chat-response", "Chat · grounded answer"],
    ["chat-thinking", "Chat · searching (in progress)"],
    ["chat-web", "Chat · web-grounded answer"],
    ["chat-table", "Chat · table answer"],
    ["search", "Chat · search"],
    ["search-results", "Chat · search results"],
    ["library", "Chat · library"],
    ["agents", "Chat · agents"],
    ["notebooks", "Chat · notebooks"],
    ["create", "Chat · create"],
    ["workflow-agent", "Chat · workflow agent"],
    ["workflow-complete", "Chat · completed workflow"]
  ];
  const supportedScenes = SCENES.map(([key]) => key);
  const COWORK_VIEWS = ["cowork-home", "session", "tasks", "scheduled", "customize"];
  const FILE_KINDS = ["word", "excel", "powerpoint", "outlook", "teams", "onenote", "sharepoint", "loop", "pdf", "web", "person", "meeting", "image", "video"];
  const KIND_ALIASES = { file: "word", doc: "word", docx: "word", xlsx: "excel", pptx: "powerpoint", email: "outlook", mail: "outlook", chat: "teams", calendar: "meeting", site: "web", link: "web" };
  const GLYPHS = { search: "search", chart: "chart", flow: "flow", sparkle: "sparkle", people: "people", document: "document", mail: "mail", calendar: "calendar", meeting: "calendar-clock", agent: "agent" };

  let data = null;
  const state = {
    scene: "chat",
    view: "chat-home",
    nameOverride: params.get("name"),
    prompt: params.get("prompt") || "",
    model: params.get("model") || "auto",
    sidePanel: params.get("panel") !== "0",
    grounding: "Work",
    convo: null,
    drafts: {},
    attachments: [],
    referenceOpen: false,
    referenceTab: "recent",
    refsCollapsed: {},
    feedback: {},
    sidebarCollapsed: false,
    mobileNav: false,
    appsOpen: false,
    searchQuery: "",
    searchFilter: "All",
    agentId: "workflow-agent",
    workflowPrompt: "",
    workflowStatus: "idle",
    sessionScene: "running",
    sessionTitle: "",
    sessionStep: 1,
    paused: false,
    filter: "All",
    schedulesTab: "manage",
    customizeTab: "skills",
    showAllSuggestions: false,
    streaming: false,
    studioOpen: params.get("studio") === "1"
  };
  let streamToken = 0;
  let sessionTimer = 0;

  /* ------------------------------------------------------------ helpers */
  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const icon = (name, cls = "") => `<svg class="fluent-icon ${cls}" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;
  const logo = (cls = "") => `<svg class="copilot-logo ${cls}" aria-hidden="true" focusable="false"><use href="#copilot-logo"></use></svg>`;
  const kindOf = (kind) => {
    const k = String(kind || "").toLowerCase();
    if (FILE_KINDS.includes(k)) return k;
    return KIND_ALIASES[k] || "";
  };
  const fileIcon = (kind, cls = "") => {
    const k = kindOf(kind) || "word";
    return `<svg class="file-icon ${cls}" aria-hidden="true" focusable="false"><use href="#ft-${k}"></use></svg>`;
  };
  const kindIcon = (kind, cls = "") => (kindOf(kind) ? fileIcon(kind, cls) : `<span class="glyph-tile ${cls}">${icon(GLYPHS[kind] || "sparkle")}</span>`);
  const userName = () => state.nameOverride || data.user.name;
  const firstName = () => userName().trim().split(/\s+/)[0] || "there";
  const initials = () => (state.nameOverride ? userName().trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() : data.user.initials) || "U";
  const fill = (template) => String(template || "").replaceAll("{first}", firstName()).replaceAll("{name}", userName());
  const models = () => data.models || [];
  const selectedModel = () => models().find((m) => m.id === state.model) || models()[0] || { id: "auto", name: "Auto" };
  const isCowork = () => COWORK_VIEWS.includes(state.view);
  const task = () => data.cowork.task;
  const agents = () => data.chat.pinnedAgents || [];

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2400);
  }

  /* ------------------------------------------------ markdown renderer */
  const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const isTableSep = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line || "");
  const splitRow = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

  function isBlockStart(lines, i) {
    const line = lines[i];
    return /^#{1,6}\s/.test(line) || /^\s*>/.test(line) || /^```/.test(line.trim()) || LIST_RE.test(line)
      || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line) || (line.includes("|") && isTableSep(lines[i + 1]));
  }

  function cite(n, ctx) {
    const source = ctx.sources?.[Number(n) - 1];
    if (ctx.sources?.length && !source) return `[${n}]`;
    return `<sup class="cite-wrap"><button type="button" class="cite" data-cite="${n}" data-msg="${ctx.msg ?? ""}" title="${esc(source?.title || "")}">${n}</button></sup>`;
  }

  function inline(text, ctx = {}) {
    const codes = [];
    let s = String(text ?? "").replace(/`([^`]+)`/g, (_, code) => `\u0000${codes.push(code) - 1}\u0000`);
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      const safe = /^(https?:|mailto:|#|\/|\.)/i.test(url) ? url : "#";
      return `<a href="${safe}" target="_blank" rel="noopener">${label}</a>`;
    });
    s = s.replace(/\[(\d{1,2})\]/g, (_, n) => cite(n, ctx));
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/__(.+?)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, "$1<em>$2</em>").replace(/(^|[^\w&])_(?!\s)(.+?)_(?!\w)/g, "$1<em>$2</em>");
    return s.replace(/\u0000(\d+)\u0000/g, (_, k) => `<code>${esc(codes[k])}</code>`);
  }

  function renderList(lines, ctx) {
    const items = [];
    for (const line of lines) {
      const match = line.match(LIST_RE);
      if (match) items.push({ indent: match[1].replace(/\t/g, "  ").length, ordered: /\d/.test(match[2]), start: parseInt(match[2], 10), text: match[3] });
      else if (items.length) items.at(-1).text += ` ${line.trim()}`;
    }
    let pos = 0;
    const build = (indent) => {
      const first = items[pos];
      const tag = first.ordered ? "ol" : "ul";
      let out = `<${tag}${first.ordered && first.start > 1 ? ` start="${first.start}"` : ""}>`;
      while (pos < items.length && items[pos].indent >= indent) {
        if (items[pos].indent > indent) { out = `${out.replace(/<\/li>$/, "")}${build(items[pos].indent)}</li>`; continue; }
        out += `<li>${inline(items[pos].text, ctx)}</li>`;
        pos += 1;
      }
      return `${out}</${tag}>`;
    };
    let html = "";
    while (pos < items.length) html += build(items[pos].indent);
    return html;
  }

  function md(source, ctx = {}) {
    const lines = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i += 1; continue; }
      if (/^```/.test(line.trim())) {
        const buf = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
        i += 1;
        html += `<pre><code>${esc(buf.join("\n"))}</code></pre>`;
        continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) { const level = Math.min(6, heading[1].length + 1); html += `<h${level}>${inline(heading[2], ctx)}</h${level}>`; i += 1; continue; }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html += "<hr>"; i += 1; continue; }
      if (/^\s*>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
        html += `<blockquote>${md(buf.join("\n"), ctx)}</blockquote>`;
        continue;
      }
      if (line.includes("|") && isTableSep(lines[i + 1])) {
        const header = splitRow(line);
        const aligns = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? "center" : /-+:$/.test(c) ? "right" : ""));
        const al = (k) => (aligns[k] ? ` style="text-align:${aligns[k]}"` : "");
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
        html += `<div class="md-table"><table><thead><tr>${header.map((c, k) => `<th${al(k)}>${inline(c, ctx)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, k) => `<td${al(k)}>${inline(row[k] ?? "", ctx)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        continue;
      }
      if (LIST_RE.test(line)) {
        const buf = [];
        while (i < lines.length && (LIST_RE.test(lines[i]) || (buf.length && /^\s{2,}\S/.test(lines[i])))) buf.push(lines[i++]);
        html += renderList(buf, ctx);
        continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && (!buf.length || !isBlockStart(lines, i))) buf.push(lines[i++].trim());
      html += `<p>${inline(buf.join(" "), ctx)}</p>`;
    }
    return html;
  }

  /* ------------------------------------------------------ data access */
  function normalize(raw) {
    const d = clone(raw || {});
    d.user = { name: "User", initials: "U", plan: "", ...(d.user || {}) };
    d.app = { ...(d.app || {}) };
    d.models = Array.isArray(d.models) ? d.models : [];
    d.chat = { pinnedAgents: [], history: [], suggestions: [], replies: [], references: {}, search: { results: [], recommended: [], tryTerms: [] }, library: [], notebooks: [], agentCatalog: [], create: [], ...(d.chat || {}) };
    d.chat.search = { results: [], recommended: [], tryTerms: [], ...(d.chat.search || {}) };
    d.conversations = d.conversations || {};
    d.scenes = d.scenes || {};
    d.cowork = { suggestions: [], tasks: [], schedules: [], runs: [], skills: [], plugins: [], ...(d.cowork || {}) };
    d.cowork.task = { steps: [], activity: [], inputs: [], files: [], skills: [], approval: {}, complete: {}, ...(d.cowork.task || {}) };
    d.cowork.task.steps = d.cowork.task.steps.map((step) => (typeof step === "string" ? { title: step, detail: "" } : step));
    d.workflow = { steps: [], ...(d.workflow || {}) };
    return d;
  }

  function loadConversation(id) {
    const source = data.conversations[id];
    if (!source) return null;
    const convo = clone(source);
    convo.id = id;
    convo.grounding = convo.grounding === "Web" ? "Web" : "Work";
    convo.messages = (convo.messages || []).map((m) => ({ ...m }));
    return convo;
  }

  function progressLabel(status) {
    const s = String(status || "");
    if (!s) return "Reasoning";
    return s.replace(/^Searched/, "Searching").replace(/^Analyzed/, "Analyzing").replace(/^Reviewed/, "Reviewing").replace(/^Checked/, "Checking").replace(/^Read /, "Reading ");
  }

  function findReply(text) {
    const lower = String(text).toLowerCase();
    if (state.grounding === "Web") return data.chat.defaultWebReply || data.chat.defaultReply || { text: "" };
    for (const rule of data.chat.replies || []) {
      if ((rule.keywords || []).some((k) => lower.includes(String(k).toLowerCase()))) {
        const convo = data.conversations[rule.chat];
        const reply = convo?.messages?.find((m) => m.role === "assistant" && m.text);
        if (reply) return reply;
      }
    }
    return data.chat.defaultReply || { text: "" };
  }

  /* ---------------------------------------------------------- sidebar */
  function navItem({ attrs, iconHtml, label, active, extra = "" }) {
    return `<button class="nav-item ${active ? "active" : ""}" ${attrs} title="${esc(label)}">${iconHtml}<span class="nav-label">${esc(label)}</span>${extra}</button>`;
  }

  function renderSidebar() {
    const chatMode = !isCowork();
    const chatNav = [
      ["chat-home", "compose", "New chat"],
      ["search", "search", "Search"],
      ["library", "library", "Library"],
      ["agents", "agent", "Agents"],
      ["notebooks", "notebook", "Notebooks"],
      ["create", "paint", "Create"]
    ];
    const coworkNav = [
      ["cowork-home", "add-circle", "New task"],
      ["tasks", "task-list", "My tasks"],
      ["scheduled", "calendar-clock", "Scheduled"],
      ["customize", "wand", "Customize"]
    ];
    const activeView = state.view === "conversation" ? "" : state.view === "session" ? "cowork-home" : state.view;
    const nav = (chatMode ? chatNav : coworkNav).map(([view, ic, label]) => navItem({ attrs: `data-nav="${view}"`, iconHtml: icon(ic, "nav-icon"), label, active: activeView === view && !(view === "agent") })).join("");

    let sections = "";
    if (chatMode) {
      const pinned = agents().map((agent) => navItem({
        attrs: `data-agent="${esc(agent.id)}"`,
        iconHtml: `<span class="agent-tile sm" style="--agent:${esc(agent.color || "#0f6cbd")}">${icon(GLYPHS[agent.glyph] || "agent")}</span>`,
        label: agent.title,
        active: state.view === "agent" && state.agentId === agent.id,
        extra: `<span class="nav-more" aria-hidden="true">${icon("more")}</span>`
      })).join("");
      const history = (data.chat.history || []).map((item) => navItem({
        attrs: `data-open-chat="${esc(item.chat || "")}"`,
        iconHtml: "",
        label: item.title,
        active: state.view === "conversation" && state.convo?.id && state.convo.id === item.chat,
        extra: `<span class="nav-more" aria-hidden="true">${icon("more")}</span>`
      })).join("");
      sections = `${pinned ? `<div class="nav-section"><div class="nav-section-label">Agents</div>${pinned}</div>` : ""}
        <div class="nav-section chats"><div class="nav-section-label">Chats</div>${history}</div>`;
    } else {
      const statusIcon = (t) => (t.status === "Complete" ? "check-circle" : t.status === "In progress" ? "sync" : "warning");
      sections = `<div class="nav-section chats"><div class="nav-section-label">Recent tasks</div>${(data.cowork.tasks || []).map((t) => navItem({
        attrs: `data-open-task="${esc(t.id)}"`,
        iconHtml: `<span class="task-dot ${esc(String(t.status).toLowerCase().replaceAll(" ", "-"))}">${icon(statusIcon(t))}</span>`,
        label: t.title,
        active: state.view === "session" && state.sessionTitle === t.title,
        extra: t.unread ? '<i class="unread-dot" aria-label="Unread"></i>' : ""
      })).join("")}</div>`;
    }

    els.sidebar.innerHTML = `
      <div class="sidebar-header">
        <button class="brand" data-nav="${chatMode ? "chat-home" : "cowork-home"}" aria-label="Copilot home">${logo("brand-logo")}<strong>Copilot</strong></button>
        <div class="sidebar-header-actions">
          <button class="icon-button" data-action="apps-launcher" aria-label="Microsoft 365 apps" aria-expanded="${state.appsOpen}" title="Apps">${icon("grid-dots")}</button>
          <button class="icon-button" data-action="collapse-sidebar" aria-label="${state.sidebarCollapsed ? "Expand" : "Collapse"} navigation" title="${state.sidebarCollapsed ? "Expand" : "Collapse"} navigation">${icon(state.sidebarCollapsed ? "panel-expand" : "panel-contract")}</button>
        </div>
      </div>
      <div class="mode-switch" role="tablist" aria-label="Copilot mode">
        <button role="tab" data-mode="chat" class="${chatMode ? "active" : ""}" aria-selected="${chatMode}">${icon("chat")}<span>Chat</span></button>
        <button role="tab" data-mode="cowork" class="${chatMode ? "" : "active"}" aria-selected="${!chatMode}">${icon("clipboard-task")}<span>Cowork</span></button>
      </div>
      <nav class="sidebar-nav" id="primary-nav">
        <div class="nav-main">${nav}</div>
        ${sections}
      </nav>
      <footer class="account-row">
        <span class="avatar">${esc(initials())}</span>
        <span class="account-copy"><strong>${esc(userName())}</strong><small>${esc(data.user.plan)}</small></span>
        <button class="icon-button" data-action="settings" aria-label="Settings" title="Settings">${icon("settings")}</button>
      </footer>`;
  }

  function syncChrome() {
    els.shell.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    els.shell.classList.toggle("nav-open", state.mobileNav);
    $("#main").dataset.view = state.view;
    $$("[data-bind]").forEach((node) => {
      const key = node.dataset.bind;
      if (key === "initials") node.textContent = initials();
      else if (data.app[key] !== undefined) node.textContent = fill(data.app[key]);
    });
    document.title = `${data.app.windowTitle || "Copilot"} — Training Mock`;
  }

  /* --------------------------------------------------------- composer */
  const COMPOSERS = {
    chat: { form: "chat-composer", input: "chat-input" },
    cowork: { form: "task-composer", input: "task-input" },
    agent: { form: "agent-composer", input: "agent-input" },
    followup: { form: "followup-composer", input: "followup-input" }
  };

  function captureDrafts() {
    $$(".composer-input").forEach((input) => { state.drafts[input.dataset.kind] = input.value; });
  }

  function referenceMenu() {
    const refs = data.chat.references || {};
    const web = state.grounding === "Web";
    const tabs = web ? [] : [["recent", "Recent"], ["files", "Files"], ["people", "People"], ["meetings", "Meetings"], ["emails", "Emails"]].filter(([id]) => (refs[id] || []).length);
    const active = tabs.some(([id]) => id === state.referenceTab) ? state.referenceTab : tabs[0]?.[0];
    const items = active ? refs[active] || [] : [];
    return `<div class="reference-menu popover" id="reference-menu" role="dialog" aria-label="Add content">
      <div class="reference-head"><strong>Add work content</strong><button type="button" class="icon-button sm" data-action="close-references" aria-label="Close">${icon("dismiss")}</button></div>
      ${tabs.length ? `<div class="reference-tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" class="${id === active ? "active" : ""}" aria-selected="${id === active}" data-reference-tab="${id}">${label}</button>`).join("")}</div>
      <div class="reference-list">${items.map((item) => `<button type="button" class="reference-item" data-source-id="${esc(item.id)}" data-source-tab="${esc(active)}">${kindIcon(item.kind)}<span><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></span>${state.attachments.some((a) => a.id === item.id) ? icon("check", "ref-added") : ""}</button>`).join("")}</div>` : `<p class="reference-note">Work content is off. Switch to Work to add files, people, meetings, and email.</p>`}
      <div class="reference-foot"><button type="button" class="menu-row" data-action="upload-demo-file">${icon("attach")}<span>Upload images and files</span></button></div>
    </div>`;
  }

  function attachmentChips(list, removable) {
    if (!list?.length) return "";
    return `<div class="attachment-strip">${list.map((a) => `<span class="attachment-chip">${kindIcon(a.kind)}<span>${esc(a.title)}</span>${removable ? `<button type="button" data-remove-source="${esc(a.id)}" aria-label="Remove ${esc(a.title)}">${icon("dismiss")}</button>` : ""}</span>`).join("")}</div>`;
  }

  function composer(kind, { placeholder, grounding = true, model = true, compact = false } = {}) {
    const ids = COMPOSERS[kind];
    const draft = state.drafts[kind] || "";
    const allowRefs = kind === "chat" || kind === "agent";
    const ph = placeholder || (state.grounding === "Web" && grounding ? data.app.webPlaceholder : data.app.chatPlaceholder) || "";
    return `<form class="composer ${compact ? "compact" : ""} ${draft.trim() ? "has-text" : ""} ${state.streaming ? "is-streaming" : ""}" id="${ids.form}" data-composer="${kind}" autocomplete="off">
      ${allowRefs ? attachmentChips(state.attachments, true) : ""}
      <textarea class="composer-input" id="${ids.input}" data-kind="${kind}" rows="1" aria-label="${esc(ph)}" placeholder="${esc(ph)}">${esc(draft)}</textarea>
      <div class="composer-toolbar">
        <div class="composer-left">
          <button type="button" class="tool-btn" data-action="attachment" aria-label="Add content" title="Add content" aria-expanded="${state.referenceOpen}">${icon("add")}</button>
          ${grounding ? `<div class="grounding-toggle" role="radiogroup" aria-label="Grounding">
            ${["Work", "Web"].map((g) => `<button type="button" role="radio" aria-checked="${state.grounding === g}" class="${state.grounding === g ? "active" : ""}" data-grounding="${g}">${icon(g === "Work" ? "briefcase" : "globe")}<span>${esc(data.app.groundingLabels?.[g] || g)}</span></button>`).join("")}
          </div>` : ""}
        </div>
        <div class="composer-right">
          ${model ? `<button type="button" class="model-pill" data-action="model-menu" aria-haspopup="menu" aria-expanded="false" title="Choose a model"><span data-model-label>${esc(selectedModel().name)}</span>${icon("chevron-down", "chev")}</button>` : ""}
          <button type="button" class="tool-btn" data-action="voice" aria-label="Use voice input" title="Dictate">${icon("mic")}</button>
          <button type="${state.streaming ? "button" : "submit"}" class="send-btn" ${state.streaming ? 'data-action="stop"' : ""} aria-label="${state.streaming ? "Stop generating" : "Send"}" title="${state.streaming ? "Stop" : "Send"}">${icon(state.streaming ? "stop" : "arrow-up")}</button>
        </div>
      </div>
      ${allowRefs && state.referenceOpen ? referenceMenu() : ""}
    </form>`;
  }

  function autoGrow(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    textarea.closest(".composer")?.classList.toggle("has-text", !!textarea.value.trim());
  }

  /* ------------------------------------------------------------ topbar */
  function renderTopbar() {
    const expand = state.sidebarCollapsed ? `<button class="icon-button" data-action="collapse-sidebar" aria-label="Expand navigation" title="Expand navigation">${icon("panel-expand")}</button>` : "";
    let left = "";
    let right = "";
    if (state.view === "conversation" && state.convo) {
      left = `<button class="topbar-title" data-action="conversation-menu">${esc(state.convo.title || "New chat")}${icon("chevron-down", "chev")}</button>`;
      right = `<button class="ghost-button" data-action="share-chat">${icon("share")}<span>Share</span></button>
        <button class="icon-button" data-action="conversation-menu" aria-label="More options" title="More options">${icon("more")}</button>
        <button class="icon-button" data-nav="chat-home" aria-label="New chat" title="New chat">${icon("compose")}</button>`;
    } else if (state.view === "agent") {
      const agent = agents().find((a) => a.id === state.agentId);
      left = agent ? `<span class="topbar-agent"><span class="agent-tile xs" style="--agent:${esc(agent.color)}">${icon(GLYPHS[agent.glyph] || "agent")}</span>${esc(agent.title)}</span>` : "";
      right = `<button class="icon-button" data-action="agent-menu" aria-label="Agent options">${icon("more")}</button>`;
    } else if (state.view === "chat-home") {
      right = `<button class="icon-button" data-action="history" aria-label="Chat history" title="History">${icon("history")}</button>`;
    }
    els.topbar.innerHTML = `<div class="topbar-left">${expand}${left}</div><div class="topbar-right">${right}</div>`;
    els.topbar.hidden = !expand && !left && !right;
  }

  /* -------------------------------------------------------- chat views */
  function suggestionCards(list) {
    return (list || []).map((item) => `<button class="prompt-card" data-prompt="${esc(item.prompt)}">
      <span class="prompt-card-icon">${icon(GLYPHS[item.icon] || "sparkle")}</span>
      <span class="prompt-card-copy"><strong>${esc(item.label)}</strong><small>${esc(item.prompt)}</small></span>
    </button>`).join("");
  }

  function renderChatHome() {
    els.workspace.className = "workspace home-view chat-home";
    els.workspace.innerHTML = `<div class="home-inner">
      <div class="home-logo">${logo()}</div>
      <h1 class="greeting">${esc(fill(data.app.greeting))}</h1>
      <div class="composer-wrap">${composer("chat")}</div>
      <div class="prompt-grid" aria-label="Suggested prompts">${suggestionCards(data.chat.suggestions)}</div>
      <p class="disclaimer">${esc(data.app.disclaimer)}</p>
    </div>`;
  }

  function statusLine(msg) {
    if (!msg.status && !msg.pending) return "";
    if (msg.pending) return `<div class="progress-line active" role="status"><span class="spinner" aria-hidden="true"></span><span class="shimmer">${esc(msg.status || "Reasoning")}</span></div>`;
    return `<div class="progress-line done">${icon("check-circle")}<span>${esc(msg.status)}</span>${icon("chevron-down", "chev")}</div>`;
  }

  function referencesBlock(msg, index) {
    const sources = msg.sources || [];
    if (!sources.length || msg.pending || msg.streaming) return "";
    const collapsed = !!state.refsCollapsed[index];
    return `<div class="references ${collapsed ? "collapsed" : ""}">
      <button type="button" class="refs-toggle" data-action="toggle-refs" data-msg="${index}" aria-expanded="${!collapsed}">${sources.length} reference${sources.length === 1 ? "" : "s"}${icon("chevron-down", "chev")}</button>
      <div class="ref-list">${sources.map((s, k) => `<button type="button" class="ref-card" data-ref="${k + 1}" data-msg="${index}" title="${esc(s.title)}"><span class="ref-num">${k + 1}</span>${kindIcon(s.kind)}<span class="ref-copy"><strong>${esc(s.title)}</strong><small>${esc(s.meta || "")}</small></span></button>`).join("")}</div>
    </div>`;
  }

  function answerActions(index) {
    const fb = state.feedback[index];
    return `<div class="answer-actions" role="toolbar" aria-label="Response actions">
      <button type="button" data-action="copy-answer" data-msg="${index}" aria-label="Copy" title="Copy">${icon("copy")}</button>
      <button type="button" data-action="like-answer" data-msg="${index}" class="${fb === "up" ? "on" : ""}" aria-label="Like" title="Like">${icon("thumb-up")}</button>
      <button type="button" data-action="dislike-answer" data-msg="${index}" class="${fb === "down" ? "on" : ""}" aria-label="Dislike" title="Dislike">${icon("thumb-down")}</button>
      <button type="button" data-action="regenerate-answer" data-msg="${index}" aria-label="Regenerate" title="Regenerate">${icon("sync")}</button>
      <button type="button" class="labeled" data-action="edit-in-pages" data-msg="${index}" title="Edit in Pages">${icon("pages")}<span>Edit in Pages</span></button>
      <button type="button" data-action="share-answer" data-msg="${index}" aria-label="Share" title="Share">${icon("share")}</button>
      <button type="button" data-action="answer-menu" data-msg="${index}" aria-label="More" title="More">${icon("more")}</button>
    </div>`;
  }

  function assistantBody(msg, index) {
    let html = md(msg.text, { sources: msg.sources || [], msg: index });
    if (msg.streaming) {
      const caret = '<span class="caret"></span>';
      const at = html.search(/<\/(p|li|h\d|td|th)>(?![\s\S]*<\/(p|li|h\d|td|th)>)/);
      html = at >= 0 ? html.slice(0, at) + caret + html.slice(at) : html + caret;
    }
    const body = msg.pending ? "" : `<div class="md">${html}</div>`;
    return `${body}${referencesBlock(msg, index)}${msg.pending || msg.streaming ? "" : answerActions(index)}`;
  }

  function renderMessage(msg, index, opts = {}) {
    if (msg.role === "user") {
      return `<div class="msg user" data-msg="${index}">
        ${attachmentChips(msg.attachments, false)}
        <div class="bubble">${inline(msg.text)}</div>
        <div class="user-actions"><button type="button" data-action="copy-prompt" data-msg="${index}" aria-label="Copy" title="Copy">${icon("copy")}</button><button type="button" data-action="edit-prompt" data-msg="${index}" aria-label="Edit" title="Edit">${icon("edit")}</button></div>
      </div>`;
    }
    const agent = opts.agent;
    return `<article class="msg assistant" data-msg="${index}">
      <div class="assistant-head">${agent ? `<span class="agent-tile xs" style="--agent:${esc(agent.color)}">${icon(GLYPHS[agent.glyph] || "agent")}</span>` : logo("msg-logo")}${msg.status || msg.pending ? statusLine(msg) : `<span>${esc(agent?.title || "Copilot")}</span>`}</div>
      <div class="assistant-body">${assistantBody(msg, index)}</div>
    </article>`;
  }

  function renderConversation() {
    const convo = state.convo;
    state.grounding = convo.grounding || state.grounding;
    els.workspace.className = "workspace conversation-view";
    els.workspace.innerHTML = `<div class="thread-scroll" id="thread-scroll"><div class="thread">${convo.messages.map((m, i) => renderMessage(m, i)).join("")}</div></div>
      <div class="composer-dock">${composer("chat", { compact: true })}<p class="disclaimer">${esc(data.app.disclaimer)}</p></div>`;
  }

  function updateMessageNode(index) {
    const msg = state.convo?.messages[index];
    const wrap = $(`.msg[data-msg="${index}"]`, els.workspace);
    if (!wrap || !msg) return;
    const head = $(".assistant-head", wrap);
    const status = msg.status || msg.pending ? statusLine(msg) : `<span>Copilot</span>`;
    if (head && head.dataset.status !== status) { head.dataset.status = status; head.innerHTML = logo("msg-logo") + status; }
    $(".assistant-body", wrap).innerHTML = assistantBody(msg, index);
  }

  function scrollThread(toBottom = true) {
    const scroller = $("#thread-scroll");
    if (!scroller) return;
    if (toBottom) scroller.scrollTop = scroller.scrollHeight;
    else scroller.scrollTop = 0;
  }

  function searchView() {
    const s = data.chat.search;
    const form = `<form class="feature-search" id="copilot-search" role="search">${icon("search")}<input aria-label="Search your work" placeholder="Search your work" value="${esc(state.searchQuery)}" /><button type="submit" class="primary-button sm">Search</button></form>`;
    if (!state.searchQuery) {
      return `<div class="page"><header class="page-heading"><div><h1>Search</h1><p>Find people, chats, meetings, and files across your work.</p></div></header>${form}
        <div class="chip-row"><span class="chip-label">Try</span>${(s.tryTerms || []).map((t) => `<button class="chip" data-search-term="${esc(t)}">${esc(t)}</button>`).join("")}</div>
        <section class="page-section"><h2>Recommended</h2><div class="card-grid two">${(s.recommended || []).map((r) => `<button class="list-card" data-search-term="${esc(r.title)}">${kindIcon(r.kind, "lg")}<span><strong>${esc(r.title)}</strong><small>${esc(r.meta)}</small><em>${icon("sparkle")}${esc(r.prompt)}</em></span></button>`).join("")}</div></section></div>`;
    }
    const filters = ["All", "Files", "People", "Meetings", "Chats"];
    const results = (s.results || []).filter((r) => state.searchFilter === "All" || r.type === state.searchFilter);
    return `<div class="page"><header class="page-heading"><div><h1>Search</h1></div></header>${form}
      <div class="tab-row" role="tablist">${filters.map((f) => `<button role="tab" aria-selected="${state.searchFilter === f}" class="${state.searchFilter === f ? "active" : ""}" data-search-filter="${f}">${f}</button>`).join("")}</div>
      <div class="results-summary"><strong>${results.length} results</strong> for “${esc(state.searchQuery)}”</div>
      <div class="result-list">${results.map((r) => `<button class="result-row" data-action="open-search-result">${kindIcon(r.kind, "lg")}<span class="result-copy"><strong>${esc(r.title)}</strong><small>${esc(r.meta)}</small><p>${esc(r.snippet)}</p></span>${icon("more", "result-more")}</button>`).join("")}</div></div>`;
  }

  function libraryView() {
    return `<div class="page"><header class="page-heading"><div><h1>Library</h1><p>Files and content you’ve created with Copilot.</p></div></header>
      <div class="tab-row"><button class="active">All</button><button>Documents</button><button>Images</button><button>Pages</button></div>
      <div class="table-list"><div class="table-head"><span>Name</span><span>Modified</span><span></span></div>${(data.chat.library || []).map((f) => `<button class="table-row">${kindIcon(f.kind)}<strong>${esc(f.title)}</strong><small>${esc(f.updated)}</small>${icon("more", "row-more")}</button>`).join("")}</div></div>`;
  }

  function agentsView() {
    const card = (a, attrs, badge) => `<button class="agent-card" ${attrs}><span class="agent-tile lg" style="--agent:${esc(a.color || "#0f6cbd")}">${icon(GLYPHS[a.glyph] || "agent")}</span><span><strong>${esc(a.title)}</strong><small>${esc(a.description || "")}</small></span>${badge ? `<i class="badge">${badge}</i>` : ""}</button>`;
    return `<div class="page"><header class="page-heading"><div><h1>Agents</h1><p>Use agents for specialized tasks and workflows.</p></div><button class="secondary-button" data-action="create-agent">${icon("add")}<span>Create agent</span></button></header>
      <section class="page-section"><h2>Pinned</h2><div class="card-grid three">${agents().map((a) => card(a, `data-agent="${esc(a.id)}"`, icon("pin"))).join("")}</div></section>
      <section class="page-section"><h2>Built by Microsoft</h2><div class="card-grid three">${(data.chat.agentCatalog || []).map((a) => card(a, 'data-action="open-agent-demo"', "")).join("")}</div></section></div>`;
  }

  function notebooksView() {
    return `<div class="page"><header class="page-heading"><div><h1>Notebooks</h1><p>Bring files, chats, and notes together for focused work.</p></div><button class="primary-button" data-action="new-notebook">${icon("add")}<span>New notebook</span></button></header>
      <div class="card-grid three">${(data.chat.notebooks || []).map((n) => `<button class="notebook-card" style="--nb:${esc(n.color || "#0f6cbd")}"><span class="notebook-cover">${icon("notebook")}</span><strong>${esc(n.title)}</strong><small>${esc(n.sources)} sources · ${esc(n.updated || "")}</small></button>`).join("")}</div></div>`;
  }

  function createView() {
    return `<div class="page"><header class="page-heading"><div><h1>Create</h1><p>Make images, documents, presentations, and more.</p></div></header>
      <div class="card-grid four">${(data.chat.create || []).map((c) => `<button class="create-card" data-action="create-item" data-title="${esc(c.title)}"><span class="create-art">${kindIcon(c.kind, "xl")}</span><strong>${esc(c.title)}</strong><small>${esc(c.description)}</small></button>`).join("")}</div></div>`;
  }

  function renderChatPage() {
    els.workspace.className = "workspace page-view";
    const views = { search: searchView, library: libraryView, agents: agentsView, notebooks: notebooksView, create: createView };
    els.workspace.innerHTML = (views[state.view] || searchView)();
  }

  function renderAgent() {
    const agent = agents().find((a) => a.id === state.agentId) || agents()[0];
    if (!agent) { state.view = "agents"; return renderChatPage(); }
    const wf = data.workflow;
    const isWorkflow = agent.id === "workflow-agent";
    const plan = isWorkflow && state.workflowStatus !== "idle" ? `<section class="workflow-plan ${state.workflowStatus}">
      <header><div><span class="eyebrow">Workflow draft</span><h2>${esc(state.workflowPrompt || wf.completePrompt || "")}</h2></div><span class="state-badge ${state.workflowStatus === "complete" ? "active" : "draft"}">${state.workflowStatus === "complete" ? "Run complete" : "Ready to run"}</span></header>
      <ol class="step-list">${(wf.steps || []).map((s) => `<li class="${state.workflowStatus === "complete" ? "done" : ""}"><span class="step-mark">${state.workflowStatus === "complete" ? icon("check") : ""}</span><p><strong>${esc(s.title)}</strong><small>${esc(s.detail)}</small></p></li>`).join("")}</ol>
      ${state.workflowStatus === "complete" && wf.output ? `<div class="deliverable">${kindIcon(wf.output.kind, "lg")}<span><strong>${esc(wf.output.title)}</strong><small>${esc(wf.output.detail)}</small></span><button class="secondary-button sm" data-action="preview-file">${icon("open")}<span>Open</span></button></div>` : ""}
      <footer><button type="button" class="secondary-button" data-action="edit-workflow">Edit workflow</button><button type="button" class="primary-button" data-action="run-workflow">${icon("play")}<span>${state.workflowStatus === "complete" ? "Run again" : "Run workflow"}</span></button></footer>
    </section>` : "";
    els.workspace.className = "workspace home-view agent-home";
    els.workspace.innerHTML = `<div class="home-inner">
      <span class="agent-tile hero" style="--agent:${esc(agent.color)}">${icon(GLYPHS[agent.glyph] || "agent")}</span>
      <h1 class="greeting">${esc(agent.title)}</h1>
      <p class="agent-intro">${esc(isWorkflow ? wf.intro || agent.description : agent.description)}</p>
      <div class="composer-wrap">${composer("agent", { placeholder: `Message ${agent.title}`, grounding: false })}</div>
      <div class="chip-row center">${(agent.starters || []).map((s) => `<button class="chip" data-agent-prompt="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      ${plan}
    </div>`;
  }

  /* ------------------------------------------------------ cowork views */
  function renderCoworkHome() {
    const list = data.cowork.suggestions || [];
    els.workspace.className = "workspace home-view cowork-home";
    els.workspace.innerHTML = `<div class="home-inner">
      <span class="cowork-badge">${logo()}<span>Cowork</span></span>
      <h1 class="greeting" id="welcome-heading">${esc(fill(data.app.coworkGreeting || data.app.greeting))}</h1>
      <div class="composer-wrap">${composer("cowork", { placeholder: data.app.coworkPlaceholder, grounding: false })}</div>
      <div class="suggestions-heading"><strong>Try these next</strong><button class="text-button" data-action="show-more">${state.showAllSuggestions ? "Show less" : "Show more"}</button></div>
      <div class="suggestion-grid">${list.slice(0, state.showAllSuggestions ? list.length : 3).map((s) => `<button class="suggestion-card" data-prompt="${esc(s.prompt)}"><span class="suggestion-icon tone-${esc(s.icon)}">${icon(GLYPHS[s.icon] || "sparkle")}</span><span>${esc(s.label)}</span></button>`).join("")}</div>
      <div class="recent-strip"><span class="nav-section-label">Recent</span>${(data.cowork.tasks || []).slice(0, 2).map((t) => `<button data-open-task="${esc(t.id)}"><strong>${esc(t.title)}</strong><small>${esc(t.status)} · ${esc(t.time)}</small></button>`).join("")}</div>
    </div>`;
  }

  function sessionProgress() {
    const total = Math.max(1, task().steps.length);
    if (state.sessionScene === "complete") return { active: total, percent: 100 };
    if (state.sessionScene === "approval") { const active = Math.min(total - 1, 3); return { active, percent: Math.round((active / total) * 100) + 10 }; }
    const active = Math.min(total - 1, state.sessionStep);
    return { active, percent: Math.round((active / total) * 100) + 8 };
  }

  function stepList(progress, withDetail) {
    return `<ol class="step-list">${task().steps.map((s, i) => {
      const cls = i < progress.active ? "done" : i === progress.active && state.sessionScene !== "complete" ? "current" : "";
      const mark = cls === "done" ? icon("check") : cls === "current" ? '<span class="spinner sm"></span>' : "";
      return `<li class="${cls}"><span class="step-mark">${mark}</span><p><strong>${esc(s.title)}</strong>${withDetail && cls && s.detail ? `<small>${esc(s.detail)}</small>` : ""}</p></li>`;
    }).join("")}</ol>`;
  }

  function sessionAssistant(progress) {
    const t = task();
    const scene = state.sessionScene;
    const planCard = `<div class="plan-card"><header><span>${icon("task-list")}<strong>Plan</strong></span><small>${Math.min(progress.active, t.steps.length)} of ${t.steps.length} complete</small></header>${stepList(progress, true)}</div>`;
    const activity = (t.activity || []).slice(0, Math.max(1, progress.active + 1)).map((a) => `<li>${kindIcon(a.kind)}<span>${esc(a.text)}</span></li>`).join("");
    if (scene === "complete") {
      const c = t.complete || {};
      return `<div class="md">${md(c.text || "")}</div>
        <div class="deliverables">${(t.files || []).map((f) => `<div class="deliverable">${kindIcon(f.kind, "lg")}<span><strong>${esc(f.title)}</strong><small>${esc(f.detail || "")}</small></span><button class="secondary-button sm" data-action="preview-file">${icon("open")}<span>Open</span></button><button class="icon-button" data-action="download-file" aria-label="Download">${icon("download")}</button></div>`).join("")}</div>
        <div class="completion-note">${icon("check-circle")}<div><strong>Task complete</strong><p>${esc(c.stats || "")}</p></div></div>
        ${answerActions("session")}`;
    }
    if (scene === "approval") {
      const a = t.approval || {};
      return `<p>${esc(a.intro)}</p>${planCard}
        <div class="approval-card" role="group" aria-label="Approval request">
          <header>${icon("shield-check")}<strong>${esc(a.action)}</strong><span class="risk-badge">${esc(a.risk)}</span></header>
          <dl><div><dt>To</dt><dd>${esc(a.to)}</dd></div><div><dt>Subject</dt><dd>${esc(a.subject)}</dd></div></dl>
          <blockquote>${esc(a.body)}</blockquote>
          <button class="text-button" data-action="parameters">Show parameters</button>
          <footer><button class="secondary-button" data-action="skip-approval">Don’t send</button><span></span><button class="secondary-button" data-action="edit-approval">${icon("edit")}<span>Edit</span></button><button class="primary-button" data-action="approve-send">${icon("send")}<span>Send</span></button></footer>
        </div>`;
    }
    return `<p>${esc(t.intro)}</p>${planCard}
      ${activity ? `<ul class="activity-list">${activity}</ul>` : ""}
      <div class="work-card"><span class="spinner"></span><div><strong class="shimmer">${esc(state.paused ? "Paused" : t.steps[progress.active]?.title || t.runningStatus)}</strong><p>${esc(state.paused ? "Resume when you’re ready." : t.runningDetail)}</p></div><span class="work-pct">${progress.percent}%</span></div>`;
  }

  function sessionPanel(progress) {
    const t = task();
    const done = state.sessionScene === "complete";
    return `<aside class="session-panel" aria-label="Task details">
      <header><strong>Task details</strong><button class="icon-button" data-action="toggle-panel" aria-label="Close details">${icon("dismiss")}</button></header>
      <div class="panel-scroll">
        <section class="panel-section"><div class="panel-row"><strong>Progress</strong><span>${progress.percent}%</span></div><div class="progress-track"><i style="width:${progress.percent}%"></i></div>${stepList(progress, false)}</section>
        <details open><summary>Output <span class="count">${done ? (t.files || []).length : 0}</span></summary>${done ? (t.files || []).map((f) => `<button class="file-row" data-action="preview-file">${kindIcon(f.kind)}<span><strong>${esc(f.title)}</strong><small>${esc(f.detail || "")}</small></span></button>`).join("") : '<p class="panel-empty">Files Cowork creates will appear here.</p>'}</details>
        <details open><summary>Input <span class="count">${(t.inputs || []).length}</span></summary>${(t.inputs || []).map((f) => `<button class="file-row">${kindIcon(f.kind)}<span><strong>${esc(f.title)}</strong><small>${esc(f.detail || "")}</small></span></button>`).join("")}</details>
        <details open><summary>Skills <span class="count">${(t.skills || []).length}</span></summary><div class="skill-chips">${(t.skills || []).map((s) => `<span>${esc(s)}</span>`).join("")}</div></details>
        <details><summary>Schedule <span class="count">0</span></summary><p class="panel-empty">This task doesn’t repeat. <button class="text-button" data-action="create-schedule">Add a schedule</button></p></details>
        <details ${state.sessionScene === "approval" ? "open" : ""}><summary>Permissions <span class="count">${done || state.sessionScene === "approval" ? 1 : 0}</span></summary><p class="panel-empty">${state.sessionScene === "approval" ? "Waiting for approval to send 1 email." : done ? "1 email sent with your approval." : "Approvals you give will appear here."}</p></details>
      </div>
    </aside>`;
  }

  function renderSession() {
    const progress = sessionProgress();
    const scene = state.sessionScene;
    const statusLabel = scene === "complete" ? "Completed" : scene === "approval" ? "Needs your input" : state.paused ? "Paused" : "Working";
    els.workspace.className = `workspace session-view ${state.sidePanel ? "with-panel" : ""}`;
    els.workspace.innerHTML = `<section class="conversation-pane">
        <header class="session-header">
          <div class="session-title"><button class="icon-button" data-nav="cowork-home" aria-label="Back">${icon("chevron-left")}</button><span><strong>${esc(state.sessionTitle || task().title)}</strong><small class="status-${scene}">${scene === "running" && !state.paused ? '<span class="pulse"></span>' : ""}${esc(statusLabel)}</small></span></div>
          <div class="session-actions">${scene !== "complete" ? `<button class="ghost-button" data-action="pause">${icon(state.paused ? "play" : "pause")}<span>${state.paused ? "Resume" : "Pause"}</span></button>` : ""}<button class="ghost-button" data-action="toggle-panel">${icon(state.sidePanel ? "panel-contract" : "panel-expand")}<span>${state.sidePanel ? "Hide" : "Show"} details</span></button>${scene !== "complete" ? `<button class="ghost-button danger" data-action="cancel-task">Cancel</button>` : ""}</div>
        </header>
        <div class="thread-scroll"><div class="thread">
          <div class="msg user"><div class="bubble">${esc(state.prompt || task().prompt)}</div></div>
          <article class="msg assistant"><div class="assistant-head">${logo("msg-logo")}<span>Cowork</span></div><div class="assistant-body">${sessionAssistant(progress)}</div></article>
        </div></div>
        <div class="composer-dock">${composer("followup", { placeholder: "Add instructions or ask a follow-up", grounding: false, model: false, compact: true })}</div>
      </section>
      ${state.sidePanel ? sessionPanel(progress) : ""}`;
  }

  function renderTasks() {
    const statuses = ["All", "Needs your input", "In progress", "Complete", "Unread"];
    const tasks = (data.cowork.tasks || []).filter((t) => state.filter === "All" || (state.filter === "Unread" ? t.unread : t.status === state.filter));
    els.workspace.className = "workspace page-view";
    els.workspace.innerHTML = `<div class="page"><header class="page-heading"><div><h1>My tasks</h1><p>Tasks Cowork is working on or has finished.</p></div><button class="primary-button" data-nav="cowork-home">${icon("add")}<span>New task</span></button></header>
      <div class="tab-row pills" role="tablist">${statuses.map((s) => `<button class="${state.filter === s ? "active" : ""}" data-filter="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <div class="task-list">${tasks.length ? tasks.map((t) => `<button class="task-row" data-open-task="${esc(t.id)}">
        <span class="task-status ${esc(String(t.status).toLowerCase().replaceAll(" ", "-"))}">${icon(t.status === "Complete" ? "check-circle" : t.status === "In progress" ? "sync" : "warning")}</span>
        <span class="task-copy"><strong>${esc(t.title)}${t.unread ? '<i class="unread-dot" aria-label="Unread"></i>' : ""}</strong><small>${esc(t.preview)}</small></span>
        <span class="task-meta"><span class="status-pill ${esc(String(t.status).toLowerCase().replaceAll(" ", "-"))}">${esc(t.status)}</span><small>${esc(t.time)}</small></span>
        ${icon("chevron-right", "row-chevron")}</button>`).join("") : `<div class="empty-state">${icon("check-circle")}<h2>No tasks here</h2><p>Try another filter or start a new task.</p></div>`}</div></div>`;
  }

  function renderScheduled() {
    const runs = `<div class="task-list">${(data.cowork.runs || []).map((r) => `<div class="task-row static"><span class="task-status ${r.state === "success" ? "complete" : "in-progress"}">${icon(r.state === "success" ? "check-circle" : "calendar-clock")}</span><span class="task-copy"><strong>${esc(r.title)}</strong><small>${esc(r.detail)}</small></span><span class="task-meta"><small>${esc(r.time)}</small></span></div>`).join("")}</div>`;
    const cards = `<div class="schedule-list">${(data.cowork.schedules || []).map((s) => `<article class="schedule-card"><span class="schedule-icon">${icon(s.event ? "sparkle" : "calendar-clock")}</span><div class="schedule-copy"><div class="schedule-title"><h2>${esc(s.title)}</h2><span class="state-badge ${esc(String(s.state).toLowerCase())}">${esc(s.state)}</span></div><p>${esc(s.cadence)}</p><small>Next run: ${esc(s.next)}</small></div><label class="toggle" title="On/off"><input type="checkbox" ${s.state === "Active" ? "checked" : ""} data-action="toggle-schedule" /><i></i></label><button class="icon-button" data-action="schedule-menu" aria-label="Schedule options">${icon("more")}</button></article>`).join("")}</div>`;
    els.workspace.className = "workspace page-view";
    els.workspace.innerHTML = `<div class="page"><header class="page-heading"><div><h1>Scheduled</h1><p>Tasks that run on a schedule or when something happens.</p></div><button class="primary-button" data-action="create-schedule">${icon("add")}<span>Create</span></button></header>
      <div class="tab-row" role="tablist"><button data-schedule-tab="manage" class="${state.schedulesTab === "manage" ? "active" : ""}">Manage schedules</button><button data-schedule-tab="runs" class="${state.schedulesTab === "runs" ? "active" : ""}">Runs</button></div>
      ${state.schedulesTab === "runs" ? runs : cards}</div>`;
  }

  function renderCustomize() {
    const list = state.customizeTab === "plugins" ? data.cowork.plugins || [] : data.cowork.skills || [];
    els.workspace.className = "workspace page-view";
    els.workspace.innerHTML = `<div class="page"><header class="page-heading"><div><h1>Customize</h1><p>Skills and plugins help Cowork complete specialized work.</p></div><button class="primary-button" data-action="add-skill">${icon("add")}<span>Add</span></button></header>
      <div class="tab-row" role="tablist"><button data-customize-tab="skills" class="${state.customizeTab === "skills" ? "active" : ""}">Skills</button><button data-customize-tab="plugins" class="${state.customizeTab === "plugins" ? "active" : ""}">Plugins</button></div>
      <div class="card-grid three">${list.map((s, i) => `<div class="skill-card">${kindIcon(s.kind, "lg")}<span class="skill-copy"><strong>${esc(s.title)}</strong><small>${esc(s.description)}</small></span><label class="toggle"><input type="checkbox" ${s.enabled !== false ? "checked" : ""} data-action="toggle-skill" data-skill="${i}" /><i></i></label></div>`).join("")}</div></div>`;
  }

  /* ------------------------------------------------------------ render */
  function render() {
    if (!data) return;
    captureDrafts();
    syncChrome();
    renderSidebar();
    renderTopbar();
    switch (state.view) {
      case "conversation": state.convo ? renderConversation() : renderChatHome(); break;
      case "search": case "library": case "agents": case "notebooks": case "create": renderChatPage(); break;
      case "agent": renderAgent(); break;
      case "cowork-home": renderCoworkHome(); break;
      case "session": renderSession(); break;
      case "tasks": renderTasks(); break;
      case "scheduled": renderScheduled(); break;
      case "customize": renderCustomize(); break;
      default: state.view = "chat-home"; renderChatHome();
    }
    $$(".composer-input").forEach(autoGrow);
    if (!els.modelMenu.hidden) toggleModelMenu(false);
    hideCitePop();
  }

  function go(view, extra = {}) {
    stopStream();
    clearTimeout(sessionTimer);
    Object.assign(state, extra);
    state.view = view;
    state.referenceOpen = false;
    state.mobileNav = false;
    if (view !== "conversation") state.scene = extra.scene || sceneForView(view);
    render();
  }

  function sceneForView(view) {
    return ({ "chat-home": "chat", "cowork-home": "home", agent: "workflow-agent", session: state.sessionScene })[view] || view;
  }

  /* ---------------------------------------------------------- scenes */
  function openChat(id, sceneKey) {
    const convo = loadConversation(id);
    if (!convo) { toast(`No conversation “${id}” in demo data`); return false; }
    stopStream();
    state.convo = convo;
    state.grounding = convo.grounding;
    state.attachments = [];
    state.refsCollapsed = {};
    state.feedback = {};
    state.drafts.chat = "";
    go("conversation", { scene: sceneKey || "chat" });
    state.scene = sceneKey || "chat";
    scrollThread(false);
    return true;
  }

  function newChat() {
    state.convo = null;
    state.attachments = [];
    state.drafts.chat = "";
    state.grounding = "Work";
    go("chat-home");
  }

  function startTask(prompt, scene = "running", options = {}) {
    const t = task();
    state.prompt = String(prompt || t.prompt).trim() || t.prompt;
    state.sessionTitle = options.title || (state.prompt === t.prompt ? t.title : state.prompt.replace(/[.!?]+$/, ""));
    state.sessionScene = ["running", "approval", "complete"].includes(scene) ? scene : "running";
    state.sessionStep = 1;
    state.paused = false;
    go("session", { scene: state.sessionScene });
    if (options.animate && state.sessionScene === "running") advanceSession();
  }

  function advanceSession() {
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => {
      if (state.view !== "session" || state.sessionScene !== "running") return;
      if (state.paused) return advanceSession();
      if (state.sessionStep < 3) { state.sessionStep += 1; render(); advanceSession(); }
      else { state.sessionScene = "approval"; state.scene = "approval"; render(); }
    }, 2600);
  }

  function setScene(scene) {
    if (!supportedScenes.includes(scene)) { toast(`Unknown scene: ${scene}`); return; }
    state.mobileNav = false;
    if (data.scenes[scene]) { openChat(data.scenes[scene], scene); return; }
    switch (scene) {
      case "chat": newChat(); break;
      case "home": go("cowork-home", { scene }); break;
      case "running": case "approval": case "complete": startTask(state.prompt || task().prompt, scene); break;
      case "tasks": case "scheduled": case "customize": go(scene, { scene }); break;
      case "search": go("search", { searchQuery: "", searchFilter: "All", scene }); break;
      case "search-results": go("search", { searchQuery: data.chat.search.demoQuery || "", searchFilter: "All", scene }); break;
      case "library": case "agents": case "notebooks": case "create": go(scene, { scene }); break;
      case "workflow-agent": go("agent", { agentId: "workflow-agent", workflowStatus: "idle", workflowPrompt: "", scene }); break;
      case "workflow-complete": go("agent", { agentId: "workflow-agent", workflowStatus: "complete", workflowPrompt: data.workflow.completePrompt || "", scene }); break;
      default: newChat();
    }
    state.scene = scene;
  }

  /* ------------------------------------------------------- chat engine */
  function ensureConversation(title) {
    if (state.view === "conversation" && state.convo) return;
    state.convo = { id: null, title: String(title || "New chat").slice(0, 60), grounding: state.grounding, messages: [] };
    state.refsCollapsed = {};
    state.feedback = {};
    state.view = "conversation";
    state.scene = "chat";
  }

  function addMessage(role, text, extra = {}) {
    stopStream();
    ensureConversation(text);
    state.convo.messages.push({ role: role === "user" ? "user" : "assistant", text: String(text ?? ""), ...extra });
    state.convo.dirty = true;
    render();
    scrollThread(true);
    return state.convo.messages.length - 1;
  }

  function stopStream() {
    if (!state.streaming) return;
    streamToken += 1;
    state.streaming = false;
    const last = state.convo?.messages.at(-1);
    if (last) { last.pending = false; last.streaming = false; }
  }

  async function streamReply(markdown, opts = {}) {
    const speed = Math.max(0.1, Number(opts.speed) || 1);
    ensureConversation(opts.title || "New chat");
    stopStream();
    const token = ++streamToken;
    const msg = { role: "assistant", text: "", pending: true, streaming: true, status: opts.progress || progressLabel(opts.status), sources: opts.sources || [] };
    state.convo.messages.push(msg);
    state.convo.dirty = true;
    state.streaming = true;
    const index = state.convo.messages.length - 1;
    render();
    scrollThread(true);
    const think = opts.thinkMs ?? (state.model === "think-deeper" ? 2600 : 1500);
    await sleep(think / speed);
    if (token !== streamToken) return false;
    msg.pending = false;
    msg.status = opts.status || null;
    const parts = String(markdown ?? "").split(/(\s+)/);
    let shown = 0;
    const perTick = 2;
    while (shown < parts.length) {
      if (token !== streamToken) return false;
      shown = Math.min(parts.length, shown + perTick * 2);
      msg.text = parts.slice(0, shown).join("");
      updateMessageNode(index);
      const scroller = $("#thread-scroll");
      if (scroller && scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 160) scroller.scrollTop = scroller.scrollHeight;
      await sleep(42 / speed);
    }
    if (token !== streamToken) return false;
    msg.streaming = false;
    state.streaming = false;
    render();
    scrollThread(true);
    return true;
  }

  async function submitChat(text, opts = {}) {
    const clean = String(text || "").trim();
    if (!clean || state.streaming) return;
    state.drafts.chat = "";
    ensureConversation(clean);
    state.convo.messages.push({ role: "user", text: clean, attachments: state.attachments.length ? clone(state.attachments) : undefined });
    state.convo.dirty = true;
    state.attachments = [];
    state.referenceOpen = false;
    const reply = findReply(clean);
    render();
    scrollThread(true);
    await sleep(250);
    return streamReply(reply.text, { status: reply.status, progress: reply.progress, sources: reply.sources, speed: opts.speed });
  }

  async function typePrompt(text, opts = {}) {
    const speed = Math.max(0.1, Number(opts.speed) || 1);
    let input = $(".composer-input");
    if (!input) { if (isCowork()) go("cowork-home"); else newChat(); input = $(".composer-input"); }
    if (!input) return false;
    const token = ++typePrompt.token;
    input.focus();
    input.value = "";
    autoGrow(input);
    for (const ch of String(text)) {
      if (token !== typePrompt.token) return false;
      input.value += ch;
      autoGrow(input);
      await sleep((/[ ,.]/.test(ch) ? 70 : 38) / speed);
    }
    state.drafts[input.dataset.kind] = input.value;
    if (opts.submit) {
      await sleep(350 / speed);
      input.closest("form")?.requestSubmit();
    }
    return true;
  }
  typePrompt.token = 0;

  /* ------------------------------------------------------- model menu */
  function renderModelMenu() {
    const group = (g, label) => {
      const list = models().filter((m) => (m.group || "model") === g);
      return list.length ? `<div class="menu-group-label">${label}</div>${list.map((m) => `<button role="menuitemradio" aria-checked="${m.id === state.model}" data-model="${esc(m.id)}"><span class="menu-check">${m.id === state.model ? icon("check") : ""}</span><span><strong>${esc(m.name)}</strong><small>${esc(m.description || "")}</small></span></button>`).join("")}` : "";
    };
    els.modelMenu.innerHTML = group("style", "Response style") + group("model", "Models");
  }

  function toggleModelMenu(force, anchor) {
    const open = typeof force === "boolean" ? force : els.modelMenu.hidden;
    if (open) renderModelMenu();
    els.modelMenu.hidden = !open;
    $$('[data-action="model-menu"]').forEach((b) => b.setAttribute("aria-expanded", String(open && b === anchor)));
    if (open && anchor) {
      const rect = anchor.getBoundingClientRect();
      const menuRect = els.modelMenu.getBoundingClientRect();
      const left = Math.max(8, Math.min(window.innerWidth - menuRect.width - 8, rect.right - menuRect.width));
      const below = rect.bottom + 6;
      const top = below + menuRect.height > window.innerHeight - 8 ? rect.top - menuRect.height - 6 : below;
      els.modelMenu.style.left = `${left}px`;
      els.modelMenu.style.top = `${Math.max(8, top)}px`;
    }
  }

  function toggleApps(force) {
    state.appsOpen = typeof force === "boolean" ? force : !state.appsOpen;
    els.apps.hidden = !state.appsOpen;
    $$('[data-action="apps-launcher"]').forEach((b) => b.setAttribute("aria-expanded", String(state.appsOpen)));
  }

  /* -------------------------------------------------- citation popover */
  let citePop = null;
  function showCitePop(button) {
    const msg = state.convo?.messages[Number(button.dataset.msg)];
    const source = msg?.sources?.[Number(button.dataset.cite) - 1];
    if (!source) return;
    if (!citePop) { citePop = document.createElement("div"); citePop.className = "cite-pop popover"; document.body.append(citePop); }
    citePop.innerHTML = `<div class="cite-pop-head">${kindIcon(source.kind, "lg")}<span><strong>${esc(source.title)}</strong><small>${esc(source.meta || "")}</small></span></div><button type="button" class="menu-row" data-action="open-source">${icon("open")}<span>Open</span></button>`;
    citePop.hidden = false;
    const rect = button.getBoundingClientRect();
    const w = 300;
    citePop.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, rect.left - 20))}px`;
    citePop.style.top = `${rect.bottom + 6}px`;
    $$(`.ref-card[data-msg="${button.dataset.msg}"]`).forEach((c) => c.classList.toggle("flash", c.dataset.ref === button.dataset.cite));
  }
  function hideCitePop() { if (citePop) citePop.hidden = true; $$(".ref-card.flash").forEach((c) => c.classList.remove("flash")); }

  /* ------------------------------------------------------------ studio */
  function toggleStudio(force) {
    state.studioOpen = typeof force === "boolean" ? force : !state.studioOpen;
    els.studioPanel.classList.toggle("open", state.studioOpen);
    els.studioPanel.setAttribute("aria-hidden", String(!state.studioOpen));
    els.studioBackdrop.hidden = !state.studioOpen;
    if (state.studioOpen) syncStudio();
  }

  function populateStudio() {
    $("#studio-scene").innerHTML = SCENES.map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join("");
    $("#studio-chat").innerHTML = `<option value="">— choose a conversation —</option>${Object.entries(data.conversations).map(([id, c]) => `<option value="${esc(id)}">${esc(c.title || id)}</option>`).join("")}`;
    $("#studio-model").innerHTML = models().map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("");
  }

  function syncStudio() {
    populateStudio();
    $("#studio-scene").value = state.scene;
    $("#studio-chat").value = state.convo?.id || "";
    $("#studio-name").value = userName();
    $("#studio-prompt").value = state.prompt || task().prompt || "";
    $("#studio-model").value = state.model;
    $("#studio-theme").value = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    $("#studio-side-panel").checked = state.sidePanel;
  }

  function applyStudio() {
    const name = $("#studio-name").value.trim();
    state.nameOverride = name && name !== data.user.name ? name : null;
    state.prompt = $("#studio-prompt").value.trim();
    state.model = $("#studio-model").value || state.model;
    state.sidePanel = $("#studio-side-panel").checked;
    setTheme($("#studio-theme").value);
    setScene($("#studio-scene").value);
    toast("Demo scene updated");
  }

  function setTheme(theme) {
    if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#1f1f1f" : "#f5f5f5";
  }

  function sceneLink() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("scene", state.scene);
    if (state.view === "conversation" && state.convo?.id) url.searchParams.set("chat", state.convo.id);
    if (state.nameOverride) url.searchParams.set("name", state.nameOverride);
    if (state.prompt && state.prompt !== task().prompt) url.searchParams.set("prompt", state.prompt);
    if (state.model !== "auto") url.searchParams.set("model", state.model);
    if (!state.sidePanel) url.searchParams.set("panel", "0");
    if (document.documentElement.dataset.theme === "dark") url.searchParams.set("theme", "dark");
    return url.toString();
  }

  function resetDemo() {
    Object.assign(state, { nameOverride: null, prompt: "", model: "auto", sidePanel: true, grounding: "Work", convo: null, drafts: {}, attachments: [], searchQuery: "", searchFilter: "All", workflowPrompt: "", workflowStatus: "idle", sidebarCollapsed: false, filter: "All", showAllSuggestions: false });
    setScene("chat");
  }

  /* ------------------------------------------------------------ events */
  function onClick(event) {
    const t = event.target;
    if (state.appsOpen && !t.closest("#apps-launcher") && !t.closest('[data-action="apps-launcher"]')) toggleApps(false);
    if (!t.closest("#model-menu") && !t.closest('[data-action="model-menu"]') && !els.modelMenu.hidden) toggleModelMenu(false);
    if (!t.closest(".cite") && !t.closest(".cite-pop")) hideCitePop();
    if (state.referenceOpen && !t.closest("#reference-menu") && !t.closest('[data-action="attachment"]') && !t.closest("[data-source-id]")) { state.referenceOpen = false; render(); }

    const b = t.closest("button");
    if (!b || b.closest(".mk-editor")) return;
    const ds = b.dataset;

    if (ds.cite) { event.preventDefault(); showCitePop(b); return; }
    if (ds.model) { state.model = ds.model; toggleModelMenu(false); $$("[data-model-label]").forEach((n) => { n.textContent = selectedModel().name; }); toast(`${selectedModel().name} selected`); return; }
    if (ds.mode) { if (ds.mode === "chat") (state.convo ? go("conversation") : newChat()); else go("cowork-home"); return; }
    if (ds.nav) { if (ds.nav === "chat-home") newChat(); else if (ds.nav === "search") go("search", { searchQuery: "", searchFilter: "All" }); else go(ds.nav); return; }
    if (ds.agent) { go("agent", { agentId: ds.agent, workflowStatus: ds.agent === "workflow-agent" ? state.workflowStatus : "idle" }); return; }
    if (ds.openChat !== undefined) { if (ds.openChat) openChat(ds.openChat); else toast("This chat has no conversation in demo data"); return; }
    if (ds.openTask) { const tk = (data.cowork.tasks || []).find((x) => String(x.id) === ds.openTask); if (tk) startTask(tk.title, tk.opens || "complete", { title: tk.title }); return; }
    if (ds.grounding) {
      captureDrafts();
      state.grounding = ds.grounding;
      if (state.convo) state.convo.grounding = ds.grounding;
      render();
      toast(ds.grounding === "Work" ? "Work: answers use your emails, meetings, chats, and files" : "Web: answers use public web content");
      return;
    }
    if (ds.prompt) {
      const input = $(".composer-input");
      if (input) { input.value = ds.prompt; autoGrow(input); input.focus(); state.drafts[input.dataset.kind] = ds.prompt; }
      return;
    }
    if (ds.agentPrompt) { const input = $("#agent-input"); if (input) { input.value = ds.agentPrompt; autoGrow(input); input.focus(); } return; }
    if (ds.searchTerm) { go("search", { searchQuery: ds.searchTerm, searchFilter: "All", scene: "search-results" }); return; }
    if (ds.searchFilter) { go("search", { searchFilter: ds.searchFilter }); return; }
    if (ds.referenceTab) { captureDrafts(); state.referenceTab = ds.referenceTab; state.referenceOpen = true; render(); return; }
    if (ds.sourceId) {
      const item = (data.chat.references[ds.sourceTab] || []).find((x) => x.id === ds.sourceId);
      captureDrafts();
      if (item && !state.attachments.some((a) => a.id === item.id)) state.attachments.push({ id: item.id, kind: item.kind, title: item.title });
      state.referenceOpen = false;
      render();
      $(".composer-input")?.focus();
      return;
    }
    if (ds.removeSource) { captureDrafts(); state.attachments = state.attachments.filter((a) => a.id !== ds.removeSource); render(); return; }
    if (ds.filter) { go("tasks", { filter: ds.filter }); return; }
    if (ds.scheduleTab) { go("scheduled", { schedulesTab: ds.scheduleTab }); return; }
    if (ds.customizeTab) { go("customize", { customizeTab: ds.customizeTab }); return; }

    const index = Number(ds.msg);
    switch (ds.action) {
      case "model-menu": toggleModelMenu(els.modelMenu.hidden, b); break;
      case "apps-launcher": toggleApps(); break;
      case "all-apps": toast("All Microsoft 365 apps"); break;
      case "launch-app": toast(`Opening ${ds.app || "app"}…`); toggleApps(false); break;
      case "collapse-sidebar": state.sidebarCollapsed = !state.sidebarCollapsed; render(); break;
      case "mobile-nav": state.mobileNav = !state.mobileNav; syncChrome(); break;
      case "titlebar-search": go("search", { searchQuery: "", searchFilter: "All" }); $("#copilot-search input")?.focus(); break;
      case "attachment": {
        const kind = b.closest("[data-composer]")?.dataset.composer;
        if (kind === "chat" || kind === "agent") { captureDrafts(); state.referenceOpen = !state.referenceOpen; render(); }
        else toast("Add files, people, meetings, or email as context");
        break;
      }
      case "close-references": state.referenceOpen = false; render(); break;
      case "upload-demo-file": {
        const up = data.chat.references.upload;
        captureDrafts();
        if (up && !state.attachments.some((a) => a.id === up.id)) state.attachments.push({ id: up.id, kind: up.kind, title: up.title });
        state.referenceOpen = false;
        render();
        break;
      }
      case "voice": b.classList.toggle("recording"); toast(b.classList.contains("recording") ? "Listening…" : "Dictation stopped"); break;
      case "stop": stopStream(); render(); toast("Response stopped"); break;
      case "toggle-refs": state.refsCollapsed[index] = !state.refsCollapsed[index]; updateMessageNode(index); break;
      case "copy-answer": case "copy-prompt": {
        const text = ds.msg === "session" ? "" : state.convo?.messages[index]?.text || "";
        navigator.clipboard?.writeText(text).catch(() => {});
        toast("Copied");
        break;
      }
      case "like-answer": case "dislike-answer": {
        const v = ds.action === "like-answer" ? "up" : "down";
        state.feedback[index] = state.feedback[index] === v ? null : v;
        b.parentElement.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        if (state.feedback[index]) b.classList.add("on");
        toast("Thanks for your feedback");
        break;
      }
      case "regenerate-answer": {
        const msg = state.convo?.messages[index];
        if (msg && !state.streaming) { state.convo.messages.splice(index, 1); streamReply(msg.text, { status: msg.status, sources: msg.sources }); }
        break;
      }
      case "edit-in-pages": toast("Opening in Pages…"); break;
      case "share-answer": case "share-chat": toast("Share link ready: people in your organization can view"); break;
      case "edit-prompt": { const msg = state.convo?.messages[index]; const input = $("#chat-input"); if (msg && input) { input.value = msg.text; autoGrow(input); input.focus(); } break; }
      case "answer-menu": toast("Export to Word · Export to PDF · Copy link"); break;
      case "conversation-menu": toast("Rename · Pin · Share · Delete"); break;
      case "history": toast("Your recent chats are in the sidebar"); break;
      case "open-source": toast("Opening source…"); hideCitePop(); break;
      case "open-search-result": toast("Opening…"); break;
      case "create-agent": case "open-agent-demo": case "agent-menu": toast("Agent experience ready to stage"); break;
      case "new-notebook": toast("New notebook"); break;
      case "create-item": toast(`Create ${ds.title || ""}`.trim()); break;
      case "run-workflow": state.workflowStatus = "complete"; state.scene = "workflow-complete"; render(); toast("Workflow run complete"); break;
      case "edit-workflow": state.workflowStatus = "idle"; state.scene = "workflow-agent"; render(); $("#agent-input")?.focus(); break;
      case "toggle-panel": state.sidePanel = !state.sidePanel; render(); break;
      case "pause": state.paused = !state.paused; render(); break;
      case "cancel-task": clearTimeout(sessionTimer); go("cowork-home"); toast("Task canceled"); break;
      case "approve-send": state.sessionScene = "complete"; state.scene = "complete"; render(); toast("Email sent"); break;
      case "skip-approval": state.sessionScene = "running"; state.scene = "running"; state.sessionStep = 2; render(); toast("Email not sent. Cowork will continue."); break;
      case "edit-approval": toast("Edit the draft before sending"); break;
      case "parameters": b.textContent = b.textContent.startsWith("Show") ? "Hide parameters" : "Show parameters"; break;
      case "preview-file": toast("Opening preview…"); break;
      case "download-file": toast("Downloading…"); break;
      case "create-schedule": toast("Create a schedule"); break;
      case "schedule-menu": toast("Edit · Pause · Run now · Delete"); break;
      case "add-skill": toast("Upload or create a skill"); break;
      case "show-more": state.showAllSuggestions = !state.showAllSuggestions; render(); break;
      case "settings": case "titlebar-more": toast("Settings · Themes · Help & feedback"); break;
      default: break;
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (form.id === "copilot-search") {
      const q = form.querySelector("input").value.trim();
      if (q) go("search", { searchQuery: q, searchFilter: "All", scene: "search-results" });
      return;
    }
    const kind = form.dataset.composer;
    const input = form.querySelector(".composer-input");
    const value = input?.value.trim() || "";
    if (kind === "chat" && state.streaming) return;
    if (input) { input.value = ""; state.drafts[kind] = ""; }
    if (kind === "chat") { if (value) submitChat(value); return; }
    if (kind === "cowork") { startTask(value || task().prompt, "running", { animate: true }); return; }
    if (kind === "agent") {
      if (!value) return;
      state.drafts.agent = "";
      if (state.agentId === "workflow-agent") { state.workflowPrompt = value; state.workflowStatus = "draft"; render(); toast("Workflow draft created"); }
      else { const agent = agents().find((a) => a.id === state.agentId); state.convo = null; ensureConversation(value); state.convo.title = `${agent?.title || "Agent"}: ${value}`.slice(0, 60); submitChat(value); }
      return;
    }
    if (kind === "followup" && value) { state.drafts.followup = ""; input.value = ""; autoGrow(input); toast("Instruction added to the task"); }
  }

  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("input", (e) => { if (e.target.classList?.contains("composer-input")) { autoGrow(e.target); state.drafts[e.target.dataset.kind] = e.target.value; } });
  document.addEventListener("change", (e) => {
    if (e.target.id === "studio-chat" && e.target.value) { openChat(e.target.value); syncStudio(); }
    if (e.target.id === "studio-theme") setTheme(e.target.value);
    if (e.target.dataset?.action === "toggle-skill" || e.target.dataset?.action === "toggle-schedule") toast(e.target.checked ? "Turned on" : "Turned off");
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.classList?.contains("composer-input") && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); e.target.closest("form")?.requestSubmit(); return; }
    if (e.altKey && !e.ctrlKey && (e.key === "d" || e.key === "D" || e.code === "KeyD")) { e.preventDefault(); toggleStudio(); }
    if (e.key === "Escape") {
      toggleModelMenu(false);
      hideCitePop();
      if (state.appsOpen) toggleApps(false);
      if (state.referenceOpen) { state.referenceOpen = false; render(); }
      if (state.studioOpen) toggleStudio(false);
      if (state.mobileNav) { state.mobileNav = false; syncChrome(); }
    }
  });
  window.addEventListener("resize", () => { toggleModelMenu(false); hideCitePop(); });

  $("#open-studio").addEventListener("click", () => toggleStudio());
  $("#close-studio").addEventListener("click", () => toggleStudio(false));
  els.studioBackdrop.addEventListener("click", () => toggleStudio(false));
  $("#apply-studio").addEventListener("click", applyStudio);
  $("#copy-scene-link").addEventListener("click", () => { const link = sceneLink(); navigator.clipboard?.writeText(link).then(() => toast("Scene link copied")).catch(() => window.prompt("Copy this link", link)); });
  $("#studio-edit-data").addEventListener("click", () => { toggleStudio(false); window.MockKit?.openEditor(); });
  $("#studio-play").addEventListener("click", async () => {
    const prompt = $("#studio-prompt").value.trim() || data.chat.suggestions?.[0]?.prompt || "";
    toggleStudio(false);
    newChat();
    await sleep(400);
    typePrompt(prompt, { submit: true });
  });
  $("#reset-demo").addEventListener("click", () => { window.MockKit?.reset(); resetDemo(); syncStudio(); toast("Demo reset"); });

  /* ------------------------------------------------------- WebMCP tools */
  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = [
      { name: "read_cowork_demo_state", title: "Read Copilot demo state", description: "Read the visible tutorial scene and editable demo values.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => api.getState() },
      { name: "stage_cowork_demo_scene", title: "Stage Copilot demo scene", description: "Show a specific tutorial scene using fake demo data.", inputSchema: { type: "object", properties: { scene: { type: "string", enum: supportedScenes }, name: { type: "string" }, prompt: { type: "string" }, model: { type: "string" }, sidePanel: { type: "boolean" } }, required: ["scene"], additionalProperties: false }, annotations: { readOnlyHint: false },
        execute: (input) => { if (input.name) state.nameOverride = String(input.name); if (input.prompt) state.prompt = String(input.prompt); if (input.model) api.setModel(input.model); if (typeof input.sidePanel === "boolean") state.sidePanel = input.sidePanel; setScene(input.scene); return { scene: state.scene, status: "staged" }; } },
      { name: "start_cowork_demo_task", title: "Start Cowork demo task", description: "Start a simulated Cowork task with the supplied prompt.", inputSchema: { type: "object", properties: { prompt: { type: "string", minLength: 1 } }, required: ["prompt"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input) => { startTask(input.prompt, "running", { animate: true }); return { scene: "running", prompt: state.prompt }; } },
      { name: "open_copilot_demo_chat", title: "Open demo conversation", description: "Open a conversation from the demo data by id.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input) => ({ opened: openChat(input.id) }) }
    ];
    tools.forEach((tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) { /* unsupported host */ } });
  }

  /* --------------------------------------------------------------- API */
  const api = {
    getState: () => ({ scene: state.scene, view: state.view, mode: isCowork() ? "cowork" : "chat", name: userName(), prompt: state.prompt, model: state.model, grounding: state.grounding, sidePanel: state.sidePanel, chat: state.convo?.id || null, messages: state.convo?.messages.length || 0, streaming: state.streaming, theme: document.documentElement.dataset.theme || "light" }),
    scenes: () => supportedScenes.slice(),
    conversations: () => Object.keys(data.conversations),
    setScene,
    startTask: (prompt, scene = "running") => startTask(prompt, scene, { animate: scene === "running" }),
    openChat: (id) => openChat(id),
    newChat,
    addMessage,
    typePrompt,
    streamReply,
    submitPrompt: (text, opts) => submitChat(text, opts),
    setUser: (name) => { state.nameOverride = name ? String(name) : null; render(); },
    setModel: (id) => { if (models().some((m) => m.id === id)) { state.model = id; render(); } },
    setGrounding: (g) => { state.grounding = g === "Web" ? "Web" : "Work"; if (state.convo) state.convo.grounding = state.grounding; render(); },
    setTheme: (theme) => { setTheme(theme); },
    openStudio: () => toggleStudio(true),
    closeStudio: () => toggleStudio(false),
    editData: () => window.MockKit?.openEditor(),
    sceneLink,
    reset: resetDemo
  };
  window.TrainingMock = api;
  window.CoworkDemo = api;

  /* -------------------------------------------------------------- boot */
  function onDataChange(next) {
    data = normalize(next);
    if (state.convo?.id && !state.convo.dirty && data.conversations[state.convo.id]) {
      const fresh = loadConversation(state.convo.id);
      state.convo = fresh;
    }
    if (state.studioOpen) syncStudio();
    render();
  }

  async function boot() {
    const defaults = window.COWORK_DEMO_DATA || {};
    const initial = window.MockKit
      ? await window.MockKit.init({ product: "microsoft", defaults, onChange: onDataChange })
      : clone(defaults);
    data = normalize(initial);
    if (params.get("theme")) setTheme(params.get("theme"));
    const scene = params.get("scene");
    const chat = params.get("chat");
    if (chat && data.conversations[chat]) openChat(chat, supportedScenes.includes(scene) && data.scenes[scene] === chat ? scene : "chat");
    else if (supportedScenes.includes(scene)) setScene(scene);
    else setScene("chat");
    toggleStudio(state.studioOpen);
    registerWebMcpTools();
    document.documentElement.classList.add("mock-ready");
  }

  boot();
})();
