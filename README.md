# AI Desktop Training Mocks

Capture-ready, editable interface mocks for building tutorials about Microsoft 365 Copilot, ChatGPT desktop with Work and Codex, and Claude Desktop.

**Live toolkit:** https://perfectz.github.io/ai-desktop-training-mocks/

These are independent static training props—not product clones connected to real services. Every account, prompt, file, response, task, and metric is fake. Nothing is uploaded and no sign-in is required.

## Included mocks

| Product | What is staged | Open |
| --- | --- | --- |
| Microsoft 365 Copilot | Chat, Cowork tasks, Work IQ, Workflow agent, approvals, task history, schedules, customization | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/microsoft/) |
| ChatGPT desktop | Chat, Work, unified Recents, Projects, search, plugins, Codex task and diff views | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/chatgpt/) |
| Claude Desktop | Unified Claude chats and tasks, Artifacts, Research, Projects, scheduled work, Claude Code | [Launch mock](https://perfectz.github.io/ai-desktop-training-mocks/claude/) |

Each mock has deterministic URLs for capture automation, editable fake data, a hidden tutorial studio, responsive layouts, inline SVG icons, and a small JavaScript control API.

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
```

## Edit the demo content

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
resources/
  SCENE_CATALOG.md
  CUSTOMIZATION_GUIDE.md
  TUTORIAL_AUTHORING_GUIDE.md
  HYPERFRAMES_REMOTION.md
  RECORDING_CHECKLIST.md
  ACCURACY_NOTES.md
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

The structures are based on supplied visual references and current first-party product documentation checked on September 23, 2026. They are optimized for repeatable training capture, so some transitions and product capabilities are simulated. Real interfaces vary by operating system, plan, administrator settings, geography, staged rollout, and window size. See [accuracy notes and official sources](resources/ACCURACY_NOTES.md).

## License and trademarks

Code in this repository is available under the [MIT License](LICENSE). Product names and interface patterns remain the property of their respective owners. See [NOTICE.md](NOTICE.md) for the full independent-use notice.
