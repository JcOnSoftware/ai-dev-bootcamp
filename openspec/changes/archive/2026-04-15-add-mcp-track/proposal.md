# Proposal: add-mcp-track

**Change:** `add-mcp-track`
**Phase:** proposal
**Date:** 2026-04-14
**Artifact store:** hybrid (engram + openspec)

---

## Intent

Agregar el sexto y último track del bootcamp — `06-mcp` — con 5 ejercicios progresivos que enseñan el Model Context Protocol end-to-end: server, client, resources, prompts, bridge a Claude, y un loop completo agent-with-MCP-tools. El track cierra la ruta de 6 tracks (Foundations → Caching → Tool use → RAG → Agents → MCP) y deja al learner con skills production-relevant para extensions de Claude Desktop, integraciones de Claude Code y tool servers remotos. Transforma el "agent con tools hardcoded" del track 05 en un "agent que descubre y usa tools remotos dinámicamente".

## Problem

Después de Agents, el learner puede armar loops iterativos con tools in-process. Lo que **no puede** es construir tool servers reusables que Claude Desktop, Claude Code o agents remotos consuman. MCP es el protocolo industry-standard para esto — el que usan todas las integraciones actuales del ecosistema Claude. Sin MCP, cualquier tool que el learner arme queda atrapada en su propio `solution.ts`: no se puede empaquetar, ni compartir, ni publicar, ni conectar a otro host. MCP es también el acto de cierre natural del bootcamp porque **reformula** todo lo aprendido: los tools de 03 y 05 se vuelven tools MCP; el agent loop de 05 se vuelve un MCP client; el concepto de "herramienta remota" desbloquea el mundo real.

## Proposed solution

Nuevo track `code/packages/exercises/06-mcp/` con **5 ejercicios progresivos** + un **fixture compartido** `research-server.ts` que reusa `05-agents/fixtures/research-tools.ts` → `04-rag/fixtures/docs-chunks.ts` (continúa la convención de reuse cross-track). Intro de 25 minutos (01), capstone de 45 minutos (05). **Todos los tests** usan `InMemoryTransport.createLinkedPair()` — cero subprocesses, determinismo total, cero risk de zombie processes. **Solutions** usan `StdioClientTransport` / `StdioServerTransport` para que el learner vea el patrón real production-ready. **Cero cambios** a harness, CLI o `cost.ts`. Una sola adición de deps: `@modelcontextprotocol/sdk@^1.29.0` + `zod@^3.25.0` al workspace root. Bilingüe `es`/`en` desde día uno.

## Scope (in)

- **5 ejercicios** en `code/packages/exercises/06-mcp/`:
  - `01-mcp-server-basics` — armar un `McpServer` mínimo con stdio transport; registrar un tool; entender el ciclo request/response JSON-RPC
  - `02-mcp-client-connect` — conectar un `Client` MCP a un server, hacer handshake, listar tools disponibles, invocar un tool remoto
  - `03-resources-and-prompts` — exponer resources (lectura) y prompts (templates reusables) además de tools; el learner ve las tres primitivas del protocolo
  - `04-tools-with-mcp` — bridge manual MCP ↔ Claude: traducir `tool.inputSchema` → `tool.input_schema`, ejecutar `tool_use` de Claude vía `mcpClient.callTool()`, devolver resultado como `tool_result`
  - `05-mcp-in-agent-loop` — capstone: agent loop completo del track 05 pero con tools descubiertos dinámicamente vía MCP client, server separado vía InMemory transport
- **Fixture compartido**: `code/packages/exercises/06-mcp/fixtures/research-server.ts` — canonical MCP server con `search_docs` + `read_chunk` construidos sobre `05-agents/fixtures/research-tools.ts` que a su vez lee `04-rag/fixtures/docs-chunks.ts`. Exporta una factory `createResearchServer()` retornando un `McpServer` configurado.
- **Deps nuevas (workspace root `code/package.json`)**: `@modelcontextprotocol/sdk: ^1.29.0` + `zod: ^3.25.0` (peer requerida por el SDK para schemas de tool inputs).
- **Bilingüe `es/exercise.md` + `en/exercise.md`** para los 5 ejercicios desde el inicio (10 archivos).
- **`meta.json`** por ejercicio con `track: "06-mcp"`, `valid_until: "2026-10-15"`, `locales: ["es", "en"]`, y cadena `requires`: 01 → `["01-first-call"]`, 02 → `["01-mcp-server-basics"]`, 03 → `["02-mcp-client-connect"]`, 04 → `["03-resources-and-prompts"]`, 05 → `["04-tools-with-mcp"]`.
- **Docs comment header** en cada `starter.ts` / `solution.ts` con URLs canónicas: `modelcontextprotocol.io/...` para MCP, `docs.claude.com/...` para Anthropic (exercises 04-05).
- **README + CONTRIBUTING update** mencionando las nuevas deps (SDK + zod), zero env vars nuevos (solo `ANTHROPIC_API_KEY` para 04-05, ya existente).

## Scope (out)

- **Transport HTTP / SSE** — stdio only por pedagogía (matches Claude Desktop / Claude Code conventions). HTTP queda para un futuro track avanzado.
- **Autenticación** — MCP soporta OAuth-style auth para servers remotos; fuera de scope v1.
- **Subprocess lifecycle management** más allá de lo que InMemoryTransport provee en tests — no enseñamos manejo de procesos zombie, signal handling, etc.
- **Custom notifications / server-initiated events** — MCP los soporta, pero complican la mental model inicial. Fuera de v1.
- **Anthropic SDK MCP helper** (si existe / cuando exista) — el manual bridging en 04 es el camino pedagógico; misma filosofía que 05-agents (DIY loop vs Agent SDK).
- **Claude Desktop integration setup** — se menciona solo como "Concepto extra" en 01; el bootcamp no configura Claude Desktop.
- **Multi-server orchestration** — un servidor a la vez en los 5 ejercicios.
- **Cambios a `harness.ts`, `cost.ts`, CLI (`aidev`)** — listing dinámico por `trackSlug` hace que `06-mcp` aparezca solo.
- **Nuevos env vars** — cero.

## Key decisions

1. **5 ejercicios fijos**: `01-mcp-server-basics`, `02-mcp-client-connect`, `03-resources-and-prompts`, `04-tools-with-mcp`, `05-mcp-in-agent-loop`. Progresión server → client → 3 primitivas → bridge a Claude → agent loop completo.
2. **SDK oficial (`@modelcontextprotocol/sdk@^1.29.0`) vs DIY JSON-RPC**: enseñamos los patterns canónicos que el learner va a usar en producción. DIY JSON-RPC no aporta valor pedagógico — MCP no es "aprender JSON-RPC", es "aprender el protocolo de tool servers".
3. **`zod@^3.25.0` como peer**: `McpServer.tool()` espera schemas Zod; el SDK auto-deriva JSON Schema desde ellos. Agregado una vez al workspace root como single source of truth para evitar conflictos de versión.
4. **Transport stdio en SOLUTIONS** — matches Claude Desktop / Claude Code conventions, es el transport real que usan los learners en producción.
5. **`InMemoryTransport.createLinkedPair()` en TESTS** — cero subprocesses, determinismo, no hay risk de zombie processes, tests corren rápido. El learner ve ambos transports: real en solution, in-memory en test.
6. **Manual bridge en 04 (vs SDK helper)**: 5 líneas de traducción (MCP `tool.inputSchema` → Claude `tool.input_schema`; Claude `tool_use` → `mcpClient.callTool(...)`). Filosofía DIY: el learner **ve** la traducción, entiende que el MCP tool schema ≠ Claude tool schema, y sabe qué hace cualquier helper futuro bajo el capot.
7. **Fixture compartido cross-track**: `06-mcp/fixtures/research-server.ts` → `05-agents/fixtures/research-tools.ts` → `04-rag/fixtures/docs-chunks.ts`. Continúa la convención establecida en 05-agents de que fixtures pueden cruzar track boundaries cuando el dominio lo justifica. El learner ve cómo "tools in-process" se convierten en "tool server remoto" reusando la misma lógica de negocio.
8. **Modelo `claude-haiku-4-5-20251001`** para generación en 04 y 05 — coherente con cost discipline bootcamp-wide. Estimación de costo total del track por learner: **< $0.02** (el track más barato — 01/02/03 son pure protocol, cero llamadas a Anthropic).
9. **Bilingüe `es`/`en` desde día uno** — 10 `exercise.md` al cierre del track.
10. **Prominent `console.error`-not-`console.log` comment en cada server starter**: escribir a stdout corrompe el frame JSON-RPC de stdio. Diagnóstico va por stderr. Es el gotcha #1 de MCP servers — debe estar en el comment header de cada server starter y en el spec.
11. **`command: "bun"` para `StdioClientTransport`** en este proyecto (Bun-native). **NO `node`**. Comentado explícitamente en starter de 02.
12. **`.js` subpath imports** (`@modelcontextprotocol/sdk/server/mcp.js`, `.../client/index.js`, etc.): el SDK expone subpaths con extensión `.js` que resuelven correctamente bajo Bun gracias al export wildcard `"./*"` del package. Documentado en cada starter.
13. **Zero env vars nuevos** — solo `ANTHROPIC_API_KEY` para 04 y 05 (ya existente). 01-03 son puramente protocol (cero llamadas a Anthropic).
14. **Zero runtime changes** — harness, `cost.ts`, `aidev` CLI intactos. `list` agrupa por `trackSlug` dinámicamente.

## Risks & mitigations

- **Riesgo — SDK en mayor evolución (1.x pre-2.0)**: breaking changes posibles entre minors.
  - **Mitigación**: `valid_until: "2026-10-15"` en cada `meta.json` + weekly health-check CI que corre la suite completa del track contra el API real semanalmente. Si la CI falla por cambio de SDK, tenemos signal temprano.
- **Riesgo — Bun + SDK compatibility edge cases**: exploration confirmó que 1.29.0 funciona bajo Bun, pero algún subpath podría tener issues no detectados.
  - **Mitigación**: el primer task de apply verifica el import chain end-to-end. Si algún subpath rompe, pineamos a una versión menor conocida.
- **Riesgo — Test flakiness si un learner elige `StdioClientTransport` para tests en vez de `InMemoryTransport`**: subprocess lifecycle no determinista, zombie processes, race conditions en beforeAll/afterAll.
  - **Mitigación**: docs + starter comments recomiendan fuertemente `InMemoryTransport.createLinkedPair()` para tests. Los `tests.test.ts` de referencia lo usan exclusivamente. Mencionado explícitamente en `exercise.md`.
- **Riesgo — conflictos de versión de `zod`** si otros paquetes del monorepo ya lo traen transitivamente.
  - **Mitigación**: agregar `zod: ^3.25.0` una sola vez al workspace root `code/package.json`; Bun workspaces deduplican. Verificar en apply que no aparezcan múltiples instancias.
- **Riesgo — `console.log` corrompe stdio**: un learner puede logear a stdout en el server y romper JSON-RPC silenciosamente (el client ve un parse error confuso).
  - **Mitigación**: comment prominente en **cada** server starter ("STDOUT IS RESERVED FOR JSON-RPC — use `console.error` for diagnostics"). El spec enuncia esto como invariante del contrato de server. Failure mode es recuperable: el test falla con un JSON parse error claro.
- **Riesgo — Manual bridging en 04 induce confusión** si el learner mezcla `tool.inputSchema` (MCP) con `tool.input_schema` (Claude).
  - **Mitigación**: el bridge es literalmente 5 líneas, todas comentadas paso a paso en `solution.ts`. `exercise.md` muestra la tabla de mapping side-by-side. El test assertea que los dos schemas son equivalentes estructuralmente.

## Success criteria

- Los 5 ejercicios pasan `aidev verify <id> --solution` — 01/02/03 corren sin `ANTHROPIC_API_KEY`, 04/05 lo requieren.
- `bun test` desde `code/` permanece verde (existentes + nuevos).
- Costo total del track por learner **< $0.02** — el track más barato del bootcamp.
- `aidev list` muestra `▸ 06-mcp` auto-agrupado con los 5 ejercicios, sin tocar CLI.
- Weekly health-check CI pasa con los secrets existentes (solo `ANTHROPIC_API_KEY`).
- Cada ejercicio enseña **exactamente un concepto atómico** del protocolo (verificable leyendo el `exercise.md`).
- Bilingüe completo: 10 `exercise.md` (5 `es` + 5 `en`).
- Gotchas críticos (stdout contamination, `command: "bun"`, `.js` subpaths) documentados en starter comments de los ejercicios afectados.

## Dependencies

- `code/packages/exercises/05-agents/fixtures/research-tools.ts` debe existir — **confirmado en commit `8b44a14`**.
- `code/packages/exercises/04-rag/fixtures/docs-chunks.ts` debe existir con `.text` / `.metadata.topic` / `.id` — **confirmado en commit `2f01664`**.
- Nuevas npm deps al workspace root: `@modelcontextprotocol/sdk@^1.29.0` + `zod@^3.25.0`. Cero env vars nuevos.

## Next steps

1. **Specs + design en paralelo** (via orchestrator):
   - `sdd-spec` → delta spec: nueva capability `mcp-track` con requirements por ejercicio (server contract, client handshake, resources/prompts semantics, bridge mapping, agent+MCP loop invariants, stdio stdout invariant).
   - `sdd-design` → ADRs (SDK vs DIY, stdio vs HTTP, InMemory vs Stdio en tests, manual bridge vs helper, cross-track fixture reuse, zod en root, `console.error` invariant).
2. **Tasks breakdown** (`sdd-tasks`) — checklist por ejercicio (01→05) + fixture compartido + root deps + README/CONTRIBUTING updates.
3. **Apply** (`sdd-apply`) por batches (Strict TDD).
4. **Verify + archive**.

---

## skill_resolution: injected
