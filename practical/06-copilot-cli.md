# Part 6 (bonus): The same factory from the terminal (15 min)

**Goal:** see that everything you built is **portable**. Copilot CLI uses the same harness as VS Code, and therefore the same agents, skills, instructions, MCP config and hooks, with **no change**.

- 📖 [Install Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)
- 📖 [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- 📖 [Custom agents in Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli)

## 6.1 Install and explore (5 min)

```bash
npm install -g @github/copilot      # or: brew install --cask copilot-cli / winget install GitHub.Copilot
cd <your-repo>
copilot                             # trust the folder when asked, then /login if needed
```

In the interactive session, check that the CLI found your work:

| Command        | What you should see                                                                          |
| -------------- | -------------------------------------------------------------------------------------------- |
| `/agent`       | `planner`, `implementer`, `tester`, `reviewer`, `factory`                                    |
| `/skills list` | `e2e-testing`                                                                                |
| `/mcp`         | `playwright`, loaded from `.mcp.json` (project servers load only once the folder is trusted) |
| `/hooks`       | your guardrails                                                                              |

Try your guard: ask it to `run rm -rf dist`.

## 6.2 Agents as scriptable building blocks (10 min)

The CLI can run **non-interactively**, which turns your agents into steps you can script, e.g. in a Makefile or a CI job:

```bash
copilot --agent planner -p "Plan F4" --allow-tool='write'
```

- What did it do without a human to approve tool calls? Which permissions did you need to grant, and which would you **never** grant in a script? Look up `--allow-tool`, `--deny-tool` and the permission patterns (`shell(npm:*)`, `write(path)`, …) in the reference.
- Other commands worth knowing: `/plan`, `/review`, `/fleet` (parallel subagents), and `/delegate`, which hands the task to the **Copilot cloud agent**. That agent works on GitHub in its own environment and opens a PR. It's included in Copilot Student, but a full run uses a fair number of credits, so try it only if you have plenty left.

## ✅ Checkpoint 6

- [ ] Your five agents, the skill, the MCP server and the hooks all work in the CLI.
- [ ] `JOURNAL.md`: _Part 6_. How does it compare with VS Code? When would you use each?

➡️ [Part 7: Final demo](07-final-demo.md)
