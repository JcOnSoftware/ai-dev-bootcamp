import { spawn } from "node:child_process";
import { t } from "./i18n/index.ts";
import { readConfig } from "./config.ts";

/**
 * Curated list of editors shown in `aidev init`.
 * Order matters: most popular AI-first editors first.
 */
export const SUGGESTED_EDITORS: ReadonlyArray<{ binary: string; label: string }> = [
  { binary: "code",       label: "VS Code" },
  { binary: "cursor",     label: "Cursor" },
  { binary: "windsurf",   label: "Windsurf" },
  { binary: "antigravity", label: "Antigravity" },
  { binary: "zed",        label: "Zed" },
  { binary: "nvim",       label: "Neovim" },
  { binary: "webstorm",   label: "WebStorm" },
] as const;

/**
 * Checks whether the given binary exists somewhere in PATH.
 * Uses Bun.which — returns null when not found.
 */
export async function isEditorInPath(binary: string): Promise<boolean> {
  return Bun.which(binary) !== null;
}

/**
 * Resolves the editor binary using the full priority chain:
 *   flagValue → AIDEV_EDITOR env → $VISUAL → $EDITOR → config.editor → "code"
 *
 * Async because it reads the config file as the last fallback.
 */
export async function resolveEditor(flagValue?: string): Promise<string> {
  if (flagValue !== undefined && flagValue !== "") {
    return flagValue;
  }
  if (process.env["AIDEV_EDITOR"]) {
    return process.env["AIDEV_EDITOR"];
  }
  if (process.env["VISUAL"]) {
    return process.env["VISUAL"];
  }
  if (process.env["EDITOR"]) {
    return process.env["EDITOR"];
  }
  const config = await readConfig();
  if (config.editor) {
    return config.editor;
  }
  return "code";
}

/**
 * Detects the user's preferred editor (sync, best-effort — no config read).
 * Used as a lightweight check when async resolution is not needed.
 * Priority: $VISUAL → $EDITOR → "code"
 *
 * @deprecated prefer resolveEditor() for full resolution order including config.
 */
export function detectEditor(): string | undefined {
  return process.env["VISUAL"] || process.env["EDITOR"] || "code";
}

/**
 * Opens the given files in the resolved editor.
 * Spawns the editor detached so the CLI doesn't block.
 *
 * If `editorBinary` is provided (pre-resolved by the caller), it is used directly.
 * Otherwise falls back to resolveEditor() which reads config + env.
 */
export async function openInEditor(files: string[], editorBinary?: string): Promise<string> {
  const editor = editorBinary ?? await resolveEditor();
  if (!editor) {
    throw new Error(t("open.no_editor"));
  }

  try {
    const child = spawn(editor, files, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    throw new Error(t("open.editor_failed", { editor }));
  }

  return editor;
}
