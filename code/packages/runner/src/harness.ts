/**
 * Runner harness — stub.
 *
 * Implementación real viene en la tarea #2: interceptar llamadas al Anthropic
 * SDK y exponer request + response para assertions en los tests.
 */

export interface HarnessResult {
  apiCall: unknown;
  response: unknown;
}

export async function runUserCode(_path: string): Promise<HarnessResult> {
  throw new Error("harness not implemented yet — see task #2");
}
