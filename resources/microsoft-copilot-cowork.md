# Copilot Cowork training mock

This is a standalone, data-driven interface mock for recording tutorials and instructional videos. It is not connected to Microsoft 365, does not send messages, and does not read real work data. It is not part of Patrickz.ai.

## Open locally

Serve `docs/` with any local static server, then open `/microsoft/`. The included PowerShell script uses `http://127.0.0.1:4193/microsoft/`.

## Stage a scene

Open the page and press `Alt+D`, or select **Training mock** in the top bar. The demo panel can change:

- the visible scene;
- display name;
- task prompt;
- selected model; and
- whether the task detail panel is visible.

**Copy scene link** creates a deterministic URL that can be used as a browser source in a recording or captured by HyperFrames/Remotion later.

Supported scene parameters:

```text
?scene=home
?scene=chat
?scene=chat-response
?scene=search-results
?scene=workflow-agent
?scene=workflow-complete
?scene=running
?scene=approval
?scene=complete
?scene=tasks
?scene=scheduled
?scene=customize
```

Optional parameters are `name`, `prompt`, `model`, `panel=0|1`, and `studio=1`.

The Chat scene includes the traditional Copilot navigation—New chat, Search, Library, Agents, Notebooks, pinned agents, and demo chat history. **Workflow agent** is pinned and can be opened directly with `?scene=workflow-agent`. The capture-ready scenes `chat-response`, `search-results`, and `workflow-complete` open fully populated states without requiring clicks, which makes repeatable HyperFrames and Remotion shots easier.

Functional demo interactions include Work IQ on/off grounding, adding files/people/meetings/email as sources, multi-turn chat, response source cards and feedback actions, Microsoft 365 app launcher, sidebar collapse, work search and filters, Library, Agents, Notebooks, a runnable Workflow agent draft, Cowork task approvals, task filters, schedules, and customization cards. All activity is simulated locally with fake data.

Interface icons are stored as a single inline SVG symbol sheet near the top of `docs/microsoft/index.html`. They use editable Microsoft Fluent System Icon paths and are referenced throughout `docs/microsoft/app.js` with lightweight `<use>` elements, which keeps them crisp for browser capture, HyperFrames, and Remotion.

The page also exposes a small scripting API:

```js
CoworkDemo.setScene("approval");
CoworkDemo.startTask("Prepare a project update for the leadership team.");
CoworkDemo.setUser("Jordan Lee");
CoworkDemo.setModel("gpt-5-5");
CoworkDemo.openStudio();
CoworkDemo.reset();
```

Edit `docs/microsoft/demo-data.js` to replace the sample people, prompts, tasks, schedules, skills, and model labels in one place. Visual styling lives in `docs/microsoft/styles.css`; UI behavior lives in `docs/microsoft/app.js`.

## Microsoft interface references

The mock follows the supplied screenshot and Microsoft’s current product guidance:

- [Get started with the Microsoft Copilot app](https://support.microsoft.com/en-us/microsoft-365-copilot/what-is-microsoft-copilot-app)
- [Get started with Search in the Microsoft 365 Copilot app](https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-search-in-the-microsoft-365-copilot-app)
- [Refer to specific files and more in Microsoft 365 Copilot](https://support.microsoft.com/en-us/microsoft-365-copilot/refer-to-specific-files-and-more-in-microsoft-365-copilot)
- [File upload in Microsoft Copilot](https://support.microsoft.com/en-us/microsoft-copilot/file-upload-in-microsoft-copilot)
- [Microsoft 365 Copilot release notes](https://learn.microsoft.com/en-us/microsoft-365/copilot/release-notes)
- [Work IQ overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq)

Microsoft, Microsoft 365, and Copilot are trademarks of Microsoft. This independent prototype is for demonstration and training production only.
