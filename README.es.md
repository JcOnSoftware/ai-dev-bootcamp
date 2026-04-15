# ai-dev-bootcamp

> [🇬🇧 Read this in English →](./README.md)

**CLI estilo rustlings que enseña a devs senior cómo usar Claude con ejercicios progresivos y tests automáticos contra la API real de Anthropic.**

Los recursos típicos para aprender AI son o muy básicos ("prompt engineering para principiantes") o muy abstractos (cursos de 4 horas en video sobre teoría de LLMs). Este proyecto es para lo opuesto: devs con 5+ años de experiencia que saben programar pero todavía no construyeron nada serio con AI. Aprendés **escribiendo código, corriéndolo contra la API real y viendo tests pasar** — no mirando a alguien más tipear.

## Qué vas a aprender

**Track: Foundations** (5 ejercicios, listos)

| # | Ejercicio | Concepto |
|---|-----------|----------|
| 01 | `01-first-call` | Primera llamada a Claude — cliente, modelo, mensajes, forma de la respuesta |
| 02 | `02-params` | Parámetros: `temperature` para output determinista vs creativo |
| 03 | `03-streaming` | Streaming responses — iteración de eventos, `finalMessage()`, UX en tiempo real |
| 04 | `04-tokens-cost` | Leer `usage`, calcular costo real en USD por llamada |
| 05 | `05-error-handling` | Helper `withRetry` con exponential backoff, errores retryable vs fatales |

**Próximos tracks** (v2): prompt caching · tool use · RAG · agents · servers MCP.

## Quick start

Requiere [Bun](https://bun.com) 1.3+ y una API key de Anthropic (<https://console.claude.com/settings/keys>).

```bash
gh repo clone jcyovera/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env

# Configurá locale, mirá los ejercicios disponibles, corré uno:
bun run packages/cli/src/index.ts init
bun run packages/cli/src/index.ts list
bun run packages/cli/src/index.ts verify 01-first-call
```

Abrí `packages/exercises/01-foundations/01-first-call/starter.ts` en tu editor e implementá el TODO. Re-corré `verify` hasta que los tests pasen. Leé el enunciado completo en `packages/exercises/01-foundations/01-first-call/{es,en}/exercise.md`.

## Modo playground

¿Querés **ver** la salida del modelo, no solo pasar tests? Usá `aidev run`:

```bash
bun run packages/cli/src/index.ts run 01-first-call --solution
bun run packages/cli/src/index.ts run 03-streaming --solution --stream-live
```

`--stream-live` imprime los tokens a medida que llegan — así ves el streaming en tiempo real, la misma UX que van a experimentar tus usuarios.

## Costo

Todos los ejercicios corren contra **Claude Haiku** — el tier más barato y rápido.
- Completar todo Foundations (5 ejercicios × resolver + verificar una vez): **~$0.01 total**.
- Cada `aidev run` imprime los tokens exactos y el costo estimado de esa llamada.

## Contenido bilingue

Los ejercicios vienen en **español e inglés**. El locale por default es `es` (LATAM primero) — lo sobreescribís con `--locale en` en cualquier comando, `AIDEV_LOCALE=en`, o lo elegís durante `aidev init`.

## Estado del proyecto

- **v1 shippeado**: track Foundations (5 ejercicios), CLI (`init`, `list`, `verify`, `run`, `progress`), contenido bilingue.
- **v2 próximo**: más tracks, binario publicado en npm, GitHub Actions opcional para contributors.

Seguí el progreso en [Issues](https://github.com/jcyovera/ai-dev-bootcamp/issues) y en el directorio `openspec/` (artifacts de Spec-Driven Development para cambios grandes).

## Contribuir

Ejercicios nuevos, bug fixes, traducciones — todo bienvenido. Mirá **[CONTRIBUTING.md](./CONTRIBUTING.md)** para el setup, tests, convenciones de commits y cómo escribir un ejercicio nuevo según el contrato.

## Licencia

[MIT](./LICENSE)
