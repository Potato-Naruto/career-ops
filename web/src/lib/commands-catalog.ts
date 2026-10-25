import {
  Archive, BarChart3, BookOpen, Brain, Briefcase, CalendarClock, ClipboardCheck, Compass, Cpu, FileText, Files,
  GraduationCap, Handshake, Inbox, Layers, ListChecks, Mail, Mic, PenLine, Plus, Radar, RefreshCw, Scale, Search,
  Send, Settings, ShieldAlert, Sparkles, Target, TrendingUp, Users, Wrench,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

// Every career-ops mode (AGENTS.md "Skill Modes"), grouped for the Command
// Center. `href` is the GUI page that covers the mode today; modes without one
// still list their terminal command so nothing is hidden behind the CLI.

export type CommandItem = {
  id: string;
  title: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** In-app page that covers this mode, when there is one. */
  href?: string;
  /** Slash command / prompt for the AI CLI. */
  cli: string;
  badge?: "New" | "Local AI";
};

export type CommandGroup = { id: string; label: string; blurb: string; items: CommandItem[] };

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    id: "find",
    label: "Find roles",
    blurb: "Discover postings and feed your pipeline.",
    items: [
      { id: "scan", title: "Scan portals", desc: "Zero-token sweep of Greenhouse, Ashby and Lever boards for new matches.", icon: Radar, href: "/explore", cli: "/career-ops scan" },
      { id: "discover", title: "Discover boards", desc: "Turn a list of company names into scannable ATS boards in portals.yml.", icon: Compass, href: "/portals", cli: "/career-ops discover" },
      { id: "titles", title: "Adjacent titles", desc: "Broaden the search with job titles suggested from your CV.", icon: Layers, cli: "/career-ops titles" },
      { id: "scheduled", title: "Scheduled scans", desc: "Save recurring scans and let them run on a timer.", icon: CalendarClock, href: "/scheduled-scans", cli: "/career-ops scan" },
      { id: "pipeline", title: "Process pipeline", desc: "Work through the inbox of pending URLs.", icon: Inbox, href: "/pipeline", cli: "/career-ops pipeline" },
      { id: "triage", title: "Triage", desc: "Fast first-pass filter before a full evaluation.", icon: Target, cli: "/career-ops triage" },
    ],
  },
  {
    id: "evaluate",
    label: "Evaluate",
    blurb: "Score offers against your CV, in the cloud or on your own machine.",
    items: [
      { id: "ollama", title: "Evaluate with Ollama", desc: "Run the A–G evaluation on a local model. Free, private, no API key.", icon: Cpu, href: "/ollama", cli: "node ollama-eval.mjs --file jd.txt", badge: "Local AI" },
      { id: "oferta", title: "Evaluate an offer", desc: "Full A–G report, legitimacy check and verdict for one posting.", icon: ClipboardCheck, href: "/pipeline", cli: "/career-ops oferta" },
      { id: "auto-pipeline", title: "Auto-pipeline", desc: "Paste a JD or URL: evaluate, report, PDF and tracker in one go.", icon: Sparkles, href: "/", cli: "/career-ops <paste a URL>" },
      { id: "ofertas", title: "Compare offers", desc: "Side-by-side comparison of several evaluated offers.", icon: Scale, href: "/pipeline/compare", cli: "/career-ops ofertas" },
      { id: "deep", title: "Company research", desc: "Six-axis deep dive: strategy, culture, challenges, competitors.", icon: Search, cli: "/career-ops deep" },
      { id: "project", title: "Evaluate a project", desc: "Judge a portfolio project for how well it supports your search.", icon: Briefcase, cli: "/career-ops project" },
      { id: "training", title: "Evaluate a course", desc: "Is this course or certificate worth your time?", icon: GraduationCap, cli: "/career-ops training" },
      { id: "batch", title: "Batch evaluate", desc: "Process many offers in parallel.", icon: Layers, cli: "/career-ops batch" },
    ],
  },
  {
    id: "documents",
    label: "CV & documents",
    blurb: "Tailored, ATS-safe documents built only from your own facts.",
    items: [
      { id: "pdf", title: "Tailored CV (PDF)", desc: "Generate a CV tailored to one posting and render it to PDF.", icon: FileText, href: "/cv", cli: "/career-ops pdf" },
      { id: "latex", title: "LaTeX CV", desc: "Overleaf-ready LaTeX version of your CV.", icon: FileText, cli: "/career-ops latex" },
      { id: "text", title: "CV as Markdown", desc: "Tailored CV as markdown to paste into your own template.", icon: PenLine, cli: "/career-ops text" },
      { id: "cover", title: "Cover letter", desc: "Draft a cover letter grounded in your CV and the posting.", icon: Mail, href: "/pipeline", cli: "/career-ops cover" },
      { id: "ats", title: "ATS check", desc: "Parseability score and issues for a generated CV.", icon: ClipboardCheck, cli: "/career-ops ats" },
      { id: "master-profile", title: "Master career profile", desc: "Build and review a source-backed master profile.", icon: BookOpen, cli: "/career-ops master-profile" },
      { id: "expand", title: "Expand competencies", desc: "Surface skills you forgot to put on your CV.", icon: Plus, cli: "/career-ops expand" },
      { id: "intake", title: "Intake documents", desc: "Propose profile additions from files in documents/.", icon: Files, href: "/documents", cli: "/career-ops intake" },
      { id: "add", title: "Add to CV", desc: "Add a finished project, paper or role, with a preview first.", icon: Plus, cli: "/career-ops add" },
    ],
  },
  {
    id: "apply",
    label: "Apply & network",
    blurb: "You review everything. Nothing is ever submitted for you.",
    items: [
      { id: "apply", title: "Application assistant", desc: "Draft form answers and prefill; you press Submit.", icon: Send, href: "/apply", cli: "/career-ops apply" },
      { id: "email", title: "Application email", desc: "Draft-only subject, body and attachment checklist.", icon: Mail, cli: "/career-ops email" },
      { id: "contacto", title: "LinkedIn outreach", desc: "Find the right contact and draft a short message.", icon: Users, cli: "/career-ops contacto" },
      { id: "followup", title: "Follow-ups", desc: "Cadence and history of your application follow-ups.", icon: RefreshCw, href: "/followups", cli: "/career-ops followup" },
      { id: "reply-watch", title: "Reply watch", desc: "Classify replies and suggest tracker updates.", icon: Inbox, cli: "/career-ops reply-watch" },
      { id: "agent-inbox", title: "Agent inbox", desc: "Queue a request now, drain it next session.", icon: Archive, cli: "/career-ops agent-inbox" },
    ],
  },
  {
    id: "interview",
    label: "Interview & offer",
    blurb: "Prepare, practise, debrief and understand the paperwork.",
    items: [
      { id: "interview-prep", title: "Interview prep", desc: "Company-specific intel and your STAR+R story bank.", icon: Mic, cli: "/career-ops interview-prep" },
      { id: "interview-plan", title: "Prep plan", desc: "Time-blocked plan for an upcoming interview.", icon: CalendarClock, cli: "/career-ops interview/plan" },
      { id: "interview-practice", title: "Practice questions", desc: "Run practice questions with feedback.", icon: Brain, cli: "/career-ops interview/practice" },
      { id: "interview-debrief", title: "Debrief", desc: "Debrief a real interview and close the gaps.", icon: ClipboardCheck, cli: "/career-ops interview/debrief" },
      { id: "interview-redflag", title: "Red-flag check", desc: "Is this company safe to join?", icon: ShieldAlert, cli: "/career-ops interview-redflag" },
      { id: "offer-prep", title: "Offer prep", desc: "Walk through an offer's clauses with a lawyer question list.", icon: Handshake, cli: "/career-ops offer-prep" },
    ],
  },
  {
    id: "track",
    label: "Track & learn",
    blurb: "Know what is working and where to improve.",
    items: [
      { id: "tracker", title: "Application tracker", desc: "Every application, status and score in one table.", icon: ListChecks, href: "/pipeline", cli: "/career-ops tracker" },
      { id: "patterns", title: "Rejection patterns", desc: "Find patterns and sharpen your targeting.", icon: TrendingUp, href: "/analytics", cli: "/career-ops patterns" },
      { id: "calibrate", title: "Calibrate scores", desc: "Do the scores actually predict your outcomes?", icon: BarChart3, href: "/analytics", cli: "/career-ops calibrate" },
      { id: "upskill", title: "Skill gaps", desc: "What to learn, weighted by your tracked reports.", icon: GraduationCap, href: "/analytics", cli: "/career-ops upskill" },
      { id: "outcome", title: "Record outcome", desc: "Record a result and archive the artifacts.", icon: ClipboardCheck, cli: "/career-ops outcome" },
    ],
  },
  {
    id: "system",
    label: "Setup & system",
    blurb: "Make it yours and keep it healthy.",
    items: [
      { id: "config", title: "Settings", desc: "Profile, CLI choice and preferences.", icon: Settings, href: "/config", cli: "config/profile.yml" },
      { id: "update", title: "Update career-ops", desc: "Install the latest release; your data is never touched.", icon: Wrench, cli: "node update-system.mjs check" },
      { id: "doctor", title: "Health check", desc: "Verify the setup and the pipeline's integrity.", icon: ShieldAlert, cli: "node doctor.mjs" },
    ],
  },
];

export const ALL_COMMANDS: CommandItem[] = COMMAND_GROUPS.flatMap((g) => g.items);
