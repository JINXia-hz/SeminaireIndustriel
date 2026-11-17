# Part 7: Final demo, a secret feature (20 min)

**Goal:** prove that your factory works on a feature **you haven't seen before**.

## Rules

1. Your instructor gives you a **feature card** (D1–D6). Add it to `BACKLOG.md` as written, with its ID.
2. You have **20 minutes**. Use the `factory` agent (VS Code or CLI) to deliver it: spec → code → tests → review.
3. **Count your interventions.** One intervention is any of these:
   - answering an _Open question_ or approving the spec (expected, but count it);
   - stopping a run, or re-prompting an agent;
   - editing an agent, skill or instruction file mid-demo (allowed, and often the right call);
   - editing product code or tests **by hand** (allowed, but it's a point against your factory).
4. At the end, whatever state you're in:
   - push your branch and open a PR;
   - run `npm run verify` and `npm run check`;
   - fill in _Part 7_ and _Reflection_ in `JOURNAL.md`.

A partially delivered feature with an honest journal is better than a "done" feature you patched by hand without saying so.

## When the instructor comes by

Be ready to show, in 3 minutes:

- the factory run (the orchestrator's final summary);
- the spec, the test report and the review for the demo feature;
- the CI result of the PR;
- your intervention count, and the **one change to your factory** you'd make next.

## ✅ Final checkpoint

- [ ] `npm run check` prints **All core parts complete: PASS**.
- [ ] Both CI jobs are green on `main`.
- [ ] The demo PR is open, with its spec, test report and review.
- [ ] `JOURNAL.md` is complete, including the _Reflection_ and the AI credits log.

Congratulations. You built a software factory. Now read [going further](going-further.md) to see where this is heading.
