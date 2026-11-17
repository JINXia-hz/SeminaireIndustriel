# Part 0: Setup (15 min)

**Goal:** get a working repository, a running app, and VS Code configured with the **Copilot agent harness**.

## 0.1 Create your repository

1. On the template repository page, click **Use this template → Create a new repository**. One repository per pair, under one of your accounts. Make it **public**, or private with your instructor added.
2. Add your partner as a collaborator.
3. Clone it and install:

   ```bash
   git clone https://github.com/<you>/<repo>.git && cd <repo>
   npm ci
   npx playwright install chromium
   npm run verify      # must be green before you start
   npm run dev         # open http://localhost:5173
   ```

4. Spend **3 minutes** reading the code: `server/src/app.ts`, `web/src/App.tsx`, `e2e/fixtures.ts`, `e2e/board.spec.ts`. You'll need this knowledge to judge what your agents produce.

## 0.2 VS Code and Copilot

You need an up-to-date VS Code with the **GitHub Copilot Chat** extension, signed in with the GitHub account that has **Copilot Student** enabled ([student setup](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students)).

### Select the Copilot harness

VS Code can run agents on several **harnesses**, the runtimes that execute the agent loop. Today you use the **Copilot** harness. It's the default, and it's shared with Copilot CLI, the GitHub Copilot app and the cloud agent, so everything you build today also works in the terminal (Part 6) and on GitHub.

- Open the Chat view and check that the **Session Target** control is set to **Copilot**.
- 📖 [Agent harnesses](https://code.visualstudio.com/docs/agents/run/agent-harnesses)

> ⚠️ You may find tutorials that use **handoffs**, **prompt files** (`.prompt.md`), `.vscode/mcp.json` or the `#runSubagent` tool. These belong to the older **Local** harness, which is deprecated and will be removed in February 2027. We don't use them today.

### Find the customisation UI

Open **Chat → Open Customizations** (title bar of the Chat view). That page lists the agents, skills, instructions, MCP servers and hooks that Copilot sees for this workspace. **It's your best debugging tool today**: if your file doesn't appear there, Copilot isn't using it.

### Permissions

The agent will ask before running terminal commands and calling MCP tools. **Keep the default (manual approval)** for now: reading what the agent wants to run is part of the exercise. 📖 [Approvals and permission levels](https://code.visualstudio.com/docs/agents/run/approvals)

## AI credits

Copilot Student uses **auto model selection only** (you can't pick a model) and comes with a **monthly allowance of GitHub AI Credits**. Every agent run uses credits, and more for long contexts and many tool calls. 📖 [Billing for individuals](https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing)

Some habits for using fewer credits. These are also good engineering practice:

- **Start a new chat session for each task.** A long conversation re-sends its whole history on every turn.
- **Give agents small, well-scoped tasks.** "Plan F1", not "build the whole backlog".
- **Stop a run that is going in circles** (the ⏹ button) and fix the agent's instructions instead of insisting.
- **Don't paste huge files or logs.** Let the agent read what it needs.

Note your remaining credits now in `JOURNAL.md`, using the usage dashboard linked from the billing doc above.

## ✅ Checkpoint 0

- [ ] `npm run verify` is green locally.
- [ ] The app runs on http://localhost:5173 and you can add a task.
- [ ] The Chat view's Session Target is **Copilot**, and you've found **Open Customizations**.
- [ ] `JOURNAL.md`: **Pair**, **Repository** and the _Part 0_ section are filled in.
- [ ] `npm run check -- --part 0` is green. Commit and push, and check that both CI jobs ran (the practical job will stay red until the end; that's expected).

➡️ [Part 1: Your first agent](01-first-agent.md)
