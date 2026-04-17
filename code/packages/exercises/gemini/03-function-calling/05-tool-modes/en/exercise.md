# Exercise 05 — Force, forbid, or allow tool calls (mode)

## Concept

By default, function calling is **opportunistic**: Gemini decides per request whether your tools are relevant. That's fine for a chatbot. But some workflows need stronger guarantees:

- A **form-filling agent** that MUST end every turn with a structured function call — never free text.
- A **safety-sensitive system** that must NEVER call tools on user input (e.g., during a prompt-injection audit).
- A **narrow controller** that's only allowed to pick from a subset of declared functions.

Gemini's `toolConfig.functionCallingConfig.mode` gives you that control. Values (from the `FunctionCallingConfigMode` enum):

| Mode | Behavior |
|---|---|
| `AUTO` (default) | Model decides — may call a function or return text |
| `ANY` | Model MUST call one of the declared functions |
| `NONE` | Model MUST NOT call any function; pure text response |

Under `ANY`, you can further restrict which functions are allowed via `allowedFunctionNames: ["specific_fn"]`. Pairs well with role-based access — an "intern" agent only allowed to call read-only tools, a "manager" agent allowed the full set.

## Docs & references

1. [Function calling modes](https://ai.google.dev/gemini-api/docs/function-calling#modes) — AUTO / ANY / NONE semantics
2. [`ToolConfig`](https://ai.google.dev/api/caching#ToolConfig) — the config nesting
3. [`FunctionCallingConfig`](https://ai.google.dev/api/caching#FunctionCallingConfig) — `mode`, `allowedFunctionNames`

## Your task

Make TWO calls with the SAME user message `"Tell me a joke."` and the SAME `get_weather` tool declaration. The only difference is the mode.

1. **Call 1 — `AUTO`**: `toolConfig.functionCallingConfig.mode: FunctionCallingConfigMode.AUTO`. On a joke prompt with a weather tool, the model should return PLAIN TEXT (no function call).
2. **Call 2 — `ANY`**: `toolConfig.functionCallingConfig.mode: FunctionCallingConfigMode.ANY` with `allowedFunctionNames: ["get_weather"]`. The model MUST call the function, even though the prompt has nothing to do with weather — it will invent a location.
3. Return:
   ```ts
   { autoCalled: boolean,           // was there a function call in call 1?
     forcedFunctionName: string     // the name the forced call invoked
   }
   ```

## How to verify

```bash
aidev verify 05-tool-modes
```

Tests check:
- Exactly 2 API calls
- Both calls declare the weather tool
- One call sets `mode: "AUTO"`, the other sets `mode: "ANY"`
- Return has `autoCalled: boolean` + `forcedFunctionName: string`
- Under `ANY`, the forced call is `get_weather`
- Under `AUTO` on a joke prompt, the model did NOT call the tool

## Extra concept (optional)

`NONE` is the less-used third option — it's useful when you're reusing the same declarations across many calls but want to turn tool-use off for a specific one (audit turns, replay traces, or to force the model to summarize rather than act).

`ANY` combined with a single-element `allowedFunctionNames` is functionally equivalent to "always call this specific function" — a clean way to express "this turn MUST emit a form filled with these fields."

Track 05 (agents) chains these modes together: a planner step under `AUTO`, followed by forced-action steps under `ANY`. That's how you build deterministic-where-it-matters, flexible-where-it-helps agent loops.
