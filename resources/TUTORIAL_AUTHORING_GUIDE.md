# Tutorial authoring guide

## Plan the lesson as states, not clicks

Write a short shot list before recording. Use a deterministic scene URL for each important state, such as landing, prompt, response, approval, and finished output. This prevents a failed simulated transition from ruining a take and makes reshoots match the original footage.

Example:

1. Establish the product on `chat-home`.
2. Cut to a close view of the composer.
3. Load `chat-response` with the final fake prompt in the URL.
4. Highlight sources or output actions.
5. End on a finished file or artifact scene.

## Keep tutorial data safe and readable

- Use obviously fictional people and organizations.
- Keep file names short enough to remain visible at the recording resolution.
- Use prompts that describe the teaching objective in plain language.
- Avoid real customer, HR, financial, legal, medical, or security data.
- Keep the **Training mock** badge visible whenever brand confusion is possible.

## Make cursor movement teach the interface

Pause before clicking. Move to one target at a time. Keep menus open long enough for the viewer to read them. For voiceover-led tutorials, record clean interface footage first and add the voiceover, cursor emphasis, punch-ins, and captions during editing.

## Use separate takes for responsive layouts

Desktop and phone layouts intentionally change. Record them as separate shots rather than resizing during a take. Use a fixed viewport for every scene in one sequence.

## Preserve a tutorial release

When a course is approved, tag the repository version and store the scene URLs used by the edit. Vendor products change frequently; a pinned mock release makes future pickups and translations consistent.
