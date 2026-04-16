# ai-dev-bootcamp

> [🇬🇧 Read this in English →](./README.md)

**Rustlings para devs de AI.** Bootcamp hands-on de AI engineering para developers con experiencia — aprendé Claude con 30 ejercicios progresivos y tests automáticos contra la API real de Anthropic.

**Empezá con API fundamentals. Después aprendé tool use con ejemplos clásicos como calculator y weather. Después escalá a RAG, agents y servers MCP.**

Los recursos típicos para aprender AI son o muy básicos ("prompt engineering para principiantes") o muy abstractos (cursos de 4 horas en video sobre teoría de LLMs). Este proyecto es para lo opuesto: devs con 5+ años de experiencia que saben programar pero todavía no construyeron nada serio con AI. Aprendés **escribiendo código, corriéndolo contra la API real y viendo tests pasar** — no mirando a alguien más tipear.

## El currículum — 6 tracks, 30 ejercicios

**Track 01 — Foundations** (5 ejercicios) — primera llamada, parámetros, streaming, tokens & cost, error handling.

**Track 02 — Prompt caching** (5 ejercicios) — `cache_control`, métricas de hit, multi-breakpoint, TTL extendido, caching + tools.

**Track 03 — Tool use** (5 ejercicios) — definir tools, tool loop, router multi-tool, modos de `tool_choice`, parallel tool use. Dominio clásico `get_weather` + `calculate`.

**Track 04 — RAG** (5 ejercicios) — embeddings con Voyage AI, vector search, chunking strategies, pipeline de retrieval end-to-end, citation grounding.

**Track 05 — Agents** (5 ejercicios) — agent loop DIY (think→act→observe), stop conditions layered, state management, multi-step planning, self-correction.

**Track 06 — MCP** (5 ejercicios) — armá un server MCP, conectá un cliente, exponé recursos + prompt templates, bridge de tools MCP a Claude, agent loop completo sobre tools expuestos vía MCP.

Cada ejercicio tiene un `starter.ts` (TODOs para implementar), un `solution.ts` (referencia), `tests.test.ts` (asserts estructurales contra la API real) y `exercise.md` bilingue (español + inglés).

## Quick start

Requiere [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows), [VS Code](https://code.visualstudio.com/) (para `aidev open` y `aidev next`), y una API key de Anthropic (<https://console.claude.com/settings/keys>). El track 04 (RAG) también necesita una key de Voyage AI (<https://dash.voyageai.com/api-keys>) — free tier de 200M tokens/mes.

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
cat > .env <<EOF
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...        # solo requerida para el track 04
EOF

# Forma corta — funciona desde cualquier lado dentro de code/:
bun run aidev init              # configurá locale (es/en)
bun run aidev list              # ver los 30 ejercicios agrupados por track
bun run aidev verify 01-first-call
```

¿Preferís usar `aidev` pelado sin el prefijo `bun run`? Dos opciones:

```bash
# Opción A — alias de shell (Mac/Linux/WSL):
alias aidev="$(pwd)/bin/aidev"
aidev list

# Opción B — agregar code/bin al PATH:
export PATH="$(pwd)/bin:$PATH"     # Mac/Linux
# Windows PowerShell: $env:Path = "$PWD\bin;$env:Path"
aidev list
```

## Trabajar con ejercicios

No hace falta navegar carpetas profundas — la CLI se encarga:

```bash
bun run aidev open                  # selector interactivo — elegí un ejercicio de la lista
bun run aidev open 01-first-call    # abrí un ejercicio específico directo en VS Code
bun run aidev next                  # abrí automáticamente el siguiente ejercicio incompleto
```

`open` y `next` abren VS Code con dos archivos: `starter.ts` (donde codeás) y `exercise.md` (el enunciado en tu idioma). Implementá los TODOs y corré `verify` hasta que pasen los tests.

> **Soporte de editores**: `aidev open` y `aidev next` usan VS Code por default. Podés cambiarlo con las variables de entorno `$VISUAL` o `$EDITOR`.

## Modo playground

¿Querés **ver** la salida del modelo, no solo pasar tests? Usá `aidev run`:

```bash
bun run aidev run 01-first-call --solution
bun run aidev run 03-streaming --solution --stream-live
```

`--stream-live` imprime los tokens a medida que llegan — así ves el streaming en tiempo real, la misma UX que van a experimentar tus usuarios.

## Costo

Todos los ejercicios corren contra **Claude Haiku** — el tier más barato y rápido.
- Completar el bootcamp completo (30 ejercicios × resolver + verificar una vez): **bajo $0.10 total**.
- Los embeddings de Voyage en el track 04: el free tier cubre 100% el uso del learner ($0).
- Cada `aidev run` imprime los tokens exactos y el costo estimado de esa llamada.

## Contenido bilingue

Los ejercicios vienen en **español e inglés**. El locale por default es `es` (LATAM primero) — lo sobreescribís con `--locale en` en cualquier comando, `AIDEV_LOCALE=en`, o lo elegís durante `aidev init`.

## Estado del proyecto

- **v1 completo**: 6 tracks × 5 ejercicios = 30 total. CLI (`init`, `list`, `verify`, `run`, `progress`, `open`, `next`) + contenido bilingue es/en + GitHub Actions CI + health check semanal contra APIs reales.
- **Distribución**: git-clone-first (modelo rustlings) — los ejercicios SON el repo. `git pull` actualiza contenido; `fork + PR` es el canal de contribución.
- **Caveat de rate limit para el track 04**: el free tier de Voyage es 3 RPM/10K TPM sin método de pago. Correr ejercicios de a uno (~40s aparte). Agregar método de pago desbloquea los límites estándar manteniendo $0 bajo el budget de 200M tokens free.

Seguí el progreso en [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues) y en el directorio `openspec/` (artifacts de Spec-Driven Development para cambios grandes).

## Contribuir

Ejercicios nuevos, bug fixes, traducciones — todo bienvenido. Mirá **[CONTRIBUTING.md](./CONTRIBUTING.md)** para el setup, tests, convenciones de commits y cómo escribir un ejercicio nuevo según el contrato.

## Licencia

[MIT](./LICENSE)
