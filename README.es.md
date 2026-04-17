# ai-dev-bootcamp

> [🇬🇧 Read this in English →](./README.md)

**Rustlings para devs de AI.** Bootcamp hands-on de AI engineering para developers con experiencia — aprendé a construir sistemas de AI reales con ejercicios progresivos y tests automáticos contra APIs reales.

Elegí tu provider: **Anthropic (Claude)**, **OpenAI (GPT)** o **Google (Gemini)**. Anthropic y OpenAI tienen 6 tracks x 5 ejercicios cada uno (60 en total). El soporte de Gemini ya está vivo (v3.0) — los ejercicios van saliendo track por track en PRs siguientes. Todos los ejercicios son bilingues (inglés + español), con tests que validan contra la API real.

Los recursos típicos para aprender AI son o muy básicos ("prompt engineering para principiantes") o muy abstractos (cursos de 4 horas en video sobre teoría de LLMs). Este proyecto es para lo opuesto: devs con 5+ años de experiencia que saben programar pero todavía no construyeron nada serio con AI. Aprendés **escribiendo código, corriéndolo contra la API real y viendo tests pasar** — no mirando a alguien más tipear.

## El currículum — 3 providers soportados

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

### Google (Gemini) — soporte de provider activo, ejercicios saliendo

v3.0 shippea la infra multi-provider para Gemini (SDK `@google/genai`, harness con streaming + embeddings, estimación de costo, CLI bilingue). Los ejercicios salen track por track en PRs separados. Tracks planeados:

| Track | Foco |
|-------|------|
| **01 — Foundations** | `generateContent`, selección de modelo, token usage, streaming, structured output |
| **02 — Context caching** | Caching implícito + explícito con `ai.caches` — modo dual único de Gemini |
| **03 — Function calling** | `functionDeclarations`, tool loops, JSON mode, parallel tools |
| **04 — RAG** | `embedContent` con `gemini-embedding-001` (3072 dims), cosine similarity, retrieval |
| **05 — Agents** | Agent loops, razonamiento multi-step, planner-executor, memoria |
| **06 — Live multimodal** | Live API (audio-to-audio realtime sobre WebSocket) — único de Gemini |

Seguí el progreso en [el board de Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues).

Cada ejercicio tiene un `starter.ts` (TODOs para implementar), un `solution.ts` (referencia), `tests.test.ts` (asserts estructurales contra la API real) y `exercise.md` bilingue (inglés + español).

## Quick start

Requiere [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows) y [VS Code](https://code.visualstudio.com/) (para `aidev open` y `aidev next`).

**API key** — necesitás una según el provider que elijas:
- **Anthropic**: <https://console.claude.com/settings/keys>
- **OpenAI**: <https://platform.openai.com/api-keys>
- **Google (Gemini)**: <https://aistudio.google.com/apikey>

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

# Google (Gemini):
echo "GEMINI_API_KEY=AIza..." > .env

# O exportar en tu shell:
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AIza...
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

**Flag de provider**: agregá `--provider anthropic`, `--provider openai` o `--provider gemini` a cualquier comando para cambiar tu default.

**Flag de idioma**: agregá `--locale es` o `--locale en` a cualquier comando.

> **Editor**: VS Code (`code`) por default. Cambialo con las variables de entorno `$VISUAL` o `$EDITOR`.

## Costo

Los ejercicios usan los modelos más baratos por default:
- **Anthropic**: Claude Haiku — bootcamp completo bajo $0.10
- **OpenAI**: gpt-4.1-nano — bootcamp completo bajo $0.10
- **Google (Gemini)**: gemini-2.5-flash-lite — mismo tier ($0.10 in / $0.40 out por 1M tokens)
- Embeddings de Voyage (Anthropic Track 04): free tier cubre todo ($0)
- Cada `aidev run` imprime los tokens exactos y el costo estimado

## Estado del proyecto

- **v3.0**: Soporte para Gemini (infra). Anthropic + OpenAI con 60 ejercicios shippeados; los ejercicios de Gemini salen track por track en PRs siguientes.
- **v2.0**: 2 providers x 6 tracks x 5 ejercicios = 60 total. CLI completa + contenido bilingue en/es.
- **Distribución**: git-clone-first (modelo rustlings) — los ejercicios SON el repo.

Seguí el progreso en [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues).

## Contribuir

Ejercicios nuevos, bug fixes, traducciones — todo bienvenido. Mirá **[CONTRIBUTING.md](./CONTRIBUTING.md)** para el setup, tests, convenciones de commits y cómo escribir un ejercicio nuevo según el contrato.

## Licencia

[MIT](./LICENSE)
