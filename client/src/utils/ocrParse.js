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
      // Strip LinkedIn connection degree badge: "• 2nd", "© 2m", "® 3rd", etc.
      // (OCR often misreads • as © or ®, and "2nd" as "2m")
      .replace(/\s*[·•©®°]\s*\d+\w*\s*$/i, '')
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

  const UNIVERSITY_KEYWORDS = [
    'university', 'college', 'institute', 'school', 'polytechnic',
    'academy', 'iit', 'iim', 'mit', 'caltech', 'seminary',
  ]

  const looksLikeTitle = (l) =>
    TITLE_KEYWORDS.some(k => l.toLowerCase().includes(k)) && l.length < 120

  const looksLikeLocation = (l) =>
    /\b(area|metropolitan|county|district|province|region)\b/i.test(l) ||
    /,\s*([a-z]{2,3}|united states|united kingdom|canada|australia|india|germany|france)\s*$/i.test(l) ||
    /^(greater|san francisco|new york|los angeles|london|toronto|sydney|remote|chicago|seattle|boston|austin|denver|atlanta|miami|dallas|washington|philadelphia|phoenix|portland|berlin|paris|tokyo|singapore|amsterdam|dubai|mumbai|bangalore|hyderabad)/i.test(l) ||
    // Standalone country names
    /^(united states|united kingdom|canada|australia|india|germany|france|china|japan|brazil|mexico|spain|italy|netherlands|sweden|norway|denmark|finland|switzerland|austria|belgium|portugal|new zealand|south korea|singapore|hong kong|taiwan|thailand|vietnam|indonesia|philippines|malaysia|pakistan|bangladesh|nigeria|south africa|egypt|turkey|russia|ukraine|poland|romania|hungary|greece|israel|saudi arabia|uae|united arab emirates)$/i.test(l)

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
    // LinkedIn always shows first + last name — require at least 2 words
    if (words.length < 2 || words.length > 5) return false
    // First word must start with uppercase
    if (!/^[A-Z]/.test(words[0])) return false
    // Every word must start AND end with a letter (no leading/trailing hyphens)
    if (!words.every(w => /^[A-Za-z][A-Za-z''\-]*[A-Za-z]$/.test(w) || /^[A-Za-z]$/.test(w))) return false
    // Any lowercase word must be a known name particle (de, van, la…)
    const lowercaseWords = words.filter(w => /^[a-z]/.test(w))
    if (lowercaseWords.some(w => !NAME_PARTICLES.has(w))) return false
    return true
  }

  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i)
  const emailMatch    = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch    = text.match(/(\+\d[\d\s\-().]{8,15}|\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)

  // Name extraction: the name on LinkedIn is always the bold line immediately before
  // the headline/title. Scan forward and find a title line whose preceding line is name-like.
  let nameLine = null
  for (let i = 1; i < cleanLines.length; i++) {
    if (looksLikeTitle(cleanLines[i])) {
      // Look back up to 3 lines for a name candidate
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const candidate = cleanLines[j]
        if (looksLikeName(candidate) && !looksLikeLocation(candidate)) {
          nameLine = candidate
          break
        }
      }
      if (nameLine) break
    }
  }
  // Fallback: direct scan if no title anchor found
  if (!nameLine) {
    nameLine = cleanLines.find(l => looksLikeName(l) && !looksLikeLocation(l))
  }

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
        !l.includes('@') && !/^\d/.test(l) &&
        !UNIVERSITY_KEYWORDS.some(k => l.toLowerCase().includes(k))
      )
      if (next) company = next.split(/\s*[-–—·•]\s*/)[0].trim()
    }
  }

  // University: first line containing a university keyword, excluding title lines
  const universityLine = cleanLines.find(l =>
    UNIVERSITY_KEYWORDS.some(k => l.toLowerCase().includes(k)) &&
    !looksLikeTitle(l) &&
    l.length < 120
  )

  const aboutMatch = text.match(/\bAbout\b[\s\n]+([\s\S]+?)(?=\n\s*(?:Activity|Experience|Education|Skills|Recommendations|Posts|Comments|Images|\d[\d,]*\s*follower))/i)
  const notes = aboutMatch
    ? aboutMatch[1].trim().replace(/\.{3}see more\s*$/i, '').trim()
    : null

  return {
    fullName:    nameLine        || '',
    jobTitle:    jobTitle        || '',
    company:     company         || '',
    university:  universityLine  || '',
    email:       emailMatch ? emailMatch[0] : '',
    phone:       phoneMatch ? phoneMatch[0].trim() : '',
    linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '',
    notes:       notes           || '',
    linkedinFound: !!linkedinMatch,
  }
}
