/*
 * MockKit — shared, dependency-free data layer for every training mock.
 *
 * Load order in each mock's index.html:
 *   <script src="./demo-data.js"></script>
 *   <script src="../shared/mockkit.js"></script>
 *   <script src="./app.js"></script>
 *
 * Data sources, merged in this order (later wins, arrays replace):
 *   1. window.<PRODUCT>_MOCK_DATA from demo-data.js (the defaults)
 *   2. localStorage "mockkit:<product>" (saved from the data editor)
 *   3. ?data=<url-to-json> (fetched; same-origin or CORS-enabled)
 *   4. ?d=<base64url-json> (inline share link produced by the editor)
 *
 * Other URL flags understood by every mock:
 *   ?clean=1   hide training badges, the studio launcher and other capture chrome
 *   ?theme=dark|light   force a colour scheme (mocks that support it)
 *   ?nosave=1  ignore localStorage overrides (fresh defaults for recordings)
 *
 * API (window.MockKit):
 *   MockKit.init({ product, defaults, onChange }) -> Promise<data>
 *   MockKit.get()                 deep copy of the active data
 *   MockKit.set("path.to.key", v) set one value and re-render
 *   MockKit.merge(partial)        deep-merge an object and re-render
 *   MockKit.replace(fullData)     replace everything and re-render
 *   MockKit.reset()               defaults only, clears saved overrides
 *   MockKit.save()                persist the active data to localStorage
 *   MockKit.openEditor() / closeEditor()   (shortcut: Alt+E)
 *   MockKit.shareUrl()            URL containing the active data inline
 *
 * The page also accepts window.postMessage({ type: "mockkit", action, ... }):
 *   { action: "merge", data }  { action: "replace", data }  { action: "set", path, value }
 *   { action: "reset" }        { action: "call", method, args }   (calls TrainingMock[method])
 */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  function deepMerge(base, patch) {
    if (!isObj(base) || !isObj(patch)) return clone(patch);
    const out = clone(base);
    for (const [k, v] of Object.entries(patch)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : clone(v);
    return out;
  }
  // Minimal patch that turns `base` into `next` via deepMerge (arrays are replaced whole).
  function diff(base, next) {
    if (isObj(base) && isObj(next)) {
      const out = {};
      for (const [k, v] of Object.entries(next)) { const d = diff(base[k], v); if (d !== undefined) out[k] = d; }
      return Object.keys(out).length ? out : undefined;
    }
    return JSON.stringify(base) === JSON.stringify(next) ? undefined : clone(next);
  }
  const b64encode =(s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64decode = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

  let product = "mock", defaults = {}, data = {}, onChange = () => {}, ready = false;
  const storeKey = () => `mockkit:${product}`;

  function readSaved() {
    if (params.get("nosave") === "1") return null;
    try { const raw = localStorage.getItem(storeKey()); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function emit() { if (ready) { try { onChange(clone(data)); } catch (e) { console.error("[MockKit] render failed", e); } } syncEditor(); }

  async function init(opts) {
    product = opts.product || product;
    defaults = clone(opts.defaults || {});
    onChange = opts.onChange || onChange;
    data = clone(defaults);
    const saved = readSaved();
    if (saved) data = deepMerge(data, saved);
    const remote = params.get("data");
    if (remote) {
      try { const res = await fetch(remote, { cache: "no-store" }); data = deepMerge(data, await res.json()); }
      catch (e) { console.warn("[MockKit] could not load ?data=", remote, e); }
    }
    const inline = params.get("d");
    if (inline) { try { data = deepMerge(data, JSON.parse(b64decode(inline))); } catch (e) { console.warn("[MockKit] bad ?d= payload", e); } }
    if (params.get("clean") === "1") document.documentElement.classList.add("mk-clean");
    const theme = params.get("theme");
    if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
    ready = true;
    buildEditor();
    return clone(data);
  }

  function setPath(path, value) {
    const keys = String(path).split(".");
    let node = data;
    keys.slice(0, -1).forEach((k) => { if (!isObj(node[k]) && !Array.isArray(node[k])) node[k] = {}; node = node[k]; });
    node[keys.at(-1)] = clone(value);
  }

  const api = {
    init,
    get: () => clone(data),
    defaults: () => clone(defaults),
    set(path, value) { setPath(path, value); emit(); return api; },
    merge(partial) { data = deepMerge(data, partial || {}); emit(); return api; },
    replace(full) { data = clone(full || {}); emit(); return api; },
    reset() { try { localStorage.removeItem(storeKey()); } catch {} data = clone(defaults); emit(); return api; },
    save() { try { localStorage.setItem(storeKey(), JSON.stringify(data)); } catch {} return api; },
    /* Share link carrying only what differs from demo-data.js, so links stay short. */
    shareUrl() {
      const u = new URL(location.href);
      u.searchParams.delete("data"); u.searchParams.delete("d");
      const patch = diff(defaults, data);
      if (patch !== undefined) u.searchParams.set("d", b64encode(JSON.stringify(patch)));
      return u.toString();
    },
    download() {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${product}-demo-data.json` });
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    openEditor, closeEditor, deepMerge, clone
  };
  window.MockKit = api;

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.type !== "mockkit") return;
    if (msg.action === "merge") api.merge(msg.data);
    else if (msg.action === "replace") api.replace(msg.data);
    else if (msg.action === "set") api.set(msg.path, msg.value);
    else if (msg.action === "reset") api.reset();
    else if (msg.action === "call" && window.TrainingMock && typeof window.TrainingMock[msg.method] === "function") window.TrainingMock[msg.method](...(msg.args || []));
  });

  /* ---------- Data editor panel ---------- */
  let panel, textarea, status;
  const css = `
  .mk-clean .training-badge,.mk-clean .mock-badge,.mk-clean .studio-launcher,.mk-clean [data-mk-chrome]{display:none!important}
  .mk-editor{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:2147483000;background:#16171a;color:#e8e8ea;font:13px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:-20px 0 60px rgba(0,0,0,.35);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .22s ease}
  .mk-editor:not(.open){visibility:hidden;box-shadow:none}
  .mk-editor.open{transform:none}
  .mk-editor header{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid #2a2c31}
  .mk-editor header strong{font-size:14px;flex:1}
  .mk-editor header small{color:#9a9ca3;font-weight:400}
  .mk-editor textarea{flex:1;margin:0;border:0;resize:none;background:#0f1012;color:#d7e3ff;padding:14px 16px;font:12.5px/1.55 ui-monospace,"Cascadia Code",Consolas,monospace;outline:none;tab-size:2}
  .mk-editor footer{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid #2a2c31;align-items:center}
  .mk-editor button,.mk-editor label.mk-btn{appearance:none;border:1px solid #34363c;background:#23252a;color:#e8e8ea;border-radius:8px;padding:7px 11px;font:inherit;cursor:pointer}
  .mk-editor button:hover,.mk-editor label.mk-btn:hover{background:#2d3036}
  .mk-editor button.primary{background:#e8e8ea;color:#16171a;border-color:#e8e8ea;font-weight:600}
  .mk-editor .mk-status{flex-basis:100%;color:#9a9ca3;font-size:12px;min-height:16px}
  .mk-editor .mk-status.err{color:#ff8a80}
  .mk-editor .mk-close{background:none;border:0;font-size:20px;line-height:1;padding:2px 6px}`;

  function buildEditor() {
    if (panel) return;
    const style = document.createElement("style"); style.textContent = css; document.head.append(style);
    panel = document.createElement("aside");
    panel.className = "mk-editor"; panel.setAttribute("aria-label", "Demo data editor"); panel.dataset.mkChrome = "";
    panel.innerHTML = `<header><strong>Demo data <small>· ${product} · Alt+E</small></strong><button class="mk-close" data-mk="close" aria-label="Close">×</button></header>
      <textarea spellcheck="false" aria-label="Demo data JSON"></textarea>
      <footer><button class="primary" data-mk="apply">Apply</button><button data-mk="save">Apply &amp; save</button><button data-mk="reset">Reset to defaults</button><button data-mk="download">Download JSON</button><label class="mk-btn">Load JSON<input type="file" accept="application/json,.json" hidden></label><button data-mk="link">Copy share link</button><div class="mk-status"></div></footer>`;
    document.body.append(panel);
    textarea = panel.querySelector("textarea"); status = panel.querySelector(".mk-status");
    const parse = () => { try { return JSON.parse(textarea.value); } catch (e) { say(`JSON error: ${e.message}`, true); return null; } };
    panel.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-mk]")?.dataset.mk; if (!act) return;
      if (act === "close") closeEditor();
      if (act === "apply") { const v = parse(); if (v) { api.replace(v); say("Applied."); } }
      if (act === "save") { const v = parse(); if (v) { api.replace(v); api.save(); say("Applied and saved in this browser."); } }
      if (act === "reset") { api.reset(); say("Defaults restored."); }
      if (act === "download") api.download();
      if (act === "link") { const v = parse(); if (v) { api.replace(v); try { await navigator.clipboard.writeText(api.shareUrl()); say("Share link copied."); } catch { prompt("Copy this link", api.shareUrl()); } } }
    });
    panel.querySelector("input[type=file]").addEventListener("change", async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { api.replace(JSON.parse(await file.text())); say(`Loaded ${file.name}.`); } catch (err) { say(`Could not load: ${err.message}`, true); }
      e.target.value = "";
    });
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); textarea.setRangeText("  ", textarea.selectionStart, textarea.selectionEnd, "end"); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); panel.querySelector('[data-mk="apply"]').click(); }
      e.stopPropagation();
    });
    document.addEventListener("keydown", (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "e" || e.key === "E" || e.code === "KeyE")) { e.preventDefault(); panel.classList.contains("open") ? closeEditor() : openEditor(); }
      if (e.key === "Escape" && panel.classList.contains("open")) closeEditor();
    });
    syncEditor();
  }
  function say(msg, err) { if (status) { status.textContent = msg; status.classList.toggle("err", !!err); } }
  function syncEditor() { if (textarea && document.activeElement !== textarea) textarea.value = JSON.stringify(data, null, 2); }
  function openEditor() { buildEditor(); syncEditor(); panel.classList.add("open"); say("Edit any value, then Apply (Ctrl+Enter)."); }
  function closeEditor() { panel && panel.classList.remove("open"); }
})();
