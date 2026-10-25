import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot } from "@/lib/career-ops";
import { readJsonObject } from "@/lib/json-body";
import { isValidModelName, resolveOllamaUrl, shapeModel } from "@/lib/ollama.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The selected model lives in config/ollama.json: user layer (AGENTS.md Data
// Contract), so a system update never overwrites it.
function configPath() {
  return path.join(/* turbopackIgnore: true */ careerOpsRoot(), "config", "ollama.json");
}

function readSelected(): string | null {
  try {
    const j = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ configPath(), "utf8"));
    return isValidModelName(j?.model) ? j.model : null;
  } catch {
    return null;
  }
}

// GET: is Ollama up, which models are pulled, which one is selected.
export async function GET() {
  const base = resolveOllamaUrl(process.env.OLLAMA_BASE_URL);
  const selected = readSelected();
  if (!base.ok) return Response.json({ running: false, error: base.error, models: [], selected });
  try {
    const res = await fetch(`${base.url}/api/tags`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { models?: unknown[] };
    const models = (j.models ?? []).map(shapeModel).filter((m) => m.name);
    return Response.json({
      running: true,
      url: base.url,
      models,
      // A saved model that was since removed must not stay "selected".
      selected: selected && models.some((m) => m.name === selected) ? selected : null,
    });
  } catch {
    return Response.json({
      running: false,
      url: base.url,
      models: [],
      selected,
      error: "Ollama is not reachable. Start it with `ollama serve` (or open the Ollama app).",
    });
  }
}

// POST { model }: remember the model the evaluator should use.
export async function POST(req: Request) {
  const body = await readJsonObject<{ model?: string }>(req);
  if (!body || !isValidModelName(body.model)) {
    return Response.json({ error: "A valid model name is required." }, { status: 400 });
  }
  const file = configPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(/* turbopackIgnore: true */ file, JSON.stringify({ model: body.model }, null, 2) + "\n", "utf8");
  return Response.json({ ok: true, model: body.model });
}
