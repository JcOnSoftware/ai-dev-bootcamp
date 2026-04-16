// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Fake e-commerce backend — do not change these functions.
 */
function fakeSearchProducts(query: string): Array<{ id: string; name: string; category: string }> {
  void query;
  return [
    { id: "laptop-001", name: "ProBook 15 Laptop", category: "laptops" },
    { id: "laptop-002", name: "UltraSlim 14 Laptop", category: "laptops" },
  ];
}

function fakeGetPrice(productId: string): { productId: string; price: number; currency: string } {
  const prices: Record<string, number> = {
    "laptop-001": 899,
    "laptop-002": 1199,
  };
  return { productId, price: prices[productId] ?? 999, currency: "USD" };
}

function fakeCheckStock(productId: string): { productId: string; inStock: boolean; quantity: number } {
  const stock: Record<string, number> = {
    "laptop-001": 5,
    "laptop-002": 0,
  };
  const qty = stock[productId] ?? 0;
  return { productId, inStock: qty > 0, quantity: qty };
}

function fakeAddToCart(
  productId: string,
  quantity: number,
): { success: boolean; cartItemId: string; productId: string; quantity: number } {
  return { success: true, cartItemId: `cart-${productId}`, productId, quantity };
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build a messages array starting with:
 *        [{ role: "user", content: "Find a laptop under $1000 that's in stock and add it to my cart." }]
 *   3. Define four tools:
 *        - search_products(query: string)
 *        - get_price(productId: string)
 *        - check_stock(productId: string)
 *        - add_to_cart(productId: string, quantity: number)
 *   4. Run the agent loop. Execute each tool call with the matching fake function.
 *   5. Track cartItems: push each successful add_to_cart result to the array.
 *   6. Track totalSteps: increment each time you process tool calls.
 *   7. When the loop ends (finish_reason "stop"), capture finalSummary from last assistant message.
 *   8. Return { cartItems, totalSteps, finalSummary }.
 *
 * Read es/exercise.md or en/exercise.md for full context.
 */
export default async function run(): Promise<{
  cartItems: Array<{ success: boolean; cartItemId: string; productId: string; quantity: number }>;
  totalSteps: number;
  finalSummary: string;
}> {
  void fakeSearchProducts;
  void fakeGetPrice;
  void fakeCheckStock;
  void fakeAddToCart;
  throw new Error("TODO: implement tool orchestration agent. Read exercise.md for context.");
}
