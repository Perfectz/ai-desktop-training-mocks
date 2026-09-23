/*
 * ============================================================================
 *  Microsoft 365 Copilot (Chat + Cowork) training mock: DEMO DATA
 * ============================================================================
 *
 *  Every piece of visible fake content in the mock comes from this file.
 *  Edit it here, or live in the browser with Alt+E (MockKit data editor).
 *  All people, companies, files and numbers are FICTIONAL.
 *
 *  QUICK GUIDE
 *  -----------
 *  user ............ the signed-in person shown in the sidebar and greeting
 *  app ............. greeting text, placeholders, disclaimer, badge text
 *  models .......... the model picker in the composer ("Auto" etc.)
 *  chat ............ Copilot Chat: sidebar agents + history, home prompts,
 *                    "+" source picker, search, library, notebooks, create
 *  conversations ... ANY chat thread, keyed by id. Open one with ?chat=<id>
 *  scenes .......... which conversation each chat scene shows
 *  cowork .......... Cowork: tasks, the staged task, approvals, schedules, skills
 *  workflow ........ the pinned Workflow agent's plan
 *
 *  ADD A NEW CONVERSATION (the most common edit)
 *  ---------------------------------------------
 *  1. Add an entry to `conversations` below, e.g.
 *
 *       "budget-review": {
 *         title: "Budget review",
 *         grounding: "Work",                 // "Work" or "Web"
 *         messages: [
 *           { role: "user", text: "Summarize the FY27 budget draft" },
 *           { role: "assistant",
 *             status: "Searched your files",   // optional progress label
 *             text: "## Budget summary\nSpend is **flat** year over year [1].",
 *             sources: [{ title: "FY27 budget draft.xlsx", kind: "excel", meta: "Finance · Updated today" }] }
 *         ]
 *       }
 *
 *  2. Optional: add `{ title: "Budget review", chat: "budget-review" }` to
 *     chat.history so it shows in the sidebar.
 *  3. Open  /microsoft/?chat=budget-review
 *
 *  MESSAGE TEXT is lightweight Markdown: # headings, **bold**, *italic*,
 *  `code`, - bullets, 1. numbered lists, | tables |, > quotes, [links](url),
 *  --- rules, and citation markers [1] [2] that point at `sources` (1-based).
 *
 *  SOURCE KINDS: word, excel, powerpoint, outlook, teams, pdf, web, loop,
 *  onenote, sharepoint, person, meeting
 * ============================================================================
 */
window.COWORK_DEMO_DATA = {
  /* ---------------------------------------------------------------- user */
  user: {
    name: "Elvia Atkins",
    initials: "EA",
    plan: "Microsoft 365 Copilot",
    email: "elvia.atkins@contoso.com",
    org: "Contoso"
  },

  /* ----------------------------------------------------------------- app */
  app: {
    windowTitle: "Microsoft 365 Copilot",
    titlebarSearch: "Search",
    greeting: "Hi {first}, how can I help?",          // {first} = user's first name
    coworkGreeting: "What should we get done, {first}?",
    chatPlaceholder: "Message Copilot",
    webPlaceholder: "Ask anything on the web",
    coworkPlaceholder: "Describe a task for Cowork",
    disclaimer: "AI-generated content may be incorrect",
    trainingBadge: "Training mock",
    groundingLabels: { Work: "Work", Web: "Web" }
  },

  /* -------------------------------------------------------------- models */
  // group "style" = response styles shown first; group "model" = named models.
  models: [
    { id: "auto", name: "Auto", description: "Decides how long to think", group: "style" },
    { id: "quick", name: "Quick response", description: "Answers right away", group: "style" },
    { id: "think-deeper", name: "Think deeper", description: "Thinks longer for better answers", group: "style" },
    { id: "gpt-5-5", name: "GPT-5.5", description: "OpenAI · Versatile across task types", group: "model" },
    { id: "gpt-5-6-sol", name: "GPT-5.6 Sol", description: "OpenAI · Efficient for hard work", group: "model" },
    { id: "claude-opus", name: "Claude Opus", description: "Anthropic · Complex, high-stakes work", group: "model" },
    { id: "claude-sonnet", name: "Claude Sonnet", description: "Anthropic · Fast drafting and research", group: "model" }
  ],

  /* ---------------------------------------------------------------- chat */
  chat: {
    // Coloured agents pinned in the sidebar. `glyph` is an icon name
    // (search, chart, flow, sparkle, people, document). `color` is any CSS colour.
    pinnedAgents: [
      { id: "researcher", title: "Researcher", glyph: "search", color: "#0f6cbd", description: "Multi-step research across your work and the web", starters: ["Research how competitors price onboarding services", "Build a brief on Fabrikam before our partnership call"] },
      { id: "analyst", title: "Analyst", glyph: "chart", color: "#107c41", description: "Turns raw data into insights and charts", starters: ["Find trends in the Q3 support tickets workbook", "Forecast FY26 revenue from the pipeline export"] },
      { id: "workflow-agent", title: "Workflow agent", glyph: "flow", color: "#8764b8", description: "Build and run repeatable work", starters: ["Create a weekly status workflow", "Triage new customer escalations", "Prepare a meeting follow-up workflow"] }
    ],

    // Sidebar "Chats" list. `chat` = id in `conversations`.
    history: [
      { title: "Prepare for what’s ahead this week", chat: "phoenix-week" },
      { title: "Sales forecast FY26", chat: "sales-forecast" },
      { title: "Relocation benefits", chat: "relocation-benefits" },
      { title: "Escalation trends", chat: "escalation-trends" },
      { title: "Latest emails from manager", chat: "manager-emails" },
      { title: "Market analysis and trends", chat: "market-analysis" },
      { title: "Marketing strategy for Q2", chat: "q2-marketing" },
      { title: "Contoso account brief", chat: "contoso-brief" }
    ],

    // Prompt cards under the home composer. icon: mail, calendar, search,
    // sparkle, document, chart, people, meeting
    suggestions: [
      { icon: "calendar", label: "Prepare for what’s ahead", prompt: "Prepare me for what’s ahead this week" },
      { icon: "mail", label: "Catch up on email", prompt: "Summarize the latest emails from my manager and what I need to do" },
      { icon: "chart", label: "Analyze a forecast", prompt: "Summarize the FY26 sales forecast by region" },
      { icon: "document", label: "Draft a brief", prompt: "Draft a one-page brief for the Contoso account review" }
    ],

    // Free-typed prompts: first keyword match plays that conversation's first
    // assistant reply. Otherwise defaultReply / defaultWebReply is used.
    replies: [
      { keywords: ["week", "ahead"], chat: "phoenix-week" },
      { keywords: ["forecast", "sales"], chat: "sales-forecast" },
      { keywords: ["relocation", "benefit"], chat: "relocation-benefits" },
      { keywords: ["escalation"], chat: "escalation-trends" },
      { keywords: ["manager", "email"], chat: "manager-emails" },
      { keywords: ["market", "trend"], chat: "market-analysis" },
      { keywords: ["marketing", "q2"], chat: "q2-marketing" },
      { keywords: ["contoso", "brief", "account"], chat: "contoso-brief" }
    ],
    defaultReply: {
      status: "Searched your emails, meetings, and files",
      text: "Here’s what I found across your work:\n\n- **Project Phoenix** is on track for the September launch [1].\n- Maya Chen asked for final comments on the launch brief by **Thursday** [2].\n- Three follow-ups from the leadership sync still need owners [3].\n\nWant me to draft replies or turn this into a checklist?",
      sources: [
        { title: "Project Phoenix launch brief", kind: "powerpoint", meta: "Maya Chen · Updated today" },
        { title: "RE: Phoenix launch readiness", kind: "outlook", meta: "Maya Chen · 9:14 AM" },
        { title: "Leadership launch sync", kind: "teams", meta: "Meeting recap · Yesterday" }
      ]
    },
    defaultWebReply: {
      status: "Searched the web",
      text: "Here’s a quick overview from public sources:\n\n- Analysts expect **steady growth** in collaboration software through 2027 [1].\n- Buyers increasingly prioritise *security and governance* features [2].\n\nTurn on **Work** to include your files, email, and meetings.",
      sources: [
        { title: "Collaboration software outlook", kind: "web", meta: "fabrikamresearch.example" },
        { title: "What IT buyers want in 2026", kind: "web", meta: "northwindinsights.example" }
      ]
    },

    // The "+" menu: Add work content (tabs → items). kind: file/person/meeting/email
    references: {
      recent: [
        { id: "launch-brief", kind: "powerpoint", title: "Project Phoenix launch brief", detail: "PowerPoint · Updated today" },
        { id: "maya-chen", kind: "person", title: "Maya Chen", detail: "VP, Product Marketing" },
        { id: "leadership-sync", kind: "meeting", title: "Leadership launch sync", detail: "Meeting · Tomorrow at 10:00 AM" }
      ],
      files: [
        { id: "launch-brief", kind: "powerpoint", title: "Project Phoenix launch brief", detail: "PowerPoint · Updated today" },
        { id: "readiness-tracker", kind: "excel", title: "Launch readiness tracker", detail: "Excel · Updated yesterday" },
        { id: "customer-insights", kind: "word", title: "Customer insights summary", detail: "Word · Updated Monday" }
      ],
      people: [
        { id: "maya-chen", kind: "person", title: "Maya Chen", detail: "VP, Product Marketing" },
        { id: "jon-bell", kind: "person", title: "Jon Bell", detail: "Director, Customer Success" }
      ],
      meetings: [
        { id: "leadership-sync", kind: "meeting", title: "Leadership launch sync", detail: "Tomorrow at 10:00 AM" },
        { id: "customer-review", kind: "meeting", title: "Contoso account review", detail: "Thursday at 2:30 PM" }
      ],
      emails: [
        { id: "launch-thread", kind: "outlook", title: "RE: Phoenix launch readiness", detail: "From Maya Chen · 9:14 AM" },
        { id: "contoso-followup", kind: "outlook", title: "Contoso follow-up items", detail: "From Jon Bell · Yesterday" }
      ],
      upload: { id: "uploaded-demo", kind: "pdf", title: "Launch plan.pdf", detail: "PDF · Uploaded just now" }
    },

    // Copilot Search page
    search: {
      demoQuery: "Launch readiness",
      tryTerms: ["Launch readiness", "Notes from my manager", "Customer feedback"],
      recommended: [
        { kind: "powerpoint", title: "Project Phoenix launch brief", meta: "PowerPoint · Updated today", prompt: "Summarize this presentation" },
        { kind: "teams", title: "Leadership launch sync", meta: "Meeting recap · Yesterday", prompt: "What decisions were made?" }
      ],
      // type: Files | People | Meetings | Chats
      results: [
        { kind: "powerpoint", type: "Files", title: "Project Phoenix launch brief", meta: "Modified today · Maya Chen", snippet: "Launch positioning, campaign milestones, and final readiness decisions." },
        { kind: "teams", type: "Meetings", title: "Leadership launch sync", meta: "Yesterday · 8 participants", snippet: "Discussion of launch blockers, owners, and the September release timeline." },
        { kind: "person", type: "People", title: "Maya Chen", meta: "VP, Product Marketing", snippet: "Frequent collaborator on Project Phoenix and go-to-market planning." },
        { kind: "outlook", type: "Chats", title: "RE: Phoenix launch readiness", meta: "Today · 9:14 AM", snippet: "Final review notes and three follow-up items for the launch team." },
        { kind: "excel", type: "Files", title: "Launch readiness tracker", meta: "Modified yesterday · Jon Bell", snippet: "Workstream owners, readiness scores, and open risks by market." }
      ]
    },

    // Library page (files Copilot created)
    library: [
      { title: "Quarterly planning notes", kind: "word", updated: "Today" },
      { title: "Customer insights", kind: "powerpoint", updated: "Yesterday" },
      { title: "Launch readiness tracker", kind: "excel", updated: "Monday" },
      { title: "Phoenix launch checklist", kind: "loop", updated: "Last week" }
    ],

    // Notebooks page
    notebooks: [
      { title: "Leadership planning", sources: 12, updated: "Today", color: "#0f6cbd" },
      { title: "Customer research", sources: 8, updated: "Yesterday", color: "#107c41" },
      { title: "Phoenix launch", sources: 21, updated: "Last week", color: "#c43e1c" }
    ],

    // Agents page (pinned agents are shown too)
    agentCatalog: [
      { title: "Prompt Coach", glyph: "sparkle", color: "#c239b3", description: "Write better prompts" },
      { title: "Writing Coach", glyph: "document", color: "#0078d4", description: "Get feedback on your drafts" },
      { title: "Surveys", glyph: "people", color: "#038387", description: "Create and analyse surveys" }
    ],

    // Create page
    create: [
      { kind: "image", title: "Image", description: "Generate images and visuals" },
      { kind: "powerpoint", title: "Presentation", description: "Start a deck from a prompt" },
      { kind: "word", title: "Document", description: "Draft a document or brief" },
      { kind: "video", title: "Video", description: "Create a short video" }
    ]
  },

  /* ------------------------------------------------------- conversations */
  conversations: {
    "phoenix-week": {
      title: "Prepare for what’s ahead this week",
      grounding: "Work",
      messages: [
        { role: "user", text: "Prepare me for what’s ahead this week", attachments: [{ kind: "person", title: "Maya Chen" }] },
        {
          role: "assistant",
          status: "Searched your emails, meetings, and files",
          text: "Here’s what needs your attention this week, based on your calendar, email, and recent files.\n\n### Top priorities\n\n1. **Project Phoenix leadership review** on Tuesday: the launch brief is final except for pricing slides [1].\n2. **Maya Chen** needs your comments on launch readiness by *Thursday noon* [2].\n3. Three follow-ups from the launch sync still need owners [3].\n\n### Meetings to prepare for\n\n| Day | Meeting | Prep needed |\n| --- | --- | --- |\n| Tue | Leadership launch review | Review slides 4–8 [1] |\n| Wed | Phoenix stand-up | Update the tracker [4] |\n| Thu | Contoso account review | Read the insights summary [5] |\n\nWant me to draft a reply to Maya or add focus time to your calendar?",
          sources: [
            { title: "Project Phoenix launch brief", kind: "powerpoint", meta: "Maya Chen · Updated today" },
            { title: "RE: Phoenix launch readiness", kind: "outlook", meta: "Maya Chen · 9:14 AM" },
            { title: "Leadership launch sync", kind: "teams", meta: "Meeting recap · Yesterday" },
            { title: "Launch readiness tracker", kind: "excel", meta: "Jon Bell · Updated yesterday" },
            { title: "Customer insights summary", kind: "word", meta: "Elvia Atkins · Monday" }
          ]
        }
      ]
    },

    "sales-forecast": {
      title: "Sales forecast FY26",
      grounding: "Work",
      messages: [
        { role: "user", text: "Summarize the FY26 sales forecast by region" },
        {
          role: "assistant",
          status: "Analyzed FY26 forecast.xlsx",
          text: "The FY26 forecast projects **$48.2M** in bookings, up **12%** year over year [1].\n\n| Region | FY25 actual | FY26 forecast | Change |\n| --- | ---: | ---: | ---: |\n| North America | $19.4M | $21.6M | +11% |\n| Europe | $12.1M | $13.9M | +15% |\n| Asia Pacific | $8.7M | $9.8M | +13% |\n| Latin America | $2.8M | $2.9M | +4% |\n\n**Key drivers**\n\n- Europe growth is led by the Fabrikam renewal and two new public-sector wins [2].\n- Latin America is flat because the distributor transition slips to Q3 [3].\n\nWould you like a chart of this for the leadership deck?",
          sources: [
            { title: "FY26 forecast.xlsx", kind: "excel", meta: "Finance · Updated Monday" },
            { title: "EMEA pipeline review", kind: "powerpoint", meta: "Lucas Moreau · Last week" },
            { title: "RE: LATAM distributor timeline", kind: "outlook", meta: "Ana Ruiz · Yesterday" }
          ]
        }
      ]
    },

    "relocation-benefits": {
      title: "Relocation benefits",
      grounding: "Work",
      messages: [
        { role: "user", text: "What relocation benefits do we offer for international moves?" },
        {
          role: "assistant",
          status: "Searched HR policies",
          text: "Contoso’s **Global Mobility policy** covers international moves for eligible employees [1]:\n\n- Temporary housing for up to **60 days**\n- Shipment of household goods, including one vehicle\n- Two house-hunting trips for the employee and a partner\n- Tax preparation support for the first two filing years [2]\n\n> Requests must be approved by your manager and HR before the move date [1].\n\nYou can start a request in the HR portal under *My moves*.",
          sources: [
            { title: "Global Mobility policy.pdf", kind: "pdf", meta: "HR · SharePoint" },
            { title: "Relocation tax support FAQ", kind: "word", meta: "HR · Updated in March" }
          ]
        }
      ]
    },

    "escalation-trends": {
      title: "Escalation trends",
      grounding: "Work",
      messages: [
        { role: "user", text: "What are the trends in customer escalations this month?" },
        {
          role: "assistant",
          status: "Searched Teams chats and files",
          text: "Escalations are **down 18%** month over month, but two themes stand out [1]:\n\n1. **Sign-in issues** after the identity update account for 41% of cases [2].\n2. **Billing questions** from new self-serve customers doubled [1].\n\nThe support team proposed a known-issues page and a billing FAQ in `#cs-leads` [3].",
          sources: [
            { title: "Escalations dashboard", kind: "excel", meta: "Customer Success · Today" },
            { title: "Sign-in incident review", kind: "word", meta: "Jon Bell · Tuesday" },
            { title: "CS leads channel", kind: "teams", meta: "Teams · Yesterday" }
          ]
        }
      ]
    },

    "manager-emails": {
      title: "Latest emails from manager",
      grounding: "Work",
      messages: [
        { role: "user", text: "Summarize the latest emails from my manager and what I need to do" },
        {
          role: "assistant",
          status: "Searched your emails",
          text: "Maya Chen sent you **3 emails** since Friday:\n\n- **Phoenix launch readiness**: wants your comments on the brief by Thursday [1].\n- **Headcount plan**: asks you to confirm two open roles [2].\n- **Offsite logistics**: FYI only, no action needed [3].\n\n**Your to-dos**\n\n1. Review the launch brief and reply to Maya\n2. Confirm the open roles in the headcount plan",
          sources: [
            { title: "RE: Phoenix launch readiness", kind: "outlook", meta: "Maya Chen · 9:14 AM" },
            { title: "FY26 headcount plan", kind: "outlook", meta: "Maya Chen · Yesterday" },
            { title: "Offsite logistics", kind: "outlook", meta: "Maya Chen · Friday" }
          ]
        }
      ]
    },

    "market-analysis": {
      title: "Market analysis and trends",
      grounding: "Web",
      messages: [
        { role: "user", text: "What are the main trends in the collaboration software market?" },
        {
          role: "assistant",
          status: "Searched the web",
          text: "Here are the main trends shaping collaboration software in 2026:\n\n- **AI agents in everyday apps**: vendors are moving from assistants to agents that complete multi-step work [1].\n- **Consolidation**: buyers are reducing overlapping tools to cut costs [2].\n- **Governance first**: data protection and admin controls are now top buying criteria [3].\n\nWant me to compare these trends with our product roadmap? Turn on **Work** so I can use your files.",
          sources: [
            { title: "The agentic workplace, 2026", kind: "web", meta: "fabrikamresearch.example" },
            { title: "Why IT is consolidating SaaS", kind: "web", meta: "northwindinsights.example" },
            { title: "Buyer survey: security and AI", kind: "web", meta: "adatum-analysts.example" }
          ]
        }
      ]
    },

    "q2-marketing": {
      title: "Marketing strategy for Q2",
      grounding: "Work",
      messages: [
        { role: "user", text: "Outline our marketing strategy for Q2" },
        {
          role: "assistant",
          status: "Searched your files",
          text: "## Q2 marketing strategy\n\n**Goal:** grow qualified pipeline by 20% [1].\n\n- **Launch Project Phoenix** with a partner webinar series\n- **Refresh the website** product pages for self-serve buyers [2]\n- **Customer stories**: publish three case studies from the beta program\n\nBudget is allocated 50/30/20 across campaigns, content, and events [1].",
          sources: [
            { title: "Q2 marketing plan", kind: "word", meta: "Marketing · Updated in March" },
            { title: "Website refresh brief", kind: "loop", meta: "Web team · Last week" }
          ]
        }
      ]
    },

    // Used by ?scene=chat-thinking: the last reply is still in progress.
    "contoso-brief": {
      title: "Contoso account brief",
      grounding: "Work",
      messages: [
        { role: "user", text: "Draft a one-page brief for the Contoso account review" },
        { role: "assistant", status: "Searching your emails and files", pending: true, text: "" }
      ]
    }
  },

  /* -------------------------------------------------------------- scenes */
  // Which conversation each chat scene shows (ids from `conversations`).
  scenes: {
    "chat-response": "phoenix-week",
    "chat-thinking": "contoso-brief",
    "chat-web": "market-analysis",
    "chat-table": "sales-forecast"
  },

  /* -------------------------------------------------------------- cowork */
  cowork: {
    suggestions: [
      { icon: "mail", label: "Organize my inbox", prompt: "Organize my inbox and flag anything that needs my reply." },
      { icon: "calendar", label: "Arrange my week", prompt: "Arrange my week around my priorities and upcoming meetings." },
      { icon: "search", label: "Research a company", prompt: "Research Contoso and prepare a concise company brief." },
      { icon: "sparkle", label: "Catch me up", prompt: "Catch me up on messages, files, and meetings from this week." },
      { icon: "meeting", label: "Prep for a meeting", prompt: "Prepare me for the Northwind project review tomorrow." },
      { icon: "chart", label: "Build a report", prompt: "Build a weekly pipeline report from the sales tracker." }
    ],

    // "My tasks". status: Complete | Needs your input | In progress
    // opens: which session scene to show when clicked (complete | approval | running)
    tasks: [
      { id: 1, title: "Organize quarterly planning notes", preview: "Created a summary and action list", status: "Complete", time: "11:42 AM", unread: true, opens: "complete" },
      { id: 2, title: "Prepare for the Contoso account review", preview: "Drafted a briefing from 8 files and 3 meetings", status: "Complete", time: "Yesterday", unread: false, opens: "complete" },
      { id: 3, title: "Follow up with the launch team", preview: "Waiting for your approval to send 3 messages", status: "Needs your input", time: "Yesterday", unread: true, opens: "approval" },
      { id: 4, title: "Research customer onboarding patterns", preview: "Reviewing internal reports and public sources", status: "In progress", time: "Mon", unread: false, opens: "running" }
    ],

    // The task staged by the running / approval / complete scenes
    task: {
      prompt: "Organize my inbox and draft replies to urgent messages.",
      title: "Organize inbox and prepare replies",
      intro: "I’ll review your inbox, identify what needs your attention, and prepare suggested replies. I won’t send anything without your approval.",
      steps: [
        { title: "Reviewing recent messages", detail: "Checked 64 messages from the last 3 days" },
        { title: "Identifying urgent conversations", detail: "Found 5 that need a reply" },
        { title: "Preparing suggested replies", detail: "Drafting in your writing style" },
        { title: "Waiting for your approval", detail: "Nothing is sent without you" },
        { title: "Finishing the inbox summary", detail: "Creating a Word summary" }
      ],
      activity: [
        { kind: "outlook", text: "Read 64 messages in Inbox" },
        { kind: "teams", text: "Checked 3 related Teams chats" },
        { kind: "word", text: "Opened Launch readiness notes.docx" }
      ],
      runningStatus: "Identifying urgent conversations",
      runningDetail: "Checking senders, deadlines, and conversation context…",
      inputs: [{ kind: "outlook", title: "Inbox", detail: "Connected work content" }],
      files: [
        { kind: "word", title: "Inbox priorities.docx", detail: "Word document · 2 pages" },
        { kind: "outlook", title: "Draft replies (4)", detail: "Saved in Outlook Drafts" }
      ],
      skills: ["Email", "Enterprise Search", "Word"],
      approval: {
        intro: "I reviewed the urgent messages and prepared a reply to Jordan Lee. Please review it before I send anything.",
        risk: "Medium risk",
        action: "Send email?",
        to: "Jordan Lee <jordan.lee@contoso.com>",
        subject: "Re: Launch readiness review",
        body: "Hi Jordan, thanks for the update. I’ve reviewed the open items and can confirm our team is ready for Thursday’s checkpoint. I’ll send the final tracker by Wednesday EOD."
      },
      complete: {
        text: "Done! I organized your inbox, prioritized the messages that need attention, and prepared replies for you to review.\n\n- **5 urgent** conversations flagged\n- **4 replies** drafted in Outlook\n- **1 email** sent to Jordan Lee (approved)\n\nThe summary is saved to your OneDrive.",
        stats: "64 messages reviewed · 4 replies prepared · 1 sent with approval"
      }
    },

    schedules: [
      { id: 1, title: "Daily morning briefing", cadence: "Weekdays at 8:30 AM", next: "Tomorrow, 8:30 AM", state: "Active" },
      { id: 2, title: "Friday status report", cadence: "Fridays at 3:00 PM", next: "Friday, 3:00 PM", state: "Active" },
      { id: 3, title: "Monitor incident mentions", cadence: "When I’m mentioned in Incident Response", next: "Event driven", state: "Draft", event: true }
    ],
    runs: [
      { title: "Daily morning briefing", detail: "Completed in 42 seconds", time: "Today, 8:30 AM", state: "success" },
      { title: "Friday status report", detail: "Created Status report — Sep 18.docx", time: "Fri, 3:00 PM", state: "success" },
      { title: "Daily morning briefing", detail: "Upcoming", time: "Tomorrow, 8:30 AM", state: "pending" }
    ],

    // Customize → Skills. kind picks the icon: word, excel, powerpoint, outlook, calendar, search, teams
    skills: [
      { kind: "word", title: "Word", description: "Create and refine documents", enabled: true },
      { kind: "excel", title: "Excel", description: "Analyze data and build workbooks", enabled: true },
      { kind: "powerpoint", title: "PowerPoint", description: "Create presentations", enabled: true },
      { kind: "outlook", title: "Email", description: "Draft and manage messages", enabled: true },
      { kind: "calendar", title: "Calendar", description: "Schedule and organize meetings", enabled: true },
      { kind: "search", title: "Deep Research", description: "Synthesize information across sources", enabled: false }
    ],
    plugins: [
      { kind: "teams", title: "Teams", description: "Read and post in chats and channels", enabled: true },
      { kind: "sharepoint", title: "SharePoint", description: "Search sites and document libraries", enabled: true }
    ]
  },

  /* ------------------------------------------------------------ workflow */
  workflow: {
    intro: "Turn a repeatable process into a guided workflow using your Microsoft 365 content.",
    completePrompt: "Create a weekly launch status workflow",
    steps: [
      { title: "Collect updates", detail: "Recent email, meetings, and project files" },
      { title: "Summarize progress", detail: "Group accomplishments, risks, and decisions" },
      { title: "Prepare the report", detail: "Create an editable Word draft for review" }
    ],
    output: { kind: "word", title: "Launch status — week 38.docx", detail: "Created just now · 3 pages" }
  }
};
