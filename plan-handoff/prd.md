Got it — you want saved sessions and user accounts, so I'll add a PostgreSQL database with login, plus a Sessions history view. Let me lock in the theme and author the plan and supporting artifacts.







# AI SDR Outreach Assistant

## 1. Overview
An AI-powered SDR workspace that turns a target company name into research-backed, personalised outreach — grounded strictly in the user's own company knowledge base. It runs as a guided three-step flow (Research → Prospects → Outreach) and saves each completed session so users can revisit past drafts. User accounts keep every user's sessions private.

## 2. User Stories
- As an SDR, I want to research a target company from just its name so that I understand its context and pain points before reaching out.
- As an SDR, I want suggested prospect personas ranked by fit to my ICP so that I target the right people.
- As an SDR, I want a personalised draft email that references my product by name and never invents claims, so that outreach is accurate and on-brand.
- As an SDR, I want alternative one-line hooks so that I can A/B different openers.
- As an SDR, I want my past sessions saved so that I can revisit or copy earlier drafts later.

## 3.a. Agent Architecture

**Pattern:** Mixed — one **Single** agent (Research) triggered in step 1, and a **Manager-Subagent** cluster triggered in step 3 (Outreach) that coordinates Personalisation + Writer. The Prospect agent runs as its own **Single** agent between them. Steps are UI-orchestrated because there are natural breakpoints (user selects a prospect, sessions are saved).

**Reasoning:** Research and prospecting are distinct user-triggered steps with human selection in between → independent agents. Personalisation feeds directly into the Writer in one shot with one combined output (the email + hooks) → Manager-Subagent for step 3, one CTA, one output.

**Agent Flow:**
```
[Login/Signup] → App unlocked
Step 1: User uploads KB + enters target company → clicks "Research Company"
  → Research Agent (Perplexity web search) → Company Research Summary (right column)
Step 2: (auto after step 1) Prospect Agent → 3–4 selectable persona cards
  → user selects a persona OR enters own prospect name/role
Step 3: User clicks "Generate Outreach"
  → Outreach Coordinator (Manager)
       ├→ Personalisation Sub-Agent (maps KB value props → prospect needs)
       └→ Writer Sub-Agent (drafts email + 2–3 hooks, KB-grounded)
  → combined Draft Email + Alternative Hooks (right column)
On completion: session (research + prospect + draft) saved to DB → appears in Sessions history
```

**Data Sources Detected:** 2 — Knowledge Base (user's company doc, unstructured RAG) + Web search (Perplexity Sonar Pro).

**Agents Table:**
| Agent Type | Agent Name | Description | Tools/Data Sources | Trigger | Provider | Model | Temperature | Top_p |
|------------|------------|-------------|-------------------|---------|----------|-------|-------------|-------|
| Single | Research Agent | Researches the target company via web search — overview, industry, size, recent news/signals, inferred pain points. Cited. | Perplexity built-in web search | "Research Company" on Workspace | Perplexity | perplexity/sonar-pro | 0.3 | 1 |
| Single | Prospect Agent | Uses the company research + the user's ICP/product from the KB to suggest 3–4 target roles/personas, each with a one-line fit reason. | Knowledge Base | Auto after Research (renders selectable cards) | Anthropic | anthropic/claude-sonnet-4-6 | 0.4 | 1 |
| Manager | Outreach Coordinator | Coordinates Personalisation + Writer sub-agents and aggregates their output into one draft email + hooks. Routes prospect + research + KB context. | N/A | "Generate Outreach" on Workspace | Anthropic | anthropic/claude-sonnet-4-6 | 0.3 | 1 |
| Sub-Agent | Personalisation Agent | Matches the user's value propositions (from KB) to the selected prospect's likely needs. KB-grounded only. | Knowledge Base | Auto (via Manager) | Anthropic | anthropic/claude-sonnet-4-6 | 0.4 | 1 |
| Sub-Agent | Writer Agent | Drafts the personalised email (references the product by name from KB) + 2–3 alternative one-line hooks. No invented claims. | Knowledge Base | Auto (via Manager) | Anthropic | anthropic/claude-sonnet-4-6 | 0.6 | 1 |

**Workflow Visualization:** The Input Node sits far left. The Research Agent connects to its right at the same level. To its right, the Prospect Agent continues the horizontal flow. To the right of the Prospect Agent, the Outreach Coordinator (Manager) connects; directly below the Manager, the Personalisation Agent and Writer Agent sit in a horizontal row at the same vertical level, with bottom connections from the Manager to each.

**Connection Summary:**
- Input → Research Agent: Right
- Research Agent → Prospect Agent: Right
- Prospect Agent → Outreach Coordinator: Right
- Outreach Coordinator → Personalisation, Writer: Bottom (horizontal row of subs)

## 3.b. Knowledge Base
The user uploads a company document (what it does, product, value props, ICP, pricing) as the RAG knowledge base. Used by the Prospect, Personalisation, and Writer agents. All user-company claims come ONLY from this KB — nothing invented. Prospect/target-company details come from the research step, not the KB. The KB is uploaded per session via the "Your Company" card.

## 3.g. Database Configuration

**Database:** PostgreSQL (Built-in Lyzr Studio database)

**User Management:** Required — email/password signup + login. All screens gated behind authentication.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| users | User accounts and auth | id, name, email, password_hash, created_at |
| sessions | One saved outreach session per run | id, user_id (FK → users.id), target_company, company_name_of_kb, research_summary (jsonb), created_at |
| prospects | Prospect chosen/entered per session | id, session_id (FK → sessions.id), name, role, fit_reason |
| drafts | Generated draft + hooks per session | id, session_id (FK → sessions.id), subject, body, hooks (jsonb), created_at |

**Authentication Flow:** Standard email/password signup and login; the workspace is visible but blurred/locked behind an auth modal until authenticated.

## 4. User Flow
```
1. User lands on the Workspace (blurred/locked) with an auth modal (Sign Up default, app-themed).
2. New user signs up (name, email, password) → account created → app unlocked. Returning user logs in.
3. Step 1 — Left column: upload company KB ("Your Company" card → shows "ready"); enter target company ("Target Company" card) → click "Research Company".
   → Right column loading → Research Agent returns Company Research Summary.
4. Step 2 — Prospect Agent auto-runs → 3–4 selectable persona cards appear in the left "Prospects" section AND right column. User selects one OR enters own prospect name/role.
5. Step 3 — "Generate Outreach" button appears → click → right column loading → Outreach Coordinator (Personalisation + Writer) returns Draft Email (editable, Copy button) + Alternative Hooks.
6. Session auto-saves → appears in Sessions history; user can reopen a past session to view/copy its draft. Flow ends at the editable, copyable draft — no email is sent.
```

## 5. Integrations Required
No out-of-the-box integrations required for this app. Web research is handled by the Research Agent's Perplexity Sonar Pro model (built-in search with citations), not a Composio tool. Email is never sent — the flow ends at a copyable draft.

## 6. UI/UX Specification

### App Structure
Authenticated single-workspace app. A top header holds the app name, a "Sessions" history entry, and the user menu. The primary screen is a **two-column Workspace**. Login and Sign Up gate everything (auth modal over a blurred workspace).

### Design System
**Components:** Cards ("Your Company", "Target Company", selectable prospect cards), 3-step progress stepper, editable email panel with inline Copy button, hook chips, skeleton loaders, toasts, auth modal, sessions list rows.
**Visual Hierarchy:** 8pt spacing grid; large step headings, subtle secondary text; generous whitespace; crisp, professional density.
**Information Density:** Left column ~35% (inputs + prospects), right column ~65% (progressive output). Clean, minimal, no clutter.

### Screens/Pages/Sections

**Screen 0 / 0b: Login & Sign Up** — centered card forms (Login: email + password; Sign Up: name, email, password), primary button, cross-links, validation/error states. Shown as a modal over the blurred workspace.

**Screen 1: Workspace** — the core two-column screen.
- **Right column top:** 3-step progress indicator (Research → Prospects → Outreach), highlighting current step.
- **Left column (~35%):** "Your Company" card (KB upload → "ready" state); "Target Company" card (name field + primary "Research Company" button). After step 1, a "Prospects" section shows selectable persona cards + a free-text "own prospect" input; once a prospect is selected, a primary "Generate Outreach" button appears.
- **Right column (~65%):** Step 1 = Company Research Summary (overview, recent signals, inferred pain points). Step 2 = Suggested Prospects. Step 3 = Draft Email (editable textarea, subject + body, Copy button top-right) + Alternative Hooks (2–3 lines) beneath. Loading skeleton while any step runs. Empty state before step 1: a short placeholder prompting upload + target company.

**Screen 2: Sessions** — list of the user's past sessions (target company, date); clicking one reopens its saved research, prospect, draft, and hooks read-only with Copy.

### Component Specifications
**Input:** KB file upload, target-company text field, own-prospect text input, auth fields.
**Display:** research summary card, selectable prospect cards, editable email panel, hook list, sessions list.
**Action:** "Research Company", "Generate Outreach", "Copy", prospect selection, auth buttons.

### Complete User Journey
Sign up/log in → upload company KB + enter target company → "Research Company" → read summary → pick/enter a prospect → "Generate Outreach" → edit/copy the draft and hooks → session saved → revisit anytime from Sessions.

## Artifacts & references
- **Skill:** `company-research.skill.md` — used by the Research Agent.
- **Skill:** `kb-grounded-outreach-writer.skill.md` — used by the Writer & Personalisation agents.
- **Design file:** App Mockup — specifies the two-column Workspace; the build should follow it.