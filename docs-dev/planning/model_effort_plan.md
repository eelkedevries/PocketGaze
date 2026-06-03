# Model and effort plan for the implementation prompt queue

Non-binding planning note. Recommends which model and reasoning-effort level to use when
running each prompt in `docs-dev/agent/prompts/`. Priority: **best possible output first,
efficiency second.**

This is guidance, not canon — adjust per run. The binding design lives in
`docs-dev/reference/primary_authoritative/specification.md`.

## Principle

- **Opus + High effort** — anything where a wrong decision propagates: the shared data
  model, every spike (library/method/feasibility decision), and the correctness-critical
  algorithms. Never economise here.
- **Opus + Medium** — foundational browser-API and integration code, plus the most-visible
  content page. Run with `/fast` to keep Opus quality with faster output.
- **Sonnet + Medium** — UI wiring/demo prompts and bulk content (Sonnet 4.6 is strong and
  cheaper/faster here).
- **Sonnet Low / Haiku** — trivial content/doc prompts.

**Effort = thinking budget:** High ≈ extended thinking ("think hard"/ultrathink),
Medium ≈ normal thinking, Low ≈ minimal. Set the model with `/model`; use `/fast` on the
Opus-Medium rows.

## Per-prompt recommendations

| Prompt | Model | Effort | Why |
|---|---|---|---|
| `004_step0_overview_content` | Opus | Medium | Flagship landing page — portfolio prose quality matters most here. |
| `005_step_explanatory_content` | Sonnet | Medium | Bulk explanatory copy; formulaic, Sonnet handles prose well. |
| `006_shell_polish_accessibility` | Sonnet | High | Real engineering: persistence, responsive, keyboard/ARIA. |
| `007_about_privacy_page` | Sonnet | Low | Short static page; low risk. (Haiku acceptable.) |
| `007b_shared_data_session_model` | **Opus** | **High** | Highest-leverage prompt — defines types every later module depends on. |
| `008_camera_access` | Opus | Medium | `getUserMedia` lifecycle / stream release / permission edges are error-prone. |
| `009_frame_timing` | Opus | Medium | rVFC + fallback + dropped/repeated-frame logic is subtle. |
| `010_step1_demo` | Sonnet | Medium | UI wiring over the `008`/`009` modules. |
| `011_landmark_library_spike` | **Opus** | **High** | Research + binding decision (Human vs MediaPipe). |
| `012_feature_extraction` | Opus | Medium | Library integration, self-hosting, feature plumbing. |
| `013_step2_demo` | Sonnet | Medium | Overlay wiring. |
| `014_head_pose_method_spike` | **Opus** | **High** | Binding method decision (library pose vs solvePnP vs Procrustes). |
| `014b_head_pose_estimation` | Opus | Medium | Pose maths + quality estimate. |
| `015_motion_quality_labelling` | Opus | Medium | Thresholds + unit tests; correctness matters. |
| `016_step3_demo` | Sonnet | Medium | Wiring. |
| `017_eye_local_signal` | Opus | Medium | Normalisation maths + signal-type separation. |
| `018_webeyetrack_spike` | **Opus** | **High** | Feasibility / licence / self-host go-no-go decision. |
| `019_screen_gaze_integration` | Opus | Medium | Conditional integration; must keep signals distinct. |
| `020_step4_demo` | Sonnet | Medium | Wiring + UX of the eye-local/screen-gaze distinction. |
| `021_follow_the_dots_task` | Opus | Medium | Many mobile/coordinate/timing requirements. |
| `022_regression_mapping` | **Opus** | **High** | Calibration maths + held-out error + tests; correctness-critical. |
| `023_step5_demo` | Sonnet | Medium | Wiring. |
| `024_one_euro_filter` | Opus | Medium | Signal-processing algorithm + tests. |
| `025_blink_quality_suppression` | Opus | Medium | Logic + tests. |
| `026_event_detection` | **Opus** | **High** | Trickiest algorithm (saccade/fixation candidates) + tests. |
| `027_step6_demo` | Sonnet | High | Dual raw-vs-filtered trace viz + event overlay is the most complex demo. |
| `028_stimulus_viewport_logging` | Sonnet | Medium | Moderate logging. |
| `029_content_coordinate_mapping` | Opus | Medium | DOM-geometry transform maths + tests. |
| `030_step7_demo` | Sonnet | Medium | Wiring. |
| `031_derived_data_export` | Opus | Medium | CSV serialisation must match the locked schema exactly + tests. |
| `032_cross_device_performance_qa` | Opus | Medium | Investigation/judgement; hard to automate. |
| `033_docs_and_deploy_verification` | Sonnet | Low | Docs + a verification pass. |

`001`–`003` are already run — N/A.

## Tally

- **Opus High (6):** `007b`, `011`, `014`, `018`, `022`, `026` — never economise.
- **Opus Medium (14):** `004`, `008`, `009`, `012`, `014b`, `015`, `017`, `019`, `021`,
  `024`, `025`, `029`, `031`, `032` — run with `/fast`.
- **Sonnet (12):** `005`, `006`, `007`, `010`, `013`, `016`, `020`, `023`, `027`, `028`,
  `030`, `033`.

## Efficiency notes

1. **Run each prompt in its own fresh session.** The prompts are independent units, so a
   fresh session avoids carrying a bloated context (cheaper and better-focused) and lets you
   switch models per prompt.
2. **If budget is tight**, the only safe downgrades are the Sonnet-Low rows (`007`, `033`)
   to Haiku. Do **not** downgrade any Opus row — that is exactly where a cheap model costs a
   rework cycle.
