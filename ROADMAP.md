# Bookmarkr AI Roadmap

## Phase 0 - Baseline MVP (current)
- Build Chrome and Brave Manifest V3 extension with bookmark read and write permissions.
- Ship popup interface with scan, plan preview, and apply actions flow.
- Add agentic pipeline stages: snapshot, analysis, planning, validation, and execution.
- Use heuristic planner by default with optional LangChain powered planning.
- Deploy optional planning API to Vercel.

## Phase 1 - Quality and Safety
- Add dead-link checks before deletion suggestions.
- Add confidence thresholds with manual approval gates.
- Add backup and restore by exporting bookmark snapshots.
- Add integration tests for planner and bookmark mutations.
- Add telemetry opt-in with strong privacy defaults.

## Phase 2 - Better Intelligence
- Add domain based clustering and semantic topic grouping.
- Add per-user style profile to learn folder naming preferences.
- Add explain mode that details why each action is recommended.
- Add rollback support for each apply batch.
- Add optional local embedding cache for faster repeated runs.

## Phase 3 - Collaboration (future SaaS)
- Add user auth and one-time purchase plan.
- Add bookmark version control and restore points.
- Add anonymous pattern library for folder structures across users.
- Add template adoption so users can import structure ideas.
- Add permissioned team workspace for startup teams.

## Phase 4 - Advanced Platform
- Add optional native helper for faster indexing using Rust.
- Add model routing for cost and speed control.
- Add cross-browser sync strategy and import pipelines.
- Add enterprise policy controls and audit logs.
