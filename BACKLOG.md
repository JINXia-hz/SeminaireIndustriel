# Product backlog — Kanban Factory

These are the feature requests your **software factory** will turn into working, tested code.
They are written the way a product owner would write them: short and a bit vague on purpose.
Turning them into a precise spec is the **Planner** agent's job.

Tick a box only when the feature is merged into `main` **and** `npm run verify` is green.

| ID  | Feature                           | Used in     |
| --- | --------------------------------- | ----------- |
| F1  | Move a task between columns       | Parts 1 → 3 |
| F2  | Delete a task                     | Part 4      |
| F3  | Work-in-progress (WIP) limit      | Part 4      |
| F4  | Edit a task title                 | Stretch     |
| F5  | Search / filter tasks             | Stretch     |
| F6  | Task priority                     | Stretch     |
| F7  | Due dates & overdue tasks         | Stretch     |
| F8  | Persist the board across restarts | Stretch     |

---

[ ] **F1 — Move a task between columns.**
As a user, I want to move a task to another column (To do / Doing / Done) so that the
board reflects the progress of my work. Moving must be possible without a mouse.

[ ] **F2 — Delete a task.**
As a user, I want to delete a task I no longer need. I don't want to lose a task by
accident.

[ ] **F3 — WIP limit on "Doing".**
As a team lead, I want at most **3** tasks in the "Doing" column at any time. The rule must
be enforced by the API (not only the UI), and the user must understand why a move was
refused.

[ ] **F4 — Edit a task title.**
As a user, I want to fix a typo in a task title. Same validation rules as creation.

[ ] **F5 — Search / filter.**
As a user with many tasks, I want to type some text and only see the matching tasks in
every column. Clearing the search shows everything again.

[ ] **F6 — Priority.**
As a user, I want to give each task a priority (low / medium / high), see it on the card,
and have high-priority tasks at the top of each column.

[ ] **F7 — Due dates.**
As a user, I want to set an optional due date on a task and immediately spot overdue
tasks that are not done yet.

[ ] **F8 — Persistence.**
As a user, I don't want to lose my board when the server restarts. Store it in a JSON file
under `data/` (no database). Tests must not touch the real data file.
