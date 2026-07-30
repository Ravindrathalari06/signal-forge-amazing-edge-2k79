import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { outreach_sessions, prospects, drafts } from '@/lib/db/schema'
import { NextResponse } from 'next/server'

export const POST = authMiddleware(async () => {
  try {
    const sessionRepo = scopedRepo(outreach_sessions)
    const existing = await sessionRepo.count()
    if (existing > 0) {
      return NextResponse.json({ success: true, seeded: false })
    }

    const seeds = [
      {
        target_company: 'Northwind Logistics',
        company_name_of_kb: 'FlowGrid',
        research_summary: {
          overview:
            'Northwind Logistics is a mid-market third-party logistics provider (~1,400 employees) specialising in regional fulfilment and last-mile delivery across the Midwest.',
          industry: 'Third-Party Logistics (3PL)',
          size: '~1,400 employees',
          recent_signals: [
            { signal: 'Series C · $60M', date: 'Mar 2026' },
            { signal: 'Opened 2 new distribution hubs', date: 'Feb 2026' },
            { signal: 'Hiring 40+ operations roles', date: 'Jan 2026' },
          ],
          inferred_pain_points: [
            'Scaling fulfilment capacity faster than current systems allow.',
            'Fragmented visibility across newly added distribution hubs.',
            'Onboarding a rapidly growing operations team efficiently.',
          ],
          sources: [
            'https://techcrunch.com/northwind-series-c',
            'https://northwindlogistics.com/newsroom',
          ],
        },
        prospect: {
          name: 'VP of Operations',
          role: 'VP of Operations',
          fit_reason:
            "Directly owns scaling fulfilment capacity and hub coordination, making them the primary decision-maker for solutions that address fragmented visibility.",
        },
        draft: {
          subject: "Scaling Northwind's new hubs without the growing pains",
          body:
            "Hi Alex,\n\nCongrats on the two new distribution hubs — scaling fulfilment that fast usually strains visibility across sites. That's exactly where FlowGrid helps ops leaders unify hub-level tracking into one view, so your growing team ships faster with fewer blind spots.\n\nWorth a 15-minute look at how teams like yours cut cross-hub coordination time?\n\nBest,\nJordan",
          hooks: [
            'Saw the Series C — congrats. Scaling ops that fast is where visibility usually breaks.',
            'Two new hubs in a quarter is a lot of coordination to keep in one view.',
            'Hiring 40+ ops roles? Onboarding is smoother when the tooling is unified.',
          ],
        },
      },
      {
        target_company: 'Brightpath Health',
        company_name_of_kb: 'FlowGrid',
        research_summary: {
          overview:
            'Brightpath Health is a fast-growing digital-first primary care network operating 60+ clinics with a hybrid virtual/in-person model.',
          industry: 'Healthcare Services',
          size: '~800 employees',
          recent_signals: [
            { signal: 'Acquired 12 regional clinics', date: 'Apr 2026' },
            { signal: 'Launched telehealth platform v2', date: 'Feb 2026' },
          ],
          inferred_pain_points: [
            'Standardising operations across newly acquired clinics.',
            'Coordinating supply and staffing across a distributed network.',
          ],
          sources: ['https://brightpathhealth.com/press'],
        },
        prospect: {
          name: 'Director of Clinical Operations',
          role: 'Director of Clinical Operations',
          fit_reason:
            'Owns cross-clinic standardisation and would champion a unified operational visibility layer post-acquisition.',
        },
        draft: {
          subject: 'Standardising ops across your 12 new clinics',
          body:
            "Hi Priya,\n\nIntegrating 12 clinics at once is a huge win — and a coordination challenge. FlowGrid gives clinical ops teams one shared view across sites, so standardisation happens faster and nothing slips between locations.\n\nOpen to a quick walkthrough tailored to multi-site clinical operations?\n\nBest,\nJordan",
          hooks: [
            'Congrats on the 12-clinic acquisition — that is a lot to standardise at once.',
            'A single operational view across sites makes post-M&A integration far smoother.',
          ],
        },
      },
    ]

    for (const s of seeds) {
      const [session] = await sessionRepo.insert({
        target_company: s.target_company,
        company_name_of_kb: s.company_name_of_kb,
        research_summary: s.research_summary,
      })
      await scopedRepo(prospects).insert({
        session_id: session.id,
        name: s.prospect.name,
        role: s.prospect.role,
        fit_reason: s.prospect.fit_reason,
        is_selected: true,
      })
      await scopedRepo(drafts).insert({
        session_id: session.id,
        subject: s.draft.subject,
        body: s.draft.body,
        hooks: s.draft.hooks,
      })
    }

    return NextResponse.json({ success: true, seeded: true })
  } catch (err: any) {
    console.error('[API] POST /api/seed error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to seed' },
      { status: 400 }
    )
  }
})
