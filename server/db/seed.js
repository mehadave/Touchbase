// No automatic seeding — users register via Supabase Auth and start with a clean account.
// Call seedDemoData(userId) from a route to load sample contacts for a specific user.

import { db } from './client.js'
import { contacts, conferences, templates, tags, contactTags, appSettings, streakLog } from './schema.js'
import { eq, and } from 'drizzle-orm'
import { subDays, addDays, format } from 'date-fns'

const fmt = (d) => format(d, 'yyyy-MM-dd')

export async function seedIfEmpty() {
  // No-op for production — users start fresh
}

export async function seedDemoData(userId) {
  const today = new Date()

  // Default settings
  await db.insert(appSettings).values([
    { userId, key: 'notification_time',          value: '"09:00"' },
    { userId, key: 'streak_reminder_enabled',    value: 'true' },
    { userId, key: 'default_follow_up_frequency', value: '30' },
  ]).onConflictDoNothing()

  // Conference
  const [saaSConf] = await db.insert(conferences).values({
    userId,
    name:       'SaaStr Annual 2025',
    date:       '2025-06-10',
    location:   'San Francisco, CA',
    websiteUrl: 'https://www.saastr.com',
    notes:      'Great sessions on PLG and enterprise sales.',
  }).returning()

  // Contacts
  const contactData = [
    {
      fullName: 'Sarah Chen', email: 'sarah.chen@venturecap.io',
      phone: '+1 (415) 555-0101', company: 'Venture Capital Partners',
      jobTitle: 'Managing Partner', category: 'Professional',
      linkedinUrl: 'https://linkedin.com/in/sarahchen',
      notes: 'Met at SaaStr. Interested in B2B SaaS. Follow up about Series A.',
      relationshipStrength: 5, lastContacted: subDays(today, 45),
      followUpFrequency: 30, nextFollowUp: fmt(subDays(today, 15)),
      source: 'conference', conferenceId: saaSConf.id,
    },
    {
      fullName: 'Marcus Williams', email: 'marcus@designstudio.co',
      phone: '+1 (310) 555-0184', company: 'Williams Design Studio',
      jobTitle: 'Creative Director', category: 'Personal',
      linkedinUrl: 'https://linkedin.com/in/marcuswilliams',
      notes: 'Old college friend, runs a boutique design agency.',
      relationshipStrength: 4, lastContacted: subDays(today, 8),
      followUpFrequency: 30, nextFollowUp: fmt(addDays(today, 22)),
      source: 'manual',
    },
    {
      fullName: 'Priya Patel', email: 'priya.patel@techstart.io',
      phone: '+1 (650) 555-0293', company: 'TechStart Accelerator',
      jobTitle: 'Program Manager', category: 'Social',
      notes: 'Met through the startup community. Organizes great events.',
      relationshipStrength: 3, lastContacted: subDays(today, 27),
      followUpFrequency: 30, nextFollowUp: fmt(addDays(today, 3)),
      source: 'manual',
    },
    {
      fullName: 'David Kim', email: 'david.kim@growth.ai',
      phone: '+1 (212) 555-0367', company: 'Growth.AI',
      jobTitle: 'Head of Growth', category: 'Professional',
      linkedinUrl: 'https://linkedin.com/in/davidkim-growth',
      notes: 'Connected on LinkedIn. Expert in growth loops and PLG.',
      relationshipStrength: 4, lastContacted: null,
      followUpFrequency: 14, nextFollowUp: fmt(today),
      source: 'linkedin',
    },
    {
      fullName: 'Elena Russo', email: 'elena@consult-russo.com',
      phone: '+1 (646) 555-0412', company: 'Russo Consulting',
      jobTitle: 'Fractional CFO', category: 'Professional',
      notes: 'Referred by Sarah Chen. Great for financial modeling.',
      relationshipStrength: 2, lastContacted: subDays(today, 100),
      followUpFrequency: 90, nextFollowUp: fmt(subDays(today, 10)),
      source: 'manual',
    },
  ]

  const insertedContacts = await db.insert(contacts).values(
    contactData.map(c => ({ ...c, userId, lastContacted: c.lastContacted || null }))
  ).returning()

  // Tags
  const tagNames = ['investor', 'mentor', 'hiring', 'design', 'startup', 'PLG', 'SaaStr', 'finance', 'growth']
  const insertedTags = await db.insert(tags).values(tagNames.map(name => ({ name }))).onConflictDoNothing().returning()
  const tagMap = Object.fromEntries(insertedTags.map(t => [t.name, t.id]))

  const tagAssignments = [
    { name: 'Sarah Chen',      tags: ['investor', 'mentor', 'SaaStr'] },
    { name: 'Marcus Williams', tags: ['design'] },
    { name: 'Priya Patel',    tags: ['startup'] },
    { name: 'David Kim',      tags: ['growth', 'PLG', 'hiring'] },
    { name: 'Elena Russo',    tags: ['finance', 'mentor'] },
  ]
  for (const a of tagAssignments) {
    const contact = insertedContacts.find(c => c.fullName === a.name)
    if (!contact) continue
    for (const tagName of a.tags) {
      const tagId = tagMap[tagName]
      if (tagId) await db.insert(contactTags).values({ contactId: contact.id, tagId }).onConflictDoNothing()
    }
  }

  // Default templates
  await db.insert(templates).values([
    {
      userId, title: 'Reconnect', categoryTag: 'Personal',
      body: `Hey {name}! 👋\n\nIt's been a while — hope you're doing well! I was thinking about you and wanted to reach out.\n\nWhat have you been up to lately? Would love to catch up soon!\n\nLooking forward to hearing from you!`,
    },
    {
      userId, title: 'Cold Outreach', categoryTag: 'Professional',
      body: `Hi {name},\n\nHope this message finds you well. I came across your profile and was impressed by your work at {company}.\n\nI'd love to connect and learn more — there could be some interesting overlap with what I'm working on.\n\nWould you be open to a quick 20-minute call?\n\nBest,`,
    },
    {
      userId, title: 'Congrats', categoryTag: 'Professional',
      body: `Hi {name}!\n\nI just saw the news about your new role as {title} at {company} — congratulations! That's fantastic and so well-deserved.\n\nWould love to celebrate properly when you get a moment!`,
    },
    {
      userId, title: 'Follow Up', categoryTag: 'Professional',
      body: `Hi {name},\n\nIt was great connecting recently! I wanted to follow up and see if you had any thoughts on what we discussed.\n\nLooking forward to keeping the conversation going.\n\nBest,`,
    },
  ])

  // Seed a couple of streak entries
  await db.insert(streakLog).values([
    { userId, completedDate: fmt(subDays(today, 2)), contactId: insertedContacts[1].id },
    { userId, completedDate: fmt(subDays(today, 1)), contactId: insertedContacts[2].id },
  ]).onConflictDoNothing()

  return { contacts: insertedContacts.length }
}
