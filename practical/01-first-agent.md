# Part 1: Your first agent, the planner (35 min)

**Goal:** write a custom agent from scratch, run it, criticise its output, and **improve the agent rather than the output**.

The **planner** is the first stage of your factory. It turns a vague backlog item into a precise, testable **spec plus implementation plan**. It doesn't write code.

## 1.1 What is a custom agent? (5 min)

A custom agent is a **Markdown file with a YAML frontmatter**, stored in `.github/agents/<id>.agent.md`. The file name, without `.agent.md`, is the agent's **id**.

```markdown
---
name: planner # display name (defaults to the file name)
description: >- # REQUIRED. What it does + WHEN to use it.
  ...                             # Copilot uses this to pick the agent automatically.
tools: ['read', 'search'] # least privilege: only what it needs
---

# Role

...the system prompt of your agent, in Markdown...
```

Read these two pages before writing anything. The second is the reference you'll keep coming back to:

- 📖 [Custom agents in VS Code](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- 📖 [Custom agent file reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference). Look at the **Header fields** table and the **Tools** section.
- 📖 [Custom agents configuration (GitHub)](https://docs.github.com/en/copilot/reference/custom-agents-configuration). This has the **tool aliases** table.

In the Copilot harness, the built-in **tool aliases** are:

| Alias            | Lets the agent…                                      |
| ---------------- | ---------------------------------------------------- |
| `read`           | read files                                           |
| `search`         | search for files / text                              |
| `edit`           | create and modify files                              |
| `execute`        | run shell commands                                   |
| `agent`          | delegate to another (custom) agent as a **subagent** |
| `web`            | fetch URLs, search the web                           |
| `todo`           | maintain a task list                                 |
| `<mcp-server>/*` | use the tools of an MCP server (Part 3)              |

> 💡 If you omit `tools`, the agent gets **every** tool. That's almost never what you want.

## 1.2 Write the planner (15 min)

Create `.github/agents/planner.agent.md`. You can start from **Chat: New Custom Agent** in the command palette, or create the file by hand.

### Frontmatter

- `name`: `planner`
- `description`: one or two sentences saying **what** it produces and **when** to use it, e.g. when a feature from `BACKLOG.md` must be specified before implementation.
- `tools`: the planner must read the code and **write one file** (the spec). It must **not** run commands. Which aliases does it need?

> Don't set `model`: on Copilot Student, model selection is automatic.

### Body

Structure the prompt with **these five Markdown headings**. The checker looks for them, and more importantly they're a solid structure for any agent:

| Section            | What to write                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `# Role`           | Who the agent is, in 2–3 lines. "You are a senior product engineer…"                                                                                                  |
| `## Inputs`        | What it receives: a feature ID from `BACKLOG.md`, and the existing code.                                                                                              |
| `## Process`       | Numbered steps: read the backlog item → explore the relevant code (name the folders) → identify impacts on the API, UI and tests → list ambiguities → write the spec. |
| `## Output format` | The **exact** structure of the file to produce (below), and **where** to write it: `docs/specs/<ID>-<kebab-slug>.md`.                                                 |
| `## Constraints`   | What it must never do: write code, modify files outside `docs/specs/`, invent requirements without listing them under _Open questions_, etc.                          |

Here's the spec format the rest of the factory will rely on. Paste it into your **Output format** section and adapt it:

```markdown
# <ID> — <Feature title>

## Summary

## Acceptance criteria

### AC1 — <short name>

- **Given** <initial state>
- **When** <action>
- **Then** <observable outcome>
  (at least 3 scenarios, including error / edge cases)

## API changes (routes, payloads, status codes, validation rules)

## UI changes (components, accessible names / roles, keyboard behaviour)

## Implementation plan (numbered steps, small enough for one commit each, with file paths)

## Test plan (which acceptance criteria → unit/API test vs. e2e test)

## Out of scope

## Open questions
```

> 💡 **Why Given / When / Then?** Each scenario becomes an automated test almost mechanically. Your tester agent will depend on it in Part 3.

## 1.3 Run it (5 min)

1. Start a **new chat session**, select **planner** in the agent picker, and ask: `Plan F1.`
2. Watch the tool calls: what did it read? Did it look at `server/src/app.ts`, `web/src/components/`, `e2e/fixtures.ts`?
3. Open the generated `docs/specs/F1-*.md`.

If the agent doesn't appear in the picker, check **Open Customizations → Agents**. A YAML error is the usual culprit.

## 1.4 Criticise, then fix the agent, not the spec (10 min)

Review the spec as a demanding tech lead would. For example:

- Are the acceptance criteria **observable** and **testable**? Is there an error case (e.g. invalid status → `400`)?
- Did it think about **keyboard** accessibility, as the backlog asks?
- Does the plan reference **real files** of this repo, or invented ones?
- Did it choose an API design (`PATCH /api/tasks/:id`? `POST /api/tasks/:id/move`?) and justify it?
- Did it stay within its role, with no code written?

Then **improve `planner.agent.md`** to fix the two or three worst problems: clearer process steps, an explicit checklist, an example, a stricter constraint. Delete the spec, start a **new session**, and re-run. Compare the two versions with `git diff`.

> 🎯 This is the core skill of the day. A bad output is a symptom; the cause is usually missing **context**, a vague **process**, or an unclear **output format**.

## ✅ Checkpoint 1

- [ ] `.github/agents/planner.agent.md` has a precise description, a minimal tool list (no `execute`), and the five sections.
- [ ] `docs/specs/F1-<slug>.md` exists, follows the format, and has at least 3 Given/When/Then scenarios. Review it yourselves: **you** are accountable for it.
- [ ] `JOURNAL.md`: _Part 1_ is filled in, including what you changed in the agent and its effect.
- [ ] `npm run check -- --part 1` is green. Commit and push.

<details>
<summary>⚡ Stretch goals (if you're ahead)</summary>

- Add to the process: _"If the backlog item is ambiguous, ask the user up to 3 clarifying questions before writing the spec."_ Does the agent actually ask?
- Run the planner on F3 (WIP limit). Does it spot that the rule must be enforced **server-side**?
- Compare with the built-in **Plan** agent (`/plan`). What does your agent do better or worse? 📖 [Planning](https://code.visualstudio.com/docs/agents/run/planning)

</details>

➡️ [Part 2: Context engineering](02-context-engineering.md)
