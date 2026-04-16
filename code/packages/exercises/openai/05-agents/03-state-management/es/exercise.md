# Exercise 03 — Mantené estado entre iteraciones del agente

## Concepto

El historial de mensajes es la memoria implícita del agente, pero a veces necesitás **estado explícito** — datos que el agente modifica con sus acciones y que persisten más allá del contexto de la conversación. Pensalo como la diferencia entre recordar lo que dijiste (memoria conversacional) vs. tener un cuaderno donde anotás cosas (estado externo).

En este ejercicio el agente va a usar una herramienta para agregar notas a un array y para listarlas. Ese array vive en tu código, no en el modelo — el modelo solo interactúa con él a través de las tools. Esta separación es fundamental: **el modelo razona, las tools mutan el estado, tu código orquesta todo**.

Este patrón es la base de agentes más complejos: una base de datos, un sistema de archivos, una cola de tareas — todo puede ser "estado externo" que el agente lee y modifica a través de tools. La inmutabilidad del historial de mensajes + la mutabilidad del estado externo es una arquitectura muy poderosa.

```typescript
// Estado externo — mutable, persiste entre iteraciones
const notes: string[] = [];

// Tool executor — muta el estado según lo que pide el modelo
if (args.action === "add_note") {
  notes.push(args.text);
  return { success: true };
}
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente OpenAI
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — cómo diseñar tools que mutan estado externo
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia de parámetros de herramientas con `enum` en el schema

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un array mutable `notes: string[]` — el estado externo del agente.
3. Creá un cliente OpenAI y un array `messages` con: `{ role: "user", content: "Take a note that I need to buy milk, then take a note about the meeting at 3pm, then list all notes." }`.
4. Definí la tool `note_taker` con parámetro `action: "add_note" | "list_notes"` y `text?: string`.
5. Implementá el agent loop. Cuando se ejecuta la tool:
   - Si `action === "add_note"`: pushá `text` al array `notes`, retorná `{ success: true, note: text }`.
   - Si `action === "list_notes"`: retorná `{ notes }`.
6. Incrementá `turnCount` cada vez que procesés tool calls.
7. Retorná `{ notes, turnCount }`.

## Cómo verificar

```bash
aidev verify 03-state-management
```

Los tests verifican:
- Se hacen al menos 3 llamadas a la API
- `notes` es un array con al menos 2 entradas
- `turnCount` >= 2
- La última llamada tiene `finish_reason: "stop"`

## Concepto extra (opcional)

En agentes de producción, el estado externo generalmente vive en una base de datos, no en memoria. Esto permite: (1) persistir el estado entre sesiones, (2) compartir estado entre múltiples instancias del agente, (3) auditar cambios. Herramientas como LangGraph modelan esto explícitamente con un "state graph" donde cada nodo transiciona el estado según reglas definidas. El concepto es el mismo que en este ejercicio, solo más formalizado.
