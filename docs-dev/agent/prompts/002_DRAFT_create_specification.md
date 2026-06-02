# DRAFT — Task: Create the binding PocketGaze specification

> **STATUS: DRAFT — NOT READY TO RUN.**
>
> This is a premade placeholder establishing the planned next step. Do **not** execute it
> as written. Its full contents are intentionally not finished in the setup task; they
> will be completed once the project decisions are settled, and the `DRAFT_` marker must be
> removed from the filename (e.g. renamed to `002_create_specification.md`) before running.

## Future purpose

Create the real, binding specification at
`docs-dev/reference/primary_authoritative/specification.md`, replacing the current minimal
placeholder.

The specification must be built from:

- the project decisions (provided by the user or settled during planning);
- `docs-dev/reference/secondary_background/overview.md` — non-binding background;
- `docs-dev/reference/secondary_background/smartphone_eye_tracking_background.md` —
  non-binding background;
- any additional user instructions supplied at the time.

## Must capture (at minimum)

- PocketGaze's **portfolio purpose**: showing potential employers, collaborators, and
  customers how smartphone-camera eye tracking can be implemented in practice.
- The **master "Show implementation details" control** for revealing/hiding the optional
  implementation/subprocess panels on each step page.

## Notes for when this is written out

- Fill the standard specification sections (Scope, Architecture, Data schemas, Domain
  rules, Naming and voice, Locked decisions) only with settled decisions; leave undecided
  items as explicit placeholders.
- Keep the binding document precise and free of speculation; non-binding context stays in
  the background files.
- Bump the specification version when real decisions are recorded.
- Follow `docs-dev/agent/document_contract.md` for the exact shape of the specification.

## Do not (in this draft)

- Do not write the full specification now.
- Do not treat this draft as authoritative.
