'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Check,
  Copy,
  FileText,
  Loader2,
  ExternalLink,
  Mail,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import type { ProspectItem } from './WorkspaceLeft'

export interface ResearchSummary {
  overview?: string
  industry?: string
  size?: string
  recent_signals?: { signal?: string; date?: string }[]
  inferred_pain_points?: string[]
  sources?: string[]
  raw_text?: string
}

export interface DraftData {
  subject: string
  body: string
  hooks: string[]
  raw_text?: string
}

interface WorkspaceRightProps {
  currentStep: number
  research: ResearchSummary | null
  researchLoading: boolean
  prospects: ProspectItem[]
  prospectLoading: boolean
  selectedProspect: ProspectItem | null
  draft: DraftData | null
  outreachLoading: boolean
  onBodyChange: (v: string) => void
  onSubjectChange: (v: string) => void
  onCopy: (text: string, key: string) => void
  copiedKey: string | null
  hasStarted: boolean
}

function Stepper({ step }: { step: number }) {
  const steps = ['Research', 'Prospects', 'Outreach']
  return (
    <div className="mb-6 flex items-center gap-3">
      {steps.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = step > n
        return (
          <React.Fragment key={label}>
            <div
              className={`flex items-center gap-2 text-sm ${
                active
                  ? 'font-semibold text-foreground'
                  : done
                    ? 'text-foreground'
                    : 'text-muted-foreground'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  active || done
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-muted text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px min-w-4 flex-1 bg-border" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-primary first:mt-0">
      {children}
    </h4>
  )
}

function CopyButton({
  onClick,
  copied,
  label = 'Copy',
}: {
  onClick: () => void
  copied: boolean
  label?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 gap-1.5 active:scale-[0.98] transition-transform motion-reduce:transform-none"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : label}
    </Button>
  )
}

export default function WorkspaceRight(props: WorkspaceRightProps) {
  const {
    currentStep,
    research,
    researchLoading,
    prospects,
    prospectLoading,
    selectedProspect,
    draft,
    outreachLoading,
    onBodyChange,
    onSubjectChange,
    onCopy,
    copiedKey,
    hasStarted,
  } = props

  return (
    <Card className="min-h-[70vh] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)]">
      <CardContent className="p-5 sm:p-6">
        <Stepper step={currentStep} />

        {/* Empty state */}
        {!hasStarted && !researchLoading && (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-balance text-lg font-semibold">
              Start your outreach
            </h3>
            <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
              Upload your company knowledge base and enter a target company, then
              run Research to begin building a grounded, personalised email.
            </p>
          </div>
        )}

        {/* Research loading skeleton */}
        {researchLoading && (
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        )}

        {/* Research summary */}
        {research && !researchLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            <SectionLabel>Company Research Summary</SectionLabel>
            {research.raw_text ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {research.raw_text}
              </p>
            ) : (
              <>
                {research.overview && (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {research.overview}
                  </p>
                )}
                {(research.industry || research.size) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {research.industry && (
                      <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {research.industry}
                      </span>
                    )}
                    {research.size && (
                      <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {research.size}
                      </span>
                    )}
                  </div>
                )}

                {Array.isArray(research.recent_signals) &&
                  research.recent_signals.length > 0 && (
                    <>
                      <SectionLabel>Recent Signals</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {research.recent_signals.map((s, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                          >
                            {s?.signal}
                            {s?.date ? ` · ${s.date}` : ''}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                {Array.isArray(research.inferred_pain_points) &&
                  research.inferred_pain_points.length > 0 && (
                    <>
                      <SectionLabel>Inferred Pain Points</SectionLabel>
                      <ul className="list-disc space-y-1 pl-5">
                        {research.inferred_pain_points.map((p, i) => (
                          <li
                            key={i}
                            className="text-sm leading-relaxed text-foreground/90"
                          >
                            {p}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                {Array.isArray(research.sources) &&
                  research.sources.length > 0 && (
                    <>
                      <SectionLabel>Sources</SectionLabel>
                      <div className="space-y-1">
                        {research.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="min-w-0 truncate">{src}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
              </>
            )}
          </div>
        )}

        {/* Suggested prospects on the right */}
        {(prospectLoading ||
          (Array.isArray(prospects) && prospects.length > 0)) &&
          research && (
            <div>
              <SectionLabel>Suggested Prospects</SectionLabel>
              {prospectLoading ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {prospects.map((p, i) => {
                    const active =
                      selectedProspect?.role === p.role &&
                      selectedProspect?.name === p.name
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 ${
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted/40'
                        }`}
                      >
                        <div className="text-sm font-semibold">
                          {p.role ?? p.name}
                        </div>
                        {p.fit_reason && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {p.fit_reason}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        {/* Outreach loading */}
        {outreachLoading && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Drafting a KB-grounded email...
            </div>
            <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        )}

        {/* Draft email */}
        {draft && !outreachLoading && (
          <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            {draft.raw_text ? (
              <>
                <div className="mb-2 mt-5 flex items-center justify-between">
                  <SectionLabel>Draft</SectionLabel>
                  <CopyButton
                    onClick={() => onCopy(draft.raw_text ?? '', 'raw')}
                    copied={copiedKey === 'raw'}
                  />
                </div>
                <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed text-foreground/90">
                  {draft.raw_text}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 mt-5 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Mail className="h-3.5 w-3.5" />
                    Draft Email
                  </h4>
                  <CopyButton
                    onClick={() =>
                      onCopy(
                        `Subject: ${draft.subject}\n\n${draft.body}`,
                        'email'
                      )
                    }
                    copied={copiedKey === 'email'}
                  />
                </div>
                <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      Subject
                    </span>
                    <Input
                      value={draft.subject}
                      onChange={(e) => onSubjectChange(e.target.value)}
                      className="h-8 bg-background text-sm"
                    />
                  </div>
                  <Textarea
                    value={draft.body}
                    onChange={(e) => onBodyChange(e.target.value)}
                    rows={10}
                    className="resize-y bg-background text-sm leading-relaxed"
                  />
                </div>

                {Array.isArray(draft.hooks) && draft.hooks.length > 0 && (
                  <>
                    <h4 className="mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Alternative Hooks
                    </h4>
                    <div className="space-y-2">
                      {draft.hooks.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3"
                        >
                          <span className="font-bold text-primary tabular-nums">
                            {i + 1}
                          </span>
                          <p className="min-w-0 flex-1 text-sm text-foreground/90">
                            {h}
                          </p>
                          <button
                            type="button"
                            onClick={() => onCopy(h, `hook-${i}`)}
                            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
                            aria-label="Copy hook"
                          >
                            {copiedKey === `hook-${i}` ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              This session is saved to your history automatically.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
