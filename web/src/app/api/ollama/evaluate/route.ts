import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { careerOpsRoot, rootScript } from "@/lib/career-ops";
import { readJsonObject } from "@/lib/json-body";
import { isLinkedInUrl, isValidModelName, looksLikeUrl, resolveOllamaUrl } from "@/lib/ollama.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const MAX_JD_CHARS = 60_000;

function json(error: string, status: number) {
  return new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });
}

/** Run a core script to completion and collect stdout. Never uses a shell. */
function runScript(script: string, args: string[], cwd: string, timeoutMs: number) {
  return new Promise<{ code: number | null; stdout: string }>((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d));
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout });
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve({ code: 1, stdout: "" });
    });
  });
}

// POST { input, model }: evaluate a posting with a LOCAL Ollama model by
// running the core's own ollama-eval.mjs (the same engine as the CLI: it inlines
// modes/oferta.md + cv.md into the prompt, since a bare local model can read no
// files), streams its output, then merges the tracker addition the CLI way.
//
// `input` is either pasted JD text or a posting URL. A URL is resolved through
// fetch-jd.mjs (public ATS APIs only); a local model has no browser, so when
// that cannot read it the user is asked to paste the text, never a guess.
export async function POST(req: Request) {
  const body = await readJsonObject<{ input?: string; model?: string }>(req);
  if (!body || typeof body.input !== "string" || !body.input.trim()) return json("Paste a job description or a posting URL.", 400);
  if (!isValidModelName(body.model)) return json("Pick an Ollama model first.", 400);

  const base = resolveOllamaUrl(process.env.OLLAMA_BASE_URL);
  if (!base.ok) return json(base.error, 400);

  const root = careerOpsRoot();
  const evalScript = rootScript("ollama-eval");
  if (!fs.existsSync(/* turbopackIgnore: true */ evalScript)) return json("ollama-eval.mjs is missing from this checkout.", 400);
  if (!fs.existsSync(path.join(/* turbopackIgnore: true */ root, "cv.md"))) {
    return json("Add your CV first so I can score this against you.", 400);
  }

  const input = body.input.trim();
  let jd = input;
  let postingUrl = "";
  if (looksLikeUrl(input)) {
    if (isLinkedInUrl(input)) {
      return json("LinkedIn postings can't be fetched automatically. Paste the job description text (or use the employer's careers-page link).", 422);
    }
    const fetched = await runScript(rootScript("fetch-jd"), [input], root, 30_000);
    if (fetched.code !== 0 || fetched.stdout.trim().length < 200) {
      return json("I couldn't read that posting automatically (a local model has no browser). Paste the job description text instead.", 422);
    }
    jd = fetched.stdout.trim();
    postingUrl = input;
  }
  if (jd.length > MAX_JD_CHARS) jd = jd.slice(0, MAX_JD_CHARS);

  // Scratch file, so a long JD never hits the command-line length limit.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "career-ops-ollama-"));
  const jdFile = path.join(tmpDir, "jd.txt");
  fs.writeFileSync(jdFile, jd, "utf8");

  const args = [evalScript, "--file", jdFile, "--model", body.model as string, "--url", base.url];
  if (postingUrl) args.push("--posting-url", postingUrl);

  let child: ChildProcess | null = null;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (s: string) => {
        if (!closed) controller.enqueue(encoder.encode(s));
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        fs.rmSync(tmpDir, { recursive: true, force: true });
        controller.close();
      };

      child = spawn(process.execPath, args, { cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
      const killTimer = setTimeout(() => child?.kill(), 14 * 60_000);
      child.stdout?.on("data", (d) => send(d.toString()));
      child.stderr?.on("data", (d) => send(d.toString()));
      child.on("error", (e) => {
        send(`\n❌ Could not start the evaluator: ${e.message}\n`);
        clearTimeout(killTimer);
        finish();
      });
      child.on("close", async (code) => {
        clearTimeout(killTimer);
        if (code === 0) {
          // Same follow-up the CLI asks for after every evaluation (AGENTS.md).
          const merged = await runScript(rootScript("merge-tracker"), [], root, 60_000);
          send(
            merged.code === 0
              ? "\n🔗  Tracker updated (merge-tracker.mjs).\n"
              : "\n⚠️  Report saved, but the tracker merge failed. Run `node merge-tracker.mjs`.\n",
          );
        }
        send(`\n[exit ${code ?? "killed"}]\n`);
        finish();
      });
    },
    cancel() {
      child?.kill();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
