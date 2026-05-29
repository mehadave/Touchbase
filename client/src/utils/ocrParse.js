/**
 * parseLinkedInOCR
 * Takes raw Tesseract OCR text from a LinkedIn screenshot and returns
 * structured contact fields.
 */
export function parseLinkedInOCR(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const UI_NOISE = new Set([
    'linkedin', 'home', 'my network', 'jobs', 'messaging', 'notifications',
    'me', 'work', 'search', 'connect', 'follow', 'message', 'more',
    'connections', 'followers', 'following', 'contact info', 'about',
    'experience', 'education', 'skills', 'recommendations', 'activity',
    'see all', 'show more', 'show less', 'view profile', 'open to',
    'add section', 'premium', 'try premium', '·', '•',
  ])

  const isNoise = (l) => {
    const lower = l.toLowerCase()
    return (
      UI_NOISE.has(lower) ||
      /^[\d,+]+\s*(connection|follower|view|like|comment)/i.test(l) ||
      /^\d+\s*$/.test(l) ||
      l.length < 3 ||
      l.includes('linkedin.com/in/') ||
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i.test(l) ||
      // LinkedIn notification / confirmation screens
      /your\s+invitation/i.test(l) ||
      /invitation\s+to\s+connect/i.test(l) ||
      /\bwas\s+sent\b/i.test(l) ||
      /\b(pending|withdraw|ignore|accept|decline)\b/i.test(l)
    )
  }

  const cleanLines = lines
    .map(l => l
      .replace(/\s*[·•]\s*(1st|2nd|3rd|[0-9]+th)\s*$/i, '')
      .replace(/\s+[@©®™✓✔☑]\s*$/, '')
      .trim()
    )
    .filter(l => l.length > 0 && !isNoise(l))

  const TITLE_KEYWORDS = [
    'director', 'manager', 'engineer', 'developer', 'designer',
    'founder', 'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cpo',
    'vp', 'vice president', 'president', 'head of', 'lead', 'leads',
    'senior', 'principal', 'staff', 'architect', 'analyst', 'associate',
    'consultant', 'officer', 'partner', 'attorney', 'lawyer', 'counsel',
    'scientist', 'researcher', 'professor', 'lecturer', 'teacher',
    'product', 'marketing', 'sales', 'operations', 'finance', 'legal',
    'coordinator', 'specialist', 'strategist', 'advisor', 'executive',
    'intern', 'apprentice', 'trainee', 'fellow', 'contractor', 'freelance',
  ]

  const looksLikeTitle = (l) =>
    TITLE_KEYWORDS.some(k => l.toLowerCase().includes(k)) && l.length < 120

  const looksLikeLocation = (l) =>
    /\b(area|metropolitan|county|district|province|region)\b/i.test(l) ||
    /,\s*([a-z]{2,3}|united states|united kingdom|canada|australia|india|germany|france)\s*$/i.test(l) ||
    /^(greater|san francisco|new york|los angeles|london|toronto|sydney|remote|chicago|seattle|boston|austin|denver|atlanta|miami|dallas|washington|philadelphia|phoenix|portland|berlin|paris|tokyo|singapore|amsterdam|dubai|mumbai|bangalore|hyderabad)/i.test(l)

  // Known name particles that can appear lowercase (de, van, la, etc.)
  const NAME_PARTICLES = new Set([
    'de', 'van', 'la', 'le', 'di', 'du', 'da', 'der', 'den',
    'von', 'el', 'al', 'bin', 'mac', 'mc', 'y', 'e', 'o', 'af',
  ])

  const looksLikeName = (l) => {
    if (l.length < 3 || l.length > 50) return false
    if (/\d/.test(l)) return false
    if (l.includes('@') || l.includes('http') || l.includes('/') || l.includes('|')) return false
    const words = l.split(/\s+/).filter(Boolean)
    if (words.length < 1 || words.length > 5) return false
    if (!/^[A-Z]/.test(words[0])) return false
    // Every word must contain only letters, apostrophes, or hyphens — no parens, dots, symbols
    if (!words.every(w => /^[A-Za-z''\-]+$/.test(w))) return false
    // Any lowercase word must be a known name particle (de, van, la…)
    // — rejects common English words like "to", "was", "connect", "sent"
    const lowercaseWords = words.filter(w => /^[a-z]/.test(w))
    if (lowercaseWords.some(w => !NAME_PARTICLES.has(w))) return false
    return true
  }

  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i)
  const emailMatch    = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch    = text.match(/(\+\d[\d\s\-().]{8,15}|\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)

  // Primary: strict looksLikeName; fallback: same strict check on first 5 lines
  // (no loose fallback — too many false positives from notification screens)
  const nameLine =
    cleanLines.find(l => looksLikeName(l) && !looksLikeLocation(l)) ||
    cleanLines.slice(0, 5).find(l => looksLikeName(l) && !looksLikeLocation(l) && !looksLikeTitle(l))

  const atPattern = /^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|·•\-].*)?$/i
  const headlineLine = cleanLines.find(l => atPattern.test(l) && looksLikeTitle(l))

  let jobTitle = null
  let company  = null

  if (headlineLine) {
    const m = headlineLine.match(atPattern)
    if (m) {
      jobTitle = m[1].trim()
      company  = m[2].trim().replace(/\s*[-–—·•]+\s*$/, '')
    }
  } else {
    const titleLine = cleanLines.find(l => looksLikeTitle(l) && l !== nameLine)
    if (titleLine) jobTitle = titleLine
    const titleIdx = titleLine ? cleanLines.indexOf(titleLine) : -1
    if (titleIdx >= 0) {
      const next = cleanLines.slice(titleIdx + 1).find(l =>
        l.length < 80 && !looksLikeTitle(l) && !looksLikeLocation(l) &&
        !l.includes('@') && !/^\d/.test(l)
      )
      if (next) company = next.split(/\s*[-–—·•]\s*/)[0].trim()
    }
  }

  const aboutMatch = text.match(/\bAbout\b[\s\n]+([\s\S]+?)(?=\n\s*(?:Activity|Experience|Education|Skills|Recommendations|Posts|Comments|Images|\d[\d,]*\s*follower))/i)
  const notes = aboutMatch
    ? aboutMatch[1].trim().replace(/\.{3}see more\s*$/i, '').trim()
    : null

  return {
    fullName:    nameLine   || '',
    jobTitle:    jobTitle   || '',
    company:     company    || '',
    email:       emailMatch ? emailMatch[0] : '',
    phone:       phoneMatch ? phoneMatch[0].trim() : '',
    linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '',
    notes:       notes      || '',
    linkedinFound: !!linkedinMatch,
  }
}
