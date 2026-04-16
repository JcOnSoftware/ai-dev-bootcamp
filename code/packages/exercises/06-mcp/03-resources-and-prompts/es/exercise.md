# Ejercicio 03 — Resources y Prompts

## Concepto

MCP expone tres primitivos de servidor:

| Primitivo | Qué es | Cómo se accede |
|-----------|--------|----------------|
| **Tools** | Acciones que el cliente ejecuta | `callTool()` |
| **Resources** | Endpoints de datos (URIs) | `readResource()` |
| **Prompts** | Templates de mensajes reutilizables | `getPrompt()` |

**Resources**: usan un esquema URI propio (ej: `docs://index`). Pueden ser estáticos (URI fija) o dinámicos (URI template con placeholders `{id}`). El cliente descubre los recursos disponibles via `listResources()`.

**Prompts**: templates de mensajes que aceptan argumentos Zod. El servidor los renderiza a una lista de `messages` que el cliente puede inyectar en su contexto. Son reusables y parametrizables.

## Docs y referencias

- Resources: https://modelcontextprotocol.io/docs/concepts/resources
- Prompts: https://modelcontextprotocol.io/docs/concepts/prompts
- Arquitectura: https://modelcontextprotocol.io/docs/concepts/architecture

## Tu tarea

Implementá `buildDocsResourceServer()` en `starter.ts`:

1. Creá un `new McpServer({ name: "docs-server", version: "1.0.0" })`.
2. Registrá un resource estático en `"docs://index"` con `mimeType: "text/plain"` que retorne algo de texto.
3. Registrá un prompt `"summarize_docs"` con `argsSchema: { topic: z.string() }` que retorne un mensaje de usuario que contenga el topic.
4. Retorná el servidor.

## Cómo verificar

```bash
AIDEV_TARGET=starter aidev verify 03-resources-and-prompts   # debe fallar
AIDEV_TARGET=solution aidev verify 03-resources-and-prompts  # debe pasar
```

## Qué validan los tests

- `listResources()` incluye una entrada con `uri === "docs://index"`.
- `listPrompts()` incluye una entrada con `name === "summarize_docs"`.
- `getPrompt({ name: "summarize_docs", arguments: { topic: "caching" } })` retorna un mensaje que contiene `"caching"`.

## Concepto extra

Sampling — el tercer primitivo de dirección MCP. Mientras Tools y Resources son server→client, el Sampling es client→server→LLM: el servidor le pide al cliente que llame al LLM en su nombre via `server.server.createMessage()`. Esto permite que los servidores MCP hagan inferencia sin necesitar su propia API key.
