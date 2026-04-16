# Exercise 05 — Orquestá múltiples herramientas en un agente complejo

## Concepto

Este es el ejercicio que integra todo lo que aprendiste en el track de Agentes. Vas a construir un agente con **4 herramientas** que colaboran para resolver una tarea del mundo real: encontrar un producto, verificar precio y stock, y agregarlo al carrito. Ninguna tool por sí sola puede resolver el problema — el agente tiene que **orquestar** su uso.

La orquestación es el arte de coordinar múltiples herramientas con dependencias entre sí. El modelo no puede agregar al carrito sin saber el ID del producto. No puede verificar el stock sin conocer el ID. Tiene que buscar primero, evaluar los resultados, decidir qué producto investigar más, y recién entonces actuar. Este razonamiento encadenado — donde el output de una tool es el input de la siguiente — es lo que distingue a un agente de una simple llamada a función.

Al implementar este patrón, entendés por qué existen frameworks como LangGraph, AutoGen o CrewAI: el loop que estás escribiendo a mano es exactamente lo que ellos abstraen y formalizan con herramientas de observabilidad, manejo de errores, y gestión de estado.

```
Usuario: "Find a laptop under $1000 in stock"
  ↓ search_products("laptop")
  ↓ get_price("laptop-001")       ← 899 USD ✓
  ↓ check_stock("laptop-001")     ← 5 units ✓
  ↓ add_to_cart("laptop-001", 1)  ← success
  ↓ "Added ProBook 15 Laptop ($899) to your cart."
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente OpenAI
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — orquestación de múltiples tools con dependencias
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa de parámetros para tool calling

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y un array `messages` con: `{ role: "user", content: "Find a laptop under $1000 that's in stock and add it to my cart." }`.
3. Definí cuatro tools:
   - `search_products(query: string)` — retorna lista de productos.
   - `get_price(productId: string)` — retorna precio del producto.
   - `check_stock(productId: string)` — retorna si hay stock.
   - `add_to_cart(productId: string, quantity: number)` — agrega al carrito.
4. Implementá el agent loop.
5. Ejecutá cada tool con la función fake correspondiente.
6. Cuando se ejecuta `add_to_cart`: guardá el resultado en el array `cartItems`.
7. Incrementá `totalSteps` cada vez que procesés tool calls.
8. Cuando el loop termine: guardá el contenido del último mensaje como `finalSummary`.
9. Retorná `{ cartItems, totalSteps, finalSummary }`.

## Cómo verificar

```bash
aidev verify 05-tool-orchestration
```

Los tests verifican:
- Se hacen al menos 3 llamadas a la API
- Al menos 2 nombres de tools distintas fueron usados
- `cartItems` es un array con al menos 1 elemento
- `totalSteps` >= 2
- `finalSummary` es un string no vacío
- La última llamada tiene `finish_reason: "stop"`

## Concepto extra (opcional)

Los agentes de producción necesitan **observabilidad**: logs de cada tool call, trazas de las decisiones del modelo, métricas de latencia y costo. Herramientas como LangSmith, Langfuse o Arize permiten visualizar el grafo completo de ejecución del agente. Cuando algo sale mal en producción, sin observabilidad es casi imposible debuggear — ¿fue el prompt? ¿la tool? ¿el modelo eligió mal? La observabilidad transforma el debugging de agentes de un arte oscuro a un proceso sistemático.
