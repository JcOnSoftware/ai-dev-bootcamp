# ai-dev-bootcamp

> [🇬🇧 Read this in English →](./README.md)

**Rustlings para devs de AI.** Bootcamp hands-on de AI engineering para developers con experiencia — aprendé a construir sistemas de AI reales con 60 ejercicios progresivos y tests automáticos contra APIs reales.

Elegí tu provider: **Anthropic (Claude)** o **OpenAI (GPT)**. Cada uno tiene 6 tracks x 5 ejercicios, bilingues (inglés + español), con tests que validan contra la API real.

Los recursos típicos para aprender AI son o muy básicos ("prompt engineering para principiantes") o muy abstractos (cursos de 4 horas en video sobre teoría de LLMs). Este proyecto es para lo opuesto: devs con 5+ años de experiencia que saben programar pero todavía no construyeron nada serio con AI. Aprendés **escribiendo código, corriéndolo contra la API real y viendo tests pasar** — no mirando a alguien más tipear.

## El currículum — 2 providers, 60 ejercicios

### Anthropic (Claude) — 6 tracks, 30 ejercicios

| Track | Ejercicios |
|-------|-----------|
| **01 — Foundations** | Primera llamada, params, streaming, tokens & cost, error handling |
| **02 — Prompt caching** | `cache_control`, métricas de hit, multi-breakpoint, TTL extendido, caching + tools |
| **03 — Tool use** | Definir tools, tool loop, router multi-tool, modos de `tool_choice`, parallel tools |
| **04 — RAG** | Embeddings (Voyage AI), vector search, chunking, pipeline de retrieval, citations |
| **05 — Agents** | Agent loop, stop conditions, state management, multi-step planning, self-correction |
| **06 — MCP** | Server MCP, cliente, recursos + prompts, tools MCP → Claude, agent loop completo |

### OpenAI (GPT) — 6 tracks, 30 ejercicios

| Track | Ejercicios |
|-------|-----------|
| **01 — Foundations** | Primera chat completion, selección de modelo, tokens & cost, streaming deltas, structured outputs |
| **02 — Context management** | Límites de context window, truncation, conversation memory, summarization loops, monitoreo de cached tokens |
| **03 — Function calling** | JSON schema tools, tool calls loop, multi-tool routing, ejecución paralela, control de tool choice |
| **04 — RAG** | Embeddings de OpenAI, chunking strategies, vector search, pipeline de retrieval, citations & grounding |
| **05 — Agents** | Planner-executor, razonamiento multi-step, state management, self-correction, orquestación de tools |
| **06 — Evals & production** | Evaluación de prompts, regression testing, scoring de outputs, testing con datasets, guardrails & validación |

Cada ejercicio tiene un `starter.ts` (TODOs para implementar), un `solution.ts` (referencia), `tests.test.ts` (asserts estructurales contra la API real) y `exercise.md` bilingue (inglés + español).

## Quick start

Requiere [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows) y [VS Code](https://code.visualstudio.com/) (para `aidev open` y `aidev next`).

**API key** — necesitás una según el provider que elijas:
- **Anthropic**: <https://console.claude.com/settings/keys>
- **OpenAI**: <https://platform.openai.com/api-keys>

> El track 04 de Anthropic (RAG) también necesita una key de Voyage AI (<https://dash.voyageai.com/api-keys>) — free tier de 200M tokens/mes.

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
```

Configurá tu API key — elegí **un** método:

```bash
# Anthropic:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# OpenAI:
echo "OPENAI_API_KEY=sk-..." > .env

# O exportar en tu shell:
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

### Habilitar el comando `aidev`

```bash
# Mac / Linux:
bun run setup

# Windows PowerShell:
powershell -File bin/setup.ps1
```

### Primera ejecución

```bash
aidev init                  # provider + API key + idioma (en/es)
aidev list                  # explorá ejercicios → elegí uno → se abre en VS Code
aidev next                  # saltá al siguiente ejercicio incompleto
```

## Trabajar con ejercicios

| Comando | Qué hace |
|---------|----------|
| `aidev list` | Explorá ejercicios por track, elegí uno y se abre |
| `aidev open <id>` | Abrí un ejercicio específico en VS Code |
| `aidev open <id> --solution` | Ver la solución de referencia |
| `aidev open` | Selector interactivo — navegá y elegí |
| `aidev next` | Abrí automáticamente el siguiente ejercicio incompleto |
| `aidev verify <id>` | Corré tests contra tu implementación |
| `aidev run <id>` | Ejecutá y mirá la salida del modelo |
| `aidev run <id> --stream-live` | Mirá los tokens llegar en tiempo real |
| `aidev progress` | Dashboard de completitud por track |
| `aidev init` | Reconfigurar, resetear progreso, o actualizar ejercicios |

**Flag de provider**: agregá `--provider anthropic` o `--provider openai` a cualquier comando para cambiar tu default.

**Flag de idioma**: agregá `--locale es` o `--locale en` a cualquier comando.

> **Editor**: VS Code (`code`) por default. Cambialo con las variables de entorno `$VISUAL` o `$EDITOR`.

## Costo

Los ejercicios usan los modelos más baratos por default:
- **Anthropic**: Claude Haiku — bootcamp completo bajo $0.10
- **OpenAI**: gpt-4.1-nano — bootcamp completo bajo $0.10
- Embeddings de Voyage (Anthropic Track 04): free tier cubre todo ($0)
- Cada `aidev run` imprime los tokens exactos y el costo estimado

## Estado del proyecto

- **v2.0**: 2 providers x 6 tracks x 5 ejercicios = 60 total. CLI completa + contenido bilingue en/es.
- **Distribución**: git-clone-first (modelo rustlings) — los ejercicios SON el repo.

Seguí el progreso en [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues).

## Contribuir

Ejercicios nuevos, bug fixes, traducciones — todo bienvenido. Mirá **[CONTRIBUTING.md](./CONTRIBUTING.md)** para el setup, tests, convenciones de commits y cómo escribir un ejercicio nuevo según el contrato.

## Licencia

[MIT](./LICENSE)
