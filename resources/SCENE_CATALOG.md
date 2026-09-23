# Scene catalog

Every scene below can be loaded directly with `?scene=...`. Add `name`, `prompt`, and product-specific parameters to stage a reusable shot.

Parameters shared by every mock: `chat=<conversation-id>` opens any conversation from `demo-data.js`, `theme=light|dark`, `clean=1` hides training chrome, `nosave=1` ignores saved data edits, `data=<json-url>` loads data from a file, and `d=<...>` is the payload from a **Copy share link**.

## Microsoft 365 Copilot

Base path: `/microsoft/`

| Scene | Use in a tutorial |
| --- | --- |
| `home` | Cowork welcome and starter cards |
| `chat` | Traditional Copilot Chat home with full navigation |
| `chat-response` | Populated prompt, response, and source citations |
| `chat-thinking` | Copilot reasoning over work content |
| `chat-web` | Web-grounded answer |
| `chat-table` | Answer with a formatted table |
| `search` | Search home |
| `search-results` | Search results and filters |
| `library` | Library of files and pages |
| `agents` | Agent store |
| `notebooks` | Notebooks list |
| `create` | Create gallery |
| `workflow-agent` | Pinned Workflow agent builder |
| `workflow-complete` | Completed Workflow agent run |
| `running` | Cowork task progressing through steps |
| `approval` | Cowork approval request |
| `complete` | Completed Cowork task and deliverables |
| `tasks` | Task history and filters |
| `scheduled` | Scheduled tasks list |
| `customize` | Cowork customization cards |

Extra parameters: `model`, `panel=0|1`, `studio=1`.

## ChatGPT desktop

Base path: `/chatgpt/`

| Scene | Use in a tutorial |
| --- | --- |
| `chat-home` | Chat landing screen and composer |
| `chat-response` | Populated conversation with a structured answer |
| `chat` | Long multi-turn conversation |
| `chat-code` | Answer with syntax-highlighted code |
| `chat-search` | Web search answer with citations and sources |
| `chat-image` | Image generation result |
| `work-home` | Work landing screen and starter tasks |
| `work-running` | Multi-step Work task in progress with detail pane |
| `work-complete` | Finished Work task and generated files |
| `codex-home` | Codex project and task launcher |
| `codex-task` | Codex tool log and proposed code diff |
| `search` | Unified search across chats, projects, and files |
| `project` | Project workspace and instructions |
| `library` | Image library grid |
| `gpts` | GPT directory |
| `sora` | Sora page |
| `plugins` | Plugin directory |
| `scheduled` | Scheduled tasks and their next run times |
| `sites` | Published Work sites and workspace status |

Extra parameters: `model`, `studio=1`.

## Claude Desktop

Base path: `/claude/`

| Scene | Use in a tutorial |
| --- | --- |
| `home` | Unified Claude landing screen |
| `response` | Populated chat response |
| `chat` | Long multi-turn conversation with code blocks |
| `chats` | Chat history page |
| `artifacts` | Artifacts gallery |
| `task-running` | Longer multi-step task in progress |
| `task-complete` | Finished task and downloadable outputs |
| `artifact` | Artifact beside the conversation with version controls |
| `research` | Research setup through the add menu |
| `project` | Project context and instructions |
| `code` | Claude Code task and diff view |
| `scheduled` | Scheduled work |

Extra parameters: `model`, `permission=manual|auto`, `artifact=<id>`, `time=morning|afternoon|evening`, `sidebar=collapsed`, `thinking=1`, `studio=1`.

## Claude Code terminal

Base path: `/claude-code/`. The terminal uses scripted **sessions** rather than scenes.

| Session | Use in a tutorial |
| --- | --- |
| `fix-accessibility` | Full loop: prompt, search, read, todos, permission, edits with diffs, tests, summary |
| `init` | `/init` explores the repo and writes CLAUDE.md |
| `plan-feature` | Shift+Tab into plan mode, approve the plan, then implement |
| `git-commit` | Inspect the diff, approve a Bash command, commit |

Parameters: `session`, `autoplay=1`, `delay`, `speed`, `step=N|end`, `theme`, `chrome=windows|mac|none`, `font`, `full=1`, `clean=1`. See [CLAUDE_CODE_CLI.md](CLAUDE_CODE_CLI.md).
