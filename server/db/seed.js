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
      categoryTag: 'Personal',
      body: `Hey {name}!\n\nOkay I feel bad it's been this long 😅 Was just thinking about you and realised we haven't properly talked in ages.\n\nWhat's going on with you? Would love to grab a coffee or a quick call soon and actually catch up. What does your schedule look like?`,
    },
    {
      userId,
      title: 'Conference follow-up',
      categoryTag: 'Conference',
      body: `Hey {name}! Really glad we got to meet at [event] — our chat about [topic] actually stuck with me.\n\nWould you be up for continuing the conversation over a call sometime? No real agenda, just want to keep in touch.`,
    },
    {
      userId,
      title: 'LinkedIn connection follow-up',
      categoryTag: 'LinkedIn',
      body: `Hi {name}! Thanks for connecting — saw you're at {company} and had to reach out. What you're building there looks genuinely interesting.\n\nWould love to hear more about what you're working on. Open to a quick call sometime?`,
    },
    {
      userId,
      title: 'Congrats!!',
      categoryTag: 'Personal',
      body: `{name}!! I just saw — congrats!! That's huge and you absolutely deserve it 🎉\n\nSeriously so happy for you. We need to celebrate — when are you free?`,
    },
    {
      userId,
      title: 'Professional check-in',
      categoryTag: 'Professional',
      body: `Hi {name}, I know it's been a little while but I've been keeping an eye on what {company} has been up to and had to reach out.\n\nWould love to hear what's keeping you busy these days. Grab a quick call?`,
    },
    {
      userId,
      title: 'Intro ask — warm referral',
      categoryTag: 'Professional',
      body: `Hey {name}! Hope you're doing well. I have a slightly random ask — I've been trying to get in touch with someone at [company] and you immediately came to mind.\n\nAny chance you know anyone there who'd be open to a quick chat? Totally fine if not! Either way, we're overdue for a catch-up.`,
    },
    {
      userId,
      title: 'Just saying hi',
      categoryTag: 'General',
      body: `Hey {name}! Was just thinking about you out of nowhere and figured I'd actually say hi instead of just thinking it 😄\n\nHow are you? What's been going on? Would love to hear what you've been up to.`,
    },
    {
      userId,
      title: 'Post-meeting follow-up',
      categoryTag: 'Professional',
      body: `Hey {name}, great talking just now! Really enjoyed the conversation.\n\nI'll take care of [action item] by [date] — ping me if anything else comes up on your end in the meantime. Excited to keep things moving!`,
    },
    {
      userId,
      title: 'Checking in after a while',
      categoryTag: 'Reconnect',
      body: `Hey {name}, it's been way too long and I've been meaning to reach out for a while now.\n\nHow are things? Life treating you well? Would genuinely love to catch up when you get a chance — even just a quick call.`,
    },
    {
      userId,
      title: 'Cold outreach — genuine ask',
      categoryTag: 'Cold Outreach',
      body: `Hi {name},\n\nI know we haven't met but I came across your work at {company} and genuinely loved [specific thing].\n\nI'm [brief context about yourself] and I think there could be something interesting to explore here. Would you be open to a 15-minute call? No pitch, just a proper conversation.`,
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
