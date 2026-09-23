(() => {
  "use strict";
  const source = window.CHATGPT_MOCK_DATA;
  const data = JSON.parse(JSON.stringify(source));
  const params = new URLSearchParams(location.search);
  const scenes = ["chat-home", "chat-response", "work-home", "work-running", "work-complete", "codex-home", "codex-task", "search", "project", "plugins"];
  const sceneLabels = {"chat-home":"Chat home","chat-response":"Chat response","work-home":"Work home","work-running":"Work task in progress","work-complete":"Completed Work task","codex-home":"Codex home","codex-task":"Codex coding task","search":"Search results","project":"Project workspace","plugins":"Plugin directory"};
  const state = {
    scene: scenes.includes(params.get("scene")) ? params.get("scene") : "chat-home",
    product: "chatgpt",
    experience: "chat",
    userName: params.get("name") || data.user.name,
    prompt: params.get("prompt") || "",
    model: params.get("model") || data.models[0],
    sidebarCollapsed: false,
    productMenuOpen: false,
    studioOpen: params.get("studio") === "1",
    recentFilter: "All"
  };

  const workspace = document.querySelector("#workspace");
  const shell = document.querySelector(".desktop-shell");
  const sidebar = document.querySelector(".sidebar");
  const nav = document.querySelector(".nav-primary");
  const productMenu = document.querySelector("#product-menu");
  const searchOverlay = document.querySelector("#search-overlay");
  const studio = document.querySelector("#studio");
  const backdrop = document.querySelector("#studio-backdrop");
  const toastNode = document.querySelector("#toast");
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const firstName = () => state.userName.trim().split(/\s+/)[0] || "there";
  const initials = () => state.userName.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "U";

  function toast(message){ toastNode.textContent=message; toastNode.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>toastNode.classList.remove("show"),1900); }

  function renderProjects(){ document.querySelector("#projects-list").innerHTML=data.projects.map((p,i)=>`<button class="project-row" data-open-project="${i}"><span class="project-dot" style="background:${p.color}"></span><span>${esc(p.title)}</span></button>`).join(""); }
  function renderRecents(){
    const items=data.recents.filter(item=>state.recentFilter==="All"||item.kind===state.recentFilter);
    document.querySelector("#recents-list").innerHTML=items.map((item,i)=>`<button class="recent-row" data-open-recent="${i}"><span>${esc(item.title)}</span><span class="recent-kind">${esc(item.kind)}</span></button>`).join("");
    document.querySelectorAll("[data-recent-filter]").forEach(b=>b.classList.toggle("active",b.dataset.recentFilter===state.recentFilter));
  }

  function syncSidebar(){
    shell.classList.toggle("sidebar-collapsed",state.sidebarCollapsed);
    shell.classList.toggle("codex-active",state.product==="codex");
    document.querySelector("[data-product-label]").textContent=state.product==="codex"?"Codex":"ChatGPT";
    document.querySelector(".experience-toggle").hidden=state.product==="codex";
    document.querySelectorAll("[data-product]").forEach(b=>b.classList.toggle("active",b.dataset.product===state.product));
    document.querySelectorAll("[data-experience]").forEach(b=>{const active=b.dataset.experience===state.experience;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
    document.querySelector(".account-row .avatar").textContent=initials();
    document.querySelector(".account-row strong").textContent=state.userName;
    document.querySelector(".model-picker").childNodes[0].textContent=state.model+" ";
    if(state.product==="codex") nav.innerHTML=`<button class="nav-row active" data-action="new">${icon("compose")}<span>New task</span><kbd>Ctrl N</kbd></button><button class="nav-row" data-action="codex-projects">${icon("folder")}<span>Projects</span></button><button class="nav-row" data-action="environments">${icon("terminal")}<span>Environments</span></button>`;
    else nav.innerHTML=`<button class="nav-row active" data-action="new">${icon("compose")}<span>New chat</span><kbd>Ctrl N</kbd></button><button class="nav-row" data-action="search">${icon("search")}<span>Search</span></button><button class="nav-row" data-action="library">${icon("library")}<span>Library</span></button><button class="nav-row" data-action="plugins">${icon("plug")}<span>Plugins</span></button>`;
    renderProjects();renderRecents();
  }

  function composer(value="",placeholder="Message ChatGPT",id="prompt-form"){
    return `<form class="composer-shell" id="${id}"><textarea aria-label="${esc(placeholder)}" placeholder="${esc(placeholder)}" rows="2">${esc(value)}</textarea><div class="composer-actions"><button type="button" class="round" data-action="attach" aria-label="Add files">${icon("plus")}</button><button type="button" class="tool-button" data-action="tools">${icon("spark")}<span>Tools</span></button><button type="button" class="round" data-action="voice" aria-label="Voice input">${icon("mic")}</button><button type="submit" class="round send" aria-label="Send">${icon("send")}</button></div></form>`;
  }

  function renderChatHome(){
    workspace.className="workspace home-view";
    workspace.innerHTML=`<div class="home-inner"><h1>What can I help with?</h1>${composer(state.prompt,"Message ChatGPT")}<div class="suggestion-row">${data.chatSuggestions.map(s=>`<button data-suggestion="${esc(s.prompt)}">${icon(s.icon)}<span>${esc(s.label)}</span></button>`).join("")}</div></div>`;
  }

  function renderWorkHome(){
    workspace.className="workspace home-view work-home";
    workspace.innerHTML=`<div class="home-inner"><span class="work-kicker">ChatGPT Work</span><h1>What should we work on, ${esc(firstName())}?</h1>${composer(state.prompt,"Describe the outcome you want","work-form")}<div class="work-suggestion-grid">${data.workSuggestions.map(s=>`<button data-work-suggestion="${esc(s.label)}"><span>${icon(s.icon)}</span><strong>${esc(s.label)}</strong><small>${esc(s.detail)}</small></button>`).join("")}</div></div>`;
  }

  function responseComposer(){return `<div class="fixed-composer">${composer("","Ask a follow-up","followup-form")}</div>`;}
  function renderChatResponse(){
    const r=data.chatResponse; const prompt=state.prompt||r.prompt;
    workspace.className="workspace thread-view";
    workspace.innerHTML=`<div class="thread"><header class="thread-header"><h1>${esc(prompt.slice(0,58))}</h1><button class="icon-button" data-action="thread-menu">${icon("more")}</button></header><div class="message-row user"><div class="message-body">${esc(prompt)}</div><span class="avatar">${esc(initials())}</span></div><div class="message-row"><span class="assistant-mark">◎</span><div class="message-body"><strong>ChatGPT</strong><p>${esc(r.lead)}</p><ul>${r.bullets.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="source-chips">${r.sources.map(x=>`<button data-action="open-source">${icon("document")} ${esc(x)}</button>`).join("")}</div><div class="response-actions"><button data-action="copy-response" aria-label="Copy">${icon("copy")}</button><button data-action="good-response" aria-label="Good response">${icon("thumb")}</button><button data-action="more-response" aria-label="More">${icon("more")}</button></div></div></div>${responseComposer()}</div>`;
  }

  function workSteps(complete){return data.workTask.steps.map((step,i)=>`<div class="step ${complete||i<2?"done":i===2?"current":""}"><span>${complete||i<2?icon("check"):i+1}</span><p>${esc(step)}</p></div>`).join("");}
  function renderWorkTask(complete=false){
    const t=data.workTask; const prompt=state.prompt||t.prompt;
    workspace.className="workspace task-view";
    workspace.innerHTML=`<section class="task-main"><div class="task-main-inner"><div class="task-titlebar"><div><span class="work-icon">${icon("spark")}</span><span><h1>${esc(t.title)}</h1><small>${complete?"Completed just now":"Working · you can leave and return"}</small></span></div><button class="icon-button" data-action="task-menu">${icon("more")}</button></div><div class="task-prompt">${esc(prompt)}</div><section class="agent-progress"><header><h2>${complete?"Work complete":"Working through the task"}</h2><span class="status-pill">${complete?"Ready to review":"In progress"}</span></header><div class="progress-bar"><i style="width:${complete?100:58}%"></i></div><div class="step-list">${workSteps(complete)}</div></section>${complete?`<div class="task-output">${t.files.map((file,i)=>`<article class="output-card"><span class="file-icon">${i?"W":"P"}</span><span><strong>${esc(file)}</strong><small>${i?"Word document · 2 pages":"PowerPoint · 8 slides"}</small></span><button data-action="preview-output">Preview</button></article>`).join("")}</div>`:""}</div></section><aside class="task-side"><h2>Task details</h2><div class="details-section"><header><span>Context</span><span>3 items</span></header><p>Project Phoenix files and the instructions supplied for this staged task.</p><span class="details-chip">Launch plan.pdf</span><span class="details-chip">Brand guide.pptx</span></div><div class="details-section"><header><span>Tools</span><span>${complete?"4":"3"}</span></header><span class="details-chip">Research</span><span class="details-chip">Documents</span><span class="details-chip">Slides</span></div><div class="details-section"><header><span>Permissions</span><span>0 pending</span></header><p>This mock never opens real apps, files, or accounts.</p></div></aside>`;
  }

  function codexComposer(){return `<form class="composer-shell" id="codex-form"><textarea aria-label="Task for Codex" placeholder="Describe a coding task" rows="3">${esc(state.prompt||"")}</textarea><div class="composer-actions"><button type="button" class="round" data-action="attach">${icon("plus")}</button><button type="button" class="tool-button" data-action="environment">${icon("terminal")}<span>Local</span></button><button type="submit" class="round send">${icon("send")}</button></div></form>`;}
  function codexChrome(content,active=false){
    const c=data.codex;
    return `<div class="codex-shell"><aside class="codex-sidebar"><header>${icon("folder")}<h2>Projects</h2></header><div class="repo-card"><strong>${esc(c.project)}</strong><small>${icon("git")} ${esc(c.branch)}</small></div><div class="codex-task-list"><span>Threads</span><button class="${active?"":"active"}" data-action="new-codex">New agent task<small>Start from ${esc(c.branch)}</small></button><button class="${active?"active":""}" data-action="open-codex-task">Scene picker update<small>${active?"Running":"Completed yesterday"}</small></button></div></aside><section class="codex-main"><header class="codex-header"><strong>${esc(c.project)}</strong><span class="branch-pill">${icon("git")} ${esc(c.branch)}</span><div class="topbar-spacer"></div><button class="icon-button">${icon("more")}</button></header>${content}</section></div>`;
  }
  function renderCodexHome(){
    workspace.className="workspace";
    workspace.innerHTML=codexChrome(`<div class="codex-home"><div class="codex-home-inner"><h1>What should we build?</h1><p>Delegate a task in this repository. Codex can edit files, run commands, and prepare a review.</p>${codexComposer()}<div class="environment-row"><button>${icon("terminal")} Local environment</button><button>${icon("git")} main</button><button>${icon("spark")} GPT-6 Sol</button></div></div></div>`);
  }
  function renderCodexTask(){
    const c=data.codex;const prompt=state.prompt||c.prompt;
    const content=`<div class="codex-run"><div class="codex-run-inner"><div class="codex-user-prompt">${esc(prompt)}</div><section class="codex-agent-card"><header><h2>Codex is working</h2><span class="status-pill">3 of 4 steps</span></header><div class="tool-log">${c.steps.map((step,i)=>`<div class="tool-row">${icon(i<3?"check":"terminal")}<span>${esc(step)}</span><small>${i<3?"Done":"Running"}</small></div>`).join("")}</div><div class="diff-card"><header>Proposed changes · 3 files</header><div class="diff-lines"><span> src/scenes.js</span><span class="add">+ export const tutorialScenes = sceneConfig;</span><span> src/studio.js</span><span class="add">+ syncScenePicker(tutorialScenes);</span><span> tests/scenes.spec.js</span><span class="add">+ expect(routes).toMatchSnapshot();</span></div></div></section></div></div>`;
    workspace.className="workspace";workspace.innerHTML=codexChrome(content,true);
  }

  function renderCollection(kind){
    let title="",subtitle="",cards=[];
    if(kind==="project"){title="Project Phoenix";subtitle="Shared files, instructions, and conversations.";cards=[{icon:"chat",title:"Launch readiness summary",text:"Work · Updated today"},{icon:"document",title:"Launch plan.pdf",text:"Document · Added yesterday"},{icon:"slides",title:"Leadership briefing",text:"Work · 8 slides"}];}
    else if(kind==="plugins"){title="Plugins";subtitle="Extend ChatGPT with approved tools, skills, and app templates.";cards=[{icon:"search",title:"Deep research",text:"Research across the web and connected sources"},{icon:"slides",title:"Presentations",text:"Build and refine presentation files"},{icon:"chart",title:"Data analysis",text:"Analyze spreadsheets and create charts"}];}
    else{title="Library";subtitle="Files and creations from your ChatGPT workspace.";cards=[{icon:"image",title:"Launch visual",text:"Image · Today"},{icon:"document",title:"Executive summary",text:"Document · Today"},{icon:"slides",title:"Q3 planning deck",text:"Presentation · Yesterday"}];}
    workspace.className="workspace collection";workspace.innerHTML=`<div class="collection-inner"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><div class="card-grid">${cards.map(c=>`<button class="collection-card" data-action="open-card"><span class="card-icon">${icon(c.icon)}</span><strong>${esc(c.title)}</strong><small>${esc(c.text)}</small><em>Open</em></button>`).join("")}</div></div>`;
  }

  function renderSearch(){
    openSearch(true);const q=state.prompt||"launch";const input=document.querySelector("#global-search");input.value=q;renderSearchResults(q);workspace.className="workspace home-view";workspace.innerHTML=`<div class="home-inner"><h1>Search your workspace</h1><p style="text-align:center;color:#777">The search dialog is staged above this screen.</p></div>`;
  }
  function renderSearchResults(query=""){
    const q=query.toLowerCase();const items=data.searchResults.filter(x=>!q||(`${x.title} ${x.type} ${x.snippet}`).toLowerCase().includes(q));
    document.querySelector("#search-results").innerHTML=items.map(item=>`<button class="search-result" data-action="open-search-result"><span>${icon(item.type==="Project"?"folder":item.type==="Document"?"document":"chat")}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.type)} · ${esc(item.snippet)}</small></span></button>`).join("")||`<p style="padding:16px;color:#777">No demo results found.</p>`;
  }

  function openSearch(force){const open=typeof force==="boolean"?force:searchOverlay.hidden;searchOverlay.hidden=!open;if(open){renderSearchResults("");setTimeout(()=>document.querySelector("#global-search").focus(),0);}}
  function openStudio(force){state.studioOpen=typeof force==="boolean"?force:!state.studioOpen;studio.classList.toggle("open",state.studioOpen);studio.setAttribute("aria-hidden",String(!state.studioOpen));backdrop.hidden=!state.studioOpen;if(state.studioOpen)syncStudio();}
  function syncStudio(){document.querySelector("#studio-scene").value=state.scene;document.querySelector("#studio-name").value=state.userName;document.querySelector("#studio-prompt").value=state.prompt;document.querySelector("#studio-model").value=state.model;}

  function setScene(scene){
    if(!scenes.includes(scene))scene="chat-home";state.scene=scene;searchOverlay.hidden=true;
    if(scene.startsWith("codex")){state.product="codex";state.experience="chat";}else{state.product="chatgpt";state.experience=scene.startsWith("work")?"work":"chat";}
    syncSidebar();
    ({"chat-home":renderChatHome,"chat-response":renderChatResponse,"work-home":renderWorkHome,"work-running":()=>renderWorkTask(false),"work-complete":()=>renderWorkTask(true),"codex-home":renderCodexHome,"codex-task":renderCodexTask,"search":renderSearch,"project":()=>renderCollection("project"),"plugins":()=>renderCollection("plugins")}[scene]||renderChatHome)();
  }

  function applyStudio(){state.userName=document.querySelector("#studio-name").value.trim()||data.user.name;state.prompt=document.querySelector("#studio-prompt").value.trim();state.model=document.querySelector("#studio-model").value;setScene(document.querySelector("#studio-scene").value);toast("Tutorial scene updated");}
  function copyLink(){const u=new URL(location.href);u.search="";u.searchParams.set("scene",document.querySelector("#studio-scene").value);u.searchParams.set("name",document.querySelector("#studio-name").value.trim()||data.user.name);if(document.querySelector("#studio-prompt").value.trim())u.searchParams.set("prompt",document.querySelector("#studio-prompt").value.trim());u.searchParams.set("model",document.querySelector("#studio-model").value);navigator.clipboard?.writeText(u.toString()).then(()=>toast("Scene link copied")).catch(()=>toast("Copy the URL from the address bar"));}

  document.addEventListener("click",event=>{
    const b=event.target.closest("button");if(!b)return;
    if(!b.closest("#product-menu")&&b.id!=="product-switcher"&&state.productMenuOpen){state.productMenuOpen=false;productMenu.hidden=true;}
    if(b.id==="product-switcher"){state.productMenuOpen=!state.productMenuOpen;productMenu.hidden=!state.productMenuOpen;b.setAttribute("aria-expanded",String(state.productMenuOpen));return;}
    if(b.dataset.product){state.product=b.dataset.product;state.productMenuOpen=false;productMenu.hidden=true;setScene(state.product==="codex"?"codex-home":state.experience==="work"?"work-home":"chat-home");return;}
    if(b.dataset.experience){state.experience=b.dataset.experience;setScene(state.experience==="work"?"work-home":"chat-home");return;}
    if(b.dataset.suggestion){state.prompt=b.dataset.suggestion;setScene("chat-response");return;}
    if(b.dataset.workSuggestion){state.prompt=b.dataset.workSuggestion+" using the Project Phoenix files";setScene("work-running");return;}
    if(b.dataset.openProject!==undefined){setScene("project");return;}
    if(b.dataset.openRecent!==undefined){state.prompt=data.chatResponse.prompt;setScene("chat-response");return;}
    if(b.dataset.recentFilter){state.recentFilter=b.dataset.recentFilter;renderRecents();return;}
    switch(b.dataset.action){
      case"collapse":state.sidebarCollapsed=!state.sidebarCollapsed;syncSidebar();break;
      case"new":state.prompt="";setScene(state.product==="codex"?"codex-home":state.experience==="work"?"work-home":"chat-home");break;
      case"search":openSearch();break;
      case"close-search":openSearch(false);break;
      case"library":renderCollection("library");break;
      case"plugins":setScene("plugins");break;
      case"codex-projects":setScene("codex-home");break;
      case"environments":toast("Local and cloud environments are ready to stage");break;
      case"new-codex":setScene("codex-home");break;
      case"open-codex-task":setScene("codex-task");break;
      case"attach":toast("Add fake files or local context");break;
      case"tools":toast("Search, images, data analysis, and research");break;
      case"voice":b.classList.toggle("recording");toast(b.classList.contains("recording")?"Listening…":"Voice input stopped");break;
      case"copy-response":navigator.clipboard?.writeText("Demo response").catch(()=>{});toast("Response copied");break;
      case"good-response":toast("Feedback recorded");break;
      case"open-source":toast("Demo source preview opened");break;
      case"preview-output":toast("Output preview opened");break;
      case"model":state.model=data.models[(data.models.indexOf(state.model)+1)%data.models.length];syncSidebar();toast(`${state.model} selected`);break;
      case"filter-recents":document.querySelector("#recent-filter").hidden=!document.querySelector("#recent-filter").hidden;break;
      case"new-project":toast("New project flow ready to stage");break;
      case"share":toast("Share dialog ready to stage");break;
      case"open-card":toast("Demo item opened");break;
      case"close-studio":openStudio(false);break;
      case"apply-studio":applyStudio();break;
      case"copy-link":copyLink();break;
      case"reset":state.userName=data.user.name;state.prompt="";state.model=data.models[0];setScene("chat-home");syncStudio();toast("Fake data reset");break;
      default:break;
    }
  });

  document.addEventListener("submit",event=>{
    event.preventDefault();const form=event.target;const value=form.querySelector("textarea")?.value.trim()||"";if(value)state.prompt=value;
    if(form.id==="prompt-form"||form.id==="followup-form")setScene("chat-response");
    if(form.id==="work-form")setScene("work-running");
    if(form.id==="codex-form")setScene("codex-task");
  });
  document.querySelector("#global-search").addEventListener("input",e=>renderSearchResults(e.target.value));
  document.querySelector("#open-studio").addEventListener("click",()=>openStudio());backdrop.addEventListener("click",()=>openStudio(false));
  document.addEventListener("keydown",event=>{if(event.altKey&&event.key.toLowerCase()==="d"){event.preventDefault();openStudio();}if(event.key==="Escape"){openSearch(false);openStudio(false);state.productMenuOpen=false;productMenu.hidden=true;}});

  document.querySelector("#studio-scene").innerHTML=scenes.map(s=>`<option value="${s}">${esc(sceneLabels[s])}</option>`).join("");
  document.querySelector("#studio-model").innerHTML=data.models.map(m=>`<option>${esc(m)}</option>`).join("");
  function registerWebMcpTools(){
    const context=document.modelContext;if(!context?.registerTool)return;
    const tools=[
      {name:"read_chatgpt_demo_state",title:"Read ChatGPT demo state",description:"Read the current ChatGPT, Work, or Codex training scene and its editable fake values.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({scene:state.scene,product:state.product,experience:state.experience,name:state.userName,prompt:state.prompt,model:state.model})},
      {name:"stage_chatgpt_demo_scene",title:"Stage ChatGPT demo scene",description:"Configure and display a deterministic ChatGPT, Work, or Codex tutorial scene using fake data.",inputSchema:{type:"object",properties:{scene:{type:"string",enum:scenes},name:{type:"string",minLength:1},prompt:{type:"string"},model:{type:"string"}},required:["scene"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!scenes.includes(input.scene))throw new Error("A valid scene is required.");if(input.name)state.userName=String(input.name);if(typeof input.prompt==="string")state.prompt=input.prompt;if(input.model&&data.models.includes(input.model))state.model=input.model;setScene(input.scene);return{scene:state.scene,status:"staged"};}},
      {name:"start_chatgpt_work_task",title:"Start ChatGPT Work demo task",description:"Start a simulated multi-step Work task with the supplied tutorial prompt.",inputSchema:{type:"object",properties:{prompt:{type:"string",minLength:1}},required:["prompt"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input?.prompt?.trim())throw new Error("A non-empty prompt is required.");state.prompt=input.prompt.trim();setScene("work-running");return{scene:state.scene,prompt:state.prompt};}},
      {name:"start_codex_demo_task",title:"Start Codex demo task",description:"Start a simulated Codex coding task with the supplied tutorial prompt.",inputSchema:{type:"object",properties:{prompt:{type:"string",minLength:1}},required:["prompt"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input?.prompt?.trim())throw new Error("A non-empty prompt is required.");state.prompt=input.prompt.trim();setScene("codex-task");return{scene:state.scene,prompt:state.prompt};}}
    ];
    tools.forEach(tool=>{try{void Promise.resolve(context.registerTool(tool)).catch(()=>{});}catch(_){/* Unsupported host. */}});
  }
  window.TrainingMock={getState:()=>({...state}),setScene,setUser:name=>{state.userName=String(name||data.user.name);setScene(state.scene);},setPrompt:prompt=>{state.prompt=String(prompt||"");setScene(state.scene);},setProduct:product=>setScene(product==="codex"?"codex-home":"chat-home"),openStudio:()=>openStudio(true),reset:()=>{state.userName=data.user.name;state.prompt="";state.model=data.models[0];setScene("chat-home");}};
  setScene(state.scene);openStudio(state.studioOpen);registerWebMcpTools();
})();
