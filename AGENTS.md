# Kanban Factory

## Project overview

Kanban Factory is a small full-stack Kanban application used to practise building an agentic software factory.
Keep product changes driven by explicit specifications, focused agents, tests, and reviews rather than ad hoc edits.

## Stack and layout

- `server/`: Express 5 API, Zod validation, and an in-memory `TaskStore`.
- `web/`: React 19 and Vite frontend; components live in `web/src/components/`.
- `e2e/`: Playwright end-to-end tests with project fixtures and dedicated ports 5174 and 3101.
- `docs/specs/`: feature specifications and implementation plans.
- `docs/reports/`: tester-produced acceptance and test results.
- `docs/reviews/`: reviewer-produced findings and verdicts.
- `checker/`: practical-specific structural checks; do not modify it.
- `.github/agents/`, `.github/instructions/`, `.github/skills/`, and `.github/hooks/`: factory configuration.

## Commands

- `npm run dev`: run the API on port 3001 and the web app on port 5173 in watch mode.
- `npm test`: run Vitest unit and Supertest API tests.
- `npm run test:e2e`: run Playwright tests with their own servers and ports.
- `npm run verify`: run typecheck, lint, unit/API tests, and end-to-end tests.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run lint`: run ESLint.
- `npm run format`: format source files with Prettier.
- `npm run check`: run the practical checker; do not treat it as a substitute for quality review.

## Architecture and conventions

- Enforce business rules in the API and domain layer, not only in the UI.
- Define request validation with Zod schemas in `server/src/domain.ts`; reuse `TASK_STATUSES` for task statuses.
- Share domain types through the existing exports in `web/src/api.ts` and use `import type` for type-only imports.
- Keep TypeScript strict: do not use `any`, suppress checks, or leave unused variables.
- Use the existing `TaskStore` abstraction rather than accessing its private state from routes.
- Keep test reset routes disabled outside the E2E environment and isolate tests from real application state.
- Build accessible UI with semantic elements, useful roles and labels, keyboard operation, and `role="alert"` for errors.
- Keep changes scoped to the active specification, follow existing naming and component patterns, and prefer small commits.
- Do not add dependencies or change unrelated code without explaining why the feature requires it.

## Factory conventions

- Name specs `docs/specs/<ID>-<kebab-slug>.md` and keep their acceptance criteria observable and testable.
- Name test reports `docs/reports/<ID>-test-report.md` and trace every acceptance criterion to a test or an explicit gap.
- Name reviews `docs/reviews/<ID>-review.md`; begin them with `Verdict: APPROVED` or `Verdict: CHANGES_REQUESTED`.
- Each worker must read this file at the start of a task because subagents may not inherit repository instructions.
- Do not tick a backlog item until its feature is merged and `npm run verify` is green.
- Record actual agent behavior, failures, interventions, and credit usage in `JOURNAL.md`; never invent results.

## Definition of done

- Every acceptance criterion is implemented and covered by an appropriate unit, API, or end-to-end test.
- `npm run verify` is green on the delivered changes.
- The reviewer has inspected the actual spec, code, tests, and test report and recorded a verdict.
- No unrelated changes, disabled regressions, leftover debug code, or unreported dependency changes remain.
- Update the specification if the intended behavior changes during implementation.
