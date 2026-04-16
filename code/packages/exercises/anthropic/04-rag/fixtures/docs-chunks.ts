/**
 * Shared fixture for the 04-rag exercise track.
 *
 * DOCS_CHUNKS is a set of ~15 technical chunks paraphrased from Anthropic's
 * canonical documentation on prompt caching and tool use. Each chunk is
 * 150-300 tokens of self-contained content.
 *
 * This file is NOT an exercise — it has no meta.json, tests.test.ts, or
 * exercise.md. It follows the track-level fixture convention (same pattern as
 * 02-caching/fixtures/long-system-prompt.ts).
 *
 * Source docs:
 *   https://docs.claude.com/en/docs/build-with-claude/prompt-caching
 *   https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
 */

export interface Chunk {
  id: string;
  text: string;
  metadata: {
    source: "prompt-caching-docs" | "tool-use-docs";
    topic: string;
    url: string;
  };
}

export const DOCS_CHUNKS: Chunk[] = [
  // ── Prompt Caching ────────────────────────────────────────────────────────

  {
    id: "caching-01",
    text: "Prompt caching is a feature that optimizes API usage by allowing resuming from specific prefixes in your prompts. When you enable prompt caching, the API checks whether a prompt prefix is already cached from a recent query. If found, it uses the cached version, reducing processing time and costs significantly. Cache prefixes are created in the following order: tools, system, then messages. Prompt caching is particularly useful for sharing large amounts of context, instructions, background information, or consistent elements across multiple API calls.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "prompt-caching-overview",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  {
    id: "caching-02",
    text: "To enable prompt caching, include cache_control parameters in your API request. The cache_control parameter with type 'ephemeral' marks content that should be cached. You can place cache breakpoints at the end of specific content blocks — system prompts, tool definitions, or messages — to indicate where caching should apply. The minimum cacheable prompt length is 1024 tokens for Claude Haiku models and 2048 tokens for Sonnet and Opus. Shorter prompts cannot be cached, even if you include cache_control blocks.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "cache-control",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  {
    id: "caching-03",
    text: "Prompt caching has a Time-to-Live (TTL) of 5 minutes. The TTL resets each time the cached prompt is used. This means if you use the same cached prefix within 5 minutes, the cache remains active and the timer resets. After the TTL expires, the cache entry is invalidated, and subsequent requests that include that prefix must re-create the cache from scratch, incurring full processing costs for that prefix. This ephemeral nature is why the cache_control type is called 'ephemeral'.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "cache-ttl",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  {
    id: "caching-04",
    text: "Cache writes cost 25% more than base input tokens, while cache reads cost only 10% of the base input token price. A cache write creates the cached prefix in the system; subsequent cache reads are significantly cheaper. For example, if you have a 10,000-token system prompt, the first call (cache write) costs 12,500 token-equivalents, but every subsequent call within the TTL window costs only 1,000 token-equivalents for that prefix. This makes prompt caching highly economical for repeated long prompts.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "cache-pricing",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  {
    id: "caching-05",
    text: "The cache is keyed by the exact prefix up to and including the cache_control breakpoint. For the cache to be used, subsequent requests must have the same model, temperature, system prompt, and tools up to and including the breakpoint. If any content before the cache_control marker changes — even a single token — the cache miss occurs and the entire prefix must be processed again. This makes caching most suitable for static or slowly-changing content like system prompts and large documents.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "cache-keys",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  {
    id: "caching-06",
    text: "Prompt caching supports multiple cache breakpoints in a single request. You can mark both the system prompt and tool definitions with cache_control to cache both independently. When tools are included in a request, their definitions are placed before the system prompt in the cache prefix order. Using multiple breakpoints allows you to cache different layers of context — for example, cached tools shared across all calls plus a cached system prompt specific to a conversation thread.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "cache-multiple-breakpoints",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  {
    id: "caching-07",
    text: "Cache usage is tracked in the API response's usage object. The fields cache_creation_input_tokens and cache_read_input_tokens indicate whether a cache was written or read in a given request. A non-zero cache_creation_input_tokens means a new cache entry was created. A non-zero cache_read_input_tokens means a cache hit occurred and those tokens were served from cache at 10% cost. If both are zero, no caching occurred — possibly because the prompt was below the minimum token threshold or the prefix changed.",
    metadata: {
      source: "prompt-caching-docs",
      topic: "cache-usage-tracking",
      url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
    },
  },

  // ── Tool Use ──────────────────────────────────────────────────────────────

  {
    id: "tooluse-01",
    text: "Tool use (also called function calling) allows Claude to interact with external tools, APIs, and data sources. You define tools with a name, description, and JSON Schema for the input parameters. Claude decides when to use a tool based on the user's request and the tool descriptions you provide. Tool use enables Claude to retrieve real-time information, perform computations, interact with external services, and take actions beyond what it can do with its training knowledge alone.",
    metadata: {
      source: "tool-use-docs",
      topic: "tool-use-overview",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview",
    },
  },

  {
    id: "tooluse-02",
    text: "To implement tool use, include a tools array in your API request. Each tool object requires a name (unique identifier), description (explains when and how to use the tool), and input_schema (JSON Schema object defining the expected parameters). When Claude decides to use a tool, it responds with a stop_reason of 'tool_use' and includes a tool_use content block with the tool name, tool_use_id, and the input arguments as a JSON object matching your schema.",
    metadata: {
      source: "tool-use-docs",
      topic: "tool-definition",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },

  {
    id: "tooluse-03",
    text: "The tool use loop requires multiple API calls. After Claude responds with a tool_use block, you execute the tool in your own code and send back the result. You add the assistant's response to the messages array, then add a user message containing a tool_result content block with the tool_use_id and the result content. Claude then continues the conversation incorporating the tool result. This back-and-forth continues until Claude produces an end_turn response with no further tool calls.",
    metadata: {
      source: "tool-use-docs",
      topic: "tool-loop",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },

  {
    id: "tooluse-04",
    text: "Tool input schemas use JSON Schema to define the parameters Claude should provide when calling a tool. The top-level input_schema must have type 'object'. Each property in the schema can have a type (string, number, boolean, array, object), description (crucial for Claude to understand what to pass), and enum (for restricted value sets). Mark required parameters in a required array. Well-written descriptions in the schema are as important as the tool description itself — they guide Claude to pass the right values.",
    metadata: {
      source: "tool-use-docs",
      topic: "tool-input-schema",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },

  {
    id: "tooluse-05",
    text: "Parallel tool use allows Claude to call multiple tools simultaneously when they are independent. Claude may respond with multiple tool_use blocks in a single response. You execute all tools in parallel and return all results in a single user message containing multiple tool_result blocks. This reduces latency compared to sequential tool calling. You can control parallel tool use with the tool_choice parameter: 'auto' (default), 'any' (force at least one tool call), or 'tool' (force a specific tool).",
    metadata: {
      source: "tool-use-docs",
      topic: "parallel-tools",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },

  {
    id: "tooluse-06",
    text: "Tool descriptions are the most important factor in guiding Claude to use tools correctly. A good description explains what the tool does, when to use it (and when NOT to use it), what the expected inputs and outputs are, and any important constraints or side effects. Vague descriptions cause Claude to call tools incorrectly or skip them when they would be appropriate. Treat tool descriptions as contracts between you and the model — precision and completeness directly improve reliability.",
    metadata: {
      source: "tool-use-docs",
      topic: "tool-description-quality",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },

  {
    id: "tooluse-07",
    text: "Tool results can contain either a string or an array of content blocks. For simple results, a plain string is sufficient. For richer responses, you can return structured content including text and image blocks. If a tool execution fails, set is_error to true in the tool_result block and include a descriptive error message. Claude will incorporate the error information and may attempt to recover, ask for clarification, or report the error to the user depending on context.",
    metadata: {
      source: "tool-use-docs",
      topic: "tool-result",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },

  {
    id: "tooluse-08",
    text: "Combining tool use with prompt caching is powerful for agents that share the same tool definitions across many calls. Mark the tools array with cache_control on the last tool to cache the entire tool set. On subsequent calls with the same tools, the tool definitions are served from cache at 10% cost. This is especially valuable when you have large tool input schemas with detailed descriptions, or when you have many tools defined (e.g., 50+ tools for a complex agent).",
    metadata: {
      source: "tool-use-docs",
      topic: "tools-with-caching",
      url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use",
    },
  },
];
