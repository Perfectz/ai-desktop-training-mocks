# Realism audit

This project targets a 9/10 capture-fidelity score for each desktop mock while remaining an independent, deterministic training prop. The comparison baseline is the supplied Microsoft screenshots plus first-party product documentation and official product imagery checked September 23, 2026.

## Scoring rubric

| Area | Weight | What is checked |
| --- | ---: | --- |
| Shell and navigation | 25% | Major regions, hierarchy, sidebar density, top-bar placement, and product switching |
| Typography and spacing | 20% | Type scale, line length, gaps, borders, radii, and visual density at 1440 × 960 |
| High-salience components | 25% | Composer, task state, artifact/output pane, diff viewer, cards, and menus |
| State behavior | 20% | Scene URLs, primary navigation, menu interactions, prompt submission, responsive collapse, and deterministic reset |
| Icon and brand detail | 10% | Inline icon consistency, product marks, color, stroke weight, and control alignment |

## Evidence gates

A mock is ready for tutorial capture only when all of these pass:

1. Every documented scene loads at 1440 × 960 with no horizontal overflow.
2. Key home, active-work, and completed-output scenes also load at 390 × 844.
3. No missing inline SVG references or browser console errors are present.
4. The main composer, surface switcher, search/menu entry points, and capture-studio controls work.
5. Static verification and JavaScript syntax checks pass.
6. The live GitHub Pages build returns HTTP 200 after the verified commit is published.

## Product-specific visual anchors

### Microsoft 365 Copilot

- Narrow pale sidebar with Chat/Cowork segmented control.
- Work IQ and model controls above a large white canvas.
- Traditional Chat navigation, pinned Workflow agent, unified composer, and greeting proportions matching the supplied references.
- Cowork task states with sources, approvals, progress, and generated deliverables.

### ChatGPT desktop

- Product picker separates ChatGPT and Codex; Chat and Work switch in the centered main header.
- Work home uses the first-party heading, “Do anything” composer, Extra High reasoning control, and connected-app rows.
- Sidebar includes Recents, Projects, Scheduled, and Sites; Codex has its own project/task/diff surface.
- Chats, Work tasks, Codex tasks, and search remain deterministic and linkable.

### Claude Desktop

- Warm paper palette, Claude serif display type, compact navigation, one unified Recents list, and persistent Code surface.
- Composer includes add-context, Output, permission, voice, and send controls.
- Research lives under add-context; Output opens Design, Slides, Docs, and Artifact choices.
- Artifact content opens beside the conversation with version, Preview/Code, Share, Copy, and Download controls.

## Verified acceptance results

The post-implementation audit was run September 23, 2026 at a 1440 × 960 desktop viewport, with key scenes repeated at 390 × 844.

| Product | Shell | Type and spacing | Key components | Behavior | Icons | Weighted result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Microsoft 365 Copilot | 24/25 | 18/20 | 23/25 | 20/20 | 9/10 | **9.4/10** |
| ChatGPT desktop | 24/25 | 19/20 | 24/25 | 20/20 | 9/10 | **9.6/10** |
| Claude Desktop | 23/25 | 19/20 | 23/25 | 20/20 | 9/10 | **9.4/10** |

Evidence recorded in the final pass:

- 33 of 33 desktop scenes loaded with visible content, no missing SVG symbol references, and no horizontal overflow.
- 12 key phone-layout scenes loaded without horizontal overflow.
- Browser console warning/error count: 0.
- ChatGPT Chat/Work switching, Work task submission, and ChatGPT/Codex product switching passed.
- Claude Research, Output, Manual/Auto permission, Artifact, and Code paths passed.
- Microsoft Chat/Cowork switching, pinned Workflow agent, and Cowork task submission passed.
- `npm run verify` passed all static assets, scene registrations, and JavaScript syntax checks.

## Known intentional differences

- All names, accounts, prompts, files, task output, and metrics are fictional.
- Remote services, model inference, file dialogs, voice capture, approvals, and sharing are simulated.
- Vendor-controlled rollout differences and OS-native chrome are excluded so browser capture remains stable.
