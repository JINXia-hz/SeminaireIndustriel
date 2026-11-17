# Part 2: Context engineering (25 min)

**Goal:** give **every** agent, current and future, the project knowledge it needs, without repeating it in each agent file.

Your planner had to _discover_ the stack, the commands and the conventions by reading code. Every future agent would have to do that too, spending time and credits and sometimes guessing wrong. Instruction files solve this.

## 2.1 Where should context go? (5 min)

| Mechanism                                            | Loaded…                                    | Put in it…                                                                                       |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `AGENTS.md` (or `.github/copilot-instructions.md`)   | **always**, for every request              | What every contributor must know: stack, commands, architecture, conventions, definition of done |
| `.github/instructions/*.instructions.md` + `applyTo` | when the agent works on **matching files** | Rules for one area: "in `server/**`, validate with zod…"                                         |
| **Skills** (`.github/skills/*/SKILL.md`)             | **on demand**, when relevant (Part 3)      | Procedures and resources for a specific task                                                     |
| **Custom agents**                                    | when **selected / delegated to**           | A role: process, tools, output format                                                            |

Always-on context costs tokens on **every** request, so keep it short and essential.

- 📖 [Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- 📖 [Custom instructions reference](https://code.visualstudio.com/docs/agents/reference/custom-instructions-reference)
- 📖 [agents.md](https://agents.md/), the cross-tool convention read by Copilot, Codex, Cursor, Claude Code and others. We use it instead of `copilot-instructions.md` because it isn't tied to a single vendor.

## 2.2 Write `AGENTS.md` (10 min)

Create `AGENTS.md` at the repository root. You may ask the default agent for a **first draft** ("Analyse this repository and draft an AGENTS.md"), but **you** are responsible for the result. Remove anything generic, wrong or obvious. Required content:

- **Project overview:** 2 lines.
- **Stack and layout:** the folders and their responsibility.
- **Commands:** `npm run dev`, `npm test`, `npm run test:e2e`, `npm run verify`, `npm run lint`, `npm run format`.
- **Architecture rules:** e.g. business rules are enforced in the API, not only in the UI; validation uses zod schemas in `server/src/domain.ts`; types are shared via `import type`.
- **Conventions:** TypeScript strict, no `any`, accessible UI (roles, labels, keyboard), naming, small commits.
- **A `## Definition of done` section:** `npm run verify` green, tests for each acceptance criterion, no unrelated changes, spec updated if behaviour changed.
- **Factory conventions:** where specs, test reports and reviews live (`docs/specs/`, `docs/reports/`, `docs/reviews/`) and their naming (`<ID>-<slug>.md`).

## 2.3 Path-specific instructions (5 min)

Create **at least two** files in `.github/instructions/`, each with an `applyTo` glob:

```markdown
---
name: Server conventions
description: Conventions for the Express API
applyTo: 'server/**/*.ts'
---

- Every route validates its input with a zod schema from `server/src/domain.ts`.
- Errors: 400 ValidationError (zod), 404 NotFound, 409 Conflict for business rule violations …
- Every route has supertest tests in `server/test/`.
```

Suggested pair: `server.instructions.md` (`server/**`) and `web.instructions.md` (`web/**`). An `e2e.instructions.md` is tempting, but wait for Part 3: the e2e knowledge will go into a **skill** instead. Why might that be a better fit?

## 2.4 Measure the effect (5 min)

Delete the F1 spec, start a new session, and run the planner on F1 again. Compare the result with `git diff` against the spec from Part 1:

- Does the plan now respect the error codes and conventions you wrote?
- Can you see the instruction files in the **References** of the chat response? That's how you confirm they were loaded.

Keep the better spec.

## ✅ Checkpoint 2

- [ ] `AGENTS.md`: ≥ 20 meaningful lines, with the commands and a **Definition of done**.
- [ ] ≥ 2 `.github/instructions/*.instructions.md` with `applyTo` globs that match real files.
- [ ] `JOURNAL.md`: _Part 2_ is filled in.
- [ ] `npm run check -- --part 2` is green. Commit and push.

➡️ [Part 3: The factory, human in the loop](03-factory-human-in-the-loop.md)
