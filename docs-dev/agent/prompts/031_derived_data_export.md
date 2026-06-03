# Task: Add derived-data export

## Goal

Add a derived-data export that writes the session's samples, events, calibration, stimuli,
and quality rows per the specification schema — with raw and filtered signals distinct and
processing metadata included — and never raw video.

## Scope

The export feature only. No new tracking logic.

## Context

Implements specification §4 (export schema: row types, field groups, raw vs filtered,
processing metadata) and §2.7 (no raw video). Resolves the open file-format decision (§9):
choose CSV and/or JSON-lines and record it in the spec.

## Required changes

1. Add an export that serialises `sample`/`event`/`calibration`/`stimulus`/`quality` rows
   with the §4 field groups, keeping raw and filtered signals distinct.
2. Include processing/data-flow metadata (`pipeline_id`, `model_name`, `signal_type`,
   `filter_name`, `mapping_model_id`, `processing_location`, `uploaded_data_type`,
   `raw_video_saved=false`).
3. Choose the export format, record it in specification §4/§9 (bump the version), and
   provide a user-triggered download. Do not export raw video.

## Do not implement

Do not:
- store or export raw video/frames;
- upload data anywhere;
- add a second show/hide control.

## Acceptance criteria

The task is complete when:
- a user can export a derived-data file with all five row types and the §4 fields;
- raw and filtered signals are distinct and processing metadata is present;
- the chosen format is recorded in the spec; no raw video is exported;
- `npm run build` passes.

## Checks

```bash
npm run build
bash scripts/check-public-build.sh dist
bash scripts/validate-prompts.sh
```

## Commit and push

If and only if the scope was followed and checks pass, create one commit on `main` using
this file's exact filename (`031_derived_data_export.md`) as the commit message, then push.

Do not commit or push partially completed work unless explicitly instructed.

## Final report

End with the required final report specified in `AGENTS.md`.
