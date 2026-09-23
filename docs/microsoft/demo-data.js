window.COWORK_DEMO_DATA = {
  user: {
    name: "Elvia Atkins",
    plan: "M365 Copilot Premium",
    initials: "EA"
  },
  models: [
    { id: "auto", name: "Auto", description: "Best model for the task", featured: true },
    { id: "gpt-5-5", name: "GPT 5.5", description: "Versatile across task types", featured: true },
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", description: "For complex, high-stakes work", featured: true },
    { id: "cowork-1", name: "Cowork 1", description: "Balances efficiency with performance", featured: true },
    { id: "gpt-5-6-sol", name: "GPT 5.6 Sol", description: "Intelligent and efficient for hard work" },
    { id: "gpt-5-6-terra", name: "GPT 5.6 Terra", description: "Balanced effort for common tasks" },
    { id: "gpt-6-astra", name: "GPT 6 Astra", description: "Latest model for difficult problems" },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5", description: "Fast everyday drafting and research" },
    { id: "opus-5", name: "Opus 5", description: "Complex, high-stakes work" }
  ],
  suggestions: [
    { icon: "✓", tone: "inbox", label: "Organize my inbox", prompt: "Organize my inbox and flag anything that needs my reply." },
    { icon: "▦", tone: "calendar", label: "Arrange my week", prompt: "Arrange my week around my priorities and upcoming meetings." },
    { icon: "▤", tone: "research", label: "Research a company", prompt: "Research Contoso and prepare a concise company brief." },
    { icon: "☀", tone: "briefing", label: "Catch me up", prompt: "Catch me up on messages, files, and meetings from this week." },
    { icon: "◫", tone: "meeting", label: "Prep for a meeting", prompt: "Prepare me for the Northwind project review tomorrow." },
    { icon: "✦", tone: "app", label: "Build an app", prompt: "Build a lightweight app to run our daily team check-in." }
  ],
  tasks: [
    { id: 1, title: "Organize quarterly planning notes", preview: "Created a summary and action list", status: "Complete", time: "11:42 AM", unread: true },
    { id: 2, title: "Prepare for the Contoso account review", preview: "Drafted a briefing from 8 files and 3 meetings", status: "Complete", time: "Yesterday", unread: false },
    { id: 3, title: "Follow up with the launch team", preview: "Waiting for your approval to send 3 messages", status: "Needs your input", time: "Yesterday", unread: true },
    { id: 4, title: "Research customer onboarding patterns", preview: "Reviewing internal reports and public sources", status: "In progress", time: "Mon", unread: false }
  ],
  schedules: [
    { id: 1, title: "Daily morning briefing", cadence: "Weekdays at 8:30 AM", next: "Tomorrow, 8:30 AM", state: "Active" },
    { id: 2, title: "Friday status report", cadence: "Fridays at 3:00 PM", next: "Friday, 3:00 PM", state: "Active" },
    { id: 3, title: "Monitor incident mentions", cadence: "When I am mentioned in Incident Response", next: "Event driven", state: "Draft" }
  ],
  skills: [
    { icon: "W", title: "Word", description: "Create and refine documents" },
    { icon: "X", title: "Excel", description: "Analyze data and build workbooks" },
    { icon: "P", title: "PowerPoint", description: "Create presentations" },
    { icon: "✉", title: "Email", description: "Draft and manage messages" },
    { icon: "▦", title: "Calendar", description: "Schedule and organize meetings" },
    { icon: "⌕", title: "Deep Research", description: "Synthesize information across sources" }
  ],
  chat: {
    pinned: [
      { id: "workflow-agent", icon: "◇", title: "Workflow agent", description: "Build and run repeatable work" }
    ],
    history: [
      "Relocation benefits",
      "Escalation trends",
      "New capabilities in Copilot",
      "Latest emails from manager",
      "Market analysis and trends",
      "Sales forecast FY26",
      "Marketing strategy for Q2"
    ],
    suggestions: ["Suggested", "Get to know Copilot", "Prepare for what’s ahead"],
    references: {
      recent: [
        { id: "launch-brief", kind: "file", title: "Project Phoenix launch brief", detail: "PowerPoint · Updated today", badge: "P" },
        { id: "maya-chen", kind: "person", title: "Maya Chen", detail: "VP, Product Marketing", badge: "MC" },
        { id: "leadership-sync", kind: "meeting", title: "Leadership launch sync", detail: "Meeting · Tomorrow at 10:00 AM", badge: "28" }
      ],
      files: [
        { id: "launch-brief", kind: "file", title: "Project Phoenix launch brief", detail: "PowerPoint · Updated today", badge: "P" },
        { id: "readiness-tracker", kind: "file", title: "Launch readiness tracker", detail: "Excel · Updated yesterday", badge: "X" },
        { id: "customer-insights", kind: "file", title: "Customer insights summary", detail: "Word · Updated Monday", badge: "W" }
      ],
      people: [
        { id: "maya-chen", kind: "person", title: "Maya Chen", detail: "VP, Product Marketing", badge: "MC" },
        { id: "jon-bell", kind: "person", title: "Jon Bell", detail: "Director, Customer Success", badge: "JB" }
      ],
      meetings: [
        { id: "leadership-sync", kind: "meeting", title: "Leadership launch sync", detail: "Tomorrow at 10:00 AM", badge: "28" },
        { id: "customer-review", kind: "meeting", title: "Contoso account review", detail: "Thursday at 2:30 PM", badge: "30" }
      ],
      emails: [
        { id: "launch-thread", kind: "email", title: "RE: Phoenix launch readiness", detail: "From Maya Chen · 9:14 AM", badge: "✉" },
        { id: "contoso-followup", kind: "email", title: "Contoso follow-up items", detail: "From Jon Bell · Yesterday", badge: "✉" }
      ]
    },
    responseSources: [
      { type: "PowerPoint", title: "Project Phoenix launch brief", detail: "Slides 4–8" },
      { type: "Meeting", title: "Leadership launch sync", detail: "Yesterday" },
      { type: "Email", title: "RE: Phoenix launch readiness", detail: "Maya Chen" }
    ],
    searchResults: [
      { type: "PowerPoint", title: "Project Phoenix launch brief", meta: "Modified today · Maya Chen", snippet: "Launch positioning, campaign milestones, and final readiness decisions." },
      { type: "Meeting", title: "Leadership launch sync", meta: "Yesterday · 8 participants", snippet: "Discussion of launch blockers, owners, and the September release timeline." },
      { type: "Person", title: "Maya Chen", meta: "VP, Product Marketing", snippet: "Frequent collaborator on Project Phoenix and go-to-market planning." },
      { type: "Email", title: "RE: Phoenix launch readiness", meta: "Today · 9:14 AM", snippet: "Final review notes and three follow-up items for the launch team." }
    ],
    files: [
      { title: "Quarterly planning notes", type: "Word", updated: "Today" },
      { title: "Customer insights", type: "PowerPoint", updated: "Yesterday" },
      { title: "Launch readiness tracker", type: "Excel", updated: "Monday" }
    ],
    notebooks: [
      { title: "Leadership planning", sources: 12 },
      { title: "Customer research", sources: 8 }
    ]
  },
  task: {
    prompt: "Organize my inbox and draft replies to urgent messages.",
    title: "Organize inbox and prepare replies",
    steps: [
      "Reviewing recent messages",
      "Identifying urgent conversations",
      "Preparing suggested replies",
      "Waiting for your approval",
      "Finishing the inbox summary"
    ],
    files: ["Inbox priorities.docx", "Draft replies.md"],
    skills: ["Email", "Enterprise Search", "Word"]
  }
};
