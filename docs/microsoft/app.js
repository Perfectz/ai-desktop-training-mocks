(() => {
  "use strict";

  const source = window.COWORK_DEMO_DATA;
  const data = JSON.parse(JSON.stringify(source));
  const params = new URLSearchParams(window.location.search);
  const appShell = document.querySelector(".app-shell");
  const workspace = document.querySelector("#workspace");
  const primaryNav = document.querySelector("#primary-nav");
  const topbar = document.querySelector(".topbar");
  const modelButton = document.querySelector("#model-button");
  const modelMenu = document.querySelector("#model-menu");
  const studioPanel = document.querySelector("#studio-panel");
  const studioBackdrop = document.querySelector("#studio-backdrop");
  const toastRegion = document.querySelector("#toast-region");
  const appsLauncher = document.querySelector("#apps-launcher");
  const supportedScenes = ["home", "chat", "chat-response", "search-results", "workflow-agent", "workflow-complete", "running", "approval", "complete", "tasks", "scheduled", "customize"];

  const state = {
    view: "home",
    mode: "cowork",
    scene: "home",
    model: params.get("model") || "auto",
    userName: params.get("name") || data.user.name,
    prompt: params.get("prompt") || data.task.prompt,
    sidePanel: params.get("panel") !== "0",
    filter: "All",
    schedulesTab: "manage",
    chatView: "new",
    chatDraft: "",
    chatTurns: [],
    attachedSources: [],
    referenceOpen: false,
    referenceTab: "recent",
    workIqOn: true,
    sidebarCollapsed: false,
    appsOpen: false,
    searchQuery: "",
    searchFilter: "All",
    workflowPrompt: "",
    workflowStatus: "idle",
    paused: false,
    moreModels: false,
    studioOpen: params.get("studio") === "1"
  };

  const sceneFromUrl = params.get("scene");
  if (supportedScenes.includes(sceneFromUrl)) {
    state.scene = sceneFromUrl;
  }

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const firstName = () => state.userName.trim().split(/\s+/)[0] || "there";
  const initials = () => state.userName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
  const selectedModel = () => data.models.find((model) => model.id === state.model) || data.models[0];
  const icon = (name, className = "") => `<svg class="fluent-icon ${className}" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;

  function toast(message) {
    toastRegion.textContent = message;
    toastRegion.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => toastRegion.classList.remove("show"), 2200);
  }

  function coworkNavigation() {
    return `
      <button class="nav-item ${state.view === "home" || state.view === "session" ? "active" : ""}" data-view="home">${icon("add-circle", "nav-icon")}<span>New task</span></button>
      <button class="nav-item ${state.view === "tasks" ? "active" : ""}" data-view="tasks">${icon("task-list", "nav-icon")}<span>My tasks</span></button>
      <button class="nav-item ${state.view === "scheduled" ? "active" : ""}" data-view="scheduled">${icon("calendar-clock", "nav-icon")}<span>Scheduled</span></button>
      <button class="nav-item ${state.view === "customize" ? "active" : ""}" data-view="customize">${icon("wand", "nav-icon")}<span>Customize</span></button>`;
  }

  function chatNavigation() {
    const mainItems = [
      ["new", "add-circle", "New chat"],
      ["search", "search", "Search"],
      ["library", "library", "Library"],
      ["agents", "agent", "Agents"],
      ["notebooks", "notebook", "Notebooks"]
    ];
    return `
      <div class="chat-nav-main">${mainItems.map(([id, iconName, label]) => `<button class="nav-item ${state.chatView === id ? "active" : ""}" data-chat-view="${id}">${icon(iconName, "nav-icon")}<span>${label}</span></button>`).join("")}</div>
      <div class="nav-section-label">Pinned</div>
      ${data.chat.pinned.map((item) => `<button class="nav-item chat-entry pinned-entry ${state.chatView === item.id ? "active" : ""}" data-chat-view="${escapeHtml(item.id)}">${icon("agent", "nav-icon agent-glyph")}<span class="nav-copy">${escapeHtml(item.title)}</span><span class="entry-actions" aria-hidden="true">${icon("pin-off")}${icon("more")}</span></button>`).join("")}
      <div class="nav-section-label chats-label">Chats</div>
      <div class="chat-history-list">${data.chat.history.map((title, index) => `<button class="nav-item chat-entry ${state.chatHistory === index ? "active" : ""}" data-chat-history="${index}"><span class="nav-copy">${escapeHtml(title)}</span>${index === 2 ? `<span class="history-status">${icon("check-circle")}</span>` : ""}</button>`).join("")}</div>`;
  }

  function syncNavigation() {
    primaryNav.classList.toggle("chat-navigation", state.mode === "chat");
    primaryNav.innerHTML = state.mode === "chat" ? chatNavigation() : coworkNavigation();
  }

  function syncTopbar() {
    let workIq = document.querySelector("#work-iq-button");
    if (state.mode === "chat" && !workIq) {
      workIq = document.createElement("button");
      workIq.id = "work-iq-button";
      workIq.className = "work-iq-button";
      topbar.insertBefore(workIq, modelButton);
    }
    if (workIq) {
      workIq.hidden = state.mode !== "chat";
      workIq.classList.toggle("off", !state.workIqOn);
      workIq.setAttribute("aria-pressed", String(state.workIqOn));
      workIq.setAttribute("title", state.workIqOn ? "Work data is on" : "Work data is off");
      workIq.innerHTML = "<span>Work IQ</span>";
    }
  }

  function syncShell() {
    appShell.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    document.querySelector(".profile-copy strong").textContent = state.userName;
    document.querySelector(".profile-row .avatar").textContent = initials();
    document.querySelector("[data-model-label]").textContent = selectedModel().name;
    syncNavigation();
    syncTopbar();
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      const target = button.dataset.view;
      const active = target === state.view || (target === "home" && state.view === "session");
      button.classList.toggle("active", active);
    });
    const collapseButton = document.querySelector('[data-action="collapse-sidebar"]');
    if (collapseButton) {
      collapseButton.setAttribute("aria-label", state.sidebarCollapsed ? "Expand navigation" : "Collapse navigation");
      collapseButton.setAttribute("title", state.sidebarCollapsed ? "Expand navigation" : "Collapse navigation");
    }
  }

  function toggleApps(force) {
    state.appsOpen = typeof force === "boolean" ? force : !state.appsOpen;
    appsLauncher.hidden = !state.appsOpen;
    document.querySelector('[data-action="apps-launcher"]')?.setAttribute("aria-expanded", String(state.appsOpen));
  }

  function suggestionCards(limit = 3) {
    const suggestionIcons = { inbox: "mail", calendar: "calendar", research: "search", briefing: "sparkle-circle", meeting: "calendar-clock", app: "grid-dots" };
    return data.suggestions.slice(0, limit).map((item) => `
      <button class="suggestion-card" data-prompt="${escapeHtml(item.prompt)}">
        <span class="suggestion-icon ${escapeHtml(item.tone)}">${icon(suggestionIcons[item.tone] || "sparkle-circle")}</span>
        <span>${escapeHtml(item.label)}</span>
      </button>`).join("");
  }

  function renderHome() {
    state.view = "home";
    state.scene = "home";
    workspace.className = "home-view";
    workspace.setAttribute("aria-labelledby", "welcome-heading");
    workspace.innerHTML = `
      <div class="home-content">
        <h1 id="welcome-heading">Hi ${escapeHtml(firstName())}, how can I help?</h1>
        <form class="composer" id="task-composer" data-testid="task-composer">
          <button type="button" class="composer-icon" data-action="attachment" aria-label="Add attachments">${icon("add")}</button>
          <input id="task-input" aria-label="Task request" placeholder="Start a task" value="${escapeHtml(state.prompt === data.task.prompt ? "" : state.prompt)}" autocomplete="off" />
          <button type="button" class="composer-icon mic-button" data-action="voice" aria-label="Use voice input">${icon("mic")}</button>
          <button type="submit" class="send-button" aria-label="Send task">${icon("send")}</button>
        </form>
        <div class="suggestions-heading"><strong>Try these next</strong><button data-action="show-more">Show more</button></div>
        <div class="suggestion-grid" aria-label="Suggested tasks">${suggestionCards(state.showAllSuggestions ? 6 : 3)}</div>
        <div class="recent-strip">
          <span>Recent</span>
          <button data-open-task="1"><strong>${escapeHtml(data.tasks[0].title)}</strong><small>${escapeHtml(data.tasks[0].time)}</small></button>
          <button data-open-task="3"><strong>${escapeHtml(data.tasks[2].title)}</strong><small>${escapeHtml(data.tasks[2].time)}</small></button>
        </div>
      </div>`;
    syncShell();
  }

  const sourceIconName = (kind) => ({ file: "document", person: "person", meeting: "calendar", email: "mail", chat: "chat" }[kind] || "document");

  function renderReferenceMenu() {
    const tabs = state.workIqOn ? [["recent", "Recent"], ["files", "Files"], ["people", "People"], ["meetings", "Meetings"], ["emails", "Emails"]] : [["files", "Files"]];
    const activeTab = state.workIqOn ? state.referenceTab : "files";
    const items = data.chat.references[activeTab] || data.chat.references.files;
    return `<div class="reference-menu" id="reference-menu" ${state.referenceOpen ? "" : "hidden"}>
      <header><div><strong>Add and manage sources</strong><small>${state.workIqOn ? "Work IQ suggestions" : "Files available while Work IQ is off"}</small></div><button type="button" class="icon-button" data-action="close-references" aria-label="Close sources">${icon("dismiss")}</button></header>
      <div class="reference-tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" aria-selected="${activeTab === id}" class="${activeTab === id ? "active" : ""}" data-reference-tab="${id}">${label}</button>`).join("")}</div>
      <div class="reference-list">${items.map((item) => `<button type="button" class="reference-item" data-source-id="${escapeHtml(item.id)}" data-source-tab="${escapeHtml(activeTab)}">${icon(sourceIconName(item.kind), "reference-kind-icon")}<span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><span class="reference-add">${icon("add")}</span></button>`).join("")}</div>
      <button type="button" class="upload-demo-button" data-action="upload-demo-file">${icon("document")}<span><strong>Upload images and files</strong><small>PDF, Word, PowerPoint, Excel, and images</small></span></button>
    </div>`;
  }

  function renderAttachedSources() {
    if (!state.attachedSources.length) return "";
    return `<div class="attached-source-strip" aria-label="Attached sources">${state.attachedSources.map((source) => `<span class="attached-source">${icon(sourceIconName(source.kind))}<span>${escapeHtml(source.title)}</span><button type="button" data-remove-source="${escapeHtml(source.id)}" aria-label="Remove ${escapeHtml(source.title)}">${icon("dismiss")}</button></span>`).join("")}</div>`;
  }

  function renderChat() {
    state.view = "home";
    state.chatView = "new";
    state.scene = "chat";
    workspace.className = "home-view chat-home";
    workspace.innerHTML = `
      <div class="home-content">
        <h1>Hi ${escapeHtml(firstName())}, how can I help?</h1>
        <div class="chat-compose-area">
          ${renderAttachedSources()}
          <form class="composer chat-composer" id="chat-composer">
            <button type="button" class="composer-icon" data-action="attachment" aria-label="Add and manage sources" aria-expanded="${state.referenceOpen}">${icon("add")}</button>
            <input id="chat-input" aria-label="Message Copilot" placeholder="Message Copilot" value="${escapeHtml(state.chatDraft)}" autocomplete="off" />
            <button type="button" class="composer-icon" data-action="voice" aria-label="Use voice input">${icon("mic")}</button>
            <button type="button" class="composer-icon sound-button" data-action="voice-chat" aria-label="Start voice chat">${icon("sound-wave")}</button>
          </form>
          ${renderReferenceMenu()}
        </div>
        <div class="chat-prompt-row">${data.chat.suggestions.map((label) => `<button data-chat-prompt="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join("")}<button data-action="more-chat-suggestions" aria-label="More suggestions">${icon("more")}</button></div>
      </div>`;
    syncShell();
  }

  function responseCopy(prompt) {
    const lower = prompt.toLowerCase();
    if (!state.workIqOn) return {
      lead: "Here’s a concise answer using public web context. Turn Work IQ on to include your files, email, meetings, people, and chats:",
      bullets: ["Review the week’s calendar and identify the meetings that need preparation.", "Confirm the three highest-priority outcomes and block focus time for them.", "Check public news or market updates that could affect planned work."]
    };
    if (lower.includes("ahead") || lower.includes("week")) return {
      lead: "Here’s what appears most important across your work context:",
      bullets: ["Project Phoenix launch materials are ready for leadership review.", "Three follow-up items from the launch sync still need owners.", "The Contoso account review is scheduled for Thursday afternoon."]
    };
    if (lower.includes("copilot")) return {
      lead: "Copilot can help you search, summarize, create, and take action across your work:",
      bullets: ["Use Work IQ to ground answers in files, email, meetings, people, and chats.", "Attach specific sources with the plus button when you want tighter control.", "Open an agent for specialized research or repeatable workflows."]
    };
    return {
      lead: state.workIqOn ? "I pulled together the most relevant details from your work context:" : "Here’s a concise answer using public web context:",
      bullets: ["The launch brief is aligned on positioning and timing.", "The latest meeting recap highlights ownership gaps in three workstreams.", "Maya Chen’s email confirms the final review window for tomorrow."]
    };
  }

  function renderResponseSources() {
    if (!state.workIqOn) return "";
    return `<div class="response-sources"><strong>Sources</strong><div>${data.chat.responseSources.map((source, index) => `<button type="button" data-action="open-source"><span class="source-number">${index + 1}</span><span><b>${escapeHtml(source.title)}</b><small>${escapeHtml(source.type)} · ${escapeHtml(source.detail)}</small></span></button>`).join("")}</div></div>`;
  }

  function submitChatPrompt(prompt) {
    const clean = String(prompt || "").trim();
    if (!clean) return;
    state.chatDraft = "";
    state.referenceOpen = false;
    state.chatTurns.push({ prompt: clean, answer: responseCopy(clean) });
    renderChatConversation();
  }

  function renderChatConversation() {
    state.mode = "chat";
    state.view = "response";
    state.chatView = "new";
    state.scene = "chat";
    workspace.className = "chat-thread-view copilot-response-view";
    workspace.innerHTML = `<div class="chat-thread-shell response-shell">
      <header><div><span class="thread-kicker">Copilot Chat</span><h1>${escapeHtml(state.chatTurns[0]?.prompt || "New conversation")}</h1></div><button class="icon-button" data-action="conversation-menu" aria-label="Conversation options">${icon("more")}</button></header>
      <div class="conversation-thread">${state.chatTurns.map((turn, index) => `<section class="conversation-turn">
        <div class="chat-user-row"><div class="avatar small">${escapeHtml(initials())}</div><div class="user-chat-bubble">${escapeHtml(turn.prompt)}</div></div>
        <article class="copilot-answer"><div class="assistant-avatar"><span></span><span></span></div><div class="answer-content"><div class="answer-meta"><strong>Copilot</strong><span class="grounding-pill ${state.workIqOn ? "" : "web-only"}">${state.workIqOn ? "Work IQ" : "Web"}</span></div><p>${escapeHtml(turn.answer.lead)}</p><ul>${turn.answer.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${index === 0 ? renderResponseSources() : ""}<div class="answer-actions"><button type="button" data-action="copy-answer" aria-label="Copy response">${icon("copy")}</button><button type="button" data-action="like-answer" aria-label="Good response">${icon("thumb-up")}</button><button type="button" data-action="dislike-answer" aria-label="Poor response">${icon("thumb-down")}</button><button type="button" data-action="regenerate-answer" aria-label="Regenerate response">${icon("sync")}</button><button type="button" data-action="answer-menu" aria-label="More response options">${icon("more")}</button></div></div></article>
      </section>`).join("")}</div>
      <div class="response-compose-wrap">${renderAttachedSources()}<form class="followup-composer" id="chat-response-composer"><button type="button" data-action="attachment" aria-label="Add and manage sources">${icon("add")}</button><input aria-label="Message Copilot" placeholder="Message Copilot" autocomplete="off" /><button type="button" data-action="voice" aria-label="Use voice input">${icon("mic")}</button><button type="submit" aria-label="Send message">${icon("send")}</button></form></div>
    </div>`;
    syncShell();
  }

  function renderSearchContent() {
    const query = state.searchQuery;
    const searchForm = `<form class="feature-search" id="copilot-search">${icon("search")}<input aria-label="Search your work" placeholder="Search your work" value="${escapeHtml(query)}" /><button type="submit">Search</button></form>`;
    if (!query) return `<div class="chat-feature-shell search-shell"><div class="page-heading"><div><span class="eyebrow">Copilot</span><h1>Search</h1><p>Find people, chats, meetings, and files across your work.</p></div></div>${searchForm}<div class="feature-suggestions"><strong>Try searching for</strong><button data-search-term="Launch readiness">Launch readiness</button><button data-search-term="Notes from my manager">Notes from my manager</button><button data-search-term="Customer feedback">Customer feedback</button></div><section class="search-recommended"><div class="section-title"><h2>Recommended</h2><span>Based on your recent work</span></div><div class="recommendation-grid"><button data-search-term="Project Phoenix"><span class="recommendation-icon powerpoint">P</span><span><strong>Project Phoenix launch brief</strong><small>PowerPoint · Updated today</small><em>Summarize this presentation</em></span></button><button data-search-term="Leadership launch sync"><span class="recommendation-icon meeting">${icon("calendar")}</span><span><strong>Leadership launch sync</strong><small>Meeting recap · Yesterday</small><em>What decisions were made?</em></span></button></div></section></div>`;
    const filters = ["All", "Files", "People", "Meetings", "Chats"];
    const results = data.chat.searchResults.filter((item) => state.searchFilter === "All"
      || (state.searchFilter === "People" && item.type === "Person")
      || (state.searchFilter === "Meetings" && item.type === "Meeting")
      || (state.searchFilter === "Chats" && ["Chat", "Email"].includes(item.type))
      || (state.searchFilter === "Files" && ["PowerPoint", "Word", "Excel"].includes(item.type)));
    return `<div class="chat-feature-shell search-shell search-results-shell"><div class="page-heading compact"><div><span class="eyebrow">Copilot Search</span><h1>Search results</h1></div></div>${searchForm}<div class="search-filter-row" role="tablist">${filters.map((filter) => `<button role="tab" aria-selected="${state.searchFilter === filter}" class="${state.searchFilter === filter ? "active" : ""}" data-search-filter="${filter}">${filter}</button>`).join("")}</div><div class="search-results-summary"><strong>${results.length} results</strong><span>for “${escapeHtml(query)}”</span></div><div class="search-result-list">${results.map((item) => `<button data-action="open-search-result"><span class="search-result-icon ${escapeHtml(item.type.toLowerCase())}">${icon(sourceIconName(item.type === "Person" ? "person" : item.type === "Meeting" ? "meeting" : item.type === "Email" ? "email" : "file"))}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.meta)}</small><p>${escapeHtml(item.snippet)}</p></span>${icon("more", "result-more")}</button>`).join("")}</div></div>`;
  }

  function renderChatFeature(view) {
    state.mode = "chat";
    state.view = view;
    state.chatView = view;
    state.scene = view === "workflow-agent" ? "workflow-agent" : "chat";
    workspace.className = view === "workflow-agent" ? "home-view chat-home agent-home" : "collection-view chat-feature-view";

    if (view === "workflow-agent") {
      const agent = data.chat.pinned[0];
      workspace.innerHTML = `
        <div class="home-content">
          <div class="agent-hero-icon">${icon("agent", "agent-hero-svg")}</div>
          <span class="agent-kicker">Pinned agent</span>
          <h1>${escapeHtml(agent.title)}</h1>
          <p class="agent-intro">Turn a repeatable process into a guided workflow using your Microsoft 365 context.</p>
          <form class="composer chat-composer" id="agent-composer">
            <button type="button" class="composer-icon" data-action="attachment" aria-label="Add work context">${icon("add")}</button>
            <input id="agent-input" aria-label="Message Workflow agent" placeholder="Describe the workflow you want to run" value="${escapeHtml(state.workflowPrompt)}" autocomplete="off" />
            <button type="submit" class="send-button" aria-label="Run workflow">${icon("send")}</button>
          </form>
          <div class="chat-prompt-row"><button data-agent-prompt="Create a weekly status workflow">Weekly status report</button><button data-agent-prompt="Triage new customer escalations">Triage escalations</button><button data-agent-prompt="Prepare a meeting follow-up workflow">Meeting follow-up</button></div>
          ${state.workflowStatus !== "idle" ? `<section class="workflow-plan ${state.workflowStatus}"><header><div><span>Workflow draft</span><h2>${escapeHtml(state.workflowPrompt || "Weekly status workflow")}</h2></div><strong>${state.workflowStatus === "complete" ? "Run complete" : "Ready to run"}</strong></header><div class="workflow-steps"><div><span>1</span><p><strong>Collect updates</strong><small>Recent email, meetings, and project files</small></p></div><div><span>2</span><p><strong>Summarize progress</strong><small>Group accomplishments, risks, and decisions</small></p></div><div><span>3</span><p><strong>Prepare the report</strong><small>Create an editable Word draft for review</small></p></div></div><footer><button type="button" class="secondary-button" data-action="edit-workflow">Edit workflow</button><button type="button" class="primary-button" data-action="run-workflow">${state.workflowStatus === "complete" ? "Run again" : "Run workflow"}</button></footer></section>` : ""}
        </div>`;
      syncShell();
      return;
    }

    const content = {
      search: renderSearchContent(),
      library: `<div class="chat-feature-shell"><div class="page-heading"><div><span class="eyebrow">Copilot</span><h1>Library</h1><p>Your recent Copilot files and creations.</p></div></div><div class="library-grid">${data.chat.files.map((file) => `<button class="library-card"><span class="file-type">${escapeHtml(file.type[0])}</span><span><strong>${escapeHtml(file.title)}</strong><small>${escapeHtml(file.type)} · ${escapeHtml(file.updated)}</small></span><i>•••</i></button>`).join("")}</div></div>`,
      agents: `<div class="chat-feature-shell"><div class="page-heading"><div><span class="eyebrow">Copilot</span><h1>Agents</h1><p>Choose an agent for specialized work.</p></div></div><div class="agent-grid"><button class="agent-card featured" data-chat-view="workflow-agent"><span class="agent-card-icon">${icon("agent")}</span><span><strong>Workflow agent</strong><small>Pinned · Build and run repeatable work</small></span><i>Open</i></button><button class="agent-card"><span class="agent-card-icon researcher">${icon("search")}</span><span><strong>Researcher</strong><small>Deep research across work and the web</small></span><i>Open</i></button><button class="agent-card"><span class="agent-card-icon analyst">${icon("library")}</span><span><strong>Analyst</strong><small>Analyze data and create clear insights</small></span><i>Open</i></button></div></div>`,
      notebooks: `<div class="chat-feature-shell"><div class="page-heading"><div><span class="eyebrow">Copilot</span><h1>Notebooks</h1><p>Bring selected sources together for focused work.</p></div><button class="primary-button" data-action="new-notebook">${icon("add")} New notebook</button></div><div class="notebook-grid">${data.chat.notebooks.map((book) => `<button class="notebook-card"><span>${icon("notebook")}</span><strong>${escapeHtml(book.title)}</strong><small>${book.sources} sources</small></button>`).join("")}</div></div>`
    };
    workspace.innerHTML = content[view] || content.search;
    syncShell();
  }

  function renderChatHistory(index) {
    const title = data.chat.history[index] || data.chat.history[0];
    state.mode = "chat";
    state.view = "history";
    state.chatView = "history";
    state.chatHistory = index;
    state.scene = "chat";
    workspace.className = "chat-thread-view";
    workspace.innerHTML = `<div class="chat-thread-shell"><header><h1>${escapeHtml(title)}</h1><button class="icon-button" aria-label="More chat options">${icon("more")}</button></header><div class="thread-message user-thread"><div class="avatar small">${escapeHtml(initials())}</div><p>Help me understand the latest information about ${escapeHtml(title.toLowerCase())}.</p></div><div class="thread-message copilot-thread"><div class="assistant-avatar"><span></span><span></span></div><div><strong>Copilot</strong><p>Here’s a concise overview based on your work context. This is editable demo content for the tutorial.</p></div></div><form class="followup-composer" id="chat-composer"><button type="button" data-action="attachment">${icon("add")}</button><input aria-label="Message Copilot" placeholder="Message Copilot" /><button type="submit">${icon("send")}</button></form></div>`;
    syncShell();
  }

  function renderTasks() {
    state.view = "tasks";
    state.scene = "tasks";
    const statuses = ["All", "Needs your input", "In progress", "Complete", "Unread"];
    const visibleTasks = data.tasks.filter((task) => {
      if (state.filter === "All") return true;
      if (state.filter === "Unread") return task.unread;
      return task.status === state.filter;
    });
    workspace.className = "collection-view";
    workspace.innerHTML = `
      <div class="collection-shell">
        <div class="page-heading"><div><span class="eyebrow">Cowork</span><h1>My tasks</h1></div><button class="primary-button" data-view="home">${icon("add")} New task</button></div>
        <div class="filter-row" role="tablist" aria-label="Task filters">${statuses.map((status) => `<button class="filter-pill ${state.filter === status ? "active" : ""}" data-filter="${escapeHtml(status)}">${escapeHtml(status)}</button>`).join("")}</div>
        <div class="task-list">${visibleTasks.length ? visibleTasks.map((task) => `
          <button class="task-row" data-open-task="${task.id}">
            <span class="task-status ${task.status.toLowerCase().replaceAll(" ", "-")}">${icon(task.status === "Complete" ? "check-circle" : task.status === "In progress" ? "sync" : "warning")}</span>
            <span class="task-copy"><strong>${escapeHtml(task.title)}${task.unread ? '<i class="unread-dot" aria-label="Unread"></i>' : ""}</strong><small>${escapeHtml(task.preview)}</small></span>
            <span class="task-meta"><small>${escapeHtml(task.time)}</small><span>${escapeHtml(task.status)}</span></span>
            <span class="row-chevron">${icon("chevron-right")}</span>
          </button>`).join("") : `<div class="empty-state"><span>${icon("check")}</span><h2>No tasks here</h2><p>Try another filter or start a new task.</p></div>`}</div>
      </div>`;
    syncShell();
  }

  function renderScheduled() {
    state.view = "scheduled";
    state.scene = "scheduled";
    workspace.className = "collection-view";
    workspace.innerHTML = `
      <div class="collection-shell">
        <div class="page-heading"><div><span class="eyebrow">Cowork</span><h1>Automations</h1></div><button class="primary-button" data-action="create-schedule">${icon("add")} Create</button></div>
        <div class="subtabs" role="tablist"><button data-schedule-tab="runs" class="${state.schedulesTab === "runs" ? "active" : ""}">Runs</button><button data-schedule-tab="manage" class="${state.schedulesTab === "manage" ? "active" : ""}">Manage schedules</button></div>
        ${state.schedulesTab === "runs" ? renderRuns() : renderScheduleCards()}
      </div>`;
    syncShell();
  }

  function renderRuns() {
    return `<div class="run-list">
      <div class="run-row"><span class="run-icon success">${icon("check-circle")}</span><span><strong>Daily morning briefing</strong><small>Completed in 42 seconds</small></span><time>Today, 8:30 AM</time></div>
      <div class="run-row"><span class="run-icon success">${icon("check-circle")}</span><span><strong>Friday status report</strong><small>Created Status report — Sep 18.docx</small></span><time>Fri, 3:00 PM</time></div>
      <div class="run-row"><span class="run-icon pending">${icon("calendar-clock")}</span><span><strong>Daily morning briefing</strong><small>Upcoming</small></span><time>Tomorrow, 8:30 AM</time></div>
    </div>`;
  }

  function renderScheduleCards() {
    return `<div class="schedule-list">${data.schedules.map((item) => `
      <article class="schedule-card">
        <span class="schedule-icon">${icon(item.cadence === "Event driven" ? "sparkle-circle" : "calendar-clock")}</span>
        <div><div class="schedule-title"><h2>${escapeHtml(item.title)}</h2><span class="state-badge ${item.state.toLowerCase()}">${escapeHtml(item.state)}</span></div><p>${escapeHtml(item.cadence)}</p><small>Next: ${escapeHtml(item.next)}</small></div>
        <button class="icon-button" data-action="schedule-menu" aria-label="Schedule options">${icon("more")}</button>
      </article>`).join("")}</div>`;
  }

  function renderCustomize() {
    state.view = "customize";
    state.scene = "customize";
    workspace.className = "collection-view";
    workspace.innerHTML = `
      <div class="collection-shell">
        <div class="page-heading"><div><span class="eyebrow">Cowork</span><h1>Customize</h1><p>Skills help Cowork complete specialized work.</p></div><button class="primary-button" data-action="add-skill">${icon("add")} Add</button></div>
        <div class="subtabs"><button class="active">Skills</button><button>Plugins</button></div>
        <div class="skill-grid">${data.skills.map((skill, index) => `
          <button class="skill-card" data-skill="${index}"><span class="skill-icon skill-${index}">${["Email", "Calendar", "Deep Research"].includes(skill.title) ? icon(skill.title === "Email" ? "mail" : skill.title === "Calendar" ? "calendar" : "search") : escapeHtml(skill.icon)}</span><span><strong>${escapeHtml(skill.title)}</strong><small>${escapeHtml(skill.description)}</small></span><i>${icon("chevron-right")}</i></button>`).join("")}</div>
      </div>`;
    syncShell();
  }

  function sessionProgress() {
    if (state.scene === "complete") return { percent: 100, active: 6 };
    if (state.scene === "approval") return { percent: 72, active: 4 };
    return { percent: 48, active: 2 };
  }

  function renderSession() {
    state.view = "session";
    const progress = sessionProgress();
    workspace.className = `session-view ${state.sidePanel ? "with-panel" : "without-panel"}`;
    workspace.innerHTML = `
      <section class="conversation-pane">
        <header class="session-header">
          <div><button class="back-button" data-view="home" aria-label="Back to home">${icon("chevron-left")}</button><span><strong>${escapeHtml(data.task.title)}</strong><small>${state.scene === "complete" ? "Completed" : state.scene === "approval" ? "Needs your input" : state.paused ? "Paused" : "Working"}</small></span></div>
          <div class="session-actions"><button class="secondary-button" data-action="toggle-panel">${state.sidePanel ? "Hide" : "Show"} details</button>${state.scene !== "complete" ? `<button class="secondary-button" data-action="pause">${state.paused ? "Resume" : "Pause"}</button><button class="text-button danger" data-action="cancel-task">Cancel</button>` : ""}</div>
        </header>
        <div class="conversation-scroll">
          <div class="message user-message"><div class="avatar small">${escapeHtml(initials())}</div><div><strong>You</strong><p>${escapeHtml(state.prompt)}</p></div></div>
          <div class="message assistant-message"><div class="assistant-avatar"><span></span><span></span></div><div class="assistant-copy"><strong>Copilot</strong>${sessionResponse(progress)}</div></div>
        </div>
        <form class="followup-composer" id="followup-composer"><button type="button" data-action="attachment" aria-label="Add attachment">${icon("add")}</button><input aria-label="Add instructions" placeholder="Add instructions or ask a follow-up" /><button type="submit" aria-label="Send follow-up">${icon("send")}</button></form>
      </section>
      ${state.sidePanel ? renderSidePanel(progress) : ""}`;
    syncShell();
  }

  function sessionResponse(progress) {
    if (state.scene === "complete") {
      return `<p>I organized the inbox, prioritized the messages that need attention, and prepared replies for you.</p>
        <div class="result-card"><div class="result-icon">W</div><div><strong>Inbox priorities</strong><span>Word document · 2 pages</span></div><button data-action="preview-file">Preview</button><button data-action="download-file">Download</button></div>
        <div class="completion-note"><span>${icon("check")}</span><div><strong>Task complete</strong><p>12 messages reviewed · 4 replies prepared · no messages were sent</p></div></div>`;
    }
    if (state.scene === "approval") {
      return `<p>I reviewed the urgent messages and prepared a reply to Jordan Lee. Please review it before I send anything.</p>
        <div class="approval-card">
          <header><span class="risk-badge">Medium risk</span><strong>Send email?</strong></header>
          <dl><div><dt>To</dt><dd>Jordan Lee &lt;jordan.lee@contoso.com&gt;</dd></div><div><dt>Subject</dt><dd>Re: Launch readiness review</dd></div></dl>
          <blockquote>Hi Jordan, thanks for the update. I’ve reviewed the open items and can confirm our team is ready for Thursday’s checkpoint…</blockquote>
          <button class="show-parameters" data-action="parameters">Show parameters</button>
          <footer><button class="secondary-button" data-action="skip-approval">Cancel</button><span></span><button class="split-button" data-action="approve-send">Send <i>${icon("chevron-down")}</i></button></footer>
        </div>`;
    }
    return `<p>I’ll review the inbox, identify what needs your attention, and prepare suggested replies. I won’t send anything without your approval.</p>
      <div class="work-card"><div class="thinking-spinner" aria-hidden="true"></div><div><strong>${state.paused ? "Paused" : "Reviewing recent messages"}</strong><p>${state.paused ? "Resume when you’re ready." : "Checking senders, dates, and conversation context…"}</p></div><span>${progress.percent}%</span></div>`;
  }

  function renderSidePanel(progress) {
    return `<aside class="session-panel" aria-label="Task details">
      <header><strong>Task details</strong><button class="icon-button" data-action="toggle-panel" aria-label="Close details">${icon("dismiss")}</button></header>
      <div class="panel-scroll">
        <section class="progress-section"><div><strong>Progress</strong><span>${progress.percent}%</span></div><div class="progress-track"><i style="width:${progress.percent}%"></i></div>
          <ol>${data.task.steps.map((step, index) => `<li class="${index + 1 < progress.active ? "done" : index + 1 === progress.active ? "current" : ""}"><span>${index + 1 < progress.active ? icon("check") : index + 1}</span><p>${escapeHtml(step)}</p></li>`).join("")}</ol>
        </section>
        <details open><summary>Input folder <span>1</span></summary><button class="file-row"><span>${icon("mail")}</span><span><strong>Inbox</strong><small>Connected work context</small></span></button></details>
        <details ${state.scene === "complete" ? "open" : ""}><summary>Output folder <span>${state.scene === "complete" ? "2" : "0"}</span></summary>${state.scene === "complete" ? data.task.files.map((file) => `<button class="file-row" data-action="preview-file"><span>${icon("document")}</span><span><strong>${escapeHtml(file)}</strong><small>Preview · Download</small></span></button>`).join("") : '<p class="panel-empty">Files Cowork creates will appear here.</p>'}</details>
        <details open><summary>Skills <span>${data.task.skills.length}</span></summary><div class="skill-chips">${data.task.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div></details>
        <details><summary>Schedule <span>0</span></summary><p class="panel-empty">No schedule for this task.</p></details>
        <details><summary>Permissions <span>${state.scene === "complete" ? "1" : "0"}</span></summary><p class="panel-empty">Session approvals appear here.</p></details>
      </div>
    </aside>`;
  }

  function renderModelMenu() {
    const visible = state.moreModels ? data.models : data.models.filter((model) => model.featured);
    modelMenu.innerHTML = visible.map((model) => `<button role="menuitemradio" aria-checked="${model.id === state.model}" data-model="${escapeHtml(model.id)}"><span class="model-check">${model.id === state.model ? icon("check") : ""}</span><span><strong>${escapeHtml(model.name)}</strong><small>${escapeHtml(model.description)}</small></span></button>`).join("") + (state.moreModels ? "" : `<button class="show-more-models" data-action="more-models">Show more ${icon("chevron-down")}</button>`);
  }

  function toggleModelMenu(force) {
    const open = typeof force === "boolean" ? force : modelMenu.hidden;
    renderModelMenu();
    modelMenu.hidden = !open;
    modelButton.setAttribute("aria-expanded", String(open));
    if (open) {
      const rect = modelButton.getBoundingClientRect();
      modelMenu.style.left = `${Math.max(250, rect.left)}px`;
      modelMenu.style.top = `${rect.bottom + 5}px`;
    }
  }

  function renderCurrent() {
    if (state.mode === "chat") {
      if (state.view === "workflow-agent") return renderChatFeature("workflow-agent");
      if (["search", "library", "agents", "notebooks"].includes(state.view)) return renderChatFeature(state.view);
      if (state.view === "history") return renderChatHistory(state.chatHistory || 0);
      if (state.view === "response") return renderChatConversation();
      return renderChat();
    }
    if (state.view === "session") return renderSession();
    if (state.view === "tasks") return renderTasks();
    if (state.view === "scheduled") return renderScheduled();
    if (state.view === "customize") return renderCustomize();
    return renderHome();
  }

  function startTask(prompt, scene = "running") {
    state.prompt = String(prompt || data.task.prompt).trim() || data.task.prompt;
    state.scene = scene;
    state.view = "session";
    state.paused = false;
    renderSession();
  }

  function setScene(scene) {
    if (scene === "chat-response") {
      const prompt = state.prompt === data.task.prompt ? "Prepare me for what’s ahead this week" : state.prompt;
      state.mode = "chat";
      state.chatView = "new";
      state.chatTurns = [{ prompt, answer: responseCopy(prompt) }];
      state.attachedSources = [data.chat.references.people[0]];
      state.referenceOpen = false;
      renderChatConversation();
      state.scene = "chat-response";
      return;
    }
    if (scene === "search-results") {
      state.mode = "chat";
      state.searchQuery = "Launch readiness";
      state.searchFilter = "All";
      renderChatFeature("search");
      state.scene = "search-results";
      return;
    }
    if (scene === "workflow-complete") {
      state.mode = "chat";
      state.workflowPrompt = "Create a weekly launch status workflow";
      state.workflowStatus = "complete";
      renderChatFeature("workflow-agent");
      state.scene = "workflow-complete";
      return;
    }
    if (scene === "chat") {
      state.mode = "chat";
      state.view = "home";
      state.chatView = "new";
      state.scene = "chat";
      state.chatDraft = "";
      state.chatTurns = [];
      state.attachedSources = [];
      state.referenceOpen = false;
      renderChat();
      return;
    }
    if (scene === "workflow-agent") {
      state.mode = "chat";
      state.view = "workflow-agent";
      state.chatView = "workflow-agent";
      state.scene = "workflow-agent";
      renderChatFeature("workflow-agent");
      return;
    }
    state.mode = "cowork";
    if (["running", "approval", "complete"].includes(scene)) {
      state.scene = scene;
      state.view = "session";
    } else {
      state.view = scene;
      state.scene = scene;
    }
    renderCurrent();
  }

  function toggleStudio(force) {
    state.studioOpen = typeof force === "boolean" ? force : !state.studioOpen;
    studioPanel.classList.toggle("open", state.studioOpen);
    studioPanel.setAttribute("aria-hidden", String(!state.studioOpen));
    studioBackdrop.hidden = !state.studioOpen;
    if (state.studioOpen) syncStudio();
  }

  function syncStudio() {
    document.querySelector("#studio-scene").value = state.scene;
    document.querySelector("#studio-name").value = state.userName;
    document.querySelector("#studio-prompt").value = state.prompt;
    document.querySelector("#studio-model").value = state.model;
    document.querySelector("#studio-side-panel").checked = state.sidePanel;
  }

  function populateStudio() {
    document.querySelector("#studio-model").innerHTML = data.models.map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.name)}</option>`).join("");
  }

  function applyStudio() {
    state.userName = document.querySelector("#studio-name").value.trim() || data.user.name;
    state.prompt = document.querySelector("#studio-prompt").value.trim() || data.task.prompt;
    state.model = document.querySelector("#studio-model").value;
    state.sidePanel = document.querySelector("#studio-side-panel").checked;
    setScene(document.querySelector("#studio-scene").value);
    toast("Demo scene updated");
  }

  function copySceneLink() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("scene", document.querySelector("#studio-scene").value);
    url.searchParams.set("name", document.querySelector("#studio-name").value.trim() || data.user.name);
    url.searchParams.set("prompt", document.querySelector("#studio-prompt").value.trim() || data.task.prompt);
    url.searchParams.set("model", document.querySelector("#studio-model").value);
    url.searchParams.set("panel", document.querySelector("#studio-side-panel").checked ? "1" : "0");
    navigator.clipboard?.writeText(url.toString()).then(() => toast("Scene link copied")).catch(() => toast("Copy the URL from your address bar"));
  }

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#apps-launcher") && !event.target.closest('[data-action="apps-launcher"]') && state.appsOpen) toggleApps(false);
    const target = event.target.closest("button");
    if (!target) {
      if (!event.target.closest("#model-menu")) toggleModelMenu(false);
      return;
    }
    if (target === modelButton) return toggleModelMenu();
    if (target.id === "work-iq-button") {
      state.workIqOn = !state.workIqOn;
      if (state.view === "response") {
        state.chatTurns = state.chatTurns.map((turn) => ({ ...turn, answer: responseCopy(turn.prompt) }));
        renderChatConversation();
      } else syncShell();
      toast(state.workIqOn ? "Work IQ is on — files, email, meetings, people, and chats are available" : "Work IQ is off — Copilot will use public web context");
      return;
    }
    if (target.dataset.model) {
      state.model = target.dataset.model;
      syncShell();
      toggleModelMenu(false);
      toast(`${selectedModel().name} selected`);
      return;
    }
    if (target.dataset.mode) {
      state.mode = target.dataset.mode;
      state.view = "home";
      state.scene = state.mode === "chat" ? "chat" : "home";
      state.chatView = "new";
      if (state.mode === "chat") {
        state.chatDraft = "";
        state.chatTurns = [];
        state.attachedSources = [];
        state.referenceOpen = false;
      }
      renderCurrent();
      return;
    }
    if (target.dataset.chatView) {
      const destination = target.dataset.chatView;
      if (destination === "new") {
        state.chatDraft = "";
        state.chatTurns = [];
        state.attachedSources = [];
        state.referenceOpen = false;
        renderChat();
      }
      else renderChatFeature(destination);
      return;
    }
    if (target.dataset.chatHistory !== undefined) {
      renderChatHistory(Number(target.dataset.chatHistory));
      return;
    }
    if (target.dataset.chatPrompt) {
      const input = document.querySelector("#chat-input");
      state.chatDraft = target.dataset.chatPrompt;
      if (input) { input.value = state.chatDraft; input.focus(); }
      return;
    }
    if (target.dataset.agentPrompt) {
      const input = document.querySelector("#agent-input");
      if (input) { input.value = target.dataset.agentPrompt; input.focus(); }
      return;
    }
    if (target.dataset.searchTerm) {
      state.searchQuery = target.dataset.searchTerm;
      state.searchFilter = "All";
      renderChatFeature("search");
      return;
    }
    if (target.dataset.searchFilter) {
      state.searchFilter = target.dataset.searchFilter;
      renderChatFeature("search");
      return;
    }
    if (target.dataset.referenceTab) {
      state.referenceTab = target.dataset.referenceTab;
      state.referenceOpen = true;
      state.chatDraft = document.querySelector("#chat-input")?.value || state.chatDraft;
      renderChat();
      return;
    }
    if (target.dataset.sourceId) {
      const tabItems = data.chat.references[target.dataset.sourceTab] || [];
      const source = tabItems.find((item) => item.id === target.dataset.sourceId);
      if (source && !state.attachedSources.some((item) => item.id === source.id)) state.attachedSources.push(source);
      state.referenceOpen = false;
      renderChat();
      toast(source ? `${source.title} added as a source` : "Source added");
      return;
    }
    if (target.dataset.removeSource) {
      state.attachedSources = state.attachedSources.filter((item) => item.id !== target.dataset.removeSource);
      if (state.view === "response") renderChatConversation(); else renderChat();
      return;
    }
    if (target.dataset.view) {
      state.mode = "cowork";
      setScene(target.dataset.view);
      return;
    }
    if (target.dataset.prompt) {
      state.prompt = target.dataset.prompt;
      const input = document.querySelector("#task-input, #chat-input, #agent-input");
      if (input) { input.value = state.prompt; input.focus(); }
      return;
    }
    if (target.dataset.filter) { state.filter = target.dataset.filter; renderTasks(); return; }
    if (target.dataset.scheduleTab) { state.schedulesTab = target.dataset.scheduleTab; renderScheduled(); return; }
    if (target.dataset.openTask) { startTask(data.tasks.find((task) => String(task.id) === target.dataset.openTask)?.title, target.dataset.openTask === "3" ? "approval" : "complete"); return; }

    switch (target.dataset.action) {
      case "show-more": state.showAllSuggestions = !state.showAllSuggestions; renderHome(); break;
      case "more-models": state.moreModels = true; renderModelMenu(); break;
      case "apps-launcher": toggleApps(); break;
      case "all-apps": toast("All Microsoft 365 apps are ready to stage"); break;
      case "launch-app": toast(`${target.textContent.trim()} opened in the demo`); toggleApps(false); break;
      case "collapse-sidebar": state.sidebarCollapsed = !state.sidebarCollapsed; syncShell(); break;
      case "attachment": {
        const chatComposer = target.closest("#chat-composer");
        if (chatComposer && state.view === "home") {
          state.chatDraft = chatComposer.querySelector("input")?.value || "";
          state.referenceOpen = !state.referenceOpen;
          renderChat();
          document.querySelector("#chat-input")?.focus();
        } else {
          toast("Add files, people, meetings, chats, or email as work context");
        }
        break;
      }
      case "close-references": state.referenceOpen = false; renderChat(); break;
      case "upload-demo-file": {
        const source = { id: "uploaded-demo", kind: "file", title: "Launch plan.pdf", detail: "PDF · Uploaded just now", badge: "PDF" };
        if (!state.attachedSources.some((item) => item.id === source.id)) state.attachedSources.push(source);
        state.referenceOpen = false;
        renderChat();
        toast("Launch plan.pdf added as a demo source");
        break;
      }
      case "more-chat-suggestions": state.chatDraft = "Summarize my recent work and suggest the next three actions"; renderChat(); document.querySelector("#chat-input")?.focus(); break;
      case "voice": target.classList.toggle("recording"); toast(target.classList.contains("recording") ? "Listening…" : "Voice input stopped"); break;
      case "voice-chat": toast("Voice chat ready for this demo"); break;
      case "copy-answer": {
        const copyPromise = navigator.clipboard?.writeText(target.closest(".answer-content")?.innerText || "");
        copyPromise?.catch(() => {});
        toast("Response copied");
        break;
      }
      case "like-answer": toast("Feedback recorded: helpful"); break;
      case "dislike-answer": toast("Feedback recorded: needs improvement"); break;
      case "regenerate-answer": toast("Response regenerated for the demo"); break;
      case "answer-menu": toast("Export, share, and open response options"); break;
      case "conversation-menu": toast("Rename, share, or delete this conversation"); break;
      case "open-source": toast("Source preview opened beside the response"); break;
      case "open-search-result": toast("Search result opened in the demo"); break;
      case "run-workflow": state.workflowStatus = "complete"; renderChatFeature("workflow-agent"); toast("Workflow completed with demo data"); break;
      case "edit-workflow": state.workflowStatus = "idle"; renderChatFeature("workflow-agent"); document.querySelector("#agent-input")?.focus(); break;
      case "toggle-panel": state.sidePanel = !state.sidePanel; renderSession(); break;
      case "pause": state.paused = !state.paused; renderSession(); break;
      case "cancel-task": renderHome(); toast("Task canceled"); break;
      case "approve-send": state.scene = "complete"; renderSession(); toast("Approved for this demo"); break;
      case "skip-approval": state.scene = "running"; renderSession(); toast("Action canceled; the task can continue"); break;
      case "parameters": target.textContent = target.textContent.startsWith("Show") ? "Hide parameters" : "Show parameters"; toast("Recipient and action parameters toggled"); break;
      case "preview-file": toast("Document preview opened for the tutorial"); break;
      case "download-file": toast("Demo download prepared"); break;
      case "create-schedule": toast("Schedule creation is ready to stage"); break;
      case "schedule-menu": toast("Edit, pause, resume, or delete this schedule"); break;
      case "add-skill": toast("Upload or create a custom skill"); break;
      case "new-notebook": toast("New notebook flow ready to stage"); break;
      default: break;
    }
  });

  document.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.id === "task-composer") {
      startTask(form.querySelector("input").value || state.prompt, "running");
    } else if (form.id === "followup-composer") {
      const input = form.querySelector("input");
      if (input.value.trim()) { toast("Follow-up added to the demo task"); input.value = ""; }
    } else if (form.id === "chat-composer") {
      submitChatPrompt(form.querySelector("input").value);
    } else if (form.id === "chat-response-composer") {
      submitChatPrompt(form.querySelector("input").value);
    } else if (form.id === "agent-composer") {
      const input = form.querySelector("input");
      if (input.value.trim()) {
        state.workflowPrompt = input.value.trim();
        state.workflowStatus = "draft";
        renderChatFeature("workflow-agent");
        toast("Workflow draft created");
      }
    } else if (form.id === "copilot-search") {
      const input = form.querySelector("input");
      if (input.value.trim()) {
        state.searchQuery = input.value.trim();
        state.searchFilter = "All";
        renderChatFeature("search");
      }
    }
  });

  document.querySelector("#open-studio").addEventListener("click", () => toggleStudio());
  document.querySelector("#close-studio").addEventListener("click", () => toggleStudio(false));
  studioBackdrop.addEventListener("click", () => toggleStudio(false));
  document.querySelector("#apply-studio").addEventListener("click", applyStudio);
  document.querySelector("#copy-scene-link").addEventListener("click", copySceneLink);
  document.querySelector("#reset-demo").addEventListener("click", () => {
    state.userName = data.user.name;
    state.prompt = data.task.prompt;
    state.model = "auto";
    state.sidePanel = true;
    state.mode = "cowork";
    state.chatView = "new";
    state.chatDraft = "";
    state.chatTurns = [];
    state.attachedSources = [];
    state.referenceOpen = false;
    state.workIqOn = true;
    state.sidebarCollapsed = false;
    state.searchQuery = "";
    state.searchFilter = "All";
    state.workflowPrompt = "";
    state.workflowStatus = "idle";
    setScene("home");
    syncStudio();
    toast("Demo reset");
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleStudio();
    }
    if (event.ctrlKey && event.shiftKey && event.key === "/") {
      event.preventDefault();
      toast("Alt+D — demo controls · Esc — close menus");
    }
    if (event.key === "Escape") {
      toggleModelMenu(false);
      if (state.appsOpen) toggleApps(false);
      if (state.referenceOpen) { state.referenceOpen = false; renderChat(); }
      if (state.studioOpen) toggleStudio(false);
    }
  });

  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = [
      {
        name: "read_cowork_demo_state",
        title: "Read Cowork demo state",
        description: "Read the currently visible tutorial scene and editable demo values.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => ({ scene: state.scene, mode: state.mode, name: state.userName, prompt: state.prompt, model: state.model, sidePanel: state.sidePanel, workIqOn: state.workIqOn, attachedSources: state.attachedSources.map((item) => item.title) })
      },
      {
        name: "stage_cowork_demo_scene",
        title: "Stage Cowork demo scene",
        description: "Configure and show a specific Cowork tutorial scene using fake demo data.",
        inputSchema: {
          type: "object",
          properties: {
            scene: { type: "string", enum: supportedScenes },
            name: { type: "string", minLength: 1 },
            prompt: { type: "string", minLength: 1 },
            model: { type: "string" },
            sidePanel: { type: "boolean" }
          },
          required: ["scene"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          if (!input || !supportedScenes.includes(input.scene)) throw new Error("A valid scene is required.");
          if (input.name) state.userName = String(input.name);
          if (input.prompt) state.prompt = String(input.prompt);
          if (input.model && data.models.some((model) => model.id === input.model)) state.model = input.model;
          if (typeof input.sidePanel === "boolean") state.sidePanel = input.sidePanel;
          setScene(input.scene);
          return { scene: state.scene, status: "staged" };
        }
      },
      {
        name: "start_cowork_demo_task",
        title: "Start Cowork demo task",
        description: "Start a visible simulated Cowork task with the supplied tutorial prompt.",
        inputSchema: { type: "object", properties: { prompt: { type: "string", minLength: 1 } }, required: ["prompt"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          if (!input?.prompt?.trim()) throw new Error("A non-empty prompt is required.");
          startTask(input.prompt, "running");
          return { scene: "running", prompt: state.prompt };
        }
      }
    ];
    tools.forEach((tool) => {
      try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) { /* Unsupported host. */ }
    });
  }

  window.CoworkDemo = {
    getState: () => ({ ...state }),
    setScene,
    startTask,
    setUser: (name) => { state.userName = String(name || data.user.name); renderCurrent(); },
    setModel: (id) => { if (data.models.some((model) => model.id === id)) { state.model = id; syncShell(); } },
    openStudio: () => toggleStudio(true),
    reset: () => { state.userName = data.user.name; state.prompt = data.task.prompt; state.model = "auto"; state.sidePanel = true; state.mode = "cowork"; state.chatView = "new"; state.chatDraft = ""; state.chatTurns = []; state.attachedSources = []; state.referenceOpen = false; state.workIqOn = true; state.sidebarCollapsed = false; state.searchQuery = ""; state.searchFilter = "All"; state.workflowPrompt = ""; state.workflowStatus = "idle"; setScene("home"); }
  };

  populateStudio();
  if (supportedScenes.includes(sceneFromUrl)) setScene(sceneFromUrl); else renderCurrent();
  renderModelMenu();
  toggleStudio(state.studioOpen);
  registerWebMcpTools();
})();
