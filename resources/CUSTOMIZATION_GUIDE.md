# Customization guide

## Change names, prompts, and model labels without editing code

Use URL parameters:

```text
?scene=chat-response&name=Jordan%20Lee&prompt=Summarize%20the%20launch&model=ChatGPT%205.5%20Thinking
```

The exact scene and valid model labels are available in each mock's tutorial studio (`Alt+D`). Parameters with spaces must be URL encoded.

## Edit content live (Alt+E)

Every mock loads the shared data layer `docs/shared/mockkit.js`. Press `Alt+E` (or **Edit demo data** in the tutorial studio) to open a JSON editor with everything the mock displays.

- **Apply** (`Ctrl+Enter`) re-renders immediately. **Apply & save** also keeps the edit in this browser.
- **Download JSON** / **Load JSON** save or load a whole lesson as a file.
- **Copy share link** produces a URL whose `?d=` parameter holds only your changes.
- `?data=./lessons/week1.json` merges a JSON file over the defaults when the page loads.
- `?nosave=1` ignores saved edits. **Reset to defaults** clears them.

The same operations are available from code or a parent frame:

```js
MockKit.set("user.name", "Jordan Lee");
MockKit.merge({ conversations: { demo: { title: "Demo", messages: [{ role: "user", text: "Hi" }] } } });
MockKit.reset();
iframe.contentWindow.postMessage({ type: "mockkit", action: "merge", data: { user: { name: "Jordan" } } }, "*");
iframe.contentWindow.postMessage({ type: "mockkit", action: "call", method: "openChat", args: ["demo"] }, "*");
```

## Edit all fake content in one place

Open the product's `demo-data.js`. It contains the visible user, organization, suggestions, recent items, projects, files, steps, output cards, and model labels. The interface code reads from this object on every reset.

Keep demo data fictional. Do not paste real customer records, confidential files, private conversations, access tokens, or personal contact information into a public build.

## Adjust the interface

- `index.html` contains the persistent app shell and inline SVG icon symbols.
- `styles.css` contains spacing, colors, typography, breakpoints, and product-specific panels.
- `app.js` maps scene names to render functions and handles simulated interactions.

SVG icons are centralized as symbols. Add a new symbol once in `index.html`, then render it with the existing icon helper in `app.js`.

## Add a conversation

Claude, ChatGPT, and Copilot render every chat from the `conversations` map in `demo-data.js`. Messages are markdown. Add an entry and open it with `?chat=<id>`:

```js
conversations: {
  "budget-review": {
    title: "Budget review",
    messages: [
      { role: "user", text: "Summarize the Q3 budget variances" },
      { role: "assistant", text: "## Summary
- Travel is **12% over** plan
- Software is under plan" }
    ]
  }
}
```

Optional assistant fields differ slightly by product. Claude supports `thinking`, `tools`, `research`, and `artifact`. ChatGPT supports `reasoning`, `search`, `sources`, and `image`. Copilot supports `status` and `sources` with Office file kinds. The comment block at the top of each `demo-data.js` lists them all.

## Script scenes from the browser console

Every mock exposes `window.TrainingMock`. The desktop mocks share these recording helpers:

```js
TrainingMock.openChat("budget-review");
await TrainingMock.typePrompt("Summarize the Q3 budget variances", { speed: 1 });
await TrainingMock.streamReply("## Summary
- Travel is **12% over** plan");
TrainingMock.addMessage("user", "Make it shorter");
TrainingMock.setTheme("dark");
```

The original scene helpers remain:

```js
TrainingMock.setScene("work-running");
TrainingMock.setUser("Jordan Lee");
TrainingMock.setPrompt("Prepare a launch brief for the leadership team.");
TrainingMock.openStudio();
TrainingMock.reset();
```

Claude also provides `TrainingMock.setPermission("Auto")`. ChatGPT provides `TrainingMock.setProduct("codex")`.

The Microsoft mock also keeps its original name, `window.CoworkDemo`:

```js
CoworkDemo.setScene("approval");
CoworkDemo.startTask("Prepare a project update for the leadership team.");
CoworkDemo.setUser("Jordan Lee");
CoworkDemo.setModel("gpt-5-5");
CoworkDemo.openStudio();
CoworkDemo.reset();
```

## Control scenes with WebMCP

In browsers that support page-defined WebMCP tools, each mock also registers read and stage tools. ChatGPT adds tools for starting simulated Work and Codex tasks; Claude adds a task tool with Manual/Auto permission control; Microsoft adds Cowork staging and task tools. This lets an automation-capable browser inspect or stage the visible fake interface without reaching into the page DOM.

## Add a deterministic scene

1. Add the new scene key to the `scenes` array and label map in `app.js`.
2. Create one render function that produces the complete capture-ready state.
3. Map the scene key to that function in `setScene`.
4. Add the scene to this catalog and to `scripts/verify.mjs`.
5. Check it at desktop and phone widths and confirm it has no horizontal overflow.
