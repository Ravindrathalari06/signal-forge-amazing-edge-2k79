import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { outreach_sessions, prospects, drafts } from '@/lib/db/schema'
import { eq, desc } from 'lyzr-architect-pg/schema'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/sessions            -> list all sessions (newest first)
// GET /api/sessions?id=<id>    -> single session with nested prospect + draft
export const GET = authMiddleware(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const session = await scopedRepo(outreach_sessions).findOne(
        eq(outreach_sessions.id, id)
      )
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        )
      }
      const sessionProspects = await scopedRepo(prospects).findMany({
        where: eq(prospects.session_id, id),
      })
      const sessionDrafts = await scopedRepo(drafts).findMany({
        where: eq(drafts.session_id, id),
      })
      return NextResponse.json({
        success: true,
        data: {
          ...session,
          prospects: sessionProspects,
          draft: sessionDrafts[0] ?? null,
        },
      })
    }

    const rows = await scopedRepo(outreach_sessions).findMany({
      orderBy: desc(outreach_sessions.created_at),
    })
    return NextResponse.json({ success: true, data: rows })
  } catch (err: any) {
    console.error('[API] GET /api/sessions error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to load sessions' },
      { status: 400 }
    )
  }
})

// POST /api/sessions -> save a full session (session + selected prospect + draft)
export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const {
      target_company,
      company_name_of_kb,
      research_summary,
      prospect,
      draft,
    } = body ?? {}

    if (!target_company) {
      return NextResponse.json(
        { success: false, error: 'target_company is required' },
        { status: 400 }
      )
    }

    const [session] = await scopedRepo(outreach_sessions).insert({
      target_company,
      company_name_of_kb: company_name_of_kb ?? null,
      research_summary: research_summary ?? {},
    })

    let savedProspect = null
    if (prospect && (prospect.name || prospect.role)) {
      const [p] = await scopedRepo(prospects).insert({
        session_id: session.id,
        name: prospect.name ?? prospect.role ?? 'Prospect',
        role: prospect.role ?? null,
        fit_reason: prospect.fit_reason ?? null,
        is_selected: true,
      })
      savedProspect = p
    }

    let savedDraft = null
    if (draft && (draft.subject || draft.body)) {
      const [d] = await scopedRepo(drafts).insert({
        session_id: session.id,
        subject: draft.subject ?? '',
        body: draft.body ?? '',
        hooks: Array.isArray(draft.hooks) ? draft.hooks : [],
      })
      savedDraft = d
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...session, prospect: savedProspect, draft: savedDraft },
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[API] POST /api/sessions error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to save session' },
      { status: 400 }
    )
  }
})

// DELETE /api/sessions?id=<id>
export const DELETE = authMiddleware(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      )
    }
    await scopedRepo(prospects).delete(eq(prospects.session_id, id))
    await scopedRepo(drafts).delete(eq(drafts.session_id, id))
    await scopedRepo(outreach_sessions).delete(eq(outreach_sessions.id, id))
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API] DELETE /api/sessions error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to delete session' },
      { status: 400 }
    )
  }
})
