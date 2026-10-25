# FlxOraCMS — Development Log

Engineering-facing record of committed changes. Rules and template:
`plan-v2.md` §14. Newest entries first. Use real commit hashes and subjects
only; never log secrets, personal data or customer content.

## 2026-10-25 — Plan v2: WordPress compatibility objective and roadmap
- **Commit:** `PENDING COMMIT` — not yet committed; replace with the real full hash and exact subject immediately after the commit is made (must not remain pending on `main`).
- **Phase/issue:** Planning (Phase 9 program definition) / no issue or PR
- **Summary:** Made WordPress theme/plugin compatibility a major product objective in `plan-v2.md`. Added Section 1.2 (repository facts observed by reading files), pillar 8, a revised non-goal (no universal or native-PHP claims), Section 9A (objective, compatibility levels C1–C4, claims policy, security/licensing/performance/hosting/maintenance requirements), a `compat` module boundary and repository-structure proposals, and replaced the old Phase 9 with Phases 9.1–9.10 (charter/corpus, static analyzer and report, test harness, content/DB/media/URL/settings migration, theme migration, plugin detection/adapters/alternatives, guided migration assistant with rollback strategy, PHP runtime research/PoC/architecture review, conditional runtime implementation, compatibility directory and maintenance). Each sub-phase defines prerequisites, ADRs, deliverables, acceptance criteria, tests, security controls and provisional measurable targets. Updated testing, security, release-policy, metrics, agent-rule and next-task sections accordingly. Added a planning-guardrails section to `AGENTS.md`. Created this log (it did not previously exist).
- **Files/modules:** `plan-v2.md`, `AGENTS.md`, `DEVELOPMENT_LOG.md` (new). `plan-v2.md` was untracked before this change.
- **Database:** None.
- **Security:** Not applicable to runtime behavior (documentation only). The plan itself records the intended controls: static-only analysis, no PHP execution in the app process, retention of the `.php` upload blocklist, SSRF/XXE/zip-bomb/serialized-data protections, and a research gate before any PHP runtime.
- **Tests run:** None. Documentation-only change; no commands were executed to test, lint, typecheck or build. Repository facts in `plan-v2.md` Section 1.2 come from reading source files and configuration, not from running them. Markdown files are Prettier-ignored in this repo.
- **Deployment/operations:** None.
- **Known limitations:** No compatibility capability exists; every target number in Phase 9 is provisional and unvalidated until Phase 9.1 baselines and ratifying ADRs. Section 1.2 facts should be re-verified in Phase 0. `plan-v2.md` and Section 15 refer to `plan.md` while the repository file is `PLAN.md` (flagged in Section 1.2, not renamed). The WordPress runtime options (for example PHP-in-WebAssembly) are listed for evaluation, and their current maturity was not checked.
- **Follow-up:** Maintainer review of `plan-v2.md` Section 9A and Phase 9; decide the canonical plan filename; start Phase 9.1 read-only research after Phases 0–1 complete.
