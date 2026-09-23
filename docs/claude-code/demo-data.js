/*
 * Claude Code CLI — demo data
 * ---------------------------------------------------------------------------
 * Everything the fake terminal shows comes from this file. Edit it directly,
 * or press Alt+E in the browser to edit it live (MockKit data editor).
 *
 * A "session" is a script: an ordered list of steps that the terminal plays
 * back like a real Claude Code run. Open a session with ?session=<id>.
 *
 * Step types (all fields optional unless noted):
 *   { type: "shell",   command, cwd }           shell prompt + typed command (before Claude starts)
 *   { type: "welcome" }                         the Claude Code welcome box (uses `welcome` below)
 *   { type: "user",    text }                   types a prompt into the input box and submits it
 *   { type: "slash",   command, output }        types a /command (shows the slash menu) + its output
 *   { type: "thinking", verb, ms, text }        spinner ("✻ Pondering…") for `ms`; `text` adds a visible thinking block
 *   { type: "text",    text }                   assistant message (light markdown: **bold**, `code`, lists, # headings)
 *   { type: "tool",    name, args, result, lines, status }   generic tool call, e.g. Read(src/app.js)
 *   { type: "read",    file, lines }            shorthand for Read(file) → "Read N lines"
 *   { type: "search",  pattern, path, result }  Search(pattern: "…") → "Found N files"
 *   { type: "edit",    file, diff: [...] }       Update(file) with a coloured diff; diff rows are
 *                                               "12  unchanged", "+13 added", "-14 removed" strings
 *                                               or { n, op: "+"|"-"|" ", text } objects
 *   { type: "write",   file, content }          Write(file) → "Wrote N lines to file" + preview
 *   { type: "bash",    command, output, status } Bash(command) and its output (status: "ok" | "error")
 *   { type: "todos",   items: [{ text, status: "pending"|"in_progress"|"completed" }] }
 *   { type: "permission", title, detail, question, options, choose }  permission dialog; auto-selects `choose`
 *   { type: "mode",    mode: "default"|"acceptEdits"|"plan"|"bypass" }   status-line mode (Shift+Tab)
 *   { type: "caption", text, position: "bottom"|"top" }   tutorial caption overlay ("" hides it)
 *   { type: "highlight", target: "input"|"status"|"last"|"welcome"|"none" }   pulse-outline a region
 *   { type: "pause",   ms }                      wait
 *   { type: "clear" }                            clear the transcript (like /clear)
 *   { type: "done",    summary }                 end of turn: hide spinner, optional dim summary line
 *
 * Interactive mode: click the input box and type. Prompts are matched against
 * `responses` (first match wins); slash commands use `slashCommands`.
 */
window.CLAUDE_CODE_MOCK_DATA = {
  window: {
    chrome: "windows",            // "windows" | "mac" | "none"
    title: "claude",              // tab / window title
    theme: "dark",                // "dark" | "light"
    fontSize: 15,                 // px
    shell: "powershell"           // "powershell" | "bash" | "zsh" (shell prompt style)
  },
  user: { name: "Elvia", handle: "elvia" },
  project: {
    name: "training-mock-kit",
    cwd: "C:\\Users\\elvia\\projects\\training-mock-kit",
    posixCwd: "~/projects/training-mock-kit"
  },
  welcome: {
    version: "2.1.14",
    model: "Opus 4.5",
    plan: "Claude Max",
    tips: [
      "Run /init to create a CLAUDE.md file with instructions for Claude",
      "Use Shift+Tab to switch between permission modes",
      "Ask Claude to explain, edit, test, or commit code"
    ],
    recent: ["Fixed keyboard focus in the sidebar", "Added Playwright smoke tests", "/resume for more"]
  },
  input: {
    placeholder: "Try \"how does src/app.js work?\"",
    hint: "? for shortcuts",
    statusRight: ""              // e.g. "Context left until auto-compact: 18%"
  },
  spinnerVerbs: ["Thinking", "Pondering", "Clauding", "Noodling", "Percolating", "Reticulating", "Cogitating", "Synthesizing"],

  defaultSession: "fix-accessibility",
  sessions: {
    "fix-accessibility": {
      title: "Fix keyboard accessibility",
      description: "Read, edit, test, and summarise — the classic Claude Code loop.",
      steps: [
        { type: "shell", command: "claude" },
        { type: "welcome" },
        { type: "pause", ms: 700 },
        { type: "caption", text: "Describe the task in plain English." },
        { type: "user", text: "The sidebar buttons aren't reachable with the keyboard. Find the cause and fix it, then run the tests." },
        { type: "caption", text: "" },
        { type: "thinking", verb: "Pondering", ms: 1600 },
        { type: "text", text: "I'll look at how the sidebar is rendered and how focus is handled." },
        { type: "search", pattern: "sidebar", path: "src", result: "Found 3 files" },
        { type: "read", file: "src/components/Sidebar.js", lines: 142 },
        { type: "read", file: "src/styles.css", lines: 388 },
        { type: "thinking", verb: "Reticulating", ms: 1200 },
        { type: "text", text: "Found it. The sidebar rows are `<div>` elements with click handlers, so they never receive focus, and `styles.css` removes the focus outline with `outline: none`." },
        { type: "todos", items: [
          { text: "Replace clickable divs with buttons in Sidebar.js", status: "in_progress" },
          { text: "Restore a visible focus ring in styles.css", status: "pending" },
          { text: "Run the accessibility test suite", status: "pending" }
        ] },
        { type: "caption", text: "Claude asks before editing files in the default mode." },
        { type: "permission", title: "Edit file", detail: "src/components/Sidebar.js", question: "Do you want to make this edit to Sidebar.js?",
          options: ["Yes", "Yes, allow all edits during this session (shift+tab)", "No, and tell Claude what to do differently (esc)"], choose: 1 },
        { type: "caption", text: "" },
        { type: "mode", mode: "acceptEdits" },
        { type: "edit", file: "src/components/Sidebar.js", diff: [
          "41      return items.map((item) => (",
          "-42       <div className=\"nav-row\" onClick={() => select(item.id)}>",
          "+42       <button type=\"button\" className=\"nav-row\" onClick={() => select(item.id)}",
          "+43         aria-current={item.id === activeId ? \"page\" : undefined}>",
          "44           <Icon name={item.icon} />",
          "45           <span>{item.label}</span>",
          "-46       </div>",
          "+47       </button>",
          "48      ));"
        ] },
        { type: "edit", file: "src/styles.css", diff: [
          "212  .nav-row {",
          "213    display: flex;",
          "-214   outline: none;",
          "+214   border: 0;",
          "+215   background: transparent;",
          "+216   font: inherit;",
          "217  }",
          "+218 .nav-row:focus-visible {",
          "+219   outline: 2px solid var(--focus);",
          "+220   outline-offset: 2px;",
          "+221 }"
        ] },
        { type: "todos", items: [
          { text: "Replace clickable divs with buttons in Sidebar.js", status: "completed" },
          { text: "Restore a visible focus ring in styles.css", status: "completed" },
          { text: "Run the accessibility test suite", status: "in_progress" }
        ] },
        { type: "bash", command: "npm test -- accessibility", output: [
          "> training-mock-kit@1.4.0 test",
          "> playwright test accessibility",
          "",
          "Running 6 tests using 3 workers",
          "  ✓ sidebar rows are focusable (412ms)",
          "  ✓ focus ring is visible on keyboard focus (388ms)",
          "  ✓ Enter activates the focused row (297ms)",
          "  ✓ aria-current marks the active page (201ms)",
          "  ✓ composer is reachable with Tab (256ms)",
          "  ✓ no axe violations on home (1.1s)",
          "",
          "  6 passed (3.4s)"
        ] },
        { type: "todos", items: [
          { text: "Replace clickable divs with buttons in Sidebar.js", status: "completed" },
          { text: "Restore a visible focus ring in styles.css", status: "completed" },
          { text: "Run the accessibility test suite", status: "completed" }
        ] },
        { type: "text", text: "Fixed. The sidebar is now fully keyboard accessible:\n\n- **Sidebar.js** — rows are real `<button>` elements, so they're in the tab order and respond to Enter/Space. The active row gets `aria-current=\"page\"`.\n- **styles.css** — removed `outline: none` and added a `:focus-visible` ring so mouse users don't see it but keyboard users do.\n\nAll 6 accessibility tests pass." },
        { type: "done" },
        { type: "caption", text: "Review the summary, then keep iterating or commit." }
      ]
    },

    "init": {
      title: "Create CLAUDE.md with /init",
      description: "Slash command that documents the codebase for future sessions.",
      steps: [
        { type: "welcome" },
        { type: "slash", command: "/init" },
        { type: "thinking", verb: "Exploring", ms: 1400 },
        { type: "tool", name: "List", args: ".", result: "Listed 24 paths" },
        { type: "read", file: "package.json", lines: 38 },
        { type: "read", file: "README.md", lines: 82 },
        { type: "search", pattern: "export function", path: "src", result: "Found 11 files" },
        { type: "thinking", verb: "Synthesizing", ms: 1200 },
        { type: "write", file: "CLAUDE.md", content: [
          "# CLAUDE.md",
          "",
          "This file gives Claude Code guidance for working in this repository.",
          "",
          "## Commands",
          "- `npm run dev` — start the local server on port 4193",
          "- `npm test` — run the Playwright test suite",
          "- `npm run verify` — static checks for every mock",
          "",
          "## Architecture",
          "- Each product lives in `docs/<product>/` with `demo-data.js` for fake content",
          "- Shared data editing lives in `docs/shared/mockkit.js`",
          "",
          "## Conventions",
          "- Keep all demo data fictional",
          "- Prefer editing `demo-data.js` over changing render code"
        ] },
        { type: "text", text: "I created `CLAUDE.md` with the project's commands, architecture, and conventions. Claude Code reads it automatically at the start of every session in this folder." },
        { type: "done" }
      ]
    },

    "plan-feature": {
      title: "Plan mode → build a feature",
      description: "Shift+Tab into plan mode, approve the plan, then implement.",
      steps: [
        { type: "welcome" },
        { type: "caption", text: "Press Shift+Tab twice to enter plan mode." },
        { type: "mode", mode: "acceptEdits" },
        { type: "pause", ms: 500 },
        { type: "mode", mode: "plan" },
        { type: "caption", text: "" },
        { type: "user", text: "Add a dark theme toggle to the settings page that remembers the user's choice." },
        { type: "thinking", verb: "Planning", ms: 1500, text: "The settings page is in src/pages/Settings.js. Theme tokens already exist as CSS variables, so a data-theme attribute on <html> is the smallest change. Persist in localStorage and respect prefers-color-scheme on first load." },
        { type: "read", file: "src/pages/Settings.js", lines: 96 },
        { type: "read", file: "src/theme.css", lines: 54 },
        { type: "permission", title: "Ready to code?", detail: "Here is Claude's plan:",
          body: [
            "1. Add dark-theme tokens under [data-theme=\"dark\"] in theme.css",
            "2. Create src/lib/theme.js with getTheme(), setTheme() and localStorage",
            "3. Add a Theme select (System / Light / Dark) to Settings.js",
            "4. Apply the saved theme in main.js before first paint",
            "5. Add a Playwright test for persistence"
          ],
          question: "Would you like to proceed?",
          options: ["Yes, and auto-accept edits", "Yes, and manually approve edits", "No, keep planning"], choose: 0 },
        { type: "mode", mode: "acceptEdits" },
        { type: "todos", items: [
          { text: "Add dark-theme tokens", status: "in_progress" },
          { text: "Create theme.js helpers", status: "pending" },
          { text: "Add Theme select to Settings", status: "pending" },
          { text: "Apply theme before first paint", status: "pending" },
          { text: "Add persistence test", status: "pending" }
        ] },
        { type: "edit", file: "src/theme.css", diff: [
          "18  }",
          "+19 [data-theme=\"dark\"] {",
          "+20   --bg: #1f1f1e;",
          "+21   --text: #f2f1ed;",
          "+22   --muted: #a3a29c;",
          "+23 }"
        ] },
        { type: "write", file: "src/lib/theme.js", content: [
          "const KEY = \"theme\";",
          "export const getTheme = () => localStorage.getItem(KEY) ?? \"system\";",
          "export function setTheme(value) {",
          "  localStorage.setItem(KEY, value);",
          "  applyTheme(value);",
          "}"
        ] },
        { type: "bash", command: "npm test -- theme", output: ["Running 2 tests using 2 workers", "  ✓ theme persists after reload (644ms)", "  ✓ system theme follows OS preference (301ms)", "", "  2 passed (1.6s)"] },
        { type: "todos", items: [
          { text: "Add dark-theme tokens", status: "completed" },
          { text: "Create theme.js helpers", status: "completed" },
          { text: "Add Theme select to Settings", status: "completed" },
          { text: "Apply theme before first paint", status: "completed" },
          { text: "Add persistence test", status: "completed" }
        ] },
        { type: "text", text: "Dark theme is in. Settings now has a **Theme** select (System / Light / Dark); the choice is saved to `localStorage` and applied before first paint so there's no flash. Both new tests pass." },
        { type: "done" }
      ]
    },

    "git-commit": {
      title: "Review and commit",
      description: "Let Claude inspect the diff and write a commit.",
      steps: [
        { type: "welcome" },
        { type: "user", text: "commit these changes with a good message" },
        { type: "thinking", verb: "Thinking", ms: 900 },
        { type: "bash", command: "git status --short", output: [" M src/components/Sidebar.js", " M src/styles.css", "?? tests/accessibility.spec.js"] },
        { type: "bash", command: "git diff --stat", output: [" src/components/Sidebar.js | 6 ++++--", " src/styles.css            | 9 ++++++++-", " 2 files changed, 13 insertions(+), 2 deletions(-)"] },
        { type: "permission", title: "Bash command", detail: "git add -A && git commit -m \"Make sidebar keyboard accessible\"", question: "Do you want to proceed?",
          options: ["Yes", "Yes, and don't ask again for git commit commands in this project", "No, and tell Claude what to do differently (esc)"], choose: 0 },
        { type: "bash", command: "git add -A && git commit -m \"Make sidebar keyboard accessible\"", output: ["[main 4f2c9e1] Make sidebar keyboard accessible", " 3 files changed, 58 insertions(+), 2 deletions(-)", " create mode 100644 tests/accessibility.spec.js"] },
        { type: "text", text: "Committed as `4f2c9e1` — *Make sidebar keyboard accessible*. Run `git push` when you're ready, or ask me to open a pull request." },
        { type: "done" }
      ]
    }
  },

  /* Interactive mode: what Claude "does" when you type a prompt yourself. */
  responses: [
    { match: "test", steps: [
      { type: "thinking", verb: "Thinking", ms: 900 },
      { type: "bash", command: "npm test", output: ["Running 18 tests using 4 workers", "", "  18 passed (6.2s)"] },
      { type: "text", text: "All 18 tests pass." },
      { type: "done" }
    ] },
    { match: "explain|how does|what does", steps: [
      { type: "thinking", verb: "Reading", ms: 1000 },
      { type: "read", file: "src/app.js", lines: 214 },
      { type: "text", text: "`src/app.js` boots the app in three stages:\n\n1. **Load data** — reads `demo-data.js` and applies any saved overrides.\n2. **Render** — each scene has one render function mapped in `setScene()`.\n3. **Wire events** — a single delegated click handler routes `data-action` buttons.\n\nWant me to walk through any of these in more detail?" },
      { type: "done" }
    ] }
  ],
  fallbackResponse: [
    { type: "thinking", verb: "Thinking", ms: 1100 },
    { type: "text", text: "Sure — I'll take a look at the project and get started on that." },
    { type: "done" }
  ],

  slashCommands: {
    "/help": ["Claude Code v2.1.14", "", "Always review Claude's responses, especially when running code.", "", "Usage modes:", "• REPL: claude (interactive session)", "• Non-interactive: claude -p \"question\"", "", "Common tasks:", "• Ask questions about your codebase", "• Edit code, run tests, and commit", "", "Type /  to see every command."],
    "/status": ["Version: 2.1.14", "Session: 3f9a1c2e", "cwd: ~/projects/training-mock-kit", "Model: Opus 4.5 (claude-opus-4-5)", "Memory: CLAUDE.md", "Account: Elvia (Claude Max)"],
    "/cost": ["Total cost:            $0.42", "Total duration (API):  1m 12s", "Total duration (wall): 4m 03s", "Total code changes:    13 lines added, 2 lines removed"],
    "/model": ["Set model to Opus 4.5 (claude-opus-4-5)"],
    "/context": ["Context usage  38k/200k tokens (19%)", "  System prompt   3.1k", "  Tools          11.4k", "  Memory files    1.2k", "  Messages       22.3k", "  Free space    162k"]
  },
  slashMenu: [
    { command: "/init", description: "Initialize a new CLAUDE.md file with codebase documentation" },
    { command: "/help", description: "Show help and available commands" },
    { command: "/clear", description: "Clear conversation history and free up context" },
    { command: "/compact", description: "Clear history but keep a summary in context" },
    { command: "/context", description: "Visualize current context usage" },
    { command: "/cost", description: "Show the total cost and duration of the session" },
    { command: "/model", description: "Set the AI model for Claude Code" },
    { command: "/review", description: "Review a pull request" },
    { command: "/status", description: "Show Claude Code status" }
  ]
};
