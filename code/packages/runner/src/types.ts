import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type ExerciseTarget = "starter" | "solution";

export interface RunOptions {
  entry?: string;
  onStreamEvent?: (event: unknown) => void;
}

export class HarnessError extends Error {
  override name = "HarnessError";
}

export function resolveExerciseFile(
  importMetaUrl: string,
  override?: ExerciseTarget,
): string {
  const target = override ?? (process.env["AIDEV_TARGET"] as ExerciseTarget | undefined) ?? "starter";
  if (target !== "starter" && target !== "solution") {
    throw new HarnessError(
      `Invalid AIDEV_TARGET '${target}'. Must be 'starter' or 'solution'.`,
    );
  }
  const testDir = dirname(fileURLToPath(importMetaUrl));
  return resolve(testDir, `${target}.ts`);
}
