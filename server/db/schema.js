import {
  pgTable, uuid, text, integer, date, timestamp,
  pgEnum, primaryKey, index, unique,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────
export const categoryEnum    = pgEnum('category',     ['Personal', 'Professional', 'Social'])
export const sourceEnum      = pgEnum('source',       ['conference', 'linkedin', 'manual', 'csv'])
export const queueStatusEnum = pgEnum('queue_status', ['pending', 'done', 'skipped'])

// userId is the UUID from Supabase auth — no local users table needed.

// ─── Conferences ──────────────────────────────────────────────────────────────
export const conferences = pgTable('conferences', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull(),
  name:       text('name').notNull(),
  date:       date('date'),
  location:   text('location'),
  websiteUrl: text('website_url'),
  notes:      text('notes'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:  timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  userIdx: index('idx_conferences_user').on(t.userId),
}))

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contacts = pgTable('contacts', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull(),
  fullName:             text('full_name').notNull(),
  email:                text('email'),
  phone:                text('phone'),
  company:              text('company'),
  jobTitle:             text('job_title'),
  category:             categoryEnum('category').notNull().default('Personal'),
  linkedinUrl:          text('linkedin_url'),
  notes:                text('notes'),
  relationshipStrength: integer('relationship_strength').notNull().default(3),
  lastContacted:        timestamp('last_contacted', { withTimezone: true }),
  followUpFrequency:    integer('follow_up_frequency').notNull().default(30),
  nextFollowUp:         date('next_follow_up'),
  source:               sourceEnum('source').notNull().default('manual'),
  photoPath:            text('photo_path'),
  conferenceId:         uuid('conference_id').references(() => conferences.id, { onDelete: 'set null' }),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:            timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  userIdx:         index('idx_contacts_user').on(t.userId),
  categoryIdx:     index('idx_contacts_category').on(t.category),
  nextFollowUpIdx: index('idx_contacts_next_followup').on(t.nextFollowUp),
  conferenceIdx:   index('idx_contacts_conference').on(t.conferenceId),
  strengthIdx:     index('idx_contacts_strength').on(t.relationshipStrength),
}))

// ─── Tags (global namespace — scoped via contact ownership) ───────────────────
export const tags = pgTable('tags', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const contactTags = pgTable('contact_tags', {
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  tagId:     uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk:     primaryKey({ columns: [t.contactId, t.tagId] }),
  tagIdx: index('idx_contact_tags_tag').on(t.tagId),
}))

// ─── Templates ────────────────────────────────────────────────────────────────
export const templates = pgTable('templates', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull(),
  title:       text('title').notNull(),
  body:        text('body').notNull(),
  categoryTag: text('category_tag'),
  useCount:    integer('use_count').notNull().default(0),
  lastUsedAt:  timestamp('last_used_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:   timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  userIdx: index('idx_templates_user').on(t.userId),
}))

// ─── Streak Log ───────────────────────────────────────────────────────────────
export const streakLog = pgTable('streak_log', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull(),
  completedDate: date('completed_date').notNull(),
  contactId:     uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userDateUniq: unique('uniq_streak_user_date').on(t.userId, t.completedDate),
  dateIdx:      index('idx_streak_log_date').on(t.completedDate),
  userIdx:      index('idx_streak_log_user').on(t.userId),
}))

// ─── Touchbase Queue ──────────────────────────────────────────────────────────
export const touchbaseQueue = pgTable('touchbase_queue', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull(),
  contactId:     uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  scheduledDate: date('scheduled_date').notNull(),
  status:        queueStatusEnum('status').notNull().default('pending'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dateStatusIdx: index('idx_queue_date_status').on(t.scheduledDate, t.status),
  userIdx:       index('idx_queue_user').on(t.userId),
}))

// ─── App Settings ─────────────────────────────────────────────────────────────
export const appSettings = pgTable('app_settings', {
  userId:    uuid('user_id').notNull(),
  key:       text('key').notNull(),
  value:     text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.key] }),
}))
