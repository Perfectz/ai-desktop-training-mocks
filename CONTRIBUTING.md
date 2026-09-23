# Contributing

The mocks are deliberately dependency-free: HTML, CSS, SVG, and JavaScript only. Keep additions easy to capture, easy to reset, and safe to publish.

## Design rules

- Put fake content in the product's `demo-data.js` file.
- Make every important tutorial state addressable with a `?scene=` URL.
- Keep controls functional, but never connect a mock to a real account or service.
- Prefer inline SVG symbols for crisp, editable icons.
- Test at desktop and phone widths and avoid horizontal overflow.
- Label the interface as a training mock without obscuring the teaching surface.
- Add new scenes to the product's scene picker, scripting API, and scene catalog.

Run `npm run verify` before opening a pull request. Then serve `docs/` and manually check the changed scenes.
