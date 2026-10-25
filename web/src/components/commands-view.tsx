"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, Search, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageFrame } from "@/components/page-frame";
import { cn } from "@/lib/cn";
import { ALL_COMMANDS, COMMAND_GROUPS, type CommandItem } from "@/lib/commands-catalog";

function CopyCommand({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the command is still visible on the card */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy command"
      className="group/copy inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5 font-mono text-[11.5px] text-muted transition-colors hover:border-brand/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 max-sm:min-h-[44px]"
    >
      <Terminal className="size-3.5 shrink-0 text-brand-text" aria-hidden />
      <span className="truncate">{text}</span>
      {copied ? <Check className="size-3.5 shrink-0 text-emerald-500" aria-hidden /> : <Copy className="size-3.5 shrink-0 opacity-60 group-hover/copy:opacity-100" aria-hidden />}
      <span className="sr-only">{copied ? "Copied" : "Copy command"}</span>
    </button>
  );
}

function CommandCard({ item }: { item: CommandItem }) {
  const Icon = item.icon;
  const featured = item.badge === "Local AI";
  return (
    <Card
      corner={featured ? "tr" : undefined}
      className={cn(
        "group flex h-full flex-col gap-3 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_8px_30px_-12px_hsl(217_91%_60%/0.45)]",
        featured && "border-brand/40 bg-brand-soft",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-200 text-brand-foreground shadow-sm">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold leading-tight text-foreground">{item.title}</h3>
            {item.badge && <Badge tone="info">{item.badge}</Badge>}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-muted">{item.desc}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <CopyCommand text={item.cli} />
        {item.href ? (
          <Link
            href={item.href}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 max-sm:min-h-[44px]"
          >
            Open <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <span className="text-[11px] font-medium text-faint">AI CLI</span>
        )}
      </div>
    </Card>
  );
}

export function CommandsView() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      COMMAND_GROUPS.filter((g) => group === "all" || g.id === group)
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => !q || `${i.title} ${i.desc} ${i.id} ${i.cli}`.toLowerCase().includes(q)),
        }))
        .filter((g) => g.items.length > 0),
    [q, group],
  );
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <PageFrame>
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/20 via-surface to-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/25 blur-3xl" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text">Command center</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Everything career-ops can do</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          {ALL_COMMANDS.length} modes in one place. Open the ones with a page in this app, or copy the command for the rest.
          Nothing here ever submits an application for you.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block flex-1 sm:max-w-md">
            <span className="sr-only">Search modes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modes, e.g. interview, cv, scan"
              className="w-full rounded-xl border border-border bg-background/70 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Category">
            {[{ id: "all", label: "All" }, ...COMMAND_GROUPS.map((g) => ({ id: g.id, label: g.label }))].map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={group === g.id}
                onClick={() => setGroup(g.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 max-sm:min-h-[44px]",
                  group === g.id
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-surface text-muted hover:border-brand/50 hover:text-foreground",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {shown === 0 ? (
        <Card className="py-12 text-center text-sm text-muted">No modes match “{query}”.</Card>
      ) : (
        <div className="space-y-9">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`grp-${g.id}`}>
              <div className="mb-3 flex items-baseline gap-3">
                <h2 id={`grp-${g.id}`} className="text-lg font-semibold text-foreground">
                  {g.label}
                </h2>
                <p className="text-[13px] text-faint">{g.blurb}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((item) => (
                  <CommandCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
