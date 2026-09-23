# HyperFrames and Remotion workflow

The mocks are static pages with deterministic URL state, so they can be used as browser layers or captured to image/video before animation.

## Recommended capture pattern

1. Serve `docs/` locally or use the GitHub Pages URL.
2. Build one URL per tutorial beat with `scene`, `name`, `prompt`, and optional product parameters.
3. Capture every URL at the same viewport and device scale.
4. Animate the captured states with pans, zooms, cursor paths, callouts, and captions.
5. Return to the live mock only when the lesson needs an actual menu or text-entry interaction.

## URL manifest example

```js
export const tutorialShots = [
  {
    id: "chat-intro",
    url: "https://perfectz.github.io/ai-desktop-training-mocks/chatgpt/?scene=chat-home&name=Jordan%20Lee"
  },
  {
    id: "work-progress",
    url: "https://perfectz.github.io/ai-desktop-training-mocks/chatgpt/?scene=work-running&prompt=Prepare%20a%20launch%20brief"
  },
  {
    id: "claude-artifact",
    url: "https://perfectz.github.io/ai-desktop-training-mocks/claude/?scene=artifact&permission=auto"
  }
];
```

## Timing guidance

- Hold an untouched interface for 12–18 frames before the cursor moves.
- Use 8–14 frame click emphasis and 16–28 frame menu reveals.
- Keep readable panels still for at least 2–4 seconds, depending on copy length.
- Zoom to the UI element being explained; avoid scaling the full window above the point where text becomes soft.

The pages do not depend on animation time, random values, network responses, or authenticated state. Reloading the same URL should reproduce the same starting frame.
