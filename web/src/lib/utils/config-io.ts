import type { OlimpusConfig } from "$lib/types";
import { OlimpusConfigSchema } from "@olimpus/types";
import LZString from "lz-string";

export function parseJSONC(text: string): unknown {
  const stripped = text
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(stripped);
}

export function validateConfig(data: unknown): OlimpusConfig {
  return OlimpusConfigSchema.parse(data);
}

export function stringifyConfig(config: OlimpusConfig): string {
  return JSON.stringify(config, null, 2);
}

export function downloadAsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function encodeConfigToURL(config: OlimpusConfig): string {
  const json = JSON.stringify(config);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const url = new URL(window.location.href);
  url.searchParams.set("c", compressed);
  return url.toString();
}

export function decodeConfigFromURL(): OlimpusConfig | null {
  const url = new URL(window.location.href);
  const param = url.searchParams.get("c");
  if (!param) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(param);
    if (!json) return null;
    const data = JSON.parse(json);
    return validateConfig(data);
  } catch {
    return null;
  }
}
