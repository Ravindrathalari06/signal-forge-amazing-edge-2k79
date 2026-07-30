'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  AuthProvider,
  LoginForm,
  RegisterForm,
  ProtectedRoute,
  UserMenu,
  useAuth,
} from 'lyzr-architect-pg/client'
import { Toaster, toast } from 'sonner'
import { callAIAgent } from '@/lib/aiAgent'
import { uploadAndTrainDocument, validateFile } from '@/lib/ragKnowledgeBase'
import { copyToClipboard } from '@/lib/clipboard'
import { Button } from '@/components/ui/button'
import { Send, LayoutGrid, History } from 'lucide-react'
import WorkspaceLeft, { type ProspectItem } from './sections/WorkspaceLeft'
import WorkspaceRight, {
  type ResearchSummary,
  type DraftData,
} from './sections/WorkspaceRight'
import SessionsView, {
  type SessionRow,
  type SessionDetail,
} from './sections/SessionsView'

// ---- Agent + KB config ----
const RESEARCH_AGENT_ID = '6a6b64ee1876a81230d903d3'
const PROSPECT_AGENT_ID = '6a6b64f90d42b68bdb009669'
const COORDINATOR_AGENT_ID = '6a6b6507acff266c55016b89'
const RAG_ID = '6a6b64c9543ebef6fcd47df5'
const KB_COMPANY_NAME = 'sdr_company_kbc014'

// ---- Robust agent response parsing ----
// Payload may be a JSON string inside result.response.result / .message,
// OR already a parsed object, OR prose/markdown when the KB is empty.
function parseAgentPayload(res: any): { obj: any | null; text: string } {
  const r = res?.response ?? {}

  // The pipeline wraps a plain string agent response as { text } or { value }.
  // Treat that as raw prose to parse/display, not a structured object.
  const resultObj =
    r.result && typeof r.result === 'object' ? r.result : null
  const wrapperKeys = resultObj ? Object.keys(resultObj) : []
  const isStringWrapper =
    resultObj &&
    wrapperKeys.length === 1 &&
    (wrapperKeys[0] === 'text' || wrapperKeys[0] === 'value')

  if (resultObj && !isStringWrapper && wrapperKeys.length > 0) {
    return { obj: resultObj, text: '' }
  }

  const candidate =
    (isStringWrapper ? resultObj[wrapperKeys[0]] : null) ??
    r.message ??
    (typeof r.result === 'string' ? r.result : null) ??
    res?.raw_response ??
    ''

  if (candidate && typeof candidate === 'object') {
    return { obj: candidate, text: '' }
  }

  const raw = typeof candidate === 'string' ? candidate : ''
  const trimmed = raw.trim()
  // Try direct JSON
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') return { obj: parsed, text: '' }
  } catch {
    /* not json */
  }
  // Try fenced ```json blocks
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) {
    try {
      const parsed = JSON.parse(fence[1].trim())
      if (parsed && typeof parsed === 'object') return { obj: parsed, text: '' }
    } catch {
      /* ignore */
    }
  }
  // Try first {...} span
  const braceStart = trimmed.indexOf('{')
  const braceEnd = trimmed.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      const parsed = JSON.parse(trimmed.slice(braceStart, braceEnd + 1))
      if (parsed && typeof parsed === 'object') return { obj: parsed, text: '' }
    } catch {
      /* ignore */
    }
  }
  return { obj: null, text: trimmed }
}

function formatDate(d?: string | number | Date): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// ---- Error Boundary ----
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="max-w-md p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {this.state.error}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4 antialiased">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Send className="h-6 w-6" />
          </div>
          <h1 className="text-balance text-2xl font-bold">
            SDR Outreach Assistant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Research, target, and draft personalised cold emails in minutes.
          </p>
        </div>
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}

function Workspace() {
  const { authFetch, user } = useAuth()

  const [view, setView] = useState<'workspace' | 'sessions'>('workspace')

  // KB
  const [kbFileName, setKbFileName] = useState<string | null>(null)
  const [kbUploading, setKbUploading] = useState(false)

  // Research
  const [targetCompany, setTargetCompany] = useState('')
  const [research, setResearch] = useState<ResearchSummary | null>(null)
  const [researchLoading, setResearchLoading] = useState(false)

  // Prospects
  const [prospects, setProspects] = useState<ProspectItem[]>([])
  const [prospectLoading, setProspectLoading] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<ProspectItem | null>(
    null
  )
  const [customName, setCustomName] = useState('')
  const [customRole, setCustomRole] = useState('')

  // Draft
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [outreachLoading, setOutreachLoading] = useState(false)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [savedThisSession, setSavedThisSession] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const currentStep = draft ? 3 : research ? 2 : 1
  const hasStarted = research !== null || prospects.length > 0

  // Seed + load sessions on first mount
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await authFetch('/api/seed', { method: 'POST' })
      } catch {
        /* non-fatal */
      }
      if (active) loadSessions()
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await authFetch('/api/sessions')
      const data = await res.json()
      if (data?.success) setSessions(Array.isArray(data.data) ? data.data : [])
      else toast.error(data?.error ?? 'Failed to load sessions')
    } catch (err: any) {
      toast.error(err?.message ?? 'Network error')
    } finally {
      setSessionsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } else {
      toast.error('Could not copy to clipboard')
    }
  }

  // ---- KB upload ----
  const handleUploadFile = async (file: File) => {
    const check = validateFile(file)
    if (!check.valid) {
      toast.error(check.error ?? 'Unsupported file type. Use PDF, DOCX or TXT.')
      return
    }
    setKbUploading(true)
    try {
      const result = await uploadAndTrainDocument(RAG_ID, file)
      if (result.success) {
        setKbFileName(result.fileName ?? file.name)
        toast.success('Knowledge base updated')
      } else {
        toast.error(result.error ?? 'Upload failed')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed')
    } finally {
      setKbUploading(false)
    }
  }

  // ---- Step 1: Research (auto-runs prospects after) ----
  const handleResearch = async () => {
    const company = targetCompany.trim()
    if (!company) return
    setResearchLoading(true)
    setResearch(null)
    setProspects([])
    setSelectedProspect(null)
    setDraft(null)
    setSavedThisSession(false)
    try {
      const res = await callAIAgent(
        `Research the company "${company}" for a B2B sales outreach. Provide overview, industry, size, recent signals, inferred pain points and sources.`,
        RESEARCH_AGENT_ID
      )
      if (!res.success) {
        toast.error(res.error ?? 'Research failed')
        return
      }
      const { obj, text } = parseAgentPayload(res)
      if (obj) {
        setResearch({
          overview: obj.overview,
          industry: obj.industry,
          size: obj.size,
          recent_signals: Array.isArray(obj.recent_signals)
            ? obj.recent_signals
            : [],
          inferred_pain_points: Array.isArray(obj.inferred_pain_points)
            ? obj.inferred_pain_points
            : [],
          sources: Array.isArray(obj.sources) ? obj.sources : [],
        })
      } else if (text) {
        setResearch({ raw_text: text })
      } else {
        toast.error('Empty research response')
        return
      }
      // auto-run prospects
      runProspects(company)
    } catch (err: any) {
      toast.error(err?.message ?? 'Research failed')
    } finally {
      setResearchLoading(false)
    }
  }

  // ---- Step 2: Prospects ----
  const runProspects = async (company: string) => {
    setProspectLoading(true)
    try {
      const res = await callAIAgent(
        `Suggest the best prospect personas (roles) to target at "${company}" for our outreach, with a short fit reason for each. Use our company knowledge base.`,
        PROSPECT_AGENT_ID
      )
      if (!res.success) {
        toast.error(res.error ?? 'Prospect suggestion failed')
        return
      }
      const { obj } = parseAgentPayload(res)
      const list: ProspectItem[] = Array.isArray(obj?.prospects)
        ? obj.prospects.map((p: any) => ({
            name: p?.name ?? p?.role ?? 'Prospect',
            role: p?.role,
            fit_reason: p?.fit_reason,
          }))
        : []
      setProspects(list)
    } catch (err: any) {
      toast.error(err?.message ?? 'Prospect suggestion failed')
    } finally {
      setProspectLoading(false)
    }
  }

  // ---- Step 3: Outreach (Manager Coordinator) ----
  const handleGenerateOutreach = async () => {
    const chosen: ProspectItem | null = selectedProspect
      ? selectedProspect
      : customName.trim() || customRole.trim()
        ? {
            name: customName.trim() || customRole.trim(),
            role: customRole.trim() || undefined,
          }
        : null
    if (!chosen) {
      toast.error('Pick or enter a prospect first')
      return
    }
    setOutreachLoading(true)
    setDraft(null)
    try {
      const prospectDesc = chosen.role
        ? `${chosen.name ? chosen.name + ', ' : ''}${chosen.role}`
        : chosen.name
      const res = await callAIAgent(
        `Write a personalised cold outreach email to ${prospectDesc} at "${targetCompany.trim()}". Ground it in our company knowledge base and the research. Return a subject, body and 2-3 alternative opening hooks.`,
        COORDINATOR_AGENT_ID
      )
      if (!res.success) {
        toast.error(res.error ?? 'Outreach generation failed')
        return
      }
      const { obj, text } = parseAgentPayload(res)
      let finalDraft: DraftData | null = null
      if (obj && (obj.subject || obj.body)) {
        finalDraft = {
          subject: obj.subject ?? '',
          body: obj.body ?? '',
          hooks: Array.isArray(obj.hooks) ? obj.hooks : [],
        }
      } else if (text) {
        finalDraft = { subject: '', body: '', hooks: [], raw_text: text }
      }
      if (!finalDraft) {
        toast.error('Empty outreach response')
        return
      }
      setDraft(finalDraft)
      // auto-save
      await saveSession(chosen, finalDraft)
    } catch (err: any) {
      toast.error(err?.message ?? 'Outreach generation failed')
    } finally {
      setOutreachLoading(false)
    }
  }

  const saveSession = async (prospect: ProspectItem, draftData: DraftData) => {
    if (savedThisSession) return
    try {
      const res = await authFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_company: targetCompany.trim(),
          company_name_of_kb: kbFileName ? KB_COMPANY_NAME : null,
          research_summary: research ?? {},
          prospect,
          draft: draftData,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setSavedThisSession(true)
        toast.success('Session saved to your history')
        loadSessions()
      } else {
        toast.error(data?.error ?? 'Failed to save session')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save session')
    }
  }

  const openSession = async (id: string) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await authFetch(`/api/sessions?id=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (data?.success) setDetail(data.data)
      else toast.error(data?.error ?? 'Failed to open session')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to open session')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </div>
            <span className="truncate text-sm font-semibold sm:text-base">
              SDR Outreach Assistant
            </span>
          </div>
          <nav className="ml-2 flex items-center gap-1">
            <Button
              variant={view === 'workspace' ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setView('workspace')
                setDetail(null)
              }}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Workspace</span>
            </Button>
            <Button
              variant={view === 'sessions' ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setView('sessions')
                setDetail(null)
                loadSessions()
              }}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Sessions</span>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6">
        {view === 'workspace' ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
            <div className="min-w-0">
              <WorkspaceLeft
                kbFileName={kbFileName}
                kbUploading={kbUploading}
                onUploadFile={handleUploadFile}
                targetCompany={targetCompany}
                setTargetCompany={setTargetCompany}
                onResearch={handleResearch}
                researchLoading={researchLoading}
                prospects={prospects}
                prospectLoading={prospectLoading}
                selectedProspect={selectedProspect}
                onSelectProspect={setSelectedProspect}
                customName={customName}
                setCustomName={setCustomName}
                customRole={customRole}
                setCustomRole={setCustomRole}
                onGenerateOutreach={handleGenerateOutreach}
                outreachLoading={outreachLoading}
                hasResearch={research !== null}
              />
              <AgentInfo />
            </div>
            <div className="min-w-0">
              <WorkspaceRight
                currentStep={currentStep}
                research={research}
                researchLoading={researchLoading}
                prospects={prospects}
                prospectLoading={prospectLoading}
                selectedProspect={selectedProspect}
                draft={draft}
                outreachLoading={outreachLoading}
                onBodyChange={(v) =>
                  setDraft((d) => (d ? { ...d, body: v } : d))
                }
                onSubjectChange={(v) =>
                  setDraft((d) => (d ? { ...d, subject: v } : d))
                }
                onCopy={handleCopy}
                copiedKey={copiedKey}
                hasStarted={hasStarted}
              />
            </div>
          </div>
        ) : (
          <SessionsView
            sessions={sessions}
            loading={sessionsLoading}
            detail={detail}
            detailLoading={detailLoading}
            onOpen={openSession}
            onBack={() => setDetail(null)}
            onCopy={handleCopy}
            copiedKey={copiedKey}
            formatDate={formatDate}
          />
        )}
      </main>
    </div>
  )
}

function AgentInfo() {
  const agents = [
    { name: 'Research Agent', purpose: 'Company research (step 1)' },
    { name: 'Prospect Agent', purpose: 'Persona suggestions (step 2)' },
    { name: 'Outreach Coordinator', purpose: 'Drafts email + hooks (step 3)' },
  ]
  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        Powered by
      </p>
      <ul className="space-y-1.5">
        {agents.map((a) => (
          <li key={a.name} className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="font-medium">{a.name}</span>
            <span className="min-w-0 truncate text-muted-foreground">
              · {a.purpose}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <ProtectedRoute unauthenticatedFallback={<AuthScreen />}>
          <Workspace />
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  )
}
