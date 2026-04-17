# Exercise 04 — Fetch URLs on demand with urlContext

## Concepto

`googleSearch` (ejercicio 02) corre una búsqueda web abierta — el modelo elige qué leer. A veces querés más control: "leé ESTA página específica y respondé desde ella." Esa es la tool **`urlContext`**.

La habilitás igual que las otras built-ins:

```ts
config.tools = [{ urlContext: {} }]
```

Después incluís la URL target directamente en el texto del prompt. Gemini fetchea el contenido de la página y lo usa para responder. Esto va bien para:

- **Doc QA**: "Mirá nuestra API reference en https://api.example.com/docs y listá los endpoints de auth"
- **Release notes**: "Resumí los cambios en https://github.com/org/repo/releases/latest"
- **Grounding targeteado**: evitá la varianza del search apuntando directo a la source of truth

A diferencia de `googleSearch`, las respuestas con `urlContext` se quedan focalizadas en la URL que nombraste. Falla limpiamente cuando la URL no es fetcheable (auth, paywall, 404) — el modelo lo dice en vez de fabular.

## Docs & referencias

1. [Guía de URL context](https://ai.google.dev/gemini-api/docs/url-context) — schemes soportados, límites de tamaño
2. [Built-in tools](https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools) — googleSearch / codeExecution / urlContext
3. [Grounding metadata](https://ai.google.dev/api/generate-content#GroundingMetadata) — mismo shape que googleSearch cuando urlContext pega

## Tu tarea

1. Llamá `generateContent` con:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `"Using https://ai.google.dev/ as a reference, what does Google describe as Gemini's focus? Quote one short phrase."`
   - `config.tools`: `[{ urlContext: {} }]`
   - `config.maxOutputTokens`: `400`
2. Leé `response.text`.
3. Retorná:
   ```ts
   {
     answer: response.text,
     toolRequested: true,
     mentionsTopic: /gemini/i.test(answer),
   }
   ```

## Cómo verificar

```bash
aidev verify 04-url-context
```

Los tests verifican:
- Request `config.tools` incluye `{ urlContext: {} }`
- El `contents` del prompt incluye al menos una URL `https://...`
- El retorno tiene los tres campos esperados
- `answer` no vacío
- La respuesta menciona "Gemini" (prueba que se usó el contenido de la URL)

## Concepto extra (opcional)

`urlContext` es menos flexible que `googleSearch` pero más predecible. Usalo cuando:

- Ya SABÉS la fuente canónica para la respuesta (un doc de API, una página de release, un doc de policy)
- Querés LIMITAR de qué puede aprender el modelo — guardrails más estrictos para workflows legales/compliance
- Estás pagando por grounding y querés un fetch targeteado más barato en vez de una búsqueda amplia

Límites actuales: Gemini capa el número de URLs por request (chequeá la guía para el número actual — típicamente 20). Las URLs tienen que ser accesibles públicamente; páginas con auth retornan un error que surface en la respuesta del modelo en vez de fallar silenciosamente.

Podés combinar `urlContext` con `googleSearch` en el mismo array de tools para un híbrido: "buscá amplio, pero también fetcheá esta URL específica." Buenísimo para support chatbots que siempre se apoyan en el runbook más la web general.
