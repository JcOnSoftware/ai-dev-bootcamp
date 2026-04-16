# Exercise 03 — Token usage and cost calculation

## Concepto

Cada llamada a la API consume **tokens** — la unidad básica de procesamiento de texto para los LLMs. Un token equivale aproximadamente a 4 caracteres o ¾ de una palabra en inglés (en español suele ser un poco más por las palabras más largas).

La respuesta de OpenAI incluye un campo `usage` con:
- `prompt_tokens`: tokens consumidos por tu mensaje + contexto del sistema
- `completion_tokens`: tokens generados por el modelo en la respuesta
- `total_tokens`: la suma de ambos

El costo real se calcula multiplicando esos conteos por la tarifa del modelo. Para `gpt-4.1-nano`:
- Input: **$0.10 por 1,000,000 tokens**
- Output: **$0.40 por 1,000,000 tokens**

Formula: `(prompt_tokens * 0.10 + completion_tokens * 0.40) / 1_000_000`

Entender el uso de tokens es esencial para estimar presupuestos, elegir modelos y optimizar prompts.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa del endpoint
3. [Pricing](https://platform.openai.com/docs/pricing) — tarifas actualizadas por modelo

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y hacé una llamada con `gpt-4.1-nano` y `max_completion_tokens: 128`.
3. Extraé el uso de tokens del campo `response.usage`.
4. Calculá el costo en USD con esta fórmula:
   ```typescript
   const cost = (usage.prompt_tokens * 0.10 + usage.completion_tokens * 0.40) / 1_000_000;
   ```
5. Retorná `{ response, cost }`.

## Cómo verificar

```bash
aidev verify 03-token-usage-cost
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- Se usa el modelo `gpt-4.1-nano`
- `prompt_tokens` es mayor que 0
- `completion_tokens` es mayor que 0
- Se retorna un objeto con `response` y `cost` donde `cost` es un número positivo

## Concepto extra (opcional)

Los tokens se pueden contar **antes** de hacer la llamada usando la librería `tiktoken` (el tokenizador oficial de OpenAI). Esto es útil para:
- Estimar costos antes de llamar a la API
- Verificar que tu prompt no excede el límite del modelo
- Optimizar el largo de los prompts

```typescript
import { encoding_for_model } from "tiktoken";
const enc = encoding_for_model("gpt-4o");
const tokens = enc.encode("Tu texto aquí");
console.log(tokens.length); // cantidad de tokens
enc.free();
```

En la práctica, para modelos GPT-4 se usa la codificación `cl100k_base`, y para GPT-4o y GPT-4.1 se usa `o200k_base`.
