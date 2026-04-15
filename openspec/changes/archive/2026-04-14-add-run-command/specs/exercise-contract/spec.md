# Delta for exercise-contract

## ADDED Requirements

### Requirement: Playground documentation note

`docs/EXERCISE-CONTRACT.md` MUST be updated to include an informational note (no hard requirement on exercise authors) explaining that exercises can be executed for inspection via `aidev run <id>`.

The note SHOULD mention that return shapes which are plain objects with labeled fields (e.g. `{ deterministic, creative }`) render more cleanly in the run summary than deeply nested structures, as a style hint for future exercise authors.

No existing exercise is invalidated by this note. No structural contract changes.

#### Scenario: Note appears in EXERCISE-CONTRACT.md

- GIVEN a developer reads `docs/EXERCISE-CONTRACT.md`
- WHEN they reach the section describing exercise return values
- THEN they find a note that `aidev run <id>` exists for playground inspection
- AND they find the style hint about labeled plain-object returns rendering cleanly
