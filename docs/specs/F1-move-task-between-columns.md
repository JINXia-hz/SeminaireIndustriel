# F1 - Move a task between columns

## Summary

Allow a user to move an existing task between To do (`todo`), Doing (`doing`), and Done (`done`). Movement is available through an accessible native control on every task card and must also work when called directly through the API.

## Acceptance criteria

### AC1 - Move a task to another column

- **Given** a task exists in the To do column
- **When** the user selects Doing in that task's move control
- **Then** the API receives `PATCH /api/tasks/:id` with `{ "status": "doing" }`, responds with HTTP 200, and the task appears in Doing

### AC2 - Move in any direction

- **Given** tasks exist in To do, Doing, and Done
- **When** the user moves a task to any of the two other statuses
- **Then** only that task's status changes and its card is removed from the source column and rendered in the destination column

### AC3 - Keyboard-only movement

- **Given** a task card has a move control
- **When** a keyboard user Tabs to `Move <task title>` and uses the native select interaction to choose another status
- **Then** the task moves without drag-and-drop or pointer input

### AC4 - Reject invalid move payloads

- **Given** a task exists
- **When** `PATCH /api/tasks/:id` receives a missing, unknown, extra-keyed, or non-string `status`
- **Then** the API responds with HTTP 400 and `{"error":"ValidationError","details":[...]}` and the task remains unchanged

### AC5 - Report a missing task

- **Given** no task exists for the requested ID
- **When** a client sends a valid move request
- **Then** the API responds with HTTP 404 and `{"error":"NotFound"}`

### AC6 - Preserve the board after a move failure

- **Given** a task is in its current column
- **When** the API move request fails
- **Then** the task remains in its current column, the move control returns to the current status and is usable again, and a `role="alert"` message announces the failure

## API changes (routes, payloads, status codes, validation rules)

- Add `PATCH /api/tasks/:id`.
- Request body: a strict object containing exactly `{ "status": "todo" | "doing" | "done" }`.
- Success: HTTP 200 with the complete updated task `{ id, title, status, createdAt }`.
- Invalid or missing `status`, including extra body keys or a status outside `TASK_STATUSES`, is HTTP 400 with the existing `ValidationError` shape.
- A valid request for an unknown task ID is HTTP 404 with the existing `NotFound` shape.
- Re-selecting the task's current status is an HTTP 200 idempotent operation that leaves the task unchanged.
- The move operation changes only `status`; `id`, `title`, and `createdAt` remain unchanged.
- Add `moveTaskSchema` to `server/src/domain.ts` using `TASK_STATUSES`, and add a move mutation to `TaskStore`.
- Route-level store mutations belong in `TaskStore`; the route must not access private store state.

## UI changes (components, accessible names / roles, keyboard behaviour)

- Add one native `<select>` to each `TaskCard`.
- Label the control `Move <task title>` (for example, `Move Write tests`) and expose options `To do`, `Doing`, and `Done`.
- The selected option always represents the task's current status; the control is not a separate source of board truth.
- Tabbing reaches the select and the browser's native Arrow/Enter behavior chooses a status.
- On selection, disable that card's move control while the request is pending and prevent duplicate submissions.
- Keep the card in its current column until HTTP 200; replace board state with the returned task only after success.
- On failure, restore the previous selected status and expose the API error text in an accessible `role="alert"` message within the card or existing app error region. Do not optimistically move the card.
- No drag-and-drop, confirmation dialog, or status change without an API request is part of F1.

## Implementation plan

1. Add `moveTaskSchema` and its input type in `server/src/domain.ts`, reusing `TASK_STATUSES`.
2. Add `TaskStore.move(id, status)` to update only the matching task and return `undefined` for an unknown ID.
3. Add `PATCH /api/tasks/:id` in `server/src/app.ts` before the generic `/api` not-found middleware.
4. Add `api.moveTask(id, status)` in `web/src/api.ts`, preserving existing `ApiError` and response handling.
5. Extend `App` with an asynchronous move callback that replaces only the moved task after HTTP 200.
6. Pass the callback through `Board` and `Column` to `TaskCard`, then render the native move select, pending state, and accessible failure message.
7. Add focused styles only for the move control and failure message if needed; do not redesign the board.

## Test plan

- In `server/test/tasks.test.ts`
  - Move a seeded task between all statuses and verify HTTP 200, unchanged immutable fields, and the status change.
  - Re-select the current status and verify HTTP 200 with no field changes.
  - Table-test missing, unknown, extra-keyed, and non-string statuses for HTTP 400 and no mutation.
  - Verify a valid move for an unknown task ID returns HTTP 404.
- In one new spec `e2e/F1-move-task-between-columns.spec.ts`
  - Seed one task in To do and, using keyboard interaction on `Move <title>`, move it to Doing and verify it is in the Doing region.
  - Seed tasks in all three columns and move a task through different source/destination combinations, verifying exact source and destination regions.
  - Intercept or otherwise force `PATCH /api/tasks/:id` to fail, verify the card remains in its current region, the select returns to the current status, and `role="alert"` announces an error.
- Keep F1 scenarios out of `e2e/board.spec.ts`; that suite may retain only general board regression coverage.

## Out of scope

- Drag-and-drop and task reordering.
- WIP limits, priority, filtering, title editing, deletion, persistence, and due dates.
- Moving several tasks at once.
- Confirmation dialogs or bulk move operations.

## Open questions

None.
