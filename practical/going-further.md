# Going further

What you built today is a small, local version of how teams are starting to industrialise agentic coding. Here are the directions worth exploring next.

## Spec-driven development at scale: GitHub Spec Kit

Your planner → spec → implementation flow is the core idea of **spec-driven development**: the spec, kept in the repo, is the source of truth, and code is derived from it. [Spec Kit](https://github.com/github/spec-kit) packages this as a toolkit, with a project _constitution_ and specify → plan → tasks → implement skills, and it works with Copilot and other agents.

```bash
uv tool install specify-cli
specify init my-project --integration copilot
```

## Cloud and background agents

- **Copilot cloud agent:** assign a GitHub **issue** to Copilot (or `/delegate` from the CLI). It works in its own GitHub Actions-based environment, follows your `AGENTS.md`, agents, skills and `.github/hooks`, and opens a **PR** for you to review. Your factory's agents can run there too. 📖 [About the cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
- **Agents window and parallel sessions:** run several agent sessions at once in VS Code, isolated in **git worktrees** or Dev Containers, and follow them from one place. 📖 [Agents window](https://code.visualstudio.com/docs/agents/run/agents-window)
- **Other harnesses:** VS Code can also run **Claude** and **Codex** harnesses on the same project. Skills (agentskills.io), `AGENTS.md` and MCP are shared standards, which is why it pays to invest in them. 📖 [Agent harnesses](https://code.visualstudio.com/docs/agents/run/agent-harnesses)

## Safety and governance

- **Terminal sandboxing** (`chat.agent.sandbox.enabled`) restricts what agent commands can touch on disk. 📖 [Agent sandboxing](https://code.visualstudio.com/docs/agents/run/agent-sandboxing)
- **Permission levels and Autopilot:** _Manual_, _Assisted_ (an LLM judges each call) or _Allow all_. Know when each is acceptable. 📖 [Approvals](https://code.visualstudio.com/docs/agents/run/approvals)
- **Checkpoints:** roll back an agent's edits to an earlier point in the session. 📖 [Review code edits](https://code.visualstudio.com/docs/agents/run/review-code-edits)
- **Organisation-level** agents, instructions and policy hooks let a company share its factory across all its repositories.

## Sharing your factory

- **Agent plugins** bundle agents, skills, hooks and MCP servers into one installable unit. 📖 [Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- Community collections of agents, skills and instructions are good for inspiration, but read them before you use them: [github/awesome-copilot](https://github.com/github/awesome-copilot).

## Things to keep thinking about

- **Evaluation:** how would you measure that a change to `implementer.agent.md` made the factory _better_? Today you compared by eye. Real teams build eval suites with fixed tasks, automated checks and repeated runs.
- **Cost:** your AI credits log is a first cost model. What would this factory cost per feature for a team of 20?
- **Accountability:** the factory wrote the code, but **you** merged it.
