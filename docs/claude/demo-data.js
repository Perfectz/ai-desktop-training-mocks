window.CLAUDE_MOCK_DATA = {
  user: { name: "Elvia Atkins", initials: "EA", plan: "Claude Pro" },
  models: ["Claude Opus 4.8", "Claude Sonnet 5", "Auto"],
  recents: [
    { title: "Prepare launch materials", kind: "Task", time: "Today" },
    { title: "Team planning questions", kind: "Chat", time: "Today" },
    { title: "Research customer onboarding", kind: "Research", time: "Yesterday" },
    { title: "Create a prototype", kind: "Artifact", time: "Mon" }
  ],
  projects: [
    { title: "Project Phoenix", detail: "12 files · Updated today" },
    { title: "Tutorial production", detail: "8 files · Updated yesterday" }
  ],
  homeSuggestions: [
    { title: "Research a topic", icon: "search", prompt: "Research the latest customer onboarding patterns" },
    { title: "Create a document", icon: "document", prompt: "Create a leadership brief from my launch notes" },
    { title: "Analyze files", icon: "chart", prompt: "Analyze the attached metrics and identify the main trend" },
    { title: "Build an artifact", icon: "artifact", prompt: "Build an interactive launch readiness dashboard" }
  ],
  response: {
    prompt: "Help me prepare for the Project Phoenix leadership review",
    lead: "Here’s a focused preparation plan based on the project context in this fictional workspace.",
    sections: [
      { title: "Decisions to confirm", text: "Launch timing, the customer communication owner, and the final analytics sign-off." },
      { title: "Evidence to bring", text: "The readiness tracker, customer research summary, and open-risk register." },
      { title: "Strong opening", text: "Lead with the customer outcome, then show the three remaining decisions." }
    ]
  },
  task: {
    prompt: "Research the onboarding market and create a concise comparison report",
    title: "Customer onboarding research",
    steps: ["Planning the research", "Searching trusted sources", "Comparing product capabilities", "Writing the report", "Checking citations"],
    files: ["Onboarding market comparison.docx", "Source notes.md"]
  },
  artifact: {
    title: "Launch readiness dashboard",
    version: "Version 3",
    metrics: [
      { label: "Readiness", value: "84%", change: "+7%" },
      { label: "Open risks", value: "3", change: "-2" },
      { label: "Owners confirmed", value: "11/12", change: "+3" }
    ]
  },
  code: {
    project: "training-mock-kit",
    prompt: "Review the interface and improve keyboard accessibility",
    files: ["src/app.js", "src/styles.css", "tests/accessibility.spec.js"]
  },
  schedules: [
    { title: "Monday leadership brief", cadence: "Mondays at 8:30 AM", state: "Active" },
    { title: "Daily project risk scan", cadence: "Weekdays at 4:00 PM", state: "Active" }
  ]
};
