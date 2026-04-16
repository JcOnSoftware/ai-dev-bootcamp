# Exercise 05 — Structured outputs with JSON schema

## Concepto

Los LLMs generan texto libre por defecto — lo que es un problema cuando necesitás datos estructurados para parsear en tu aplicación. OpenAI resuelve esto con **Structured Outputs**: pasás un JSON Schema y el modelo está **garantizado** de devolver JSON que lo cumpla, gracias a _constrained decoding_.

Con `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }`, el modelo:
1. Genera tokens válidos dentro de la gramática del schema
2. Nunca inventa campos extras (si `additionalProperties: false`)
3. Siempre incluye los campos requeridos (`required: [...]`)

La respuesta sigue viniendo en `choices[0].message.content` — pero ahora es un string JSON que podés parsear con confianza.

```typescript
const parsed = JSON.parse(response.choices[0]!.message.content!);
// parsed es { name: "...", birth_date: "...", birth_city: "..." }
```

Importante: `strict: true` requiere que todos los campos del schema estén en `required` y que `additionalProperties` sea `false`. Si no cumplís eso, la API devuelve un error.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) — guía oficial con ejemplos completos
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa del endpoint

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y llamá a `client.chat.completions.create` con:
   - `model: "gpt-4.1-nano"`, `max_completion_tokens: 256`
   - Dos mensajes: uno de sistema (`"Extract structured data from the user message."`) y uno de usuario (`"My name is Ada Lovelace. I was born on December 10, 1815 in London."`)
   - `response_format` con `type: "json_schema"`, `json_schema.name: "person_info"`, `strict: true`, y un schema con propiedades `name`, `birth_date`, `birth_city` (todos strings), todos requeridos, `additionalProperties: false`
3. Parseá el contenido con `JSON.parse(response.choices[0]!.message.content!)`.
4. Retorná `{ response, parsed }`.

## Cómo verificar

```bash
aidev verify 05-structured-outputs
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- El request incluye `response_format` con `type: "json_schema"`
- El `json_schema` tiene `strict: true`
- Se retorna un objeto `parsed` no nulo
- `parsed.name` es un string no vacío
- `parsed.birth_date` es un string no vacío
- `parsed.birth_city` es un string no vacío

Los tests NO verifican valores exactos — el modelo puede formatear la fecha de distintas formas.

## Concepto extra (opcional)

El SDK de OpenAI también tiene un helper de más alto nivel llamado `client.beta.chat.completions.parse()` que usa Zod para definir el schema y devuelve el objeto ya parseado y tipado:

```typescript
import { z } from "zod";

const PersonInfo = z.object({
  name: z.string(),
  birth_date: z.string(),
  birth_city: z.string(),
});

const completion = await client.beta.chat.completions.parse({
  model: "gpt-4o-mini",
  messages: [...],
  response_format: zodResponseFormat(PersonInfo, "person_info"),
});

const person = completion.choices[0].message.parsed;
// person está tipado como { name: string; birth_date: string; birth_city: string }
```

Esto es más conveniente para TypeScript pero requiere `zod` y los métodos `beta` del SDK.
