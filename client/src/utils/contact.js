import { differenceInDays, parseISO, format, isValid } from 'date-fns'

export function stalenessInfo(contact) {
  const today = new Date()
  if (!contact.nextFollowUp) return { status: 'none', label: 'No follow-up set', days: null }

  const due = parseISO(contact.nextFollowUp)
  if (!isValid(due)) return { status: 'none', label: '', days: null }

  const daysUntil = differenceInDays(due, today)

  if (daysUntil < 0) {
    return { status: 'overdue', label: `${Math.abs(daysUntil)}d overdue`, days: daysUntil }
  } else if (daysUntil <= 7) {
    return { status: 'soon', label: `Due in ${daysUntil}d`, days: daysUntil }
  } else {
    return { status: 'ok', label: `Due in ${daysUntil}d`, days: daysUntil }
  }
}

export function lastContactedLabel(contact) {
  if (!contact.lastContacted) return 'Never contacted'
  const d = new Date(contact.lastContacted)
  if (!isValid(d)) return 'Never contacted'
  const days = differenceInDays(new Date(), d)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export function fillTemplate(body, contact) {
  const firstName = contact.fullName?.split(' ')[0] || ''
  return body
    .replace(/\{name\}/gi, firstName)
    .replace(/\{company\}/gi, contact.company || '')
    .replace(/\{title\}/gi, contact.jobTitle || '')
}
