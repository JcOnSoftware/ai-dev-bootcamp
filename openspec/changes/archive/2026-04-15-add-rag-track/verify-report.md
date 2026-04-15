# Verify report — add-rag-track

## Verification outcome

passed-with-warnings

## Checks performed

### Gates from `code/`
- [x] `bunx tsc --noEmit` → exit 0 (zero TypeScript errors)
- [x] `bun test packages/cli packages/runner` → 104 pass, 0 fail (non-integration suite clean)
- [x] `git diff` scope → no changes to `packages/cli/`, `packages/runner/`, other tracks, `cost.ts` or harness

### Track structure
- [x] `code/packages/exercises/04-rag/` exists with 5 exercise subdirs + `fixtures/` subdir
- [x] `fixtures/docs-chunks.ts` present
- [x] All 5 exercises have correct 6-file set: `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json`, `es/exercise.md`, `en/exercise.md`

### meta.json compliance (all 5 exercises)
- [x] `track: "04-rag"` on all 5
- [x] `locales: ["es", "en"]` on all 5
- [x] `valid_until: "2026-10-15"` on all 5
- [x] Requires chain correct: 01→`["01-first-call"]`, 02→`["01-embeddings-basics"]`, 03→`["02-vector-search"]`, 04→`["03-chunking-strategies"]`, 05→`["04-retrieval-pipeline"]`
- [x] `model_cost_hint`: voyage-only (01,02), none (03), haiku (04,05)

### Docs: headers in starter.ts
- [x] 01: `https://docs.voyageai.com/reference/embeddings` + `https://docs.voyageai.com/docs/embeddings`
- [x] 02: `https://docs.voyageai.com/reference/embeddings` + `https://docs.voyageai.com/docs/embeddings`
- [x] 03: `https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips`
- [x] 04: `https://docs.voyageai.com/reference/embeddings` + `https://docs.claude.com/en/api/messages` + `https://docs.claude.com/en/docs/about-claude/models/overview`
- [x] 05: `https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags` + `https://docs.voyageai.com/reference/embeddings` + `https://docs.claude.com/en/api/messages`
- [x] No disallowed URLs (`docs.anthropic.com`, `platform.claude.com`) found anywhere in 04-rag

### Voyage integration correctness
- [x] All API solutions call `https://api.voyageai.com/v1/embeddings` with model `voyage-3.5-lite`
- [x] `input_type` is an explicit parameter in `voyageEmbed` (inlined per design ADR-1)
- [x] 04 and 05 solutions use model `claude-haiku-4-5-20251001`

### API key guards in tests
- [x] 01: guards `VOYAGE_API_KEY` only (no Anthropic call)
- [x] 02: guards `VOYAGE_API_KEY` only (no Anthropic call)
- [x] 03: no guard (pure computation, no API — correct per spec)
- [x] 04: guards both `VOYAGE_API_KEY` and `ANTHROPIC_API_KEY`
- [x] 05: guards both `VOYAGE_API_KEY` and `ANTHROPIC_API_KEY`

### exercise.md — 6 sections contract
- [x] All 10 files (5 exercises × 2 locales) have exactly 6 H2 content sections + 1 H1 title
- [x] es/: Concepto, Docs y referencias, Tu tarea, Cómo verificar, Qué validan los tests, Concepto extra
- [x] en/: Concept, Docs & references, Your task, How to verify, What the tests validate, Extra concept

### Pedagogical correctness
- [x] 01 teaches L2-norm → dot product == cosine similarity (explicitly documented in es/en exercise.md)
- [x] 02 teaches `input_type` asymmetry (document vs query) as first-class concept
- [x] 03 covers fixed-size, sentence, and paragraph chunking strategies with overlap tradeoffs
- [x] 04 shows full RAG pipeline: embed query → retrieve → build system prompt → Haiku generation
- [x] 05 demonstrates citation grounding with JSON output + tolerant parser + citation id validation

### CLI rendering
- [x] `aidev list` (--locale es, --locale en) shows all 5 exercises under `▸ 04-rag` with correct titles and concept tags

### Git hygiene
- [x] 6 commits on main since origin/main: `2f01664`, `024412d`, `edc8358`, `0cefc0c`, `b19fab4`, `25582ee`
- [x] All 6 use `feat(exercises/04-rag/...)` conventional format
- [x] No `Co-Authored-By` in any commit body
- [x] `git status` clean (no uncommitted changes, no staged files)

### CONTRIBUTING.md — VOYAGE_API_KEY note (B6-T06)
- [!] `VOYAGE_API_KEY` NOT mentioned in CONTRIBUTING.md — B6-T06 was NOT completed

## Integration test summary (from orchestrator serial run)

- 01-embeddings-basics: 8/8 pass
- 02-vector-search: 7/7 pass
- 03-chunking-strategies: 6/6 pass (pure — no API)
- 04-retrieval-pipeline: 6/6 pass
- 05-citations-grounding: 9/9 pass

**Total: 36/36**

## CRITICAL findings

None.

## WARNING findings

**W1 — CONTRIBUTING.md missing VOYAGE_API_KEY documentation (B6-T06 incomplete)**
Task B6-T06 required adding a note to CONTRIBUTING.md that `VOYAGE_API_KEY` is required for track `04-rag` exercises 01-02, 04-05. This was not committed. A contributor setting up the project from CONTRIBUTING.md will not know they need a Voyage API key. The current text only mentions `ANTHROPIC_API_KEY`.

Fix: add a `VOYAGE_API_KEY` entry to the Setup section noting it is required for track `04-rag` (get one at `https://dash.voyageai.com`). Commit as `docs(contributing): add VOYAGE_API_KEY note for 04-rag track`.

## SUGGESTION findings

**S1 — apply-progress in engram only captures Batches 0-1**
The engram `apply-progress` artifact (#138) only documents Batches 0 and 1. Batches 2-5 were implemented (commits confirmed in git log) but their progress was never merged back into the engram artifact. Not a correctness issue — the implementation is complete and tested — but the artifact trail is incomplete. Archive phase should note this gap.

**S2 — health-check.yml CI does not include `VOYAGE_API_KEY` secret reference**
The existing `health-check.yml` workflow runs integration tests against the real Anthropic API. Track 04-rag integration tests also require `VOYAGE_API_KEY`. If the workflow does not have this secret configured, the new exercises will silently skip or fail in CI health checks. Recommend verifying the workflow file and adding `VOYAGE_API_KEY` to the repo secrets.

## Recommendation

**needs-fixes-then-archive**

One WARNING (B6-T06 CONTRIBUTING.md update) must be completed before archive. The fix is minimal (a few lines in CONTRIBUTING.md + one commit). No CRITICAL issues. All 36 integration tests green, TSC clean, full contract compliance on all 5 exercises.

## Cost spent during verify

$0.00 (no API calls — static validation only)
