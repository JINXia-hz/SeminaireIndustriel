# Lab journal

> Fill this in **as you go** (5 minutes at the end of each part), not at the end of the session.
> It is graded on honesty and insight, not on how well everything went.
> Failures, surprises and "the agent did something stupid" moments are the most valuable content.

**Pair:** JIN Xia.
**Repository:** https://github.com/JINXia-hz/SeminaireIndustriel

---

## Part 0 — Setup

- Copilot plan and VS Code version: free, v1.146.0
- AI credits remaining at the start of the session: not checked yet.
- Anything that did not work out of the box: the first npm command failed with ENOENT because it was run from the parent directory. Running `npm ci` from the repository root succeeded, Playwright Chromium was installed, and the full `npm run verify` passed. The VS Code Agent dropdown was not available, so the planner was run through Copilot CLI instead.

## Part 1 — First agent: the Planner

- Prompt(s) used to run the planner: an initial F1 spec was written directly before the agent run. I then installed Copilot CLI because the VS Code Agent dropdown was unavailable, launched `copilot --agent planner`, and used the prescribed prompt `Plan F1.`.
- What was good / bad in the first spec it produced? The agent expanded the draft to six observable scenarios, including keyboard-only movement, invalid input, missing tasks, and failed requests. It planned a feature-specific `e2e/F1-move-task-between-columns.spec.ts` and made no product-code changes. Its main weakness was listing settled design recommendations under Open questions even though no human decision was still required.
- What did you change in `planner.agent.md` after the first run, and what effect did it have? Before the run, I added explicit feature-specific E2E naming and allowed replacement of the requested feature's existing draft; the generated spec followed both rules. After reviewing the run, I restricted Open questions to unresolved decisions requiring human input. A second fresh CLI run still listed settled recommendations there, so that prompt change did not have the intended effect. I kept the useful spec and stopped spending credits on this non-blocking wording issue.

## Part 2 — Context engineering

- What did you put in the project-wide instructions vs. path-specific instructions? Why? `AGENTS.md` contains the shared stack, commands, architecture, artifact naming, and definition of done. Server rules such as Zod validation and API errors live in `server.instructions.md`; React component flow, API access, and accessibility rules live in `web.instructions.md`. This keeps common context short while loading detailed rules only for matching paths.
- Did you observe a difference in the planner's output after adding the instructions? Yes. The third fresh run made the request schema strict, explicitly routed mutations through `TaskStore`, preserved the existing `ApiError` flow, rejected unrelated visual redesign, and finally produced `Open questions: None`. These changes are consistent with the new project and path-specific rules. I inspected the generated artifact rather than a VS Code References panel because this run used the CLI.

## Part 3 — The factory, with handoffs

- Feature implemented (ID):
- For each agent (implementer, tester, reviewer): one thing it did well, one thing it did badly.
- What did the Playwright MCP server let the tester do that it couldn't do before?
- Did the tester load the `e2e-testing` skill? How did you check?
- Human interventions: how many times did you have to step in, and why?

## Part 4 — The orchestrator, with subagents

- Feature(s) implemented (IDs):
- Handoffs (Part 3) vs. orchestrator (Part 4): which gave the better result? Which one would you
  trust on a real project, and under which conditions?
- Did the orchestrator ever loop, skip a step or "lie" about a result? What did you change?

## Part 5 — Hooks & guardrails

- Which hooks did you add, and which event triggers each?
- Show one case where a hook changed the agent's behaviour (paste the relevant output).

## Part 6 — Copilot CLI (bonus)

- What did you run and how did it compare to VS Code?

## Part 7 — Final demo

- Feature request received:
- Number of human interventions needed:
- Final `npm run verify` result:

---

## Reflection (to fill at the end, ~10 lines)

1. Which part of the factory produced the most value? Which one the least?
2. Where would you **not** trust this factory today?
3. One thing you will change in the way you use AI coding tools after today.

## AI credits log

Copilot Student uses _auto model selection_ and a monthly allowance of GitHub AI Credits.
Note your usage at the start and at the end of each part (see Part 0 for where to find it).

| Part | Credits used (approx.) | Most expensive step, and why |
| ---- | ---------------------- | ---------------------------- |
|      |                        |                              |
