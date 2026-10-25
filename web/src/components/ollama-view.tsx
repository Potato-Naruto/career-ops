"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, Cpu, Loader2, Play, RefreshCw, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageFrame } from "@/components/page-frame";
import { cn } from "@/lib/cn";

type Model = {
  name: string;
  sizeLabel: string;
  params: string;
  quant: string;
  contextLength: number;
  capabilities: string[];
};
type Status = { running: boolean; url?: string; models: Model[]; selected: string | null; error?: string };

export function OllamaView() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outRef = useRef<HTMLPreElement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ollama", { cache: "no-store" });
      const j = (await res.json()) as Status;
      setStatus(j);
      setModel((cur) => cur ?? j.selected ?? j.models[0]?.name ?? null);
    } catch {
      setStatus({ running: false, models: [], selected: null, error: "Could not reach the dashboard server." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [output]);

  async function choose(name: string) {
    setModel(name);
    try {
      await fetch("/api/ollama", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: name }) });
    } catch {
      /* the choice still applies to this session; saving is a convenience */
    }
  }

  async function evaluate() {
    if (!model || !input.trim() || running) return;
    setError(null);
    setOutput("");
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ollama/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, model }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? `Request failed (HTTP ${res.status}).`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((o) => o + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("The connection dropped before the evaluation finished.");
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  const ready = status?.running && status.models.length > 0;

  return (
    <PageFrame>
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/20 via-surface to-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/25 blur-3xl" aria-hidden />
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text">Local AI</p>
          <Badge tone="info">Free · Private</Badge>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Run career-ops on Ollama</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Evaluate offers with a model on your own machine. Your CV and the job description never leave this computer, and there is no API key or bill.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    loading ? "animate-pulse bg-faint" : status?.running ? "bg-emerald-400 shadow-[0_0_0_4px_hsl(152_70%_50%/0.18)]" : "bg-red-400",
                  )}
                  aria-hidden
                />
                <h2 className="text-sm font-semibold text-foreground">
                  {loading ? "Checking Ollama…" : status?.running ? "Ollama is running" : "Ollama is not running"}
                </h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading} aria-label="Refresh Ollama status">
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden /> Refresh
              </Button>
            </div>
            {status?.url && <p className="mt-1 font-mono text-xs text-faint">{status.url}</p>}
            {!loading && !status?.running && (
              <div className="mt-4 flex gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <p>{status?.error ?? "Ollama is not reachable."}</p>
                  <p className="mt-1 text-xs opacity-80">
                    Install it from <span className="font-mono">ollama.com</span>, then run <span className="font-mono">ollama serve</span>.
                  </p>
                </div>
              </div>
            )}
            {!loading && status?.running && status.models.length === 0 && (
              <p className="mt-4 text-sm text-muted">
                No models pulled yet. Run <span className="font-mono text-foreground">ollama pull qwen2.5</span> in a terminal, then refresh.
              </p>
            )}
          </Card>

          {ready && (
            <Card className="p-0">
              <div className="border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold text-foreground">Model</h2>
                <p className="text-xs text-faint">Pick the model the evaluator uses. 32K+ context works best.</p>
              </div>
              <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto" role="radiogroup" aria-label="Ollama model">
                {status!.models.map((m) => {
                  const active = m.name === model;
                  return (
                    <li key={m.name}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => void choose(m.name)}
                        className={cn(
                          "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50 max-sm:min-h-[44px]",
                          active ? "bg-brand-soft" : "hover:bg-surface-hover",
                        )}
                      >
                        <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border-2", active ? "border-brand" : "border-border")}>
                          {active && <span className="size-2 rounded-full bg-brand" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[13px] font-medium text-foreground">{m.name}</span>
                          <span className="block text-xs text-faint">
                            {[m.params, m.quant, m.sizeLabel, m.contextLength ? `${Math.round(m.contextLength / 1024)}K ctx` : ""].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="hidden shrink-0 gap-1 sm:flex">
                          {m.capabilities.includes("thinking") && <Badge tone="info">thinking</Badge>}
                          {m.capabilities.includes("vision") && <Badge tone="muted">vision</Badge>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <Card className="flex flex-col gap-4" corner="br">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-brand-text" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Evaluate a posting</h2>
            {model && <span className="ml-auto truncate font-mono text-xs text-faint">{model}</span>}
          </div>
          <label className="block">
            <span className="sr-only">Job description or URL</span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={9}
              disabled={running}
              placeholder="Paste the job description, or a Greenhouse / Lever / Ashby posting URL…"
              className="w-full resize-y rounded-xl border border-border bg-background/70 p-3 text-sm text-foreground placeholder:text-faint focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {running ? (
              <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                <Square className="size-4" aria-hidden /> Stop
              </Button>
            ) : (
              <Button onClick={() => void evaluate()} disabled={!ready || !model || !input.trim()}>
                <Play className="size-4" aria-hidden /> Evaluate locally
              </Button>
            )}
            {running && (
              <span className="inline-flex items-center gap-2 text-xs text-muted">
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Local models can take a minute or more…
              </span>
            )}
            {!ready && !loading && <span className="text-xs text-faint">Start Ollama and pull a model first.</span>}
          </div>

          {error && (
            <div role="alert" className="flex gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{error}</p>
            </div>
          )}

          {(output || running) && (
            <pre
              ref={outRef}
              aria-live="polite"
              className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-[var(--pre-bg)] p-4 font-mono text-[12.5px] leading-relaxed text-foreground"
            >
              {output || "Starting…"}
            </pre>
          )}
          {output.includes("[exit 0]") && (
            <p className="text-sm text-muted">
              Saved to your reports and tracker.{" "}
              <Link href="/pipeline" className="font-medium text-brand-text underline-offset-2 hover:underline">
                Open the pipeline →
              </Link>
            </p>
          )}
        </Card>
      </div>
    </PageFrame>
  );
}
