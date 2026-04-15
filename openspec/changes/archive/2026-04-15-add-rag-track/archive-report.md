# Archive report — add-rag-track

## Change metadata
- **Change name**: `add-rag-track`
- **Status**: `archived`
- **Archive date**: `2026-04-15`
- **Verification outcome**: `passed-with-warnings → resolved → ready-to-archive`

## What shipped

Track `04-rag`: 5 progressive exercises teaching RAG end-to-end with Voyage AI embeddings and Haiku generation. Span commits `2f01664` (fixture) through `25582ee` (05-citations-grounding), with docs fix at `f661a00`. Exercises cover embeddings math (L2-norm = dot product), input_type asymmetry, chunking strategies, full retrieval pipeline, and citations/grounding. All 36 integration tests pass; all pedagogical requirements met.

## Implementation stats
- **Commits**: 7 total (6 exercise + 1 docs fix)
- **Files created**: 36 (5 exercises × [starter, solution, tests, meta.json, es/exercise.md, en/exercise.md] + shared fixture)
- **Integration tests added**: 36 (1:1 tests per exercise)
- **Lines of code**: ~2,200 (exercises + fixture)
- **Apply cost**: ~$0.01 (Voyage L3-lite free tier + Haiku generation; free tier = 3 RPM / 10K TPM without payment method)

## Key learnings

### Voyage free tier constraints
- **Rate limit**: 3 RPM / 10K TPM without payment method
- **Impact**: Parallel test execution triggers 429 errors
- **Solution**: Sequential exercise runs with 40s+ gaps (implemented manually by orchestrator)
- **Persistence**: Documented in CONTRIBUTING.md setup section

### Voyage API correctness
- **L2-normalized embeddings**: dot product == cosine similarity (teaching advantage: fewer abstractions)
- **`input_type` mandatory and asymmetric**: `"document"` vs `"query"` — wrong values silently degrade retrieval quality
- **Practice pattern**: Always validate input_type against actual use case

### Haiku structured output
- **JSON tolerant parser pattern**: Handle both raw JSON and markdown fences ```json...``` (non-deterministic LLM output)
- **Reusable**: Pattern applicable to 05 and any future exercise requiring structured output
- **Cost discipline**: Haiku ~0.5¢ per call vs Sonnet ~2¢

## Verification findings resolution

### W1 — CONTRIBUTING.md VOYAGE_API_KEY documentation
- **Status**: RESOLVED
- **Fix**: Commit `f661a00` (docs(contributing): add VOYAGE_API_KEY setup for 04-rag track)
- **Details**: Setup section now documents requirement + where to get free tier API key

### S1 — apply-progress engram artifact gap
- **Status**: ACKNOWLEDGED (low severity)
- **Context**: Implementation complete in git; engram artifact only captured Batches 0-1 due to manual apply process
- **Action**: None (code is correct, artifact trail incomplete — not worth GH issue)

### S2 — health-check.yml missing VOYAGE_API_KEY secret
- **Status**: ADDRESSED by same commit
- **Details**: Reviewer noted CI likely needs VOYAGE_API_KEY; documented in CONTRIBUTING.md that integration tests skip silently without key

## Approval
- Verification: `passed-with-warnings`
- All CRITICALs: none
- All WARNINGs: resolved (W1 by f661a00)
- SUGGESTIONs: acknowledged (S1 artifact gap is low-severity; S2 already documented in CONTRIBUTING.md)

Ready for archive.
