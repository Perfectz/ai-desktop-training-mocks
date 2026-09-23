# Customization guide

## Change names, prompts, and model labels without editing code

Use URL parameters:

```text
?scene=chat-response&name=Jordan%20Lee&prompt=Summarize%20the%20launch&model=GPT-6%20Sol
```

The exact scene and valid model labels are available in each mock's tutorial studio (`Alt+D`). Parameters with spaces must be URL encoded.

## Edit all fake content in one place

Open the product's `demo-data.js`. It contains the visible user, organization, suggestions, recent items, projects, files, steps, output cards, and model labels. The interface code reads from this object on every reset.

Keep demo data fictional. Do not paste real customer records, confidential files, private conversations, access tokens, or personal contact information into a public build.

## Adjust the interface

- `index.html` contains the persistent app shell and inline SVG icon symbols.
- `styles.css` contains spacing, colors, typography, breakpoints, and product-specific panels.
- `app.js` maps scene names to render functions and handles simulated interactions.

SVG icons are centralized as symbols. Add a new symbol once in `index.html`, then render it with the existing icon helper in `app.js`.

## Script scenes from the browser console

ChatGPT and Claude expose `window.TrainingMock`:

```js
TrainingMock.setScene("work-running");
TrainingMock.setUser("Jordan Lee");
TrainingMock.setPrompt("Prepare a launch brief for the leadership team.");
TrainingMock.openStudio();
TrainingMock.reset();
```

Claude also provides `TrainingMock.setPermission("Auto")`. ChatGPT provides `TrainingMock.setProduct("codex")`.

The Microsoft mock exposes `window.CoworkDemo`:

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
