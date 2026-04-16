// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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

function fakeCheckStock(productId: string): {
  productId: string;
  inStock: boolean;
  quantity: number;
} {
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

export default async function run(): Promise<{
  cartItems: Array<{ success: boolean; cartItemId: string; productId: string; quantity: number }>;
  totalSteps: number;
  finalSummary: string;
}> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "Find a laptop under $1000 that's in stock and add it to my cart.",
    },
  ];

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "search_products",
        description: "Search for products matching a query",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query, e.g. 'laptop'" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_price",
        description: "Get the price of a product by its ID",
        parameters: {
          type: "object",
          properties: {
            productId: { type: "string", description: "The product ID" },
          },
          required: ["productId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "check_stock",
        description: "Check if a product is in stock",
        parameters: {
          type: "object",
          properties: {
            productId: { type: "string", description: "The product ID" },
          },
          required: ["productId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_to_cart",
        description: "Add a product to the shopping cart",
        parameters: {
          type: "object",
          properties: {
            productId: { type: "string", description: "The product ID" },
            quantity: { type: "number", description: "Quantity to add (default 1)" },
          },
          required: ["productId", "quantity"],
        },
      },
    },
  ];

  const cartItems: Array<{
    success: boolean;
    cartItemId: string;
    productId: string;
    quantity: number;
  }> = [];
  let totalSteps = 0;
  let finalSummary = "";

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      max_completion_tokens: 512,
      messages,
      tools,
    });

    const choice = response.choices[0]!;
    messages.push(choice.message);

    if (choice.finish_reason === "stop") {
      finalSummary = choice.message.content ?? "";
      break;
    }

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      totalSteps++;
      for (const toolCall of choice.message.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

        let result: unknown;
        if (name === "search_products") {
          result = fakeSearchProducts((args["query"] as string) ?? "");
        } else if (name === "get_price") {
          result = fakeGetPrice((args["productId"] as string) ?? "");
        } else if (name === "check_stock") {
          result = fakeCheckStock((args["productId"] as string) ?? "");
        } else if (name === "add_to_cart") {
          const cartResult = fakeAddToCart(
            (args["productId"] as string) ?? "",
            (args["quantity"] as number) ?? 1,
          );
          cartItems.push(cartResult);
          result = cartResult;
        } else {
          result = { error: "Unknown tool" };
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }
  }

  return { cartItems, totalSteps, finalSummary };
}
