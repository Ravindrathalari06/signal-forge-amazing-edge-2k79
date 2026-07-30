export { users } from 'lyzr-architect-pg/schema'
import {
  pgTable,
  text,
  boolean,
  jsonb,
  index,
  timestamps,
  ownerUserId,
  generateId,
} from 'lyzr-architect-pg/schema'

export const outreach_sessions = pgTable(
  'outreach_sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    target_company: text('target_company').notNull(),
    company_name_of_kb: text('company_name_of_kb'),
    research_summary: jsonb('research_summary').notNull().default({}),
    owner_user_id: ownerUserId(),
    ...timestamps,
  },
  (t) => [index('outreach_sessions_owner_idx').on(t.owner_user_id)]
)

export const prospects = pgTable(
  'prospects',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    session_id: text('session_id').notNull(),
    name: text('name').notNull(),
    role: text('role'),
    fit_reason: text('fit_reason'),
    is_selected: boolean('is_selected').notNull().default(false),
    owner_user_id: ownerUserId(),
    ...timestamps,
  },
  (t) => [
    index('prospects_owner_idx').on(t.owner_user_id),
    index('prospects_session_idx').on(t.session_id),
  ]
)

export const drafts = pgTable(
  'drafts',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    session_id: text('session_id').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    hooks: jsonb('hooks').notNull().default([]),
    owner_user_id: ownerUserId(),
    ...timestamps,
  },
  (t) => [
    index('drafts_owner_idx').on(t.owner_user_id),
    index('drafts_session_idx').on(t.session_id),
  ]
)
