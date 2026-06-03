# Task: Add derived-data export

## Goal

Add a derived-data export that serialises the shared session model to the locked combined
CSV format (§4.1) — samples, events, calibration, stimuli, quality — with raw and filtered
signals in separate columns and processing metadata, never raw video, with unit tests for
the serialiser.

## Scope

The export/serialisation feature only. No new tracking logic and no new data shapes.

## Required reading

Read before editing:
1. `docs-dev/reference/primary_authoritative/specification.md` §4 (schema), §4.1 (locked
   CSV format, blank vs zero, `time_ms` convention), §2.7 (no raw video).
2. Source: the `007b` session model (the single source of shapes).

## Dependencies

This prompt assumes:
- `007b_shared_data_session_model.md` is complete, and the producing modules
  (`009`,`012`,`014b`,`015`,`017`,`019`,`021`,`022`,`024`–`026`,`028`,`029`) have populated
  the model as far as the queue has progressed.
If the session model is missing, stop and report. Do not invent new field shapes here.

## Context

Export only **serialises** the model; it does not define new shapes (those are locked in
`007b`/§4).

## Required changes

1. Serialise the session model to a **single combined CSV** with a `row_type` column for
   `sample`/`event`/`calibration`/`stimulus`/`quality`; leave non-applicable fields blank;
   keep raw and filtered values in separate columns; `time_ms` is ms from session start.
2. Include processing/data-flow metadata (`pipeline_id`, `model_name`, `signal_type`,
   `filter_name`, `mapping_model_id`, `processing_location`, `uploaded_data_type`,
   `raw_video_saved=false`).
3. Provide a user-triggered download; add `node --test` tests for the serialiser (row-type
   column present; blanks for N/A; raw/filtered columns distinct; header stable).

## Do not implement

Do not:
- store or export raw video/frames;
- upload data anywhere;
- introduce new field names/shapes beyond §4 / `007b`.

## Data contracts touched

Adds: the CSV serialisation of existing model fields and processing metadata.
Preserves: all `007b` shapes exactly; raw-vs-filtered separation.
Does not: add raw-video storage or new internal shapes.

## Acceptance criteria

The task is complete when:
- a user can export a single combined CSV with all five row types and the §4 fields;
- non-applicable fields are blank, raw/filtered are separate columns, metadata is present,
  no raw video is exported;
- `npm run test` covers the serialiser and passes.

## Automated checks

```bash
npm run build
npm run test
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Manual verification

- Export from a session and open the CSV; confirm the `row_type` column, blank N/A cells,
  separate raw/filtered columns, and processing metadata.
- Confirm no raw video/frames are included.
- See `docs-dev/reviews/runtime_qa_checklist.md` (data export rows).

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`031_derived_data_export.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
