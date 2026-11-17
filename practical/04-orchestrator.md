# Part 4: The orchestrator (45 min)

**Goal:** replace **you** as the person passing work between agents. A `factory` agent delegates each stage to your agents running as **subagents**, reads their outputs, and decides what happens next.

## 4.1 Subagents (5 min)

A **subagent** is an agent doing delegated work in its **own, separate context window**. The main agent passes it a task, the subagent works on its own, and only its **final result** comes back. That's how a long pipeline stays manageable: the orchestrator's context only holds summaries, never the 200 tool calls of the implementer.

- 📖 [Subagents in VS Code](https://code.visualstudio.com/docs/agents/run/subagents). Read the **Copilot** tab.
- 📖 [Custom agents and subagents (GitHub)](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-custom-agents#custom-agents-and-subagents)

What to know in the Copilot harness:

- An agent can delegate if it has the **`agent`** tool alias. The underlying runtime tool is called `task`.
- You ask for delegation **in natural language**, e.g. "Use the `implementer` agent to…", and that's how your orchestrator's prompt will do it. Subagents can also be picked automatically from their `description`, which is one more reason to write precise descriptions.
- A subagent **does not see the main conversation**. The task you give it must be **self-contained**: feature ID, file paths, and what to return.
- ⚠️ A subagent **may not receive the repository instructions** (`AGENTS.md` etc.) that a session agent gets. Make each worker robust by starting its process with an explicit "Read `AGENTS.md` first."
- Frontmatter controls: `user-invocable: false` hides an agent from the picker (it remains usable as a subagent), and `disable-model-invocation: true` prevents it from being used as a subagent.

> ℹ️ You may see `agents: [...]` (an allow-list of workers) and `handoffs:` in examples online. Both exist **only in the deprecated Local harness**. In the Copilot harness, the orchestrator's prompt is what limits which agents it calls, which is one reason to keep it precise.

## 4.2 Write the orchestrator (15 min)

Create `.github/agents/factory.agent.md`.

**Tools: `agent`, `read`, `search`, `todo`. No `edit`, no `execute`.** An orchestrator that can't write code or run commands **has to** delegate. Least privilege isn't only about security; it also shapes behaviour.

Design the **Process** carefully. It's a small state machine. Some ideas:

1. Read the backlog item. Check with the user that `npm run dev` is running, because the tester needs it.
2. **Plan:** delegate to `planner`, then read the produced spec. If it has _Open questions_, **stop and ask the human**. Do you also want a human approval of the spec before coding? Decide, and justify your choice in the journal.
3. **Implement:** delegate to `implementer` with the spec path.
4. **Test:** delegate to `tester`, then read `docs/reports/<ID>-test-report.md`.
5. **Review:** delegate to `reviewer`, then read the `Verdict:` line of `docs/reviews/<ID>-review.md`.
6. **Fix loop:** if the verdict is `CHANGES_REQUESTED`, or tests fail, delegate to `implementer` with the review, then test and review again. **At most 2 fix iterations**; after that, stop and escalate to the human with a summary.
7. **Report.**

**Output format:** a final summary containing a table with one row per stage and the columns _Agent_, _Result_, _Artifact path_, plus the number of fix iterations, the final verdict, and what the human should check before merging.

**Constraints:** some ideas.

- Never write code or tests yourself.
- Never skip a stage.
- **Never report success without reading the artifact files.** Subagents can be over-optimistic, so check the actual verdict line and test results.
- Give every subagent a self-contained task.
- Only use the four factory agents.

## 4.3 Run it (20 min)

1. Make sure every worker's **Process** starts with reading `AGENTS.md` (§ 4.1).
2. Create a branch, then in a **new session** select `factory` and type: `Deliver F2.`
3. Watch it run. Open the subagent chats: in the **Agents** window, subagents appear as read-only chats inside the session (📖 [Agents window](https://code.visualstudio.com/docs/agents/run/agents-window)). Note the hand-off prompts the orchestrator wrote. Are they self-contained?
4. Open a PR, check the CI, and merge.
5. Repeat with **F3, the WIP limit.** It's a real business rule, and it must be enforced server-side with a clear UI message. It's a good test of whether your planner, tester and reviewer catch a UI-only implementation.

If the orchestrator misbehaves (skips the reviewer, loops, invents a verdict, does the work itself), **stop it and fix its prompt**, not the code.

## 4.4 Reflect (5 min)

In the journal, compare Part 3 (you in the loop) with Part 4 (orchestrator):

- Number of human interventions, quality of the result, and the AI credits each used.
- Where should a human stay in the loop, and why? Think about the spec approval, the merge, and anything touching security.

## ✅ Checkpoint 4

- [ ] `factory.agent.md`: tools without `edit` / `execute`, all four workers referenced, and a **bounded** fix loop.
- [ ] Every worker reads `AGENTS.md` first.
- [ ] F2 and F3 are delivered (specs, reviews, PRs merged, CI green) and ticked in `BACKLOG.md`.
- [ ] `JOURNAL.md`: _Part 4_ is filled in.
- [ ] `npm run check -- --part 4` is green.

<details>
<summary>⚡ Stretch goals</summary>

- **Parallel subagents:** split the review into a `security-reviewer` and an `a11y-reviewer` that run **in parallel**, and have the orchestrator merge their findings. Is the review better? Is it more expensive?
- Hide the workers from the picker with `user-invocable: false`. What do you lose in debuggability?
- Try the factory with the **Autopilot** permission level on a disposable branch. What would you need before trusting it on `main`? 📖 [Approvals](https://code.visualstudio.com/docs/agents/run/approvals)

</details>

➡️ [Part 5: Hooks and guardrails](05-hooks-guardrails.md)
