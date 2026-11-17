# Part 3: The factory, human in the loop (70 min)

**Goal:** build the three other stations of the factory, give the tester **eyes** (an MCP server) and **know-how** (a skill), and deliver **F1** end to end, with **you** passing work from one agent to the next.

```
 docs/specs/F1-*.md ──► implementer ──► tester ──► reviewer ──► APPROVED?
                            ▲                          │
                            └──── CHANGES_REQUESTED ───┘
```

The agents don't share a conversation. They share **files**: the spec, the code, the test report and the review. This is deliberate. Each agent starts from a **fresh, focused context**, and every hand-off leaves a written trace that a human (or the CI) can inspect.

> 💡 Work on a branch: `git switch -c feat/F1`. You'll open a pull request at the end so the CI checks your work.

---

## 3.1 The implementer (15 min)

Create `.github/agents/implementer.agent.md`, with the same five sections as the planner.

- **Tools:** it reads, searches, edits **and runs commands** (tests, lint). Use `todo` too, so it tracks the plan steps.
- **Inputs:** the path to a spec in `docs/specs/`, and optionally a review in `docs/reviews/` to address.
- **Process.** Some ideas to adapt:
  1. Read `AGENTS.md` and the spec. Stop and report if the spec has unresolved _Open questions_.
  2. Follow the **Implementation plan** step by step, one step at a time.
  3. **API first, test first:** for each acceptance criterion that touches the API, write the failing supertest test, then make it pass.
  4. Then implement the UI changes, respecting the accessible names and roles given in the spec.
  5. Run `npm run typecheck`, `npm run lint` and `npm test` after each step, and fix any failure before moving on.
  6. Finish with `npm run verify` (it must stay green: the existing e2e tests are your regression suite).
- **Output format:** a short report in the chat listing the files changed, which acceptance criteria are covered by which unit tests, the commands run and their results, and any deviation from the plan with the reason.
- **Constraints:** no changes outside the scope of the spec. Don't modify or delete existing tests to make them pass. Don't write e2e tests (that's the tester's job). No new dependencies without saying so.

Run it in a **new session**: `Implement docs/specs/F1-<slug>.md`. While it runs, read what it does and approve or deny its commands. Afterwards, try the feature yourself in the browser (`npm run dev`).

---

## 3.2 Give the tester eyes: the Playwright MCP server (10 min)

The **Model Context Protocol (MCP)** is an open standard for plugging tools into AI agents. An MCP server exposes tools (here: _navigate_, _click_, _type_, _take an accessibility snapshot_…), and any MCP-compatible client (VS Code, Copilot CLI, Claude Code…) can use them.

- 📖 [MCP configuration reference (VS Code)](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)
- 📖 [Manage MCP servers](https://code.visualstudio.com/docs/agents/run/manage-mcp-servers)
- 📖 [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp): read the list of tools and the command-line options.

Create **`.mcp.json` at the repository root**. Both the VS Code Copilot harness and Copilot CLI read this file:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--isolated"],
      "tools": ["*"]
    }
  }
}
```

1. Check that the server appears in **Open Customizations → MCP Servers**, and **trust / start** it when asked.
2. With `npm run dev` running, try it **with the default agent** (no custom agent): _"Using the Playwright tools, open http://localhost:5173, create a task called 'MCP works', move it to Done, and tell me what you observe."_ A browser window opens and the agent drives it.
3. Look at the tool calls, especially **`browser_snapshot`**. The agent "sees" the page as an **accessibility tree** (roles and names), not as pixels. What does that mean for how accessible your UI needs to be?

> 🔒 Every MCP server is code running on your machine with your permissions. Only install servers you trust, from official sources, and review tool calls before approving them.

---

## 3.3 Give the tester know-how: the `e2e-testing` skill (15 min)

A **skill** is a folder containing a `SKILL.md` (instructions) and optional **resources** (templates, scripts, examples). Skills are an open standard ([agentskills.io](https://agentskills.io)). Copilot, Claude Code, Codex and others use the same format.

Skills use **progressive disclosure**:

1. At start-up the agent only sees each skill's `name` and `description`. That costs a few tokens.
2. When a task matches the description, the agent loads the body of `SKILL.md`.
3. Bundled files are loaded only if the instructions point to them and the agent needs them.

That's why a skill is a better home than an always-on instruction file for know-how that's large but only occasionally needed.

- 📖 [Agent skills in VS Code](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- 📖 [About agent skills (GitHub)](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)

Create `.github/skills/e2e-testing/SKILL.md`:

- **Frontmatter:**
  - `name: e2e-testing`. It must be **identical to the folder name**, lowercase with hyphens. An invalid name makes the skill **silently** fail to load.
  - `description`: what it does **and when to use it**, e.g. "Use when writing, fixing or running Playwright end-to-end tests for the Kanban app."
- **Body:** the conventions **of this repository**. Read `e2e/fixtures.ts`, `e2e/board.spec.ts` and `playwright.config.ts` first. Cover at least:
  - Import `test` and `expect` from `./fixtures.ts`, not from `@playwright/test`.
  - Set the initial board with `test.use({ boardState: { tasks: [...] } })`. Explain **why it's an object and not an array** (read the comment in `fixtures.ts`).
  - Locators: `getByRole` / `getByLabel` first; no CSS or XPath selectors, and no `waitForTimeout`.
  - One spec file per feature: `e2e/<ID>-<slug>.spec.ts`. Test titles start with the acceptance criterion ID (`AC2 — …`) so the test report can trace them.
  - How to run and debug: `npm run test:e2e`, `npx playwright test e2e/F1-x.spec.ts`, traces and `--debug`. Note that the e2e servers use their own ports (5174 / 3101).
- **A bundled resource:** add `.github/skills/e2e-testing/templates/feature.spec.ts`, a commented template of a feature spec file. **Link it** from `SKILL.md` with a relative Markdown link, e.g. `[template](./templates/feature.spec.ts)`.

Test the skill **before** wiring it into an agent. In a new session with the default agent, type `/e2e-testing` (skills are also slash commands), or simply ask _"Write an e2e test checking that the Done column shows its task count"_. Check the response's references: was the skill loaded? Does the test follow your conventions? Discard that test afterwards.

---

## 3.4 The tester (10 min)

Create `.github/agents/tester.agent.md`.

- **Tools:** read, search, edit, execute, **plus the Playwright MCP tools** (`playwright/*`).
- **Skills:** in the Copilot harness you can pre-load skills with the `skills` frontmatter field: `skills: ['e2e-testing']`. Also mention the skill in the body.
- **Process.** Some ideas:
  1. Read `AGENTS.md` and the spec.
  2. Check that the app is running on http://localhost:5173. If it isn't, ask the user to run `npm run dev` and stop.
  3. **Explore** each acceptance criterion in the real UI with the Playwright MCP tools, and note the actual roles and accessible names.
  4. Write the e2e tests (following the `e2e-testing` skill), one test or more per acceptance criterion.
  5. Run them. If a test fails because **the app** is wrong, **don't fix the app**. Record the bug in the report.
- **Output format:** `docs/reports/<ID>-test-report.md`, containing a table with one row per acceptance criterion and the columns _AC_, _Test (file › title)_, _Status_ (pass/fail/not covered) and _Notes_, followed by the bugs found and the final `npm run test:e2e` result.
- **Constraints:** only create or modify files in `e2e/` and `docs/reports/`.

---

## 3.5 The reviewer (10 min)

Create `.github/agents/reviewer.agent.md`. It's the factory's quality gate, so be demanding.

- **Tools:** read and search. It also needs `execute` to run `git diff main...HEAD` and `npm run verify`, and `edit` **only** to write its report. Say that explicitly in the constraints. Do you trust a prompt to enforce that? You'll come back to this in Part 5.
- **Process:** a checklist, for example:
  - Spec conformance: each acceptance criterion is implemented **and** tested (cross-check with the test report).
  - `AGENTS.md` conventions and the path-specific instructions.
  - Correctness: edge cases, error handling, server-side enforcement of rules.
  - Security: input validation, no secrets, no `dangerouslySetInnerHTML`.
  - Accessibility: roles, labels, keyboard.
  - No unrelated changes or leftover debug code.
  - `npm run verify` result.
- **Output format:** `docs/reviews/<ID>-review.md` with
  - a first line `Verdict: APPROVED` or `Verdict: CHANGES_REQUESTED`;
  - a findings table with the columns _Severity_ (blocking / major / minor), _File:line_, _Problem_ and _Suggested fix_.
  - The verdict is `CHANGES_REQUESTED` if there's at least one blocking or major finding.
- **Constraints:** never modify code or tests.

---

## 3.6 Run the chain on F1 (10 min)

Each step runs in a **new session** with the right agent selected:

1. **tester:** `Test docs/specs/F1-<slug>.md` (with `npm run dev` running)
2. **reviewer:** `Review F1 (spec docs/specs/F1-<slug>.md, test report docs/reports/F1-test-report.md)`
3. If the verdict is `CHANGES_REQUESTED`: **implementer** with `Address docs/reviews/F1-review.md`, then tester and reviewer again.
4. When the verdict is `APPROVED` and `npm run verify` is green: tick **F1** in `BACKLOG.md`, commit, push, and open a **pull request**. Wait for the CI, then merge.

At each step, count the times **you** had to step in (stop a run, re-prompt, fix by hand) and why. You'll need that in Part 4.

## ✅ Checkpoint 3

- [ ] Agents `implementer`, `tester` and `reviewer` exist, with the five sections and minimal tools.
- [ ] `.mcp.json` declares `playwright`. You saw the tester drive the browser.
- [ ] The `e2e-testing` skill exists with a bundled template, and you checked that it gets loaded.
- [ ] F1 is delivered: spec, code, `e2e/F1-*.spec.ts`, `docs/reports/F1-test-report.md`, `docs/reviews/F1-review.md` (APPROVED), and a merged PR with green CI.
- [ ] `JOURNAL.md`: _Part 3_ is filled in.
      [ ] `npm run check -- --part 3` is green.

<details>
<summary>⚡ Stretch goals</summary>

- Run the built-in Copilot code review on your PR and compare it with your reviewer's report. 📖 [Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)
- Give the tester the `--caps=testing` Playwright MCP capability (`browser_generate_locator`, `browser_verify_*`). Does it write better locators?
- Turn the review checklist into a `code-review` skill with a bundled `checklist.md`, so any agent (or you, with `/code-review`) can use it.

</details>

➡️ [Part 4: The orchestrator](04-orchestrator.md)
