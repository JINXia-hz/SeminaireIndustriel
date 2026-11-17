# Reference card: Copilot customization files (Copilot harness, November 2026)

> Formats change fast. When in doubt, the linked docs win over this card.

## Where things live

```
AGENTS.md                                   always-on project instructions (cross-tool)
.github/
├── copilot-instructions.md                 always-on instructions (Copilot-specific alternative)
├── instructions/<name>.instructions.md     path-specific instructions (applyTo)
├── agents/<id>.agent.md                    custom agents
├── skills/<name>/SKILL.md (+ resources)    agent skills, loaded on demand
└── hooks/<name>.json (+ scripts)           lifecycle hooks
.mcp.json                                   MCP servers (VS Code Copilot harness + Copilot CLI)
```

User-level equivalents live in `~/.copilot/` (`agents/`, `skills/`, `hooks/`, `mcp-config.json`, `copilot-instructions.md`).

## Custom agent: `.github/agents/<id>.agent.md`

```markdown
---
name: reviewer
description: Reviews a delivered feature against its spec. Use after the tester, before merging.
tools: ['read', 'search', 'execute', 'edit']   # aliases: read search edit execute agent web todo, <mcp>/*
skills: ['code-review']                         # optional: pre-load skills (Copilot harness)
user-invocable: true                            # false = hidden from picker, still usable as subagent
disable-model-invocation: false                 # true = cannot be used as a subagent
---
# Role / ## Inputs / ## Process / ## Output format / ## Constraints
```

📖 [File reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference) · [GitHub configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)

## Instructions: `.github/instructions/<name>.instructions.md`

```markdown
---
name: Server conventions
applyTo: 'server/**/*.ts, server/**/*.test.ts'
---
- Rules that apply when working on matching files.
```

📖 [Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Skill: `.github/skills/<name>/SKILL.md`

```markdown
---
name: e2e-testing            # = folder name; lowercase, digits, hyphens; ≤ 64 chars
description: What it does AND when to use it (≤ 1024 chars).
---
Instructions… link resources relatively: [template](./templates/feature.spec.ts)
```

Also usable as a slash command: `/e2e-testing …`. 📖 [Agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) · [agentskills.io](https://agentskills.io)

## MCP: `.mcp.json`

```json
{
  "mcpServers": {
    "playwright": { "type": "stdio", "command": "npx", "args": ["-y", "@playwright/mcp@latest"], "tools": ["*"] }
  }
}
```

📖 [MCP configuration](https://code.visualstudio.com/docs/agents/reference/mcp-configuration) · [Playwright MCP](https://github.com/microsoft/playwright-mcp)

## Hooks: `.github/hooks/<name>.json`

```json
{
  "version": 1,
  "hooks": {
    "preToolUse":  [{ "type": "command", "matcher": "bash|powershell", "command": "node .github/hooks/guard.mjs", "timeoutSec": 10 }],
    "postToolUse": [{ "type": "command", "matcher": "edit|create|apply_patch", "command": "node .github/hooks/format.mjs" }]
  }
}
```

- stdin: event JSON. stdout: **one** JSON object.
- `preToolUse` → `{"permissionDecision":"deny","permissionDecisionReason":"…"}`
- `agentStop` → `{"decision":"block","reason":"…"}`
- A non-zero exit denies the call; a timeout fails open.

📖 [Hooks (VS Code)](https://code.visualstudio.com/docs/agent-customization/hooks) · [Hooks reference (GitHub)](https://docs.github.com/en/copilot/reference/hooks-reference)

## Legacy: Local harness (deprecated, removed February 2027)

You'll still find these in blog posts and older repos: `*.chatmode.md`, `*.prompt.md` prompt files, `handoffs:`, `agents:` allow-lists, `#runSubagent`, and `.vscode/mcp.json` with a `servers` key. 📖 [Move to Copilot](https://code.visualstudio.com/docs/agents/run/move-to-copilot)
