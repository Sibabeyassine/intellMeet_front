import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ActionItem, AISuggestion, MeetingSummary } from "@/services";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Circle, Clock, FileText, ListChecks, Sparkles, Wand2 } from "lucide-react";

interface Props {
  onClose?: () => void;
  summary?: MeetingSummary | null;
  actionItems?: ActionItem[];
  suggestions?: AISuggestion[];
}

export function AIPanel({ onClose, summary, actionItems = [], suggestions = [] }: Props) {
  const highlights = summary?.highlights ?? [];
  const decisions = summary?.decisions ?? [];

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-card">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-mesh px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground shadow-glow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold leading-tight text-foreground">IntellMeet AI</h3>
              <p className="text-[11px] text-muted-foreground">Analyse en direct · GPT‑4o</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          {/* Topic */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sujet détecté</p>
            <h4 className="mt-1 font-display text-base font-semibold text-foreground">{summary?.topic ?? "Analyse IA en attente"}</h4>
          </div>

          {/* Live summary */}
          <Section icon={FileText} title="Résumé en direct" badge="Auto">
            {highlights.length ? (
              <ul className="space-y-2.5">
                {highlights.map((h, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun résumé IA disponible pour cette réunion.</p>
            )}
          </Section>

          {/* Action items */}
          <Section icon={ListChecks} title="Action items" badge={`${actionItems.length}`}>
            {actionItems.length ? (
              <div className="space-y-2">
                {actionItems.map((a) => (
                  <div
                    key={a.id}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-primary/40 hover:shadow-elev-sm"
                  >
                    <button className="mt-0.5 text-muted-foreground transition group-hover:text-primary">
                      {a.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-sm font-medium leading-snug text-foreground",
                        a.status === "done" && "line-through text-muted-foreground"
                      )}>
                        {a.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                          style={{ backgroundColor: `hsl(${a.color})` }}
                        >
                          {a.initials}
                        </span>
                        <span>{a.assignee}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{a.due}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune action IA détectée pour le moment.</p>
            )}
          </Section>

          {/* Decisions */}
          <Section icon={Wand2} title="Décisions clés">
            {decisions.length ? (
              <ul className="space-y-2">
                {decisions.map((d, i) => (
                  <li key={i} className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-foreground/90">
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune décision IA détectée pour le moment.</p>
            )}
          </Section>

          {/* AI suggestion */}
          {suggestions[0] && (
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                SUGGESTION
              </div>
              <p className="mt-2 text-sm text-foreground/90">{suggestions[0].text}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button variant="outline" className="w-full justify-between" size="sm">
          Exporter le résumé complet
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}

function Section({ icon: Icon, title, badge, children }: { icon: LucideIcon; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-primary" />
          <h5 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h5>
        </div>
        {badge && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
            {badge}
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}
