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
  const templateData = [
    {
      userId,
      title: 'Catch up — been a while',
      body: `Hey {name}!\n\nIt's been way too long — hope everything's going well on your end. I was thinking about you the other day and realized we haven't talked in ages.\n\nWould love to grab a coffee or hop on a quick call soon. Are you around in the next couple of weeks?\n\nTalk soon!`,
      categoryTag: 'Personal',
      useCount: 0,
    },
    {
      userId,
      title: 'Conference follow-up',
      body: `Hey {name},\n\nReally great meeting you at [event] — I loved our conversation about {company} and what you're working on there.\n\nWould love to stay in touch and maybe grab a virtual coffee to dig deeper. What does your schedule look like?\n\nLooking forward to it!`,
      categoryTag: 'Conference',
      useCount: 0,
    },
    {
      userId,
      title: 'LinkedIn connection follow-up',
      body: `Hi {name},\n\nThanks for connecting! I noticed you're at {company} as {title} — really interesting work. I've been following what you're doing and would love to hear more about it.\n\nOpen to a quick 20-minute intro call sometime?\n\nBest,`,
      categoryTag: 'LinkedIn',
      useCount: 0,
    },
    {
      userId,
      title: 'Warm congratulations',
      body: `Hey {name}!\n\nJust saw the news about [achievement] — that's genuinely fantastic, you've worked so hard for this and it shows.\n\nWould love to hear all about it when you have a moment. Huge congrats! 🎉`,
      categoryTag: 'Personal',
      useCount: 0,
    },
    {
      userId,
      title: 'Professional check-in',
      body: `Hi {name},\n\nHope things are going well! I've been keeping an eye on what {company} has been up to — looks like exciting times over there.\n\nWould love to reconnect and hear what you've been working on. Grab a quick call soon?\n\nLooking forward to it!`,
      categoryTag: 'Professional',
      useCount: 0,
    },
    {
      userId,
      title: 'Intro ask — warm referral',
      body: `Hi {name},\n\nHope all's well! Quick ask — I've been trying to connect with someone at [company/area] and thought of you immediately given your network.\n\nWould you happen to know anyone there who'd be open to a quick chat? Totally understand if not, just figured it was worth asking!\n\nEither way, would love to catch up soon.`,
      categoryTag: 'Professional',
      useCount: 0,
    },
    {
      userId,
      title: 'Simple check-in',
      body: `Hey {name}!\n\nJust dropping a quick note to say hi and see how things are going with you. What's new?\n\nHope life's been treating you well — talk soon!`,
      categoryTag: 'General',
      useCount: 0,
    },
    {
      userId,
      title: 'Post-meeting follow-up',
      body: `Hi {name},\n\nReally appreciated the time earlier — great conversation and I walked away with a lot to think about.\n\nI'll follow up on [action item] by [date]. Let me know if there's anything else I can do on my end in the meantime.\n\nTalk soon!`,
      categoryTag: 'Professional',
      useCount: 0,
    },
  ]
  await db.insert(templates).values(templateData)

  // Seed a couple of streak entries
  await db.insert(streakLog).values([
    { userId, completedDate: fmt(subDays(today, 2)), contactId: insertedContacts[1].id },
    { userId, completedDate: fmt(subDays(today, 1)), contactId: insertedContacts[2].id },
  ]).onConflictDoNothing()

  return { contacts: insertedContacts.length }
}
