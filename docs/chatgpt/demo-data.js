window.CHATGPT_MOCK_DATA = {
  user: { name: "Elvia Atkins", initials: "EA", plan: "ChatGPT Business" },
  models: ["GPT-6 Sol", "GPT-6 Astra", "GPT-6 Luna"],
  chatSuggestions: [
    { label: "Create image", icon: "image", prompt: "Create a clean visual for a product launch update" },
    { label: "Summarize text", icon: "document", prompt: "Summarize the attached launch notes" },
    { label: "Help me write", icon: "edit", prompt: "Draft a concise launch update for leadership" },
    { label: "Analyze data", icon: "chart", prompt: "Analyze our weekly launch metrics" }
  ],
  workSuggestions: [
    { label: "Build a presentation", detail: "Create a finished deck from source files", icon: "slides" },
    { label: "Research a market", detail: "Gather sources and produce a report", icon: "search" },
    { label: "Analyze a spreadsheet", detail: "Find trends and create charts", icon: "chart" }
  ],
  recents: [
    { title: "Launch readiness summary", kind: "Work", time: "Today" },
    { title: "Customer onboarding ideas", kind: "Chat", time: "Today" },
    { title: "Q3 planning deck", kind: "Work", time: "Yesterday" },
    { title: "Interview questions", kind: "Chat", time: "Mon" }
  ],
  projects: [
    { title: "Project Phoenix", color: "#8b5cf6" },
    { title: "Training tutorials", color: "#0ea5e9" }
  ],
  chatResponse: {
    prompt: "Summarize the launch plan and give me the next three actions",
    lead: "The launch plan is on track, with three items that need attention before the leadership review.",
    bullets: [
      "Confirm the final owner for customer communications.",
      "Resolve the analytics dashboard access issue by Thursday.",
      "Send the updated launch brief to reviewers before 3:00 PM."
    ],
    sources: ["Launch plan.pdf", "Leadership notes.docx"]
  },
  workTask: {
    prompt: "Create a leadership-ready launch briefing from these project files",
    title: "Create launch briefing",
    steps: ["Reviewing source files", "Finding the strongest evidence", "Drafting the narrative", "Building the presentation", "Checking the final deliverable"],
    files: ["Launch briefing.pptx", "Executive summary.docx"]
  },
  codex: {
    project: "training-mock-kit",
    branch: "main",
    prompt: "Add a reusable scene picker and verify every tutorial route",
    steps: ["Inspecting the repository", "Updating scene configuration", "Running interface checks", "Preparing a review"],
    files: ["src/scenes.js", "src/studio.js", "tests/scenes.spec.js"]
  },
  searchResults: [
    { title: "Launch readiness summary", type: "Work", snippet: "Prepared the launch narrative and action list…" },
    { title: "Project Phoenix", type: "Project", snippet: "Files, instructions, and conversations for the launch…" },
    { title: "Launch plan.pdf", type: "Document", snippet: "Milestones, owners, launch channels, and timing…" }
  ]
};
