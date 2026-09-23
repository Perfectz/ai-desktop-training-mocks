# AI Desktop Training Mocks

Capture-ready, editable interface mocks for building tutorials about Microsoft 365 Copilot, ChatGPT desktop with Work and Codex, Claude Desktop, and the Claude Code CLI.

**Live toolkit:** https://perfectz.github.io/ai-desktop-training-mocks/

These are independent static training props—not product clones connected to real services. Every account, prompt, file, response, task, and metric is fake. Nothing is uploaded and no sign-in is required.

## Included mocks

| Product | What is staged | Open |
| --- | --- | --- |
| Microsoft 365 Copilot | Chat, Cowork tasks, Work IQ, Workflow agent, approvals, task history, schedules, customization | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/microsoft/) |
| ChatGPT desktop | Chat, Work, connected apps, unified Recents, Projects, search, scheduled work, Sites, plugins, Codex task and diff views | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/chatgpt/) |
| Claude Desktop | Unified Claude chats and tasks, Artifacts, Research, Projects, scheduled work, Claude Code | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/claude/) |
| Claude Code CLI | Scriptable terminal: typed prompts, spinner, tool calls, diffs, todos, permission prompts, plan mode, captions, playback controls | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/claude-code/) |

Every mock shares one data layer ([`docs/shared/mockkit.js`](docs/shared/mockkit.js)): press `Alt+E` to edit any displayed content as JSON, save it in your browser, download or load a JSON file, or copy a short share link that reproduces your edits. Each mock also has deterministic scene URLs, a tutorial studio (`Alt+D`), light and dark themes, and a `TrainingMock` JavaScript API for scripted typing and streamed replies.

## Fastest way to stage a tutorial

1. Open a mock.
2. Press `Alt+D` or select **Training mock** / **Tutorial studio**.
3. Pick a scene, enter the presenter name and fake prompt, and choose the visible model or permission mode.
4. Select **Apply** and copy the scene link.
5. Use that URL as a browser source or as the input for HyperFrames, Remotion, OBS, or a screen recorder.

Example capture URLs:

```text
https://perfectz.github.io/ai-desktop-training-mocks/microsoft/?scene=workflow-agent&name=Jordan%20Lee
https://perfectz.github.io/ai-desktop-training-mocks/chatgpt/?scene=work-running&prompt=Prepare%20a%20launch%20brief
https://perfectz.github.io/ai-desktop-training-mocks/claude/?scene=artifact&name=Jordan%20Lee&permission=auto
https://perfectz.github.io/ai-desktop-training-mocks/claude-code/?session=plan-feature&autoplay=1&clean=1&full=1
```

## Edit the demo content

### Live, without touching code

1. Open any mock and press `Alt+E`.
2. Change any value in the JSON. For example, rename the user, add a conversation, or rewrite a task's steps.
3. Select **Apply** (`Ctrl+Enter`). Select **Apply & save** to keep the change in this browser, or **Copy share link** to get a URL that carries only your edits.

You can also load data from a file with `?data=./my-lesson.json`, reset to the defaults with `?nosave=1`, and hide all training chrome for recording with `?clean=1`.

### Conversations are data

The Claude, ChatGPT, and Copilot mocks render conversations from a `conversations` map in `demo-data.js`. Messages are markdown, and assistant turns can include thinking, sources, tools, attachments, or artifacts. Open any conversation with `?chat=<id>`. The Claude Code terminal plays back `sessions`, which are scripts of steps. See [the Claude Code guide](resources/CLAUDE_CODE_CLI.md).

### In the source files

Each product is fully self-contained:

```text
docs/
  microsoft/
    index.html       shell and SVG icon sheet
    styles.css       layout and visual tokens
    demo-data.js     fake people, tasks, chats, files, and labels
    app.js           scenes and interactions
  chatgpt/
  claude/
  claude-code/       scriptable Claude Code terminal (sessions in demo-data.js)
  shared/
    mockkit.js       live data editor, JSON loading, share links, clean capture mode
resources/
  SCENE_CATALOG.md
  CUSTOMIZATION_GUIDE.md
  CLAUDE_CODE_CLI.md
  TUTORIAL_AUTHORING_GUIDE.md
  HYPERFRAMES_REMOTION.md
  RECORDING_CHECKLIST.md
  ACCURACY_NOTES.md
  REALISM_AUDIT.md
```

For most tutorial changes, edit only `demo-data.js`. Scene URLs and scripting examples are documented in [the customization guide](resources/CUSTOMIZATION_GUIDE.md).

## Run locally

No build is required. From PowerShell:

```powershell
.\scripts\serve.ps1
```

Then open `http://127.0.0.1:4193/`. You can also run `npm run serve` if Node.js is installed.

Validate the static files and scene registrations with:

```powershell
npm run verify
```

## Accuracy and limitations

The structures are based on supplied visual references and current first-party product documentation checked on September 23, 2026. They are optimized for repeatable training capture, so some transitions and product capabilities are simulated. Real interfaces vary by operating system, plan, administrator settings, geography, staged rollout, and window size. See [accuracy notes and official sources](resources/ACCURACY_NOTES.md) and the [weighted realism audit](resources/REALISM_AUDIT.md).

## License and trademarks

Code in this repository is available under the [MIT License](LICENSE). Product names and interface patterns remain the property of their respective owners. See [NOTICE.md](NOTICE.md) for the full independent-use notice.
