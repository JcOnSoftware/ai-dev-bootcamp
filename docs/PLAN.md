# ai-dev-bootcamp — Plan inicial

## Contexto

Los devs con experiencia (5+ años) están perdidos entrando al mundo AI. Los cursos existentes son o muy básicos ("prompt engineering para principiantes") o caros y en video. Los devs senior quieren aprender haciendo: código que corre, tests que pasan, progreso medible — estilo `rustlings`.

Este proyecto construye una CLI interactiva open source que enseña conceptos AI (tokens, prompt caching, tool use, RAG, agents, MCP) a través de ejercicios progresivos con tests automáticos, ejecutados contra APIs reales. Objetivo: que un dev senior pueda ir de "nunca toqué un LLM" a "puedo construir un agente con tool use y MCP" en un fin de semana de trabajo real.

## Decisiones tomadas (pre-plan)

- **Lenguaje v1**: Solo TS/JS (runtime Bun). Foco > cobertura.
- **Provider v1**: Claude-first (Anthropic SDK). Multi-provider en v2 como ejercicios comparativos.
- **Actualización**: Ejercicios versionados con `valid_until` + PRs de comunidad + CI semanal que corre ejercicios contra APIs reales para detectar breakage.
- **Validación**: Tests + assertions sobre la respuesta del modelo (adaptado a no-determinismo).

## Estructura del repositorio (workspace del proyecto)

```
new-tool/ai-dev-bootcamp/
├── code/       # Todo el código fuente del proyecto (monorepo Bun)
├── docs/       # Documentación: este plan, contributing, arquitectura, ADRs
├── notes/      # Notas de trabajo, ideas sueltas, decisiones pendientes
└── research/   # Investigación: análisis de rustlings, competencia, benchmarks
```

## Arquitectura del código (dentro de `code/`)

```
code/
├── packages/
│   ├── cli/              # Binario: `aidev` — TUI interactivo
│   ├── runner/           # Ejecuta ejercicios, corre tests, reporta progreso
│   ├── exercises/        # Contenido: ejercicios versionados
│   │   ├── 01-foundations/
│   │   │   ├── 01-first-call/
│   │   │   │   ├── exercise.md        # Enunciado + concepto
│   │   │   │   ├── starter.ts         # Código incompleto
│   │   │   │   ├── solution.ts        # Referencia (oculta al user)
│   │   │   │   ├── tests.ts           # Assertions
│   │   │   │   └── meta.json          # { version, valid_until, concepts }
│   │   │   └── ...
│   │   ├── 02-prompt-caching/
│   │   ├── 03-structured-outputs/
│   │   ├── 04-tool-use/
│   │   ├── 05-rag-basics/
│   │   ├── 06-agents/
│   │   └── 07-mcp-server/
│   └── shared/           # Types, utils, API client wrapper
├── .github/workflows/
│   └── exercises-health.yml  # CI semanal: corre soluciones contra API real
└── package.json          # Bun workspaces root
```

## Stack

- **Runtime**: Bun (rápido, nativo TS, built-in test runner)
- **CLI/TUI**: `@clack/prompts` + `chalk`
- **AI SDK**: `@anthropic-ai/sdk` oficial
- **Tests**: `bun:test` built-in
- **Monorepo**: Bun workspaces (sin Nx/Turbo — YAGNI en v1)
- **Distribución**: `npm install -g ai-dev-bootcamp` → binario `aidev`

## Flujo de usuario

```
$ aidev init              # Setup: pide ANTHROPIC_API_KEY, guarda en ~/.aidev/config
$ aidev                   # Lanza TUI: muestra tracks, progreso, próximo ejercicio
$ aidev run 01-first-call # Abre ejercicio, muestra enunciado, espera edits
$ aidev verify            # Corre tests del ejercicio actual
$ aidev hint              # Pista progresiva (3 niveles)
$ aidev solution          # Muestra solución (marca ejercicio como "viste la respuesta")
$ aidev progress          # Dashboard: qué tracks completaste, % avance
```

## Tracks propuestos (v1)

1. **Foundations** — primera llamada, parámetros (temperature, max_tokens), streaming, tokens y costos
2. **Prompt caching** — cuándo usarlo, cómo medir hit rate, cache_control breakpoints
3. **Structured outputs** — JSON mode, validación con Zod, manejo de errores
4. **Tool use** — definir tools, tool_choice, loops de tool calling, errores
5. **RAG básico** — embeddings, vector search simple (sin DB pesada, in-memory), retrieval + generation
6. **Agents** — multi-turn, state management, cuándo agent vs pipeline
7. **MCP server** — construir un MCP server propio, exponer tools, conectarlo a Claude Desktop

Cada track: 3-6 ejercicios progresivos. Total estimado v1: ~30 ejercicios.

## Modelo de ejercicio (contrato)

Cada ejercicio tiene `meta.json`:
```json
{
  "id": "01-first-call",
  "version": "1.0.0",
  "valid_until": "2026-10-01",
  "concepts": ["api-call", "messages-format"],
  "estimated_minutes": 10,
  "requires": []
}
```

Tests siguen patrón:
```ts
import { test, expect } from "bun:test";
import { runUserCode } from "@runner/harness";

test("respuesta contiene saludo", async () => {
  const { response } = await runUserCode("./starter.ts");
  expect(response.content[0].text.toLowerCase()).toMatch(/hola|hello/);
});

test("usó el modelo correcto", async () => {
  const { apiCall } = await runUserCode("./starter.ts");
  expect(apiCall.model).toContain("claude");
});
```

El `runner` intercepta la llamada al SDK (proxy) para inspeccionar tanto el request como la response — así validamos estructura sin depender 100% del contenido no-determinístico.

## Estrategia de mantenimiento

1. **CI semanal** (`exercises-health.yml`): corre `solution.ts` de cada ejercicio contra la API real. Si falla → issue automático con label `exercise-broken`.
2. **`valid_until`**: si hoy > valid_until, el CLI muestra warning "este ejercicio puede estar desactualizado, PRs bienvenidas".
3. **Contribución**: doc clara (`CONTRIBUTING.md`) con template de ejercicio nuevo. Script `aidev scaffold-exercise` que genera el boilerplate.
4. **Versionado semántico por ejercicio**: si cambia el concepto → bump major, progreso del user se resetea para ese ejercicio.

## Archivos críticos a crear (milestone 1)

- `code/packages/cli/src/index.ts` — entry point, comandos
- `code/packages/cli/src/commands/{init,run,verify,hint,progress}.ts`
- `code/packages/runner/src/harness.ts` — ejecuta código del user, intercepta SDK
- `code/packages/runner/src/progress.ts` — lee/escribe `~/.aidev/progress.json`
- `code/packages/exercises/01-foundations/01-first-call/{exercise.md,starter.ts,solution.ts,tests.ts,meta.json}`
- `docs/CONTRIBUTING.md` — guía para agregar ejercicios
- `code/.github/workflows/exercises-health.yml` — CI semanal

## Roadmap de entrega

- **Milestone 1 (MVP)**: CLI básico + 1 track (Foundations, 5 ejercicios) + harness + tests. Goal: dogfood yourself.
- **Milestone 2**: Tracks Prompt caching + Structured outputs + Tool use. Blog post de lanzamiento.
- **Milestone 3**: RAG + Agents + MCP. CI de health checks.
- **Milestone 4**: Multi-provider (OpenAI, Gemini) como tracks comparativos. Python como segundo lenguaje (si hay tracción).

## Enfoque inicial (decidido)

**Opción 2**: construir primero el **harness del runner + primer ejercicio completo**. El harness es el corazón — si el contrato de interceptar el SDK y validar de forma confiable no funciona, todos los ejercicios sufren. Validamos el núcleo, después escalamos al resto.

Pasos concretos inmediatos:
1. Init monorepo Bun mínimo en `code/` (workspace root + packages/runner + packages/exercises)
2. Implementar `runner/src/harness.ts` — proxy del Anthropic SDK que captura request + response
3. Crear ejercicio `01-first-call` completo con tests
4. Correr los tests end-to-end contra la API real con una API key propia
5. Recién entonces escalar al CLI, progress tracking y más ejercicios

## Verificación end-to-end (milestone 1)

1. Clonar repo, `cd code && bun install`
2. `bun run packages/cli/src/index.ts init` → guarda API key en config
3. `bun run packages/cli/src/index.ts` → TUI muestra track Foundations
4. Abrir `packages/exercises/01-foundations/01-first-call/starter.ts`, completar
5. `bun run packages/cli/src/index.ts verify` → tests corren contra API real, pasan
6. `bun test packages/exercises/**/*.test.ts` → CI health check corre toda la suite
7. Probar `aidev hint` y `aidev solution`

## Riesgos y mitigaciones

- **Costos de API para usuarios**: usar modelo Haiku por defecto en ejercicios, documentar costo estimado por track (~$0.50-$2 completar todo v1).
- **Tests no-determinísticos**: assertions sobre estructura (modelo usado, tools llamadas, formato JSON) antes que sobre contenido literal. Usar regex flexibles.
- **Contenido obsoleto**: `valid_until` + CI semanal + warnings en CLI.
- **Contribución baja al inicio**: el proyecto tiene que ser tan bueno que TÚ lo uses — dogfooding primero, comunidad después.
