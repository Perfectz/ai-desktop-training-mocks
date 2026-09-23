import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const products = {
  microsoft: ["home", "chat", "chat-response", "search-results", "workflow-agent", "workflow-complete", "running", "approval", "complete", "tasks", "scheduled", "customize"],
  chatgpt: ["chat-home", "chat-response", "work-home", "work-running", "work-complete", "codex-home", "codex-task", "search", "project", "plugins", "scheduled", "sites"],
  claude: ["home", "response", "task-running", "task-complete", "artifact", "research", "project", "code", "scheduled"]
};

const failures = [];

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

if (failures.length) {
  console.error(`Verification failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${Object.keys(products).length} mocks and ${Object.values(products).flat().length} deterministic scenes.`);
