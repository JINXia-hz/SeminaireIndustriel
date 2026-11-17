# Part 5: Hooks and guardrails (25 min)

**Goal:** add **deterministic** guardrails to your factory. A prompt saying "never run `rm -rf`" is a _suggestion_ to a probabilistic model. A **hook** is code that runs on every tool call and can **block** it.

## 5.1 Hooks in a nutshell (5 min)

Hooks are commands that the agent runtime executes at lifecycle events. In the Copilot harness, **VS Code, Copilot CLI and the cloud agent share the same hook format**, stored in `.github/hooks/*.json`.

- 📖 [Agent hooks in VS Code](https://code.visualstudio.com/docs/agent-customization/hooks) (Preview)
- 📖 [Hooks reference (GitHub)](https://docs.github.com/en/copilot/reference/hooks-reference). This is the schema, every event, its input and output.

| Event                            | When                             | Can it change things?                                       |
| -------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| `sessionStart` / `sessionEnd`    | a session begins / ends          | logging, setup                                              |
| `userPromptSubmitted`            | the user sends a prompt          | audit                                                       |
| **`preToolUse`**                 | **before** each tool call        | **yes: `allow` / `deny` / `ask`**, or modify the arguments  |
| **`postToolUse`**                | after a tool call succeeds       | add context for the model, modify the result                |
| `agentStop`                      | the main agent finishes its turn | `{"decision":"block","reason":…}` **forces it to continue** |
| `subagentStart` / `subagentStop` | around subagent runs             | inject context, gate                                        |

How a command hook works:

- It receives the event as **JSON on stdin**. For `preToolUse` that's `{ sessionId, timestamp, cwd, toolName, toolArgs }`. ⚠️ `toolArgs` can arrive as an object **or** as a JSON string, so handle both.
- It answers with **one JSON object on stdout**, e.g. `{"permissionDecision":"deny","permissionDecisionReason":"…"}`. `{}` means "no opinion". It does **not** approve the call.
- A **non-zero exit code denies** the call (_fail-closed_). A **timeout** lets the call continue through the normal permission flow (_fail-open_).
- `matcher` is a regex on the tool name, anchored as `^(?:…)$`. Shell tools are named `bash` / `powershell`, and editing tools `edit`, `create`, `apply_patch`.

## 5.2 Block dangerous commands (10 min)

Create `.github/hooks/guardrails.json`:

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "matcher": "bash|powershell",
        "command": "node .github/hooks/guard-commands.mjs",
        "timeoutSec": 10
      }
    ]
  }
}
```

> We write hook scripts in **Node.js** so they behave the same on macOS, Linux and Windows. `command` is the cross-platform field.

Then write `.github/hooks/guard-commands.mjs`. Here's a starting point:

```js
// preToolUse guard: deny dangerous shell commands.
import { readFileSync } from 'node:fs';

const event = JSON.parse(readFileSync(0, 'utf8'));
const args =
  typeof event.toolArgs === 'string' ? JSON.parse(event.toolArgs) : (event.toolArgs ?? {});
const command = String(args.command ?? '');

const RULES = [
  // TODO: [regex, reason] pairs — rm -rf, force push, ...
];

const hit = RULES.find(([re]) => re.test(command));
process.stdout.write(
  JSON.stringify(hit ? { permissionDecision: 'deny', permissionDecisionReason: hit[1] } : {}),
);
```

Requirements, which the checker **runs your script** to verify:

- **Deny:** `rm -rf` (in any flag order: `-rf`, `-fr`, `-r -f`…) and `git push --force` / `git push -f`.
- **Allow:** `npm test`, `git status`, `ls -la`, `npx playwright test`. A guard that blocks everything is useless.
- Add at least one rule of your own that makes sense for this project.

Test it without any agent, the way the checker does:

```bash
echo '{"toolName":"bash","toolArgs":{"command":"rm -rf node_modules"}}' | node .github/hooks/guard-commands.mjs
echo '{"toolName":"bash","toolArgs":"{\"command\":\"npm test\"}"}'      | node .github/hooks/guard-commands.mjs
```

Then test it live. Check that the hook is listed in **Open Customizations → Hooks** (or type `/hooks`), and ask an agent to _"clean the repository with rm -rf node_modules dist"_. The call must be denied, and the agent must see your reason.

## 5.3 Auto-format after edits (5 min)

Add a `postToolUse` hook with `"matcher": "edit|create|apply_patch"` that runs Prettier on the files the agent changed. Some hints:

- The simplest robust approach is to format the files listed by `git diff --name-only` and `git ls-files --others --exclude-standard`, filtered on `.ts`, `.tsx`, `.css`, `.json` and `.md`.
- Send the tool's own output to **stderr**. Only the final JSON object goes to stdout.
- Bonus: run ESLint on those files and, if there are errors, return them as `{"additionalContext": "…"}` so the model sees them right away and fixes them.

## 5.4 Discuss (5 min)

In the journal, answer:

- In Part 3 your reviewer only had `edit` "to write its report". How could a hook **enforce** that? Look up **agent-scoped hooks** (the `hooks` field in an agent's frontmatter) in the docs.
- Hooks, permission levels and terminal **sandboxing** (`chat.agent.sandbox.enabled`) all add safety. What does each one protect against, and which would you require on a team? 📖 [Agent sandboxing](https://code.visualstudio.com/docs/agents/run/agent-sandboxing)

## ✅ Checkpoint 5

- [ ] `.github/hooks/guardrails.json` is valid (`version: 1`), with a `preToolUse` hook and a `postToolUse` hook.
- [ ] The guard denies the dangerous commands and lets the safe ones through, both piped by hand **and** in a live session.
- [ ] `JOURNAL.md`: _Part 5_ is filled in, including one real output showing a hook in action.
- [ ] `npm run check -- --part 5` is green. Commit and push.

<details>
<summary>⚡ Stretch goals</summary>

- **Quality gate on `agentStop`:** run `npm run typecheck`. If it fails, return `{"decision":"block","reason":"<errors>"}` so the agent **can't stop** while the build is broken. ⚠️ This can loop and burn credits. The runtime stops after 8 consecutive blocks, but add your own safety (e.g. only block when files under `server/` or `web/` changed).
- **Audit trail:** a `postToolUse` hook appending `{timestamp, toolName}` to `.github/hooks/audit.log` (gitignored). How many tool calls did the factory make for F3?
- **Agent-scoped hook:** enforce "the reviewer may only write in `docs/reviews/`" with a `preToolUse` hook in `reviewer.agent.md`'s frontmatter.

</details>

➡️ [Part 6: Copilot CLI (bonus)](06-copilot-cli.md) or [Part 7: Final demo](07-final-demo.md)
