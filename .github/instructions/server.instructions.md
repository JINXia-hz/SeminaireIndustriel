---
name: Server conventions
description: Conventions for the Express API, domain validation, task store, and API tests
applyTo: 'server/**/*.ts'
---

- Validate every route's request input with a Zod schema from `server/src/domain.ts`.
- Reuse `TASK_STATUSES` and existing domain types instead of duplicating status unions.
- Return HTTP 400 with `ValidationError` for Zod validation failures and HTTP 404 with `NotFound` for missing resources.
- Use HTTP 409 with a clear error for business-rule conflicts, such as a WIP limit violation.
- Enforce business rules in the API or store so non-browser clients cannot bypass them.
- Add feature routes before the generic `/api` not-found middleware in `server/src/app.ts`.
- Keep store mutations in `TaskStore` methods and preserve fields that an operation does not intend to change.
- Add focused Supertest coverage in `server/test/` for success, validation, not-found, and relevant business-rule cases.
- Use a fresh `TaskStore` in tests and never enable or depend on test reset routes outside the E2E environment.
- Preserve the existing error response shapes unless the active specification explicitly changes them.
