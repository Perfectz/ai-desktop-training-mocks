# Claude Code terminal mock

`docs/claude-code/` is a fake Claude Code CLI session built for tutorial videos. It plays back a **script** of steps: typed prompts, the thinking spinner, tool calls, coloured diffs, todo lists, permission dialogs, plan mode, and captions. Nothing runs on your machine and every file, command, and output is fictional.

Live: https://perfectz.github.io/ai-desktop-training-mocks/claude-code/

## Recording a video

1. Open a session, for example `claude-code/?session=fix-accessibility&clean=1&full=1`.
2. Start your recorder, then press <kbd>Space</kbd> to play. You can also add `&autoplay=1&delay=1500` to start after 1.5 seconds.
3. Use <kbd>→</kbd> to step manually while narrating, <kbd>←</kbd> to go back, and <kbd>R</kbd> to restart.

`clean=1` hides the playback bar and other training chrome. `full=1` removes the padding around the window so the terminal fills the frame.

## URL parameters

| Parameter | Example | What it does |
| --- | --- | --- |
| `session` | `init` | Which script from `demo-data.js` to load |
| `autoplay` | `1` | Start playing on load |
| `delay` | `1500` | Milliseconds before autoplay starts |
| `speed` | `1.5` | Playback speed multiplier |
| `step` | `12` or `end` | Render the first N steps instantly (use this for stills and thumbnails) |
| `theme` | `light` | `dark` or `light` |
| `chrome` | `mac` | Window frame: `windows`, `mac`, or `none` |
| `font` | `18` | Terminal font size in px |
| `title` | `claude` | Tab or window title |
| `clean` | `1` | Hide the controls and training chrome |
| `full` | `1` | Edge-to-edge window |
| `d` / `data` | — | Load custom data inline or from a JSON URL (see below) |

## Writing a new session

Add an entry under `sessions` in `docs/claude-code/demo-data.js`, or press <kbd>Alt</kbd>+<kbd>E</kbd> and edit it live:

```js
"my-lesson": {
  title: "Rename a function safely",
  steps: [
    { type: "welcome" },
    { type: "caption", text: "Ask Claude to rename across the codebase." },
    { type: "user", text: "Rename getUser to fetchUser everywhere" },
    { type: "caption", text: "" },
    { type: "thinking", verb: "Searching", ms: 1200 },
    { type: "search", pattern: "getUser", path: "src", result: "Found 4 files" },
    { type: "edit", file: "src/api.js", diff: ["-12 export function getUser(id) {", "+12 export function fetchUser(id) {"] },
    { type: "bash", command: "npm test", output: ["  24 passed (3.1s)"] },
    { type: "text", text: "Renamed `getUser` → `fetchUser` in **4 files**. Tests pass." },
    { type: "done" }
  ]
}
```

Every step type is documented at the top of `demo-data.js`. The ones you'll use most:

- `user` types a prompt and submits it. `slash` does the same for a `/command`.
- `thinking` shows the spinner with a verb. Add `text` to also show a thinking block.
- `text` is Claude's reply. It supports light markdown: `**bold**`, `` `code` ``, lists, and headings.
- `read`, `search`, `edit`, `write`, and `bash` are tool calls. `tool` covers any other tool.
- `todos` shows the task checklist.
- `permission` shows an approval dialog and automatically picks option `choose`.
- `mode` switches between `default`, `acceptEdits`, `plan`, and `bypass`.
- `caption` shows lower-third text for narration. Pass `""` to hide it.
- `highlight` puts a pulsing outline on `input`, `status`, `last`, or `welcome`.

Diff rows are strings: `"41  context"`, `"+42 added line"`, `"-43 removed line"`. The number is the line number.

## Interactive mode

Click the input box (or press <kbd>/</kbd>) and type:

- Your prompt is checked against `responses[].match`, a case-insensitive regex, and the first match plays. If nothing matches, `fallbackResponse` plays.
- `/help`, `/status`, `/cost`, `/model`, and `/context` print text from `slashCommands`. `/clear` clears the screen.
- `/<session-id>` (for example `/init`) plays that session's steps inline.
- <kbd>Shift</kbd>+<kbd>Tab</kbd> cycles permission modes. <kbd>Esc</kbd> interrupts.

## Script it from code (HyperFrames, Remotion, Playwright)

```js
await TrainingMock.ready;
TrainingMock.load("plan-feature");
TrainingMock.play();                 // or next(), prev(), goto(8), restart()
TrainingMock.setSpeed(1.5);
TrainingMock.setTheme("light");
TrainingMock.setChrome("mac");
TrainingMock.caption("Plan mode lets you review before any edits");
TrainingMock.run([{ type: "user", text: "Now add tests" }, { type: "thinking", ms: 900 }, { type: "done" }]);
TrainingMock.state();                // { session, index, total, playing, mode, speed }
```

A parent page can also drive the mock through `postMessage`:

```js
iframe.contentWindow.postMessage({ type: "mockkit", action: "call", method: "goto", args: [10] }, "*");
iframe.contentWindow.postMessage({ type: "mockkit", action: "merge", data: { welcome: { model: "Sonnet 5" } } }, "*");
```

For frame-accurate renders, use `?step=N` and capture one still per step, or play at `speed=1` and record in real time.
