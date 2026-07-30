'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  History,
  Building2,
  Mail,
  Lightbulb,
  User,
  ExternalLink,
} from 'lucide-react'
import type { ResearchSummary, DraftData } from './WorkspaceRight'
import type { ProspectItem } from './WorkspaceLeft'

export interface SessionRow {
  id: string
  target_company: string
  company_name_of_kb?: string | null
  created_at?: string | number | Date
}

export interface SessionDetail extends SessionRow {
  research_summary?: ResearchSummary
  prospects?: (ProspectItem & { is_selected?: boolean })[]
  draft?: DraftData | null
}

interface SessionsViewProps {
  sessions: SessionRow[]
  loading: boolean
  detail: SessionDetail | null
  detailLoading: boolean
  onOpen: (id: string) => void
  onBack: () => void
  onCopy: (text: string, key: string) => void
  copiedKey: string | null
  formatDate: (d?: string | number | Date) => string
}

export default function SessionsView(props: SessionsViewProps) {
  const {
    sessions,
    loading,
    detail,
    detailLoading,
    onOpen,
    onBack,
    onCopy,
    copiedKey,
    formatDate,
  } = props

  if (detail || detailLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </Button>

        {detailLoading || !detail ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading session...
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Building2 className="h-5 w-5 text-primary" />
                  {detail.target_company}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(detail.created_at)}
                  {detail.company_name_of_kb
                    ? ` · KB: ${detail.company_name_of_kb}`
                    : ''}
                </p>
              </div>

              {detail.research_summary && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    Research Summary
                  </h4>
                  {detail.research_summary.overview && (
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {detail.research_summary.overview}
                    </p>
                  )}
                  {Array.isArray(detail.research_summary.recent_signals) &&
                    detail.research_summary.recent_signals.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {detail.research_summary.recent_signals.map((s, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                          >
                            {s?.signal}
                            {s?.date ? ` · ${s.date}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  {Array.isArray(detail.research_summary.inferred_pain_points) &&
                    detail.research_summary.inferred_pain_points.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5">
                        {detail.research_summary.inferred_pain_points.map(
                          (p, i) => (
                            <li
                              key={i}
                              className="text-sm leading-relaxed text-foreground/90"
                            >
                              {p}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  {Array.isArray(detail.research_summary.sources) &&
                    detail.research_summary.sources.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {detail.research_summary.sources.map((src, i) => (
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
                    )}
                </div>
              )}

              {Array.isArray(detail.prospects) &&
                detail.prospects.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      <User className="h-3.5 w-3.5" />
                      Prospect
                    </h4>
                    {detail.prospects.map((p, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-muted/40 p-3"
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
                    ))}
                  </div>
                )}

              {detail.draft && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      Draft Email
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onCopy(
                          `Subject: ${detail.draft?.subject ?? ''}\n\n${detail.draft?.body ?? ''}`,
                          'sess-email'
                        )
                      }
                      className="h-8 gap-1.5"
                    >
                      {copiedKey === 'sess-email' ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedKey === 'sess-email' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed">
                    <p className="font-semibold">
                      Subject: {detail.draft.subject}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-foreground/90">
                      {detail.draft.body}
                    </p>
                  </div>

                  {Array.isArray(detail.draft.hooks) &&
                    detail.draft.hooks.length > 0 && (
                      <>
                        <h4 className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Alternative Hooks
                        </h4>
                        <div className="space-y-2">
                          {detail.draft.hooks.map((h, i) => (
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
                                onClick={() => onCopy(h, `sess-hook-${i}`)}
                                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
                                aria-label="Copy hook"
                              >
                                {copiedKey === `sess-hook-${i}` ? (
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
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Your Sessions</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : Array.isArray(sessions) && sessions.length > 0 ? (
        <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-card">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpen(s.id)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {s.target_company}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(s.created_at)}
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground" />
            </button>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold">No sessions yet</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Complete an outreach flow in the Workspace and it will be saved
              here automatically.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
