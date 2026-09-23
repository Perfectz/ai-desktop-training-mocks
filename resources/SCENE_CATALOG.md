# Scene catalog

Every scene below can be loaded directly with `?scene=...`. Add `name`, `prompt`, and product-specific parameters to stage a reusable shot.

## Microsoft 365 Copilot

Base path: `/microsoft/`

| Scene | Use in a tutorial |
| --- | --- |
| `home` | Cowork welcome and starter cards |
| `chat` | Traditional Copilot Chat home with full navigation |
| `chat-response` | Populated prompt, response, and source citations |
| `search-results` | Search results and filters |
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
| `work-home` | Work landing screen and starter tasks |
| `work-running` | Multi-step Work task in progress with detail pane |
| `work-complete` | Finished Work task and generated files |
| `codex-home` | Codex project and task launcher |
| `codex-task` | Codex tool log and proposed code diff |
| `search` | Unified search across chats, projects, and files |
| `project` | Project workspace and instructions |
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
| `task-running` | Longer multi-step task in progress |
| `task-complete` | Finished task and downloadable outputs |
| `artifact` | Artifact beside the conversation with version controls |
| `research` | Research setup through the add menu |
| `project` | Project context and instructions |
| `code` | Claude Code task and diff view |
| `scheduled` | Scheduled work |

Extra parameters: `model`, `permission=manual|auto`, `studio=1`.
