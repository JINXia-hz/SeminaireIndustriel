#!/usr/bin/env node
/**
 * Practical checker — "Build your own agentic software factory".
 *
 * Usage:
 *   npm run check                 # all parts
 *   npm run check -- --part 1     # a single part (0-7)
 *   npm run check -- --ci         # markdown output, non-zero exit code if a core part fails
 *
 * The checker is deterministic and offline: it only reads files from the repository
 * (and runs your hook scripts with sample inputs). It does NOT judge the quality of your
 * prompts — your instructor does that.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const CI = args.includes('--ci');
const partArg = args.includes('--part') ? Number(args[args.indexOf('--part') + 1]) : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const p = (...segments) => join(ROOT, ...segments);
const rel = (abs) => relative(ROOT, abs) || '.';
const read = (file) => (existsSync(p(file)) ? readFileSync(p(file), 'utf8') : null);
const lines = (text) => text.split(/\r?\n/);
const nonEmptyLines = (text) => lines(text).filter((l) => l.trim() !== '');

function listFiles(dir, predicate = () => true) {
  const abs = p(dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .map((f) => join(abs, f))
    .filter((f) => statSync(f).isFile() && predicate(f));
}

function glob(pattern) {
  try {
    return globSync(pattern, { cwd: ROOT, exclude: (f) => f.includes('node_modules') });
  } catch {
    return [];
  }
}

/** Splits a Markdown file with YAML frontmatter. Returns { data, body, error }. */
function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) return { data: null, body: text, error: 'no YAML frontmatter (--- ... ---) at the top' };
  try {
    const data = parseYaml(match[1]) ?? {};
    if (typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, body: match[2], error: 'frontmatter is not a YAML mapping' };
    }
    return { data, body: match[2], error: null };
  } catch (e) {
    return { data: null, body: match[2], error: `invalid YAML: ${e.message.split('\n')[0]}` };
  }
}

/** Normalises the `tools` field (array or comma-separated string) to lowercase names. */
function toolList(data) {
  const raw = data?.tools;
  if (raw === undefined) return null; // undefined = all tools
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  return list.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
}

const TOOL_ALIASES = {
  execute: ['execute', 'shell', 'bash', 'powershell'],
  read: ['read', 'notebookread'],
  edit: ['edit', 'multiedit', 'write', 'notebookedit'],
  search: ['search', 'grep', 'glob'],
  agent: ['agent', 'custom-agent', 'task'],
  web: ['web', 'websearch', 'webfetch'],
  todo: ['todo', 'todowrite'],
};

function hasTool(tools, family) {
  if (tools === null || tools.includes('*')) return true;
  const aliases = TOOL_ALIASES[family] ?? [family];
  return tools.some((t) => aliases.includes(t) || aliases.some((a) => t.startsWith(`${a}/`)));
}

function headings(body) {
  return lines(body)
    .filter((l) => /^#{1,4}\s+/.test(l))
    .map((l) => l.replace(/^#{1,4}\s+/, '').trim().toLowerCase());
}

/** Required body sections for every agent (any of the synonyms is accepted). */
const AGENT_SECTIONS = [
  ['Role', /\b(role|mission|purpose|identity)\b/],
  ['Inputs', /\b(input|inputs|context you receive|what you receive)\b/],
  ['Process', /\b(process|steps|workflow|tasks|procedure|how you work)\b/],
  ['Output format', /\b(output|deliverable|report format|response format)\b/],
  ['Constraints', /\b(constraints|rules|boundaries|guardrails|do not|never)\b/],
];

const listAgents = () =>
  listFiles('.github/agents', (f) => f.endsWith('.agent.md')).map((f) => ({
    id: basename(f).replace(/\.agent\.md$/, ''),
    file: f,
    ...parseFrontmatter(readFileSync(f, 'utf8')),
  }));

// ---------------------------------------------------------------------------
// Check registry
// ---------------------------------------------------------------------------

/** @type {Array<{part:number, title:string, core:boolean, checks:Array<{name:string, run:() => (true|string)}>}>} */
const parts = [];
function part(num, title, core, define) {
  const checks = [];
  define((name, run) => checks.push({ name, run }));
  parts.push({ part: num, title, core, checks });
}

// Generic agent checks reused by several parts.
function agentChecks(check, id, { mustHave = [], mustNotHave = [], mentions = [] } = {}) {
  const file = `.github/agents/${id}.agent.md`;
  const load = () => {
    const text = read(file);
    if (text === null) return { missing: true };
    return parseFrontmatter(text);
  };

  check(`${file} exists with valid frontmatter`, () => {
    const a = load();
    if (a.missing) return `create ${file}`;
    if (a.error) return `${file}: ${a.error}`;
    return true;
  });

  check(`${id}: has a useful \`description\` (≥ 30 chars)`, () => {
    const a = load();
    if (a.missing || a.error) return 'fix the file first';
    const d = a.data.description;
    if (typeof d !== 'string' || d.trim().length < 30)
      return 'the description is what Copilot (and humans) use to decide when to use this agent — make it specific';
    return true;
  });

  check(`${id}: declares an explicit \`tools\` list (least privilege)`, () => {
    const a = load();
    if (a.missing || a.error) return 'fix the file first';
    const tools = toolList(a.data);
    if (tools === null) return 'no `tools` → the agent gets ALL tools. List only what it needs.';
    if (tools.includes('*')) return '`*` grants every tool. List only what the agent needs.';
    const missing = mustHave.filter((t) => !hasTool(tools, t));
    if (missing.length) return `missing tool(s): ${missing.join(', ')}`;
    const forbidden = mustNotHave.filter((t) => hasTool(tools, t));
    if (forbidden.length) return `this agent must NOT have: ${forbidden.join(', ')}`;
    return true;
  });

  check(`${id}: body has Role / Inputs / Process / Output format / Constraints sections`, () => {
    const a = load();
    if (a.missing || a.error) return 'fix the file first';
    const hs = headings(a.body);
    const missing = AGENT_SECTIONS.filter(([, re]) => !hs.some((h) => re.test(h))).map(([n]) => n);
    if (missing.length) return `add a Markdown heading for: ${missing.join(', ')}`;
    if (a.body.trim().length < 600) return 'the body is very short — be explicit about process and output';
    return true;
  });

  for (const m of mentions) {
    check(`${id}: body mentions \`${m}\``, () => {
      const a = load();
      if (a.missing || a.error) return 'fix the file first';
      return a.body.includes(m) || `the instructions should reference \`${m}\``;
    });
  }
}

function specChecks(check, featureId) {
  const find = () => glob(`docs/specs/${featureId}-*.md`)[0] ?? glob(`docs/specs/${featureId}.md`)[0];
  check(`spec for ${featureId} exists in docs/specs/`, () =>
    find() ? true : `run the planner on ${featureId}: expected docs/specs/${featureId}-<slug>.md`,
  );
  check(`spec ${featureId}: acceptance criteria use Given / When / Then (≥ 3 scenarios)`, () => {
    const f = find();
    if (!f) return 'no spec yet';
    const text = read(f);
    if (!/^##\s+acceptance criteria/im.test(text)) return 'missing "## Acceptance criteria" section';
    const scenarios = (text.match(/\bgiven\b/gi) ?? []).length;
    const whens = (text.match(/\bwhen\b/gi) ?? []).length;
    const thens = (text.match(/\bthen\b/gi) ?? []).length;
    if (Math.min(scenarios, whens, thens) < 3) return `found ${scenarios} Given / ${whens} When / ${thens} Then`;
    return true;
  });
  check(`spec ${featureId}: has Implementation plan (≥ 3 steps) and Test plan sections`, () => {
    const f = find();
    if (!f) return 'no spec yet';
    const text = read(f);
    const plan = /^##\s+implementation plan\s*$([\s\S]*?)(^##\s|$(?![\s\S]))/im.exec(text);
    if (!plan) return 'missing "## Implementation plan" section';
    const steps = lines(plan[1]).filter((l) => /^\s*(\d+\.|-|\*)\s+/.test(l)).length;
    if (steps < 3) return `implementation plan has ${steps} step(s)`;
    if (!/^##\s+test plan/im.test(text)) return 'missing "## Test plan" section';
    return true;
  });
}

function backlogChecked(check, ids) {
  check(`BACKLOG.md: ${ids.join(', ')} ticked`, () => {
    const text = read('BACKLOG.md') ?? '';
    const unticked = ids.filter((id) => !new RegExp(`^- \\[x\\] \\*\\*${id}\\b`, 'im').test(text));
    return unticked.length ? `not ticked yet: ${unticked.join(', ')}` : true;
  });
}

function reviewChecks(check, featureId) {
  check(`review report for ${featureId} in docs/reviews/ with a verdict`, () => {
    const f = glob(`docs/reviews/${featureId}-*.md`)[0];
    if (!f) return `expected docs/reviews/${featureId}-review.md produced by the reviewer`;
    const text = read(f);
    return /verdict\s*[:：]?\s*\**\s*(approved|changes[ _-]requested)/i.test(text) ||
      'the report must contain "Verdict: APPROVED" or "Verdict: CHANGES_REQUESTED"';
  });
}

// --- Journal ----------------------------------------------------------------

const JOURNAL_TEMPLATE_LINES = new Set(
  lines(read('checker/journal-template.md') ?? '').map((l) => l.trim()),
);

function journalSection(title) {
  const text = read('JOURNAL.md');
  if (!text) return null;
  const re = new RegExp(`^##\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'im');
  return re.exec(text)?.[1] ?? null;
}

function journalCheck(check, title) {
  check(`JOURNAL.md: section "${title}" filled in`, () => {
    const section = journalSection(title);
    if (section === null) return `section "## ${title}" not found in JOURNAL.md`;
    const added = nonEmptyLines(section).filter((l) => {
      const t = l.trim();
      if (JOURNAL_TEMPLATE_LINES.has(t)) return false;
      // A template bullet "- Question:" followed by an answer counts as filled.
      return !/^[-*]\s+[^:]*:\s*$/.test(t);
    });
    return added.length >= 2 || 'write at least a few lines (answers, observations, failures)';
  });
}

// --- Hooks ------------------------------------------------------------------

function loadHookConfigs() {
  return listFiles('.github/hooks', (f) => f.endsWith('.json')).map((f) => {
    try {
      return { file: f, json: JSON.parse(readFileSync(f, 'utf8')) };
    } catch (e) {
      return { file: f, error: e.message };
    }
  });
}

function hookEntries(event) {
  return loadHookConfigs()
    .filter((c) => !c.error)
    .flatMap((c) => (c.json?.hooks?.[event] ?? []).map((h) => ({ ...h, file: c.file })));
}

function runHook(entry, payload) {
  const cmd = entry.command ?? (process.platform === 'win32' ? entry.powershell : entry.bash);
  if (!cmd) return { error: 'hook entry has no `command` / `bash` field' };
  const res = spawnSync(cmd, {
    cwd: entry.cwd ? p(entry.cwd) : ROOT,
    input: JSON.stringify(payload),
    shell: true,
    encoding: 'utf8',
    timeout: 15_000,
    env: { ...process.env, ...(entry.env ?? {}) },
  });
  const stdout = (res.stdout ?? '')
    .split(/\r?\n/)
    .filter((l) => !/^\s*\{.*"type"\s*:\s*"progress".*\}\s*$/.test(l))
    .join('\n')
    .trim();
  let output = null;
  try {
    output = stdout ? JSON.parse(stdout) : {};
  } catch {
    output = undefined;
  }
  return { status: res.status, stdout, output, stderr: res.stderr };
}

function decisionFor(command, { stringArgs = false } = {}) {
  const entries = hookEntries('preToolUse').filter((h) => {
    if (!h.matcher) return true;
    try {
      return new RegExp(`^(?:${h.matcher})$`).test('bash');
    } catch {
      return false;
    }
  });
  if (!entries.length) return { none: true };
  const toolArgs = stringArgs ? JSON.stringify({ command }) : { command };
  const payload = { sessionId: 'checker', timestamp: Date.now(), cwd: ROOT, toolName: 'bash', toolArgs };
  for (const e of entries) {
    const r = runHook(e, payload);
    if (r.error) return { error: r.error };
    if (r.status !== 0) return { decision: 'deny', via: 'exit code' };
    if (r.output?.permissionDecision === 'deny') return { decision: 'deny', via: 'json' };
  }
  return { decision: 'not-denied' };
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

part(0, 'Setup', true, (check) => {
  check('Node.js ≥ 22', () => Number(process.versions.node.split('.')[0]) >= 22 || `found ${process.version}`);
  check('dependencies installed (node_modules)', () => existsSync(p('node_modules')) || 'run `npm ci`');
  check('JOURNAL.md: pair names and repository filled in', () => {
    const text = read('JOURNAL.md') ?? '';
    const pair = /\*\*Pair:\*\*\s*(.+)/.exec(text)?.[1] ?? '';
    const repo = /\*\*Repository:\*\*\s*(.+)/.exec(text)?.[1] ?? '';
    if (!pair.replace(/<!--.*?-->/g, '').trim()) return 'fill in **Pair:**';
    if (!/github\.com\//.test(repo)) return 'fill in **Repository:** with your GitHub URL';
    return true;
  });
  journalCheck(check, 'Part 0');
});

part(1, 'First agent: the Planner', true, (check) => {
  agentChecks(check, 'planner', {
    mustHave: ['read', 'search', 'edit'],
    mustNotHave: ['execute'],
    mentions: ['docs/specs/', 'BACKLOG.md'],
  });
  specChecks(check, 'F1');
  journalCheck(check, 'Part 1');
});

part(2, 'Context engineering', true, (check) => {
  check('AGENTS.md exists at the repository root (≥ 20 non-empty lines)', () => {
    const text = read('AGENTS.md');
    if (!text) return 'create AGENTS.md';
    const n = nonEmptyLines(text).length;
    return n >= 20 || `only ${n} non-empty lines`;
  });
  check('AGENTS.md documents the commands and the definition of done', () => {
    const text = read('AGENTS.md') ?? '';
    const missing = ['npm run verify', 'npm test', 'npm run test:e2e'].filter((c) => !text.includes(c));
    if (missing.length) return `mention: ${missing.join(', ')}`;
    return /definition of done/i.test(text) || 'add a "Definition of done" section';
  });
  check('≥ 2 path-specific .github/instructions/*.instructions.md with a matching `applyTo`', () => {
    const files = listFiles('.github/instructions', (f) => f.endsWith('.instructions.md'));
    if (files.length < 2) return `found ${files.length} file(s)`;
    for (const f of files) {
      const { data, error } = parseFrontmatter(readFileSync(f, 'utf8'));
      if (error) return `${rel(f)}: ${error}`;
      if (!data.applyTo) return `${rel(f)}: missing \`applyTo\``;
      if (String(data.applyTo).trim() === '**') return `${rel(f)}: \`applyTo: **\` is not path-specific`;
      const patterns = String(data.applyTo).split(',').map((s) => s.trim());
      if (!patterns.some((pat) => glob(pat).length > 0)) return `${rel(f)}: applyTo matches no file`;
    }
    return true;
  });
  journalCheck(check, 'Part 2');
});

part(3, 'The factory, human in the loop', true, (check) => {
  agentChecks(check, 'implementer', {
    mustHave: ['read', 'search', 'edit', 'execute'],
    mentions: ['docs/specs/', 'npm run verify'],
  });
  agentChecks(check, 'tester', {
    mustHave: ['read', 'search', 'edit', 'execute', 'playwright'],
    mentions: ['docs/specs/'],
  });
  check('tester: can use the Playwright MCP tools (`playwright/*` or `playwright/<tool>`)', () => {
    const text = read('.github/agents/tester.agent.md');
    if (!text) return 'no tester yet';
    const tools = toolList(parseFrontmatter(text).data) ?? [];
    return tools.some((t) => t.startsWith('playwright/')) || 'add `playwright/*` to the tester tools';
  });
  check('tester: uses the e2e-testing skill (`skills:` or explicit reference)', () => {
    const text = read('.github/agents/tester.agent.md');
    if (!text) return 'no tester yet';
    const { data, body } = parseFrontmatter(text);
    const skills = Array.isArray(data?.skills) ? data.skills : [];
    return skills.includes('e2e-testing') || body.includes('e2e-testing') || 'reference the e2e-testing skill';
  });
  agentChecks(check, 'reviewer', {
    mustHave: ['read', 'search'],
    mentions: ['docs/reviews/'],
  });

  check('.mcp.json declares the Playwright MCP server (`mcpServers.playwright`)', () => {
    const text = read('.mcp.json');
    if (!text) return 'create .mcp.json at the repository root';
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return `.mcp.json is not valid JSON: ${e.message}`;
    }
    const server = json?.mcpServers?.playwright;
    if (!server) return 'expected a server named "playwright" under "mcpServers"';
    const cmdline = [server.command, ...(server.args ?? [])].join(' ');
    return /@playwright\/mcp/.test(cmdline) || 'the playwright server should run @playwright/mcp';
  });

  const SKILL = '.github/skills/e2e-testing/SKILL.md';
  check(`${SKILL} exists with valid frontmatter`, () => {
    const text = read(SKILL);
    if (!text) return `create ${SKILL}`;
    const { data, error } = parseFrontmatter(text);
    if (error) return error;
    if (data.name !== 'e2e-testing') return '`name` must be exactly the folder name: e2e-testing';
    if (typeof data.description !== 'string' || data.description.length < 40)
      return '`description` must say what the skill does AND when to use it';
    if (data.description.length > 1024) return '`description` is limited to 1024 characters';
    return true;
  });
  check('e2e-testing skill: documents the project conventions', () => {
    const text = read(SKILL);
    if (!text) return 'no skill yet';
    const missing = ['e2e/fixtures.ts', 'boardState', 'getByRole', 'npm run test:e2e'].filter(
      (k) => !text.includes(k),
    );
    return missing.length ? `the skill should mention: ${missing.join(', ')}` : true;
  });
  check('e2e-testing skill: bundles at least one resource file, linked from SKILL.md', () => {
    const dir = p('.github/skills/e2e-testing');
    if (!existsSync(dir)) return 'no skill yet';
    const extra = readdirSync(dir, { recursive: true })
      .map(String)
      .filter((f) => f !== 'SKILL.md' && statSync(join(dir, f)).isFile());
    if (!extra.length) return 'add e.g. a template spec file next to SKILL.md';
    const text = read(SKILL);
    return extra.some((f) => text.includes(f.replaceAll('\\', '/'))) || 'link the resource file from SKILL.md';
  });

  check('F1 has at least one new e2e spec file (besides board.spec.ts)', () => {
    const specs = glob('e2e/**/*.spec.ts').filter((f) => !f.endsWith('board.spec.ts'));
    return specs.length > 0 || 'the tester should add e2e/<feature>.spec.ts';
  });
  check('test report for F1 in docs/reports/', () =>
    glob('docs/reports/F1-*.md').length > 0 || 'expected docs/reports/F1-test-report.md produced by the tester',
  );
  reviewChecks(check, 'F1');
  backlogChecked(check, ['F1']);
  journalCheck(check, 'Part 3');
});

part(4, 'The orchestrator (subagents)', true, (check) => {
  agentChecks(check, 'factory', {
    mustHave: ['agent', 'read'],
    mustNotHave: ['edit', 'execute'],
  });
  check('factory: references every worker agent, and each one exists', () => {
    const text = read('.github/agents/factory.agent.md');
    if (!text) return 'no factory yet';
    const { body } = parseFrontmatter(text);
    const ids = new Set(listAgents().map((a) => a.id));
    const workers = ['planner', 'implementer', 'tester', 'reviewer'];
    const notMentioned = workers.filter((w) => !body.toLowerCase().includes(w));
    if (notMentioned.length) return `the orchestrator never mentions: ${notMentioned.join(', ')}`;
    const missing = workers.filter((w) => !ids.has(w));
    return missing.length ? `agent file(s) missing: ${missing.join(', ')}` : true;
  });
  check('factory: defines a bounded fix loop (max number of iterations)', () => {
    const text = read('.github/agents/factory.agent.md') ?? '';
    return /\b(max(imum)?|at most|no more than|up to)\b[^.\n]{0,40}\b(\d+|two|three)\b/i.test(text) ||
      'state explicitly how many review/fix iterations are allowed before stopping';
  });
  check('worker agents tell the subagent to read AGENTS.md (subagents may not inherit instructions)', () => {
    const missing = ['planner', 'implementer', 'tester', 'reviewer'].filter(
      (w) => !(read(`.github/agents/${w}.agent.md`) ?? '').includes('AGENTS.md'),
    );
    return missing.length ? `add "Read AGENTS.md first" to: ${missing.join(', ')}` : true;
  });
  for (const id of ['F2', 'F3']) {
    specChecks(check, id);
    reviewChecks(check, id);
  }
  backlogChecked(check, ['F2', 'F3']);
  journalCheck(check, 'Part 4');
});

part(5, 'Hooks & guardrails', true, (check) => {
  check('.github/hooks/*.json: valid, version 1', () => {
    const configs = loadHookConfigs();
    if (!configs.length) return 'create .github/hooks/guardrails.json';
    for (const c of configs) {
      if (c.error) return `${rel(c.file)}: ${c.error}`;
      if (c.json.version !== 1) return `${rel(c.file)}: "version" must be 1`;
      if (typeof c.json.hooks !== 'object') return `${rel(c.file)}: missing "hooks" object`;
    }
    return true;
  });
  check('a preToolUse hook and a postToolUse hook are configured', () => {
    const missing = ['preToolUse', 'postToolUse'].filter((e) => hookEntries(e).length === 0);
    return missing.length ? `missing: ${missing.join(', ')}` : true;
  });
  check('every hook script referenced exists', () => {
    if (!loadHookConfigs().length) return 'no hook configuration yet';
    for (const c of loadHookConfigs().filter((x) => !x.error)) {
      for (const entries of Object.values(c.json.hooks ?? {})) {
        for (const e of entries) {
          const cmd = e.command ?? e.bash ?? '';
          const script = /(\S+\.(?:mjs|cjs|js|sh|ts))\b/.exec(cmd)?.[1];
          if (script && !existsSync(p(e.cwd ?? '', script))) return `${rel(c.file)}: ${script} not found`;
        }
      }
    }
    return true;
  });
  const dangerous = ['rm -rf /', 'rm -rf node_modules ~', 'git push --force origin main', 'git push -f'];
  check(`preToolUse denies dangerous commands (${dangerous.join(' | ')})`, () => {
    for (const cmd of dangerous) {
      for (const stringArgs of [false, true]) {
        const r = decisionFor(cmd, { stringArgs });
        if (r.none) return 'no preToolUse hook matching the `bash` tool';
        if (r.error) return r.error;
        if (r.decision !== 'deny')
          return `"${cmd}" was not denied (toolArgs as ${stringArgs ? 'JSON string' : 'object'})`;
      }
    }
    return true;
  });
  const safe = ['npm test', 'git status', 'ls -la', 'npx playwright test'];
  check(`preToolUse lets safe commands through (${safe.join(' | ')})`, () => {
    for (const cmd of safe) {
      const r = decisionFor(cmd);
      if (r.none) return 'no preToolUse hook matching the `bash` tool';
      if (r.error) return r.error;
      if (r.decision === 'deny')
        return r.via === 'exit code'
          ? `"${cmd}" was denied because the hook exited with a non-zero code (a crashing hook denies everything) — run it by hand to see the error`
          : `"${cmd}" was denied — your rule is too broad`;
    }
    return true;
  });
  journalCheck(check, 'Part 5');
});

part(6, 'Copilot CLI', false, (check) => {
  journalCheck(check, 'Part 6');
});

part(7, 'Final demo', true, (check) => {
  journalCheck(check, 'Part 7');
  journalCheck(check, 'Reflection');
});

// ---------------------------------------------------------------------------
// Run & report
// ---------------------------------------------------------------------------

const selected = partArg === null ? parts : parts.filter((x) => x.part === partArg);
if (!selected.length) {
  console.error(`Unknown part: ${partArg}`);
  process.exit(2);
}

const results = selected.map((pt) => ({
  ...pt,
  results: pt.checks.map((c) => {
    let outcome;
    try {
      outcome = c.run();
    } catch (e) {
      outcome = `checker error: ${e.message}`;
    }
    return { name: c.name, ok: outcome === true, hint: outcome === true ? '' : outcome };
  }),
}));

const color = (code, s) => (CI || !process.stdout.isTTY ? s : `\x1b[${code}m${s}\x1b[0m`);
let coreFailures = 0;

if (CI) console.log('## Practical checker\n');
for (const pt of results) {
  const passed = pt.results.filter((r) => r.ok).length;
  const ok = passed === pt.results.length;
  if (!ok && pt.core) coreFailures++;
  const label = `Part ${pt.part} — ${pt.title}${pt.core ? '' : ' (bonus)'}: ${passed}/${pt.results.length}`;
  if (CI) {
    console.log(`<details${ok ? '' : ' open'}><summary>${ok ? '✅' : '❌'} ${label}</summary>\n`);
    for (const r of pt.results) console.log(`- ${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ` — _${r.hint}_`}`);
    console.log('\n</details>\n');
  } else {
    console.log(`\n${ok ? color(32, '✔') : color(31, '✘')} ${color(1, label)}`);
    for (const r of pt.results) {
      console.log(`   ${r.ok ? color(32, '✔') : color(31, '✘')} ${r.name}`);
      if (!r.ok) console.log(`     ${color(33, '→ ' + r.hint)}`);
    }
  }
}

const summary =
  partArg === null
    ? coreFailures === 0
      ? 'All core parts complete — PASS 🎉'
      : `${coreFailures} core part(s) not complete yet.`
    : '';
if (summary) console.log(CI ? `\n**${summary}**` : `\n${summary}`);
process.exit(CI && coreFailures > 0 ? 1 : 0);
