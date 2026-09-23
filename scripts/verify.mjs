import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const products = {
  microsoft: ["home", "chat", "chat-response", "chat-thinking", "chat-web", "chat-table", "search", "search-results", "library", "agents", "notebooks", "create", "workflow-agent", "workflow-complete", "running", "approval", "complete", "tasks", "scheduled", "customize"],
  chatgpt: ["chat-home", "chat-response", "chat", "chat-code", "chat-search", "chat-image", "work-home", "work-running", "work-complete", "codex-home", "codex-task", "search", "project", "library", "gpts", "sora", "plugins", "scheduled", "sites"],
  claude: ["home", "response", "chat", "task-running", "task-complete", "artifact", "research", "project", "code", "scheduled", "chats", "artifacts"]
};

const failures = [];
let sessionCount = 0;

for (const [product, scenes] of Object.entries(products)) {
  const dir = join(root, "docs", product);
  for (const file of ["index.html", "styles.css", "app.js", "demo-data.js"]) {
    try {
      await access(join(dir, file));
    } catch {
      failures.push(`${product}: missing ${file}`);
    }
  }

  const html = await readFile(join(dir, "index.html"), "utf8");
  const app = await readFile(join(dir, "app.js"), "utf8");
  const ids = new Set([...html.matchAll(/<symbol\s+id="([^"]+)"/g)].map((match) => match[1]));
  const uses = [...html.matchAll(/(?:href|xlink:href)="#([^"]+)"/g), ...app.matchAll(/(?:href|xlink:href)=["'`]#([^"'`$]+)["'`]/g)].map((match) => match[1]);

  for (const use of uses) {
    if (!ids.has(use)) failures.push(`${product}: missing SVG symbol #${use}`);
  }

  for (const scene of scenes) {
    if (!app.includes(scene)) failures.push(`${product}: scene not referenced in app.js: ${scene}`);
  }

  for (const script of ["app.js", "demo-data.js"]) {
    const result = spawnSync(process.execPath, ["--check", join(dir, script)], { encoding: "utf8" });
    if (result.status !== 0) failures.push(`${product}: ${script} syntax error\n${result.stderr}`);
  }
}

// Claude Code terminal: scripted sessions live in demo-data.js rather than app.js.
{
  const dir = join(root, "docs", "claude-code");
  for (const file of ["index.html", "styles.css", "app.js", "demo-data.js"]) {
    try { await access(join(dir, file)); } catch { failures.push(`claude-code: missing ${file}`); }
  }
  for (const script of ["app.js", "demo-data.js"]) {
    const result = spawnSync(process.execPath, ["--check", join(dir, script)], { encoding: "utf8" });
    if (result.status !== 0) failures.push(`claude-code: ${script} syntax error
${result.stderr}`);
  }
  const sandbox = {};
  new Function("window", await readFile(join(dir, "demo-data.js"), "utf8"))(sandbox);
  const data = sandbox.CLAUDE_CODE_MOCK_DATA || {};
  const app = await readFile(join(dir, "app.js"), "utf8");
  const sessions = Object.entries(data.sessions || {});
  if (!sessions.length) failures.push("claude-code: no sessions defined");
  for (const [id, session] of sessions) {
    for (const [i, step] of (session.steps || []).entries()) {
      if (!new RegExp(`\\b${step.type}\\s*\\(`).test(app)) failures.push(`claude-code: session ${id} step ${i} has unknown type "${step.type}"`);
    }
  }
  sessionCount = sessions.length;
}

// Shared data layer
{
  const result = spawnSync(process.execPath, ["--check", join(root, "docs", "shared", "mockkit.js")], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`shared: mockkit.js syntax error
${result.stderr}`);
  for (const product of [...Object.keys(products), "claude-code"]) {
    const html = await readFile(join(root, "docs", product, "index.html"), "utf8");
    if (!html.includes("../shared/mockkit.js")) failures.push(`${product}: index.html does not load ../shared/mockkit.js`);
  }
}

if (failures.length) {
  console.error(`Verification failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${Object.keys(products).length} desktop mocks (${Object.values(products).flat().length} deterministic scenes) and the Claude Code terminal (${sessionCount} scripted sessions).`);
