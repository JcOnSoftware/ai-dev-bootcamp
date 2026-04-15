# Spec: add-tool-use-track

Change: `add-tool-use-track`
Track slug: `03-tool-use`
Model: `claude-haiku-4-5-20251001`
Status: spec
Date: 2026-04-15

---

## Exercise-level requirements

### 01-basic-tool

**Goal**: Define ONE tool via `tools[]`, make a single `messages.create` call, observe a `tool_use` block in the response.

**Learner task**:
1. Define a `get_weather` tool with a proper JSON Schema `input_schema`: `type: "object"`, `properties.location: { type: "string" }`, `properties.unit: { type: "string", enum: ["celsius","fahrenheit"] }`, `required: ["location"]`.
2. Call `messages.create` with `model`, `max_tokens`, `tools: [getWeatherTool]`, `messages: [{ role: "user", content: "What's the weather in Buenos Aires?" }]`.
3. Export `default async function run(): Promise<Message>` — return the full `Message`.

**Required SDK surface**: `tools` array, `input_schema` with `type: "object"`, `properties`, `required`.

**Assertions** (all in `tests.test.ts`):
- `result.calls.length === 1`
- `result.calls[0].request.tools` is an array of length 1
- `result.calls[0].request.tools[0].name === "get_weather"`
- `result.calls[0].request.tools[0].input_schema.type === "object"`
- `result.calls[0].response.stop_reason === "tool_use"`
- `result.calls[0].response.content` has at least one block with `type === "tool_use"`
- That `tool_use` block has `name === "get_weather"`, non-null/non-empty `id`, and `input.location` is a string
- `result.calls[0].request.model` matches `/haiku/i`

---

### 02-tool-loop

**Goal**: Execute the tool locally and feed a `tool_result` back in a second `messages.create` call (the full tool-use loop).

**Learner task**:
1. Reuse the `get_weather` tool definition from 01.
2. Export `executeGetWeather(input: { location: string; unit?: string }): string` — returns a canned JSON string like `'{"temp":22,"unit":"celsius","condition":"sunny"}'`.
3. In `run()`:
   a. Call 1: `messages.create` with `tools` + user message `"What's the weather in Buenos Aires?"`. Expect `stop_reason === "tool_use"`.
   b. Extract the `tool_use` block from call 1's response; call `executeGetWeather(toolUseBlock.input)`.
   c. Call 2: `messages.create` with full conversation history:
      - Original user message
      - The assistant message (call 1 full response content)
      - A new user message: `{ role: "user", content: [{ type: "tool_result", tool_use_id: toolUseBlock.id, content: result }] }`
   d. Return the final `Message` from call 2.

**Required SDK surface**: `tool_result` content block with `tool_use_id` + `content`.

**Assertions**:
- `result.calls.length === 2`
- `result.calls[0].response.content` has at least one `tool_use` block
- `result.calls[1].request.messages` contains a user message whose `content` is an array containing an item with `type === "tool_result"`
- That `tool_result` item has `tool_use_id` matching the `id` of the `tool_use` block from call 0's response
- `result.calls[1].response.content` has at least one block with `type === "text"`
- `result.calls[1].response.stop_reason === "end_turn"`
- `result.calls[1].request.model` matches `/haiku/i`

**Named exports required**: `executeGetWeather` (tests may unit-test it directly).

---

### 03-multiple-tools

**Goal**: Expose multiple tools; let Claude pick which one to call (router pattern).

**Learner task**:
1. Define BOTH tools in `tools[]`:
   - `get_weather`: same as 01-02.
   - `calculate`: `input_schema` with `properties.operation: { type: "string", enum: ["add","subtract","multiply","divide"] }`, `properties.a: { type: "number" }`, `properties.b: { type: "number" }`, `required: ["operation","a","b"]`.
2. Export `executeTool(name: string, input: Record<string, unknown>): string` — routes to the correct local implementation. `calculate` performs the arithmetic and returns a JSON string like `'{"result":5254}'`.
3. In `run()`:
   a. Call 1 with user message `"What is 37 times 142?"`. Claude SHOULD choose `calculate`.
   b. Extract the `tool_use` block; call `executeTool(block.name, block.input)`.
   c. Call 2 with full history + `tool_result` user message.
   d. Return final `Message`.

**Required SDK surface**: multi-tool `tools[]`, tool router dispatch.

**Assertions**:
- `result.calls.length === 2`
- `result.calls[0].request.tools` is an array of length 2, containing tools named `"get_weather"` and `"calculate"`
- `result.calls[0].response.content` has a `tool_use` block with `name === "calculate"`
- That `tool_use` block has `input.operation === "multiply"`
- `result.calls[1].response.stop_reason === "end_turn"`
- Soft content check: `expect(finalTextContent).toMatch(/5254|5,254/)` (format-tolerant router-confirmation signal — this is the ONLY allowed content assertion)
- `result.calls[1].request.model` matches `/haiku/i`

**Named exports required**: `executeTool`.

---

### 04-tool-choice

**Goal**: `tool_choice` controls whether and which tool is called. Covers all 4 variants.

**Learner task**:
1. Define both `get_weather` + `calculate` in `tools[]`.
2. In `run()`, make 4 back-to-back `messages.create` calls:
   - **auto**: `tool_choice: { type: "auto" }`, message `"What's the weather in Tokyo?"` — should trigger `get_weather`.
   - **any**: `tool_choice: { type: "any" }`, same or similar message — forces Claude to use SOME tool.
   - **named**: `tool_choice: { type: "tool", name: "calculate" }`, any message — forces `calculate` regardless.
   - **none**: `tool_choice: { type: "none" }`, any message — forces text-only, no tool use.
3. Return `{ auto: Message, any: Message, named: Message, none: Message }`.

**Return type**: `Promise<{ auto: Message; any: Message; named: Message; none: Message }>`.

**Required SDK surface**: all four `tool_choice` variants — `auto`, `any`, `{ type: "tool", name }`, `none`.

**Assertions**:
- `result.calls.length === 4`
- `result.calls[0].request.tool_choice` deep-equals `{ type: "auto" }`
- `result.calls[1].request.tool_choice` deep-equals `{ type: "any" }`
- `result.calls[2].request.tool_choice` deep-equals `{ type: "tool", name: "calculate" }`
- `result.calls[3].request.tool_choice` deep-equals `{ type: "none" }`
- `result.calls[0].response.stop_reason === "tool_use"` (auto triggers tool)
- `result.calls[2].response.content` has a `tool_use` block with `name === "calculate"` (forced tool)
- `result.calls[3].response.content` has NO block with `type === "tool_use"` (none forbids tools)
- `result.calls[0].request.model` matches `/haiku/i`

---

### 05-parallel-tools

**Goal**: A single response may contain MULTIPLE `tool_use` blocks; collect ALL results in ONE user message.

**Learner task**:
1. Define both tools in `tools[]`.
2. In `run()`:
   a. Call 1 with message `"What's the weather in Buenos Aires AND in Tokyo? Both in celsius please."`. Claude should emit 2 `tool_use` blocks.
   b. Execute EACH `tool_use` block locally using `executeGetWeather`.
   c. Collect ALL `tool_result` blocks into ONE user message (single `content` array — do NOT send separate messages).
   d. Call 2 with full history + that single user message.
   e. Return final `Message`.

**Required SDK surface**: multiple `tool_use` blocks in one response; multiple `tool_result` blocks in one user message.

**Assertions**:
- `result.calls.length === 2`
- `result.calls[0].response.content` has `>= 1` block with `type === "tool_use"` (accepts 1 or 2 — tolerates model non-determinism; concept exercised as long as the loop works)
- The user message in call 2's request has `content` that is an array where every item has `type === "tool_result"`
- The number of `tool_result` items in call 2's user message equals the number of `tool_use` blocks in call 1's response
- `result.calls[1].response.content` has at least one block with `type === "text"`
- `result.calls[1].request.model` matches `/haiku/i`

---

## Starter contract requirements

Each `starter.ts` MUST:

1. Begin with the `// Docs:` comment block (canonical URLs — at minimum):
   ```ts
   // Docs:
   //   Tool use overview  : https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
   //   Implement tool use : https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use
   ```
2. Export `default async function run()` with the correct return type per exercise.
3. Default body: `throw new Error("TODO: lee el ejercicio en <locale>/exercise.md")`.
4. Export any named helper that tests import:
   - `02-tool-loop`: export `executeGetWeather`
   - `03-multiple-tools`: export `executeTool`
5. Function signatures for named helpers must match what tests expect — stub implementations that throw `TODO` are acceptable.

---

## Test assertion style

- ALL assertions structural — never assert on literal LLM text output.
- Exception: `03-multiple-tools` MAY use one soft assertion `expect(text).toMatch(/5254|5,254/)` as a format-tolerant router-confirmation signal. This is the only allowed content assertion across the entire track.
- Use `Array.find(b => b.type === "tool_use")` pattern — never positional index access on content blocks.
- Use `/haiku/i` regex for model assertions — not exact string (resilient to model ID changes).
- Use `toEqual` for `tool_choice` shape — deep equality is appropriate here since these are exact SDK values.
- Parallel tool count assertions use `>= 1` to tolerate non-determinism (exercise 05).

---

## Track structure requirements

### Directory layout
```
code/packages/exercises/03-tool-use/
├── 01-basic-tool/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 02-tool-loop/
│   └── (same structure)
├── 03-multiple-tools/
│   └── (same structure)
├── 04-tool-choice/
│   └── (same structure)
└── 05-parallel-tools/
    └── (same structure)
```

### `meta.json` fields per exercise

| Field | Value |
|---|---|
| `id` | directory name (e.g. `"01-basic-tool"`) |
| `track` | `"03-tool-use"` |
| `title` | Human-readable (match exercise.md H1) |
| `version` | `"1.0.0"` |
| `valid_until` | `"2026-10-15"` |
| `locales` | `["es", "en"]` |
| `model_cost_hint` | per exercise (see cost notes below) |

### `requires` dependency chain
- `01-basic-tool`: `["01-first-call"]` — needs Foundations baseline
- `02-tool-loop`: `["01-basic-tool"]`
- `03-multiple-tools`: `["02-tool-loop"]`
- `04-tool-choice`: `["03-multiple-tools"]`
- `05-parallel-tools`: `["04-tool-choice"]`

### `concepts` tags per exercise
- `01-basic-tool`: `["tool-definition", "input_schema", "tool_use-block"]`
- `02-tool-loop`: `["tool-result", "conversation-history", "tool-loop"]`
- `03-multiple-tools`: `["multi-tool", "tool-router", "tool-dispatch"]`
- `04-tool-choice`: `["tool_choice", "auto", "any", "forced-tool", "none"]`
- `05-parallel-tools`: `["parallel-tool-use", "multiple-tool_result", "single-user-message"]`

### `estimated_minutes` per exercise
- `01-basic-tool`: 20
- `02-tool-loop`: 25
- `03-multiple-tools`: 20
- `04-tool-choice`: 25
- `05-parallel-tools`: 30

### `model_cost_hint` per exercise
- `01-basic-tool`: `"~$0.0008 per verify run (Haiku 4.5)"`
- `02-tool-loop`: `"~$0.0015 per verify run (Haiku 4.5)"`
- `03-multiple-tools`: `"~$0.0015 per verify run (Haiku 4.5)"`
- `04-tool-choice`: `"~$0.0020 per verify run (Haiku 4.5 — 4 API calls)"`
- `05-parallel-tools`: `"~$0.0020 per verify run (Haiku 4.5)"`

### CLI discovery
No changes to `code/packages/cli/src/exercises.ts` — it already discovers tracks dynamically via directory scan and groups by track slug.

---

## Exercise.md structure requirements

All `exercise.md` files (both `es/` and `en/`) MUST follow the 6-section contract in this exact order:

1. **`# Exercise <NN> — <title>`** — H1 title matching `meta.json.title`
2. **`## Concepto`** (es) / **`## Concept`** (en) — What to understand before touching code. 2–4 paragraphs. No code.
3. **`## Docs & referencias`** (es) / **`## Docs & references`** (en) — Official links only, numbered, one-line summary each. Canonical `docs.claude.com/...` URLs — NOT `docs.anthropic.com` (redirects).
4. **`## Tu tarea`** (es) / **`## Your task`** (en) — Step-by-step implementation guide for `starter.ts`.
5. **`## Cómo verificar`** (es) / **`## How to verify`** (en) — `aidev verify <id>` command + bullet list of what tests check.
6. **`## Concepto extra (opcional)`** (es) / **`## Extra concept (optional)`** (en) — Optional deepening. Nothing tests depend on.

### Canonical doc URLs to use
- Tool use overview: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview`
- Implement tool use: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use`
- Tool choice: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/tool-choice` (if it exists; otherwise link to overview with anchor)
- Parallel tool use: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/parallel-tool-use` (if it exists)

### `## Concepto extra` content hints per exercise
- `01-basic-tool`: mention `strict: true` on tool def for strict schema enforcement; optional `input_examples`.
- `02-tool-loop`: mention `is_error: true` in `tool_result` for error signaling.
- `03-multiple-tools`: mention that `description` quality heavily influences which tool Claude picks.
- `04-tool-choice`: mention that `any`/`tool` choices cause API to prefill the assistant turn (no text before tool_use).
- `05-parallel-tools`: mention `disable_parallel_tool_use: true` in `tool_choice` to limit to one tool at a time. NOT a TODO — informational only.

---

## Out of scope (delta)

The following are explicitly excluded from this change:

- RAG, agents, MCP, computer use, text editor tool, Files API
- Tool use + prompt caching (already covered in `02-caching/05` if/when that exists)
- Changes to `code/packages/runner/src/harness.ts`
- Changes to `code/packages/cli/src/` (any file)
- Any shared fixture directory under `03-tool-use/`
- New npm/bun dependencies
- Changes to `tsconfig.json` or root `package.json`
