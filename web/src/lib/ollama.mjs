// Pure helpers for the Ollama (local model) surface. Plain .mjs so the node
// test runner can import the real functions without a TypeScript loader.

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

/** Model names as Ollama spells them: `llama3.1:latest`, `library/qwen2.5:7b`, `hf.co/org/model:Q4_K_M`. */
const MODEL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

/**
 * A model name is passed to a child process as an argv element (never a shell),
 * but it is still user-supplied text that ends up in a report header and the
 * tracker note, so only the characters real model names use are accepted.
 */
export function isValidModelName(name) {
  return typeof name === "string" && MODEL_NAME_RE.test(name) && !name.includes("..");
}

/**
 * The Ollama base URL, loopback only. The CV and the full job description are
 * sent to this endpoint, so a remote host would silently exfiltrate them --
 * ollama-eval.mjs refuses one unless OLLAMA_ALLOW_REMOTE=1, and the dashboard
 * mirrors that rule rather than loosening it.
 *
 * @param {string | undefined} raw
 * @returns {{ ok: true, url: string } | { ok: false, error: string }}
 */
export function resolveOllamaUrl(raw) {
  const value = (raw || DEFAULT_OLLAMA_URL).trim().replace(/\/+$/, "");
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: `Invalid OLLAMA_BASE_URL: "${value}"` };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "OLLAMA_BASE_URL must be http(s)." };
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(parsed.hostname);
  if (!loopback && process.env.OLLAMA_ALLOW_REMOTE !== "1") {
    return {
      ok: false,
      error: `Remote Ollama endpoint ${value} refused: your CV and job description would leave this machine. Set OLLAMA_ALLOW_REMOTE=1 to allow it deliberately.`,
    };
  }
  return { ok: true, url: value };
}

/** `22.6 GB` style size for the model picker. */
export function formatBytes(n) {
  if (!Number.isFinite(n) || n <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

/** Shape one `/api/tags` entry for the client. */
export function shapeModel(m) {
  return {
    name: String(m?.name ?? ""),
    size: Number(m?.size) || 0,
    sizeLabel: formatBytes(Number(m?.size)),
    params: m?.details?.parameter_size ?? "",
    quant: m?.details?.quantization_level ?? "",
    family: m?.details?.family ?? "",
    contextLength: Number(m?.details?.context_length) || 0,
    capabilities: Array.isArray(m?.capabilities) ? m.capabilities : [],
  };
}

/** Is `input` a single http(s) URL (as opposed to pasted JD text)? */
export function looksLikeUrl(input) {
  const t = String(input ?? "").trim();
  if (!t || /\s/.test(t)) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** LinkedIn has its own loading guard in AGENTS.md: never auto-fetch it. */
export function isLinkedInUrl(input) {
  try {
    return /(^|\.)linkedin\.com$/i.test(new URL(String(input).trim()).hostname);
  } catch {
    return false;
  }
}
