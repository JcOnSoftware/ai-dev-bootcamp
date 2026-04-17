# Proposal: add-gemini-provider-support

## Intent

Add **Gemini** as a third AI provider to ai-dev-bootcamp, parallel to Anthropic and OpenAI. Ship **v3.0** with 90 exercises (30 per provider) across 3 providers, proving the multi-provider architecture scales.

## Why now

1. **Provider diversity**: learners in real projects face all 3 major providers. The bootcamp currently teaches 2 — completing the triad closes the gap.
2. **Architecture is proven**: the singleton + dispatcher pattern from v2.0 (`add-openai-provider-support`) was designed for exactly this extension. Mechanical replication.
3. **Gemini has unique differentiators** that merit dedicated tracks — Live API (audio-to-audio realtime) and dual-mode context caching (implicit auto + explicit). Neither Anthropic nor OpenAI ships an equivalent multimodal Live API integrated with their text SDK.
4. **Foundation for future tracks**: LangChain (currently in the backlog) operates ENCIMA of providers — shipping all 3 native SDKs first respects the bootcamp's "conceptos > herramientas" principle before introducing abstractions.

## Scope

**In scope:**
- Extend `SupportedProvider` union to include `"gemini"`
- Add `@google/genai` v1.48.x to runner package
- New `harness-gemini.ts` sub-harness (non-stream + stream + embed)
- Config: `geminiApiKey` field, `resolveApiKey("gemini")`, `validateProvider` supports gemini
- Init command: Gemini option in provider select, `AIza...` soft key validation
- Cost: Gemini model families (2.5-flash-lite, 2.5-flash, 2.5-pro) with cache pricing
- Render: `SdkGeminiResponse` interface + extractor
- i18n strings for Gemini in `es.json` + `en.json`
- CI: weekly health check runs Gemini exercises against real API
- Version bump to `3.0.0`
- 30 exercises in `exercises/gemini/` across 6 tracks, all bilingual (en+es):
  - `01-foundations` (5) — parallel to other providers
  - `02-context-caching` (5) — Gemini-unique (implicit + explicit)
  - `03-function-calling` (5) — parallel
  - `04-rag` (5) — parallel (embedContent)
  - `05-agents` (5) — parallel
  - `06-live-multimodal` (5) — Gemini-unique (Live API)
- Documentation: update `README.md`, `README.es.md`, `CLAUDE.md`

**Out of scope (explicit):**
- LangChain framework track (deferred to post-v3 `07-frameworks`)
- Multi-editor TUI fix for `aidev open` (separate backlog item)
- Quarterly MODEL_PRICES refresh (issue #3, not due until 2026-07)
- Cleanup of untracked `openspec/changes/add-openai-provider-support/` (separate PR)

**Fallback scope (if B0 spike fails):**
- Option C: defer track 06 (Live API) to v3.1, ship 25 exercises for v3.0. Document in PR.

## Approach

Replicate `add-openai-provider-support` SDD pattern. 7 batches:

| Batch | Focus | Est. files |
|---|---|---|
| B0 | Harness spike + deps + version bump | 3 |
| B1 | Provider types + singleton extension | 2 |
| B2 | Config extension (key resolution, validation, progress normalization) | 1 |
| B3 | CLI wiring (index, init, i18n) | 4 |
| B4 | Commands (verify, run) + cost + render | 4 |
| B5 | Harness split (harness-gemini.ts + dispatcher branch + types) | 3 |
| B6 | 30 exercises (6 tracks × 5 exercises × 6 files each) | 180 |
| B7 | CI + docs + verification | 5 |

Total: ~35 infra files + 180 exercise files.

## Success Criteria

1. `aidev init` → select Gemini → paste `AIza...` key → validates → config persisted.
2. `aidev list --provider gemini` → shows 30 exercises in 6 tracks.
3. `aidev verify <id> --provider gemini --solution` → runs against real Gemini API, passes.
4. `aidev progress` → shows 3 provider groups (Anthropic, OpenAI, Gemini).
5. `bunx tsc --noEmit` → clean.
6. No regression: Anthropic + OpenAI tests continue passing.
7. CI weekly health check runs all 3 providers.
8. Budget: each provider runs 30 exercises for <$0.10 USD total.
9. README + CLAUDE.md reflect v3.0 with 3 providers.
10. PR merged to main; tag `v3.0.0`.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `generateContentStream` async-iterable patch is harder than Promise patching | B0-T00 spike BEFORE implementing harness; if spike fails, rethink architecture |
| Live API (track 06) WebSocket intercept too complex | Fallback: defer track 06 to v3.1 (25 exercises for v3.0) — documented in proposal |
| `@google/genai` v1.x maturity (released Nov 2025) | Pin `^1.48`, soft key validation, document version in CLAUDE.md |
| Context/time budget during 30-exercise authoring | Exercise authoring can split across PRs internally (merge via `/sdd-apply` batches) if needed |

## Out of Scope (reiterated)

LangChain, multi-editor TUI, quarterly price refresh, OpenAI archive cleanup — all stay in backlog.

## Ready for

`/sdd-spec` + `/sdd-design` (parallel, both read this proposal).
