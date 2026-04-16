import { spawn } from "node:child_process";
import { t } from "./i18n/index.ts";

/**
 * Detects the user's preferred editor.
 * Priority: $VISUAL → $EDITOR → "code" (VS Code) → undefined
 */
export function detectEditor(): string | undefined {
  return process.env["VISUAL"] || process.env["EDITOR"] || "code";
}

/**
 * Opens the given files in the detected editor.
 * Spawns the editor detached so the CLI doesn't block.
 * Throws with a localized message if no editor is found.
 */
export async function openInEditor(files: string[]): Promise<string> {
  const editor = detectEditor();
  if (!editor) {
    throw new Error(t("open.no_editor"));
  }

  const child = spawn(editor, files, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return editor;
}
