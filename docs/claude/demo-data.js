/*
 * ============================================================================
 *  Claude desktop training mock — DEMO DATA
 * ============================================================================
 *  Everything the mock shows comes from this object. All names, companies,
 *  numbers, files and sources are FICTIONAL. Edit freely — no code changes
 *  are needed. You can also edit live in the browser with Alt+E (MockKit).
 *
 *  QUICK RECIPES
 *  -------------
 *  • Add a conversation: copy an entry in `conversations`, give it a new id
 *    (the object key), then open it with  ?chat=<id>  or add the id to
 *    `sidebar.recents` / `sidebar.starred`.
 *  • Messages:  { role: "user" | "assistant", text: "markdown" }
 *      optional on any message:
 *        attachments: [{ name, kind }]            file cards (kind: PDF, DOCX, XLSX, MD, PNG…)
 *      optional on assistant messages:
 *        thinking:   { label: "Thought for 12s", text: "markdown" }   collapsible
 *        tools:      [{ icon, label, detail, runningLabel,             tool / status rows
 *                       output: "text", diff: { file, lines: ["+add", "-del", " same"] },
 *                       results: [{ title, site }] }]
 *        research:   { status, duration, sources, steps: [..], results: [{ title, site }] }
 *        artifact:   "<artifact id>"   card that opens the side panel
 *        after:      "markdown"        text shown below the artifact card
 *        toolsFirst: true | false      tool rows above the text (default: true,
 *                                      except in code conversations)
 *  • Markdown supports: # headings, **bold**, *italic*, `code`, ~~strike~~,
 *    [links](https://…), > quotes, - bullets, 1. numbers (indent 2 spaces to
 *    nest), | tables |, --- rules, fenced code (``` or ~~~ + language), and
 *    [[site name]] for Claude-style citation chips.
 *    Tip: inside the `…` strings below use ~~~ fences and write \` for a
 *    literal backtick.
 *  • Scenes (`scenes`) pick which conversation / artifact / project a scene
 *    shows. URL:  ?scene=<key>  ·  ?chat=<id>  ·  ?theme=dark  ·  ?clean=1
 *    ·  ?name=Jordan  ·  ?time=morning|afternoon|evening  ·  ?sidebar=collapsed
 * ============================================================================
 */
window.CLAUDE_MOCK_DATA = {
  /* ---------------------------------------------------------------- account */
  user: { name: "Elvia Atkins", plan: "Pro plan" },

  /* Home greeting. {greeting} = time-of-day word, {firstName} = user's first name.
     Set `fixed` to force one line, e.g. "Coffee and Claude time?" */
  greeting: {
    format: "{greeting}, {firstName}",
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    fixed: ""
  },

  /* ------------------------------------------------------ interface labels */
  ui: {
    badge: "TRAINING MOCK · FICTIONAL DATA",
    newChat: "New chat",
    newSession: "New session",
    starred: "Starred",
    recents: "Recents",
    sessions: "Sessions",
    share: "Share",
    homePlaceholder: "How can I help you today?",
    replyPlaceholder: "Reply to Claude…",
    codePlaceholder: "Ask Claude to change something…",
    projectPlaceholder: "How can I help you today?",
    searchPlaceholder: "Search chats and projects…",
    disclaimer: "Claude can make mistakes. Please double-check responses.",
    lastMessage: "Last message",
    chatsTitle: "Chats",
    chatsSearch: "Search your chats…",
    chatsCount: "You have {count} previous chats with Claude",
    artifactsTitle: "Artifacts",
    newArtifact: "New artifact",
    allProjects: "All projects",
    scheduledTitle: "Scheduled",
    scheduledSubtitle: "Recurring work Claude runs for you on a schedule.",
    newTask: "New task"
  },

  /* ----------------------------------------------------------------- models
     `short` is what the composer shows. The first model is the default. */
  models: [
    { name: "Claude Opus 5.5", short: "Opus 5.5", description: "Most capable for complex work" },
    { name: "Claude Sonnet 5", short: "Sonnet 5", description: "Smart, efficient model for everyday use" },
    { name: "Claude Haiku 5", short: "Haiku 5", description: "Fastest model for quick answers" }
  ],

  /* ------------------------------------------------------ sidebar contents
     starred / recents: a conversation id (clickable) or { title } (decorative). */
  sidebar: {
    nav: [
      { label: "Chats", icon: "chats", scene: "chats" },
      { label: "Projects", icon: "folder", scene: "project" },
      { label: "Artifacts", icon: "artifacts", scene: "artifacts" },
      { label: "Code", icon: "code", scene: "code" }
    ],
    starred: ["launch-dashboard", "phoenix-review"],
    recents: [
      "csv-cleanup",
      "onboarding-research",
      "launch-materials",
      { title: "Quarterly offsite agenda ideas" },
      { title: "Explain vector databases simply" },
      { title: "Kitchen renovation budget" },
      { title: "Spanish practice: travel phrases" },
      { title: "Rewrite the volunteer sign-up email" }
    ]
  },

  /* ------------------------------------------------------ home chips row
     Clicking a chip shows its suggestions under the composer. */
  chips: [
    { label: "Write", icon: "pen", suggestions: ["Draft a launch announcement for Project Phoenix", "Turn my meeting notes into a crisp summary", "Write a friendly follow-up email to a customer"] },
    { label: "Learn", icon: "cap", suggestions: ["Explain vector databases like I'm new to them", "Teach me the basics of product analytics", "Quiz me on Spanish travel phrases"] },
    { label: "Code", icon: "code", suggestions: ["Write a Python script to clean a CSV export", "Review this function for accessibility issues", "Explain what this regular expression does"] },
    { label: "Life stuff", icon: "coffee", suggestions: ["Plan a relaxed weekend in the mountains", "Build a weekly meal plan on a budget", "Help me plan a kitchen renovation"] },
    { label: "Claude's choice", icon: "bulb", suggestions: ["Surprise me with a thought experiment", "Give me a 5-minute creative writing prompt", "Tell me something fascinating about octopuses"] }
  ],

  /* ------------------------------------------------ composer menus */
  plusMenu: [
    { label: "Add files or photos", icon: "paperclip" },
    { label: "Take a screenshot", icon: "camera" },
    { label: "Add from GitHub", icon: "repo" },
    { label: "Add to project", icon: "folder", submenu: true }
  ],
  toolsMenu: [
    { label: "Use style", icon: "pen", submenu: true },
    { label: "Web search", icon: "globe", toggle: true, on: true },
    { label: "Research", icon: "research", toggle: true, on: false }
  ],
  connectors: [
    { name: "Google Drive", on: true },
    { name: "Gmail", on: false },
    { name: "Google Calendar", on: true }
  ],

  /* What Claude streams back when someone sends a message inside the mock. */
  simulatedReply: {
    thinking: { label: "Thought for 3s", text: "The user wants a quick, practical answer. Keep it short and offer a next step." },
    text: "Happy to help with that. Here's a quick way to approach it:\n\n1. **Clarify the goal** — what does a great result look like?\n2. **Gather what you have** — notes, files, or examples.\n3. **Draft, then refine** — I'll write a first version and we can iterate.\n\nShare any details you have and I'll get started."
  },

  /* ============================================================ CONVERSATIONS
     key = conversation id. `mode`: "chat" (default) | "task" | "code". */
  conversations: {
    "phoenix-review": {
      title: "Phoenix leadership review prep",
      model: "Claude Opus 5.5",
      project: "phoenix",
      updated: "2 hours ago",
      messages: [
        {
          role: "user",
          text: "Help me prepare for Thursday's Project Phoenix leadership review. I have 20 minutes and need a decision on the launch date.",
          attachments: [{ name: "Phoenix readiness tracker.xlsx", kind: "XLSX" }]
        },
        {
          role: "assistant",
          thinking: {
            label: "Thought for 12s",
            text: "Elvia has 20 minutes and one decision to land: the launch date. The tracker shows 84% readiness with three open risks. Leadership reviews go best when the ask comes early and the evidence is tight, so I'll structure the time around the decision, then list the evidence and a strong opening line."
          },
          text: `Here's a 20-minute plan built around the one decision you need: **approving the June 9 launch date**.

## Structure the time

| Block | Minutes | Goal |
|---|---|---|
| Customer outcome | 3 | Remind the room why Phoenix matters |
| Readiness snapshot | 7 | Show 84% readiness and the weekly trend |
| Open risks | 5 | Three risks, each with a named owner |
| Decision | 5 | Ask for a clear go / no-go |

## Decisions to confirm

1. **Launch date** — June 9, with June 16 as the fallback.
2. **Customer communications owner** — Dana Whitfield has capacity after May 30.
3. **Analytics sign-off** — Priya Raman still needs to review the new funnel events.

## Evidence to bring

- The readiness tracker, filtered to *blocked* items only
- Two quotes from the pilot customer interviews
- The open-risk register with mitigation dates

> **Suggested opening:** "Pilot customers finished onboarding 40% faster. We're asking you to approve June 9 so every customer gets that."

Want me to turn this into a one-page brief or a slide outline?`
        }
      ]
    },

    "csv-cleanup": {
      title: "Clean up the signup export",
      model: "Claude Sonnet 5",
      updated: "Yesterday",
      messages: [
        { role: "user", text: "I have a CSV export of event signups with duplicate rows and messy emails. Can you write a Python script to clean it?" },
        {
          role: "assistant",
          text: `Here's a small script using **pandas** that normalizes emails, removes duplicates, and saves a clean copy.

~~~python
import pandas as pd

def clean_signups(path, out_path="signups_clean.csv"):
    df = pd.read_csv(path)

    # Normalize emails: trim spaces and lowercase
    df["email"] = df["email"].str.strip().str.lower()

    # Drop rows without an email, then remove duplicates
    df = df.dropna(subset=["email"])
    df = df.drop_duplicates(subset=["email"], keep="first")

    df.to_csv(out_path, index=False)
    return df

if __name__ == "__main__":
    clean_signups("signups.csv")
~~~

A few notes:

- \`keep="first"\` keeps the **earliest** signup for each person.
- If your column is named differently (for example \`Email Address\`), change \`"email"\` in three places.
- The original file is never modified.`
        },
        { role: "user", text: "Nice. Can it also print a short summary of how many rows were removed?" },
        {
          role: "assistant",
          thinking: { label: "Thought for 4s", text: "Count rows before and after each step so the summary separates missing emails from duplicates." },
          text: `Sure — count the rows before and after each step, then print a summary:

~~~python
    start = len(df)
    df = df.dropna(subset=["email"])
    missing = start - len(df)

    before_dedupe = len(df)
    df = df.drop_duplicates(subset=["email"], keep="first")
    dupes = before_dedupe - len(df)

    print(f"Rows in:  {start}")
    print(f"Removed:  {missing} missing emails, {dupes} duplicates")
    print(f"Rows out: {len(df)}")
~~~

Running it on your export would print something like:

~~~text
Rows in:  1,248
Removed:  17 missing emails, 96 duplicates
Rows out: 1,135
~~~`
        },
        { role: "user", text: "Perfect. Draft a two-line note to the team explaining the cleanup." },
        {
          role: "assistant",
          text: `Here's a short note you can paste into your team channel:

> Heads up — I cleaned the event signup export: emails are now lowercase and trimmed, and 96 duplicate and 17 empty rows were removed. The clean file (1,135 signups) is in the shared folder as *signups_clean.csv*.

Want a more formal version for the leadership update?`
        }
      ]
    },

    "launch-dashboard": {
      title: "Launch readiness dashboard",
      model: "Claude Opus 5.5",
      project: "phoenix",
      updated: "Today",
      messages: [
        { role: "user", text: "Build an interactive dashboard from the launch readiness metrics so leadership can see where we stand at a glance." },
        {
          role: "assistant",
          thinking: { label: "Thought for 6s", text: "Leadership needs the headline number first, then which workstreams lag, then the open items. Keep it to one screen with clear status colors." },
          text: "I built a **launch readiness dashboard** that leads with the overall score, shows readiness by workstream, and lists the open items leadership needs to unblock.",
          artifact: "launch-dashboard",
          after: `A few things you can try:

- Hover a workstream bar to see its owner
- Ask me to add a **trend line** for the last four weeks
- Switch to the Code tab to copy the component`
        }
      ]
    },

    "onboarding-research": {
      title: "B2B onboarding research",
      model: "Claude Opus 5.5",
      updated: "Yesterday",
      messages: [
        { role: "user", text: "Research how B2B software companies are shortening customer onboarding, and give me a cited summary I can share with the team." },
        {
          role: "assistant",
          research: {
            status: "Research complete",
            duration: "6m 18s",
            sources: "187 sources",
            steps: [
              "Planned the research approach",
              "Searched industry reports and practitioner write-ups",
              "Compared onboarding models across 12 companies",
              "Wrote a cited report"
            ],
            results: [
              { title: "2026 Customer Onboarding Benchmark Report", site: "benchmarks.example" },
              { title: "How we cut time-to-value from 30 days to 9", site: "fieldnotes.example.com" },
              { title: "Guided setup vs. white-glove onboarding", site: "saas-review.example" },
              { title: "The activation metrics that actually matter", site: "productletters.example" },
              { title: "Onboarding teardown: 12 B2B products", site: "teardowns.example.org" },
              { title: "Why self-serve setup stalls at integrations", site: "opsjournal.example" }
            ]
          },
          text: `Companies that shortened onboarding most did three things consistently:

1. **Replaced kickoff calls with guided in-product setup.** Teams using checklists inside the product cut median time-to-value from 30 to 9 days [[fieldnotes.example.com]].
2. **Measured activation, not completion.** The strongest programs track the first *meaningful outcome* rather than finished tutorials [[productletters.example]].
3. **Front-loaded integrations.** Setup most often stalls at connecting data, so leaders offer a pre-built import in the first session [[opsjournal.example]] [[benchmarks.example]].

I put the full cited report in a document you can share.`,
          artifact: "onboarding-report"
        }
      ]
    },

    "launch-materials": {
      title: "Prepare Phoenix launch materials",
      model: "Claude Opus 5.5",
      mode: "task",
      project: "phoenix",
      updated: "Just now",
      /* Task progress panel. In the running scene, the last assistant message
         shows its first runningStep+1 tools (the last one in progress). */
      task: {
        runningStep: 2,
        steps: [
          { label: "Review Phoenix source files" },
          { label: "Draft the leadership brief" },
          { label: "Write the support FAQ" },
          { label: "Build the launch-day checklist" },
          { label: "Cross-check facts and dates" }
        ],
        outputs: [
          { name: "leadership-brief.docx", kind: "DOCX", detail: "4 pages" },
          { name: "support-faq.md", kind: "MD", detail: "18 questions" },
          { name: "launch-day-checklist.xlsx", kind: "XLSX", detail: "42 tasks" }
        ],
        context: {
          folder: "Phoenix / Launch",
          files: ["brief-notes.md", "readiness-tracker.xlsx", "pilot-interviews.pdf"],
          connectors: ["Google Drive", "Google Calendar"]
        }
      },
      messages: [
        { role: "user", text: "Prepare the Project Phoenix launch materials: a leadership brief, an FAQ for the support team, and a launch-day checklist. Use the files in the Phoenix folder." },
        {
          role: "assistant",
          tools: [
            { icon: "folder", label: "Read 6 files in Phoenix", runningLabel: "Reading files in Phoenix…", detail: "brief-notes.md, readiness-tracker.xlsx +4" },
            { icon: "document", label: "Created leadership-brief.docx", runningLabel: "Drafting leadership-brief.docx…", detail: "4 pages" },
            { icon: "document", label: "Created support-faq.md", runningLabel: "Writing support-faq.md…", detail: "18 questions" },
            { icon: "list", label: "Created launch-day-checklist.xlsx", runningLabel: "Building launch-day-checklist.xlsx…", detail: "42 tasks" },
            { icon: "check-circle", label: "Cross-checked dates against the readiness tracker", runningLabel: "Cross-checking dates…", detail: "No conflicts" }
          ],
          text: `All three launch materials are ready in **Phoenix / Launch**:

- **Leadership brief** — one-page summary with the June 9 decision up front
- **Support FAQ** — 18 questions, grouped by *setup*, *billing* and *data import*
- **Launch-day checklist** — 42 tasks with owners and times

One thing to confirm: the checklist assumes Dana Whitfield owns customer communications. Want me to draft the announcement email next?`
        }
      ]
    },

    "code-a11y": {
      title: "Improve dialog keyboard accessibility",
      model: "Claude Opus 5.5",
      mode: "code",
      updated: "Now",
      workspace: { repo: "training-mock-kit", branch: "feat/keyboard-a11y", folder: "~/projects/training-mock-kit" },
      messages: [
        { role: "user", text: "Review the dialog components and improve keyboard accessibility. Run the tests when you're done." },
        {
          role: "assistant",
          text: "I'll start by looking at how dialogs are opened and closed.",
          tools: [
            { icon: "search", label: "Search", detail: "openDialog · 3 files" },
            { icon: "file", label: "Read", detail: "src/dialog.js · 84 lines" }
          ]
        },
        {
          role: "assistant",
          text: "I found two gaps: focus isn't moved into the dialog when it opens, and **Escape** doesn't close it. Fixing both now.",
          tools: [
            {
              icon: "edit", label: "Update", detail: "src/dialog.js · +6 −1",
              diff: { file: "src/dialog.js", lines: [
                " export function openDialog(dialog) {",
                "   dialog.hidden = false;",
                "   document.body.classList.add(\"modal-open\");",
                "-  // TODO: manage focus",
                "+  lastFocused = document.activeElement;",
                "+  dialog.querySelector(\"[autofocus], button\").focus();",
                "+  dialog.addEventListener(\"keydown\", onDialogKeydown);",
                " }",
                " ",
                "+function onDialogKeydown(event) {",
                "+  if (event.key === \"Escape\") closeDialog(event.currentTarget);",
                "+}"
              ] }
            },
            {
              icon: "edit", label: "Update", detail: "src/styles.css · +4",
              diff: { file: "src/styles.css", lines: [
                " .dialog button {",
                "   border-radius: 8px;",
                " }",
                "+.dialog :focus-visible {",
                "+  outline: 2px solid var(--focus);",
                "+  outline-offset: 2px;",
                "+}"
              ] }
            }
          ]
        },
        { role: "assistant", text: "Both fixes are in. Next I'll run the accessibility tests." }
      ],
      /* Manual permission mode shows this request card; Auto mode (or clicking
         "Allow") shows `result` and then `followUp`. */
      permissionRequest: {
        title: "Allow Claude to run this command?",
        command: "npm test -- accessibility",
        description: "Run the accessibility test suite",
        options: ["Yes", "Yes, and don't ask again for npm test", "No, and tell Claude what to do differently"],
        result: { icon: "terminal", label: "Bash", detail: "npm test -- accessibility", output: "✓ dialog receives focus on open (41 ms)\n✓ Escape closes the dialog (12 ms)\n✓ focus returns to the trigger (9 ms)\n… 9 more\n\nTests: 12 passed, 12 total  (1.8 s)" },
        followUp: "All **12 accessibility tests pass**. Dialogs now take focus when opened, close with Escape, and return focus to the button that opened them. Want me to open a pull request?"
      }
    }
  },

  /* ================================================================ ARTIFACTS
     kind: "dashboard" (built-in template, uses `content`) | "document"
     (markdown in `content`) | "html" (raw page in `html`, shown in a sandbox).
     `code` is what the Code tab shows (html artifacts show their html). */
  artifacts: {
    "launch-dashboard": {
      title: "Launch readiness dashboard",
      type: "Interactive artifact",
      kind: "dashboard",
      versions: 3,
      updated: "Edited today",
      content: {
        eyebrow: "Project Phoenix",
        heading: "Launch readiness",
        subheading: "Leadership view · Updated May 22",
        metrics: [
          { label: "Overall readiness", value: "84%", change: "+7 pts this week", tone: "up" },
          { label: "Open risks", value: "3", change: "−2 since last review", tone: "up" },
          { label: "Owners confirmed", value: "11/12", change: "1 pending", tone: "flat" }
        ],
        bars: {
          title: "Readiness by workstream",
          items: [
            { label: "Product", value: 92, owner: "Marcus Bell" },
            { label: "Sales enablement", value: 88, owner: "Ana Ruiz" },
            { label: "Marketing", value: 85, owner: "Leo Park" },
            { label: "Support", value: 78, owner: "Dana Whitfield" },
            { label: "Analytics", value: 64, owner: "Priya Raman" }
          ]
        },
        list: {
          title: "Open items",
          items: ["Confirm customer communications owner", "Finish analytics sign-off on funnel events", "Approve the final review window"]
        }
      },
      language: "jsx",
      code: `import { useState } from "react";

const workstreams = [
  { label: "Product", value: 92, owner: "Marcus Bell" },
  { label: "Sales enablement", value: 88, owner: "Ana Ruiz" },
  { label: "Marketing", value: 85, owner: "Leo Park" },
  { label: "Support", value: 78, owner: "Dana Whitfield" },
  { label: "Analytics", value: 64, owner: "Priya Raman" },
];

export default function LaunchReadiness() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="p-8 bg-stone-50 min-h-screen">
      <p className="text-sm text-orange-700">Project Phoenix</p>
      <h1 className="text-3xl font-serif">Launch readiness</h1>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Metric label="Overall readiness" value="84%" />
        <Metric label="Open risks" value="3" />
        <Metric label="Owners confirmed" value="11/12" />
      </div>
      {workstreams.map((w) => (
        <Bar key={w.label} {...w} onHover={setHovered} active={hovered === w.label} />
      ))}
    </div>
  );
}`
    },

    "onboarding-report": {
      title: "Customer onboarding: what's working in 2026",
      type: "Document",
      kind: "document",
      versions: 1,
      updated: "Edited yesterday",
      content: `# Customer onboarding: what's working in 2026

*Prepared for the Project Phoenix team · fictional sources*

## Summary

B2B software companies are shortening onboarding by moving setup **into the product**, measuring **activation** instead of course completion, and **front-loading integrations**.

## 1. Guided setup replaces kickoff calls

Teams that swapped scheduled kickoff calls for in-product checklists reduced median time-to-value from **30 days to 9** [[fieldnotes.example.com]]. White-glove help is reserved for accounts above a size threshold [[saas-review.example]].

## 2. Activation is the metric that matters

| Metric | Why it misleads / helps |
|---|---|
| Tutorial completion | Rewards clicking through, not outcomes |
| First meaningful outcome | Predicts 90-day retention best |
| Weekly active seats | Useful after week 2 |

## 3. Integrations are the stall point

Most stalled accounts never connect their data. Leaders offer a pre-built import in the first session [[opsjournal.example]].

## Recommendations for Phoenix

1. Ship the setup checklist inside the product at launch
2. Define "first meaningful outcome" per customer segment
3. Offer CSV import on the welcome screen`
    },

    "metrics-explorer": {
      title: "Weekly metrics explorer",
      type: "Interactive artifact",
      kind: "html",
      versions: 2,
      updated: "Edited Monday",
      html: `<!doctype html><html><head><style>
body{margin:0;padding:28px;font-family:system-ui,sans-serif;background:#fffdf8;color:#29261b}
h1{font:600 22px Georgia,serif;margin:0 0 4px}p{color:#77736a;margin:0 0 20px;font-size:14px}
.row{display:flex;align-items:center;gap:12px;margin:10px 0;font-size:14px}.row span{width:90px}
.bar{height:22px;border-radius:6px;background:#d97757}
</style></head><body><h1>Weekly signups</h1><p>Fictional data · last 5 weeks</p>
<div class="row"><span>Week 18</span><div class="bar" style="width:38%"></div>412</div>
<div class="row"><span>Week 19</span><div class="bar" style="width:46%"></div>497</div>
<div class="row"><span>Week 20</span><div class="bar" style="width:52%"></div>561</div>
<div class="row"><span>Week 21</span><div class="bar" style="width:61%"></div>655</div>
<div class="row"><span>Week 22</span><div class="bar" style="width:70%"></div>748</div>
</body></html>`
    }
  },

  /* ================================================================= PROJECTS */
  projects: [
    {
      id: "phoenix",
      name: "Project Phoenix",
      description: "Launch planning for the Phoenix onboarding redesign — briefs, research and leadership updates.",
      instructions: "Write for a leadership audience. Lead with customer outcomes, keep briefs under one page, and flag any date that is not confirmed.",
      capacity: 12,
      visibility: "Private",
      files: [
        { name: "brief-notes.md", kind: "MD", detail: "212 lines" },
        { name: "readiness-tracker.xlsx", kind: "XLSX", detail: "4 sheets" },
        { name: "pilot-interviews.pdf", kind: "PDF", detail: "18 pages" },
        { name: "risk-register.docx", kind: "DOCX", detail: "6 pages" }
      ],
      chats: ["phoenix-review", "launch-dashboard", "launch-materials"]
    },
    {
      id: "tutorials",
      name: "Tutorial production",
      description: "Scripts, shot lists and captions for the internal training videos.",
      instructions: "Use short sentences and plain language.",
      capacity: 4,
      visibility: "Private",
      files: [{ name: "shot-list.md", kind: "MD", detail: "64 lines" }],
      chats: []
    }
  ],

  /* ============================================================= CLAUDE CODE */
  code: {
    sessions: [
      "code-a11y",
      { title: "Fix flaky export test", time: "Yesterday" },
      { title: "Add dark mode tokens", time: "Mon" },
      { title: "Upgrade build tooling", time: "Sep 14" }
    ],
    permissionModes: { Manual: "Ask permissions", Auto: "Auto-accept edits" }
  },

  /* ========================================================= SCHEDULED TASKS */
  schedules: [
    { title: "Monday leadership brief", prompt: "Summarize last week's Phoenix updates into a one-page brief", cadence: "Every Monday at 8:30 AM", next: "Mon, Sep 28", status: "Active" },
    { title: "Daily project risk scan", prompt: "Check the risk register and flag anything overdue", cadence: "Weekdays at 4:00 PM", next: "Today, 4:00 PM", status: "Active" },
    { title: "Monthly metrics recap", prompt: "Pull signup and activation numbers into a short recap", cadence: "1st of every month", next: "Oct 1", status: "Paused" }
  ],

  /* ================================================================== SCENES
     What each ?scene= key shows. chat = conversation id, openArtifact = artifact
     id to open in the side panel, taskState = "running" | "complete",
     project = project id. */
  scenes: {
    home: {},
    response: { chat: "phoenix-review" },
    chat: { chat: "csv-cleanup" },
    artifact: { chat: "launch-dashboard", openArtifact: "launch-dashboard" },
    research: { chat: "onboarding-research" },
    "task-running": { chat: "launch-materials", taskState: "running" },
    "task-complete": { chat: "launch-materials", taskState: "complete" },
    code: { chat: "code-a11y" },
    project: { project: "phoenix" },
    scheduled: {},
    chats: {},
    artifacts: {}
  }
};
