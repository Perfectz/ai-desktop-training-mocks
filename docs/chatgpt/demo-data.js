/*
 * ChatGPT desktop training mock: demo data
 * ============================================================================
 * EVERYTHING the mock shows comes from this object. Edit it here, or live in the
 * browser with the MockKit editor (Alt+E). ALL NAMES, COMPANIES AND NUMBERS ARE
 * FICTIONAL.
 *
 * Quick recipes
 *  - Add a conversation: add an entry to `conversations` (see "launch-plan"),
 *    then open it with ?chat=<id>, TrainingMock.openChat("<id>"), or by listing
 *    its id in `sidebar.chats`.
 *  - Point a scene at a different conversation: edit `sceneChats`.
 *  - Change who is "signed in": edit `user`.
 *
 * Message format (conversations[id].messages[])
 *   { role: "user" | "assistant",
 *     text: "markdown",                               // see Markdown below
 *     reasoning?:   { label: "Thought for 8s", text: "markdown" },  // collapsible
 *     search?:      "Searched 6 sites",               // status line above the reply
 *     sources?:     [ { title, domain } ],            // "Sources" pill under the reply
 *     attachments?: [ { name, kind: "pdf"|"doc"|"sheet"|"slides"|"image"|"code"|"file" } ],
 *     image?:       { caption, palette?: ["#hex", "#hex", "#hex"] }  // generated image placeholder
 *   }
 *
 * Markdown: # headings, **bold**, *italic*, ~~strike~~, `code`, ```lang fenced```,
 * - / 1. lists (indent 2+ spaces to nest), | tables |, > quotes, [links](url), ---,
 * and inline citation pills written as {{Source name}}.
 */
window.CHATGPT_MOCK_DATA = {
  /* ---------- App chrome ---------- */
  app: {
    name: "ChatGPT",
    theme: "light",                 // "light" | "dark" (URL ?theme= overrides)
    badge: "TRAINING MOCK · FICTIONAL DATA",
    disclaimer: "ChatGPT can make mistakes. Check important info."
  },

  /* ---------- Signed-in user ---------- */
  user: { name: "Elvia Atkins", initials: "EA", plan: "Business", avatarColor: "#7d5b45" },

  /* ---------- Models: first entry is the default ---------- */
  models: [
    { name: "ChatGPT 5.5", detail: "Auto: decides how long to think" },
    { name: "ChatGPT 5.5 Instant", detail: "Answers right away" },
    { name: "ChatGPT 5.5 Thinking", detail: "Thinks longer for better answers" },
    { name: "ChatGPT 5.5 Pro", detail: "Research-grade intelligence" }
  ],
  modelMenuTitle: "Models",

  /* ---------- Interface strings (rename buttons, placeholders, headings) ---------- */
  ui: {
    homeHeading: "What can I help with?",
    placeholder: "Ask anything",
    share: "Share",
    temporaryChat: "Turn on temporary chat",
    sourcesLabel: "Sources",
    copyCode: "Copy code",
    chatToggle: ["Chat", "Work"],
    newProjectLabel: "New project",
    searchPlaceholder: "Search chats...",
    searchNewChat: "New chat",
    thinkingLabel: "Thinking",          // shimmer shown while a reply is "thinking"
    creatingImageLabel: "Creating image"
  },

  /* ---------- Home screen suggestion chips (optional; [] hides them) ---------- */
  suggestions: [
    { label: "Create image", icon: "image", prompt: "Create a clean visual for the Project Phoenix launch update" },
    { label: "Summarize text", icon: "document", prompt: "Summarize the launch plan and give me the next three actions" },
    { label: "Help me write", icon: "edit", prompt: "Draft a concise launch update for leadership" },
    { label: "Analyze data", icon: "chart", prompt: "Analyze our weekly launch metrics" },
    { label: "Code", icon: "code", prompt: "Write a Python script that removes duplicate rows from a CSV" }
  ],

  /* ---------- Sidebar ---------- */
  sidebar: {
    // action: new | search | library | codex | sora | gpts | work | scheduled | sites | plugins
    primary: [
      { action: "new", label: "New chat", icon: "compose", shortcut: "Ctrl Shift O" },
      { action: "search", label: "Search chats", icon: "search", shortcut: "Ctrl K" },
      { action: "library", label: "Library", icon: "library" }
    ],
    apps: [
      { action: "codex", label: "Codex", icon: "codex" },
      { action: "work", label: "Work", icon: "work" },
      { action: "sora", label: "Sora", icon: "sora" },
      { action: "gpts", label: "GPTs", icon: "gpts" }
    ],
    more: [
      { action: "scheduled", label: "Scheduled", icon: "clock" },
      { action: "sites", label: "Sites", icon: "globe" }
    ],
    projectsLabel: "Projects",
    chatsLabel: "Chats",
    // Conversation ids (from `conversations`) or { title } for history-only rows.
    chats: [
      "launch-plan",
      "onboarding-ideas",
      "csv-cleanup",
      "onboarding-trends",
      "launch-visual",
      { title: "Interview questions for PM role" },
      { title: "Q3 planning deck outline" },
      { title: "Rewrite onboarding email" },
      { title: "Explain OKRs vs KPIs" },
      { title: "Team offsite agenda ideas" },
      { title: "Excel formula for rolling average" }
    ]
  },

  /* ---------- Which conversation each chat scene opens ---------- */
  sceneChats: {
    "chat-response": "launch-plan",
    "chat": "onboarding-ideas",
    "chat-code": "csv-cleanup",
    "chat-search": "onboarding-trends",
    "chat-image": "launch-visual"
  },

  /* Reply streamed after a typed prompt that does not match any conversation's first message.
     (Typing the exact first prompt of a conversation streams that conversation's reply instead.) */
  autoReply: "Here is a quick draft you can build on:\n\n**Project Phoenix launch update**\n\n- **Status:** On track for the June 12 launch.\n- **Risks:** Analytics dashboard access still pending.\n- **Next step:** Leadership review on Thursday at 3:00 PM.\n\nWant me to turn this into an email or a one-page brief?",

  /* ---------- Conversations ---------- */
  conversations: {
    "launch-plan": {
      title: "Launch readiness summary",
      time: "Today",                 // optional: shown in project lists
      model: "ChatGPT 5.5 Thinking",
      messages: [
        {
          role: "user",
          attachments: [{ name: "Project Phoenix launch plan.pdf", kind: "pdf" }],
          text: "Summarize the launch plan and give me the next three actions"
        },
        {
          role: "assistant",
          reasoning: {
            label: "Thought for 8s",
            text: "The plan lists 14 milestones. Most are complete; three open items block the leadership review. I should lead with overall status, then list owners and dates so the actions are easy to assign."
          },
          text: "The **Project Phoenix** launch is on track for **June 12**, with three open items that need attention before Thursday's leadership review.\n\n### Where things stand\n\n| Workstream | Owner | Status |\n| --- | --- | --- |\n| Product readiness | Marcus Webb | Complete |\n| Customer communications | *Unassigned* | At risk |\n| Analytics dashboard | Priya Natarajan | Blocked |\n| Sales enablement | Jordan Ellis | On track |\n\n### Next three actions\n\n1. **Assign an owner for customer communications.** The email sequence and help-center update have no owner yet.\n2. **Unblock analytics dashboard access** by Thursday. Priya needs workspace admin approval.\n3. **Send the updated launch brief** to reviewers before 3:00 PM Wednesday.\n\n> Tip: if you want, I can draft the reviewer email and a one-page brief from this summary."
        }
      ]
    },

    "onboarding-ideas": {
      title: "Customer onboarding ideas",
      time: "Mon",
      model: "ChatGPT 5.5",
      messages: [
        { role: "user", text: "We're redesigning onboarding for our scheduling app, Tempo. Give me a few ideas to get new teams to their first booked meeting faster." },
        {
          role: "assistant",
          text: "Here are five ideas, ordered by expected impact on **time to first booked meeting**:\n\n1. **Pre-filled availability.** Import working hours from the calendar they connect, so the booking page is usable in one click.\n2. **\"Book yourself\" test.** Invite the admin to book a test meeting with themselves. It proves the flow works and creates a success moment.\n3. **Team templates.** Offer starter pages for *Sales demo*, *Support call*, and *Interview*.\n4. **Progress checklist.** A 4-step checklist in the sidebar that disappears once complete.\n5. **Nudge at day 2.** If no meeting is booked in 48 hours, send an email with their booking link ready to share.\n\nWould you like me to estimate effort for each one?"
        },
        { role: "user", text: "Yes, rough effort and impact in a table please." },
        {
          role: "assistant",
          reasoning: { label: "Thought for 5s", text: "Use a simple S/M/L scale for effort and High/Medium/Low for impact. Keep the table scannable." },
          text: "| Idea | Effort | Impact | Notes |\n| --- | --- | --- | --- |\n| Pre-filled availability | M | High | Needs calendar scope already requested at sign-up |\n| \"Book yourself\" test | S | High | Reuses the existing booking flow |\n| Team templates | M | Medium | Three templates to start |\n| Progress checklist | S | Medium | Pairs well with the test booking |\n| Day-2 nudge | S | Medium | Lifecycle email tool already in place |\n\n**Suggested first sprint:** the *Book yourself* test plus the checklist. Both are small and reinforce each other."
        },
        { role: "user", text: "Write the copy for the day-2 nudge email." },
        {
          role: "assistant",
          text: "**Subject:** Your booking page is ready, share it in one click\n\n**Preview text:** Teams that share their link on day 2 book 3x more meetings.\n\n---\n\nHi {first_name},\n\nYour Tempo booking page is live and ready for your first meeting. Here's your link:\n\n> **tempo.app/{team}/intro**\n\nThree quick ways to use it today:\n\n- Paste it into your email signature\n- Add it to your next calendar invite\n- Pin it in your team's chat channel\n\n[Share my booking link](https://example.com)\n\nHappy scheduling,\nThe Tempo team"
        }
      ]
    },

    "csv-cleanup": {
      title: "Remove duplicate CSV rows",
      model: "ChatGPT 5.5",
      messages: [
        { role: "user", text: "Write a Python script that removes duplicate rows from a CSV" },
        {
          role: "assistant",
          text: "Here's a small script using the standard `csv` module. It keeps the **first** occurrence of each row and preserves the original order.\n\n```python\nimport csv\nimport sys\n\n\ndef dedupe(src: str, dest: str) -> int:\n    \"\"\"Copy src to dest without duplicate rows. Returns rows removed.\"\"\"\n    seen = set()\n    removed = 0\n    with open(src, newline=\"\") as f_in, open(dest, \"w\", newline=\"\") as f_out:\n        reader = csv.reader(f_in)\n        writer = csv.writer(f_out)\n        for row in reader:\n            key = tuple(cell.strip() for cell in row)\n            if key in seen:\n                removed += 1\n                continue\n            seen.add(key)\n            writer.writerow(row)\n    return removed\n\n\nif __name__ == \"__main__\":\n    count = dedupe(sys.argv[1], sys.argv[2])\n    print(f\"Removed {count} duplicate rows\")\n```\n\n**How to run it**\n\n```bash\npython dedupe.py contacts.csv contacts_clean.csv\n```\n\nA few notes:\n\n- Whitespace is trimmed before comparing, so `\"Ana \"` and `\"Ana\"` count as the same.\n- For very large files, consider `pandas.read_csv(...).drop_duplicates()` instead."
        }
      ]
    },

    "onboarding-trends": {
      title: "Employee onboarding trends",
      model: "ChatGPT 5.5",
      messages: [
        { role: "user", text: "What are the latest trends in employee onboarding?" },
        {
          role: "assistant",
          search: "Searched 6 sites",
          text: "Here are the trends showing up most often in recent onboarding research {{Northwind Research}}:\n\n- **Pre-boarding before day one.** Companies send equipment, accounts, and a welcome plan before the start date, which reduces first-week drop-off {{Contoso HR Journal}}.\n- **Role-specific 30-60-90 plans.** Generic orientation is giving way to plans tied to the first real deliverable.\n- **Onboarding buddies.** Pairing each hire with a peer outside their reporting line is linked to faster ramp-up {{Fabrikam People Lab}}.\n- **AI assistants for policy questions.** New hires ask an internal assistant instead of waiting on HR, freeing time for relationship-building.\n\n### What this means for you\n\nIf you only change one thing, start **pre-boarding**: it's inexpensive and affects every hire.",
          sources: [
            { title: "2026 Onboarding Benchmark Report", domain: "northwind-research.com" },
            { title: "The first 90 days, reimagined", domain: "contoso-hrjournal.com" },
            { title: "Buddy programs and ramp time", domain: "fabrikam-peoplelab.com" },
            { title: "Pre-boarding checklist", domain: "adatum-talent.com" }
          ]
        }
      ]
    },

    "launch-visual": {
      title: "Launch visual",
      time: "Yesterday",
      model: "ChatGPT 5.5",
      messages: [
        { role: "user", text: "Create a clean visual for the Project Phoenix launch update" },
        {
          role: "assistant",
          text: "",
          image: { caption: "Project Phoenix launch visual", palette: ["#ff7a45", "#f5c26b", "#3b2f6b"] }
        },
        { role: "assistant", text: "Here's a clean, minimal launch visual with a warm sunrise palette. Want a square version for social or a wide banner for email?" }
      ]
    }
  },

  /* ---------- Work (agent mode) ---------- */
  work: {
    heading: "What would you like to work on?",
    placeholder: "Do anything",
    reasoningLabel: "Extra High",
    connectionsLabel: "Connected apps",
    connections: [
      { name: "Google Calendar", detail: "Create and manage events on your calendar", logo: "31", tone: "calendar", status: "Connected" },
      { name: "Slack", detail: "Read and write messages on Slack", logo: "#", tone: "slack", status: "Connect" },
      { name: "Gmail", detail: "Find and reference emails from your inbox", logo: "M", tone: "gmail", status: "Connect" }
    ],
    suggestions: [
      { label: "Build a presentation", icon: "slides" },
      { label: "Research a market", icon: "search" },
      { label: "Analyze a spreadsheet", icon: "chart" }
    ],
    task: {
      title: "Create launch briefing",
      prompt: "Create a leadership-ready launch briefing from these project files",
      runningStatus: "Working · you can leave and return",
      completeStatus: "Completed just now",
      runningHeading: "Working through the task",
      completeHeading: "Work complete",
      runningPill: "In progress",
      completePill: "Ready to review",
      progress: 58,          // percent shown while running
      currentStep: 2,        // zero-based index of the step in progress
      steps: [
        "Reviewing source files",
        "Finding the strongest evidence",
        "Drafting the narrative",
        "Building the presentation",
        "Checking the final deliverable"
      ],
      summary: "I built an **8-slide briefing** and a **2-page executive summary**. The deck leads with launch readiness, then risks and the three decisions leadership needs to make.",
      outputs: [
        { name: "Launch briefing.pptx", kind: "slides", detail: "PowerPoint · 8 slides", action: "Preview" },
        { name: "Executive summary.docx", kind: "doc", detail: "Word document · 2 pages", action: "Preview" }
      ],
      detailsTitle: "Task details",
      details: [
        { label: "Context", count: "3 items", text: "Project Phoenix files and the instructions supplied for this task.", chips: ["Launch plan.pdf", "Brand guide.pptx", "Metrics.xlsx"] },
        { label: "Tools", count: "3", chips: ["Research", "Documents", "Slides"] },
        { label: "Permissions", count: "0 pending", text: "This mock never opens real apps, files, or accounts." }
      ]
    }
  },

  /* ---------- Codex ---------- */
  codex: {
    title: "Codex",
    heading: "What should we code next?",
    placeholder: "Describe a task",
    repo: "elvia-atkins/training-mock-kit",
    branch: "main",
    environment: "Cloud · Universal",
    askLabel: "Ask",
    codeLabel: "Code",
    tabs: ["Tasks", "Code reviews", "Archive"],
    diffTabs: ["Diff", "Logs"],
    followupPlaceholder: "Request changes or ask a question",
    prCreatedLabel: "View PR",
    activeTask: "scene-picker",
    tasks: [
      {
        id: "scene-picker",
        title: "Add a reusable scene picker and verify every tutorial route",
        time: "Just now",
        repo: "training-mock-kit",
        status: "Ready",
        additions: 48,
        deletions: 12,
        prompt: "Add a reusable scene picker and verify every tutorial route",
        worked: "Worked for 4m 12s",
        log: [
          { text: "Read src/scenes.js and src/studio.js", done: true },
          { text: "Ran npm test", done: true },
          { text: "Edited 3 files", done: true },
          { text: "Ran npm test (24 passed)", done: true }
        ],
        summary: "### Summary\n\n- Added a shared `sceneConfig` export so every mock reads scenes from one place.\n- Synced the tutorial studio picker with `syncScenePicker()`.\n- Added a snapshot test covering all 12 routes.\n\n### Testing\n\n- ✅ `npm test`",
        prLabel: "Create PR",
        files: [
          {
            path: "src/scenes.js", additions: 21, deletions: 6,
            lines: [
              "@@ -1,9 +1,14 @@",
              " import { routes } from \"./routes.js\";",
              "-const scenes = [\"home\", \"chat\"];",
              "+export const sceneConfig = routes.map((route) => ({",
              "+  key: route.key,",
              "+  label: route.label,",
              "+}));",
              " ",
              "-export default scenes;",
              "+export const tutorialScenes = sceneConfig;",
              "+export default tutorialScenes;"
            ]
          },
          {
            path: "src/studio.js", additions: 17, deletions: 6,
            lines: [
              "@@ -22,7 +22,9 @@ export function openStudio() {",
              "   const picker = document.querySelector(\"#scene\");",
              "-  picker.innerHTML = renderOptions(scenes);",
              "+  syncScenePicker(tutorialScenes);",
              "+  picker.addEventListener(\"change\", onSceneChange);",
              "   panel.hidden = false;",
              " }"
            ]
          },
          {
            path: "tests/scenes.spec.js", additions: 10, deletions: 0,
            lines: [
              "@@ -0,0 +1,10 @@",
              "+import { tutorialScenes } from \"../src/scenes.js\";",
              "+",
              "+test(\"every scene has a route\", () => {",
              "+  const routes = tutorialScenes.map((s) => s.key);",
              "+  expect(routes).toMatchSnapshot();",
              "+});"
            ]
          }
        ]
      },
      { id: "dark-theme", title: "Support dark theme tokens in the studio panel", time: "2 hours ago", repo: "training-mock-kit", status: "Merged", additions: 86, deletions: 31 },
      { id: "a11y", title: "Fix focus order in the search dialog", time: "Yesterday", repo: "training-mock-kit", status: "Open", additions: 14, deletions: 9 },
      { id: "flaky", title: "Investigate flaky screenshot test on CI", time: "Mon", repo: "training-mock-kit", status: "Archived", additions: 3, deletions: 3 }
    ]
  },

  /* ---------- Projects ---------- */
  projects: [
    {
      title: "Project Phoenix", color: "#f97316",
      description: "Launch planning for Tempo's June release.",
      chats: ["launch-plan", "launch-visual", { title: "Leadership briefing", snippet: "8 slides covering readiness, risks and decisions", time: "May 28" }],
      files: ["Launch plan.pdf", "Brand guide.pptx", "Metrics.xlsx"]
    },
    { title: "Training tutorials", color: "#0ea5e9", description: "Scripts and outlines for tutorial videos.", chats: ["onboarding-ideas"], files: [] }
  ],
  projectTabs: ["Chats", "Sources"],

  /* ---------- Search chats dialog ---------- */
  search: {
    groups: [
      { label: "Today", items: ["launch-plan", "onboarding-ideas"] },
      { label: "Yesterday", items: ["csv-cleanup", "onboarding-trends"] },
      { label: "Previous 7 days", items: ["launch-visual", { title: "Q3 planning deck outline", snippet: "Slide-by-slide outline for the Q3 planning review" }] }
    ]
  },

  /* ---------- Collection pages ---------- */
  pages: {
    library: {
      title: "Library",
      subtitle: "Images and files you've created",
      items: [
        { title: "Project Phoenix launch visual", detail: "Today", palette: ["#ff7a45", "#f5c26b", "#3b2f6b"] },
        { title: "Team offsite poster", detail: "Yesterday", palette: ["#7dd3fc", "#0ea5e9", "#0c4a6e"] },
        { title: "Tempo app icon concepts", detail: "May 27", palette: ["#a7f3d0", "#10b981", "#064e3b"] },
        { title: "Quarterly review cover", detail: "May 22", palette: ["#fde68a", "#f59e0b", "#78350f"] },
        { title: "Onboarding illustration", detail: "May 20", palette: ["#e9d5ff", "#a855f7", "#3b0764"] },
        { title: "Product hero shot", detail: "May 18", palette: ["#fecdd3", "#f43f5e", "#4c0519"] }
      ]
    },
    gpts: {
      title: "GPTs",
      subtitle: "Discover and create custom versions of ChatGPT that combine instructions, extra knowledge, and any combination of skills.",
      items: [
        { icon: "document", title: "Launch Brief Writer", detail: "Turns plans into one-page briefs · By Elvia Atkins" },
        { icon: "chart", title: "Metrics Explainer", detail: "Explains dashboards in plain language · By Tempo Ops" },
        { icon: "edit", title: "Brand Voice Editor", detail: "Rewrites copy in the Tempo voice · By Marketing" }
      ]
    },
    sora: {
      title: "Sora",
      subtitle: "Create videos from text, images, and clips.",
      items: [
        { icon: "image", title: "Sunrise over the launch pad", detail: "Video · 10s · Today" },
        { icon: "image", title: "Product walkthrough intro", detail: "Video · 5s · Yesterday" }
      ]
    },
    plugins: {
      title: "Plugins",
      subtitle: "Extend ChatGPT with approved tools, skills, and app templates.",
      items: [
        { icon: "search", title: "Deep research", detail: "Research across the web and connected sources" },
        { icon: "slides", title: "Presentations", detail: "Build and refine presentation files" },
        { icon: "chart", title: "Data analysis", detail: "Analyze spreadsheets and create charts" }
      ]
    },
    scheduled: {
      title: "Scheduled",
      subtitle: "Tasks ChatGPT runs once, on a schedule, or when something changes.",
      items: [
        { icon: "clock", title: "Monday leadership brief", detail: "Every Monday at 8:00 AM", status: "Active" },
        { icon: "clock", title: "Daily launch-risk monitor", detail: "Every weekday at 4:30 PM", status: "Active" },
        { icon: "clock", title: "Customer feedback digest", detail: "When new feedback arrives", status: "Paused" }
      ]
    },
    sites: {
      title: "Sites",
      subtitle: "Interactive sites and dashboards created with ChatGPT Work.",
      items: [
        { icon: "globe", title: "Project Phoenix launch hub", detail: "Updated today" },
        { icon: "globe", title: "Revenue forecast planner", detail: "Updated yesterday" },
        { icon: "globe", title: "Event operations dashboard", detail: "Last opened Monday" }
      ]
    }
  }
};
