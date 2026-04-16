# Exercise 03 — Resources and Prompts

## Concept

MCP exposes three server primitives:

| Primitive | What it is | How to access |
|-----------|-----------|---------------|
| **Tools** | Actions the client executes | `callTool()` |
| **Resources** | Data endpoints (URIs) | `readResource()` |
| **Prompts** | Reusable message templates | `getPrompt()` |

**Resources**: use a custom URI scheme (e.g. `docs://index`). Can be static (fixed URI) or dynamic (URI templates with `{id}` placeholders). The client discovers available resources via `listResources()`.

**Prompts**: message templates that accept Zod arguments. The server renders them into a list of `messages` that the client can inject into context. They're reusable and parameterizable.

## Docs and references

- Resources: https://modelcontextprotocol.io/docs/concepts/resources
- Prompts: https://modelcontextprotocol.io/docs/concepts/prompts
- Architecture: https://modelcontextprotocol.io/docs/concepts/architecture

## Your task

Implement `buildDocsResourceServer()` in `starter.ts`:

1. Create a `new McpServer({ name: "docs-server", version: "1.0.0" })`.
2. Register a static resource at `"docs://index"` with `mimeType: "text/plain"` that returns some text.
3. Register a prompt `"summarize_docs"` with `argsSchema: { topic: z.string() }` that returns a user message containing the topic.
4. Return the server.

## How to verify

```bash
AIDEV_TARGET=starter aidev verify 03-resources-and-prompts   # should fail
AIDEV_TARGET=solution aidev verify 03-resources-and-prompts  # should pass
```

## What the tests validate

- `listResources()` includes an entry with `uri === "docs://index"`.
- `listPrompts()` includes an entry with `name === "summarize_docs"`.
- `getPrompt({ name: "summarize_docs", arguments: { topic: "caching" } })` returns a message containing `"caching"`.

## Extra concept

Sampling — the third MCP direction primitive. While Tools and Resources go server→client, Sampling goes client→server→LLM: the server asks the client to call the LLM on its behalf via `server.server.createMessage()`. This lets MCP servers do inference without needing their own API key.
