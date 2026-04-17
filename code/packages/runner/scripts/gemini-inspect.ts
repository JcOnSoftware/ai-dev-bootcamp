/**
 * Inspect where @google/genai exposes generateContent / generateContentStream / embedContent.
 * Prototype only has *Internal variants — public methods may be bound on the instance
 * or on the prototype in a different form. We need to find them.
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIza-spike-placeholder" });
const models = ai.models;
const proto = Object.getPrototypeOf(models);

console.log("=== Instance own properties ===");
console.log(Object.getOwnPropertyNames(models));

console.log("\n=== Prototype properties ===");
console.log(Object.getOwnPropertyNames(proto));

console.log("\n=== typeof models.generateContent ===");
console.log(typeof (models as any).generateContent);

console.log("\n=== typeof models.generateContentStream ===");
console.log(typeof (models as any).generateContentStream);

console.log("\n=== typeof models.embedContent ===");
console.log(typeof (models as any).embedContent);

// Walk up the prototype chain
console.log("\n=== Prototype chain ===");
let p = proto;
let depth = 0;
while (p && depth < 5) {
  console.log(`depth ${depth}:`, Object.getOwnPropertyNames(p));
  p = Object.getPrototypeOf(p);
  depth++;
}

// Check if they're getters
console.log("\n=== Descriptors for target methods ===");
for (const m of ["generateContent", "generateContentStream", "embedContent", "generateContentInternal"]) {
  const instDesc = Object.getOwnPropertyDescriptor(models, m);
  const protoDesc = Object.getOwnPropertyDescriptor(proto, m);
  console.log(`${m}: instance=${JSON.stringify(instDesc ? Object.keys(instDesc) : null)} proto=${JSON.stringify(protoDesc ? Object.keys(protoDesc) : null)}`);
}
