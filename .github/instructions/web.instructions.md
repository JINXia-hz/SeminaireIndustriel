---
name: Web conventions
description: Conventions for React components, API access, accessibility, and browser behavior
applyTo: 'web/**/*.ts, web/**/*.tsx'
---

- Keep API calls and response-error handling in `web/src/api.ts`; components should use the exported `api` object.
- Import shared task types through `web/src/api.ts` and use `import type` for type-only imports.
- Follow the existing function-component and React Hooks patterns; do not add a state-management library for a local feature.
- Prefer native semantic controls and ensure every interaction is keyboard-operable.
- Give controls stable, task-specific accessible names and use the roles and labels stated in the active specification.
- Expose user-facing failures with `role="alert"` and preserve a consistent board state when a request fails.
- Prevent duplicate submissions while a task operation is pending when the specification requires it.
- Pass callbacks through the existing `App`, `Board`, `Column`, and `TaskCard` component flow instead of bypassing it.
- Do not use `dangerouslySetInnerHTML` for task content or API messages.
- Match existing CSS class naming and avoid unrelated visual redesigns.
