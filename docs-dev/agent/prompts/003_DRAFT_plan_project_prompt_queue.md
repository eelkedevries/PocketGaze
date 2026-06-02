# DRAFT — Task: Plan the PocketGaze implementation prompt queue

> **STATUS: DRAFT — NOT READY TO RUN.**
>
> This is a premade placeholder establishing the planned step after the specification
> exists. Do **not** execute it as written. Its full contents are intentionally not
> finished in the setup task, and the `DRAFT_` marker must be removed from the filename
> (e.g. renamed to `003_plan_project_prompt_queue.md`) before running.

## Future purpose

After the binding specification exists (created via
`002_DRAFT_create_specification.md`), generate the ordered, numbered prompt queue for
actually building PocketGaze.

Each generated prompt must be a narrow, reviewable unit following
`docs-dev/agent/prompt_authoring_guide.md` — one step or one feature at a time, with
explicit required changes, acceptance criteria, and "do not implement" guards.

## Notes for when this is written out

- Derive the queue from the binding specification, not from the non-binding background.
- Sequence work incrementally (e.g. camera/timing before feature extraction before
  gaze signals), so the project stays useful even if later prompts prove difficult.
- Prefer browser-local processing first, in line with the recommended route.
- Keep each prompt small; avoid broad milestone prompts.

## Do not (in this draft)

- Do not write the actual implementation prompts now.
- Do not run any implementation work from this draft.
