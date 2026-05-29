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
    // Post-connection confirmation UI
    'people you may know', 'people also viewed', 'people similar to',
    'grow your network', 'suggested for you', 'others you may know',
    'you are now connected', 'you are now following',
  ])

  // Marks the start of "suggested people" sections — stop name search here
  const isSectionBreak = (l) =>
    /people (you may know|also viewed|similar to)/i.test(l) ||
    /grow your network/i.test(l) ||
    /suggested for you/i.test(l)

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
      /\band you are now\b/i.test(l) ||
      /\b(pending|withdraw|ignore|accept|decline)\b/i.test(l)
    )
  }

  const cleanLines = lines
    .map(l => l
      // Strip badge symbol + connection degree: "· 2nd", "© 2m", "✓ 3rd", "® 3rd+"
      // (OCR misreads • as © / ® / ✓, and "2nd" as "2m")
      .replace(/\s*[·•©®°✓✔☑@*|]+\s*\d+\w*\+?\s*$/i, '')
      // Strip a bare trailing connection degree (no symbol): "Yehuda Alon 2nd"
      .replace(/\s+(1st|2nd|3rd\+?|\d{1,2}(?:st|nd|rd|th))\s*$/i, '')
      // Strip any leftover trailing badge symbols / separators
      .replace(/[\s·•©®™✓✔☑@*|]+$/, '')
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

  // Word-boundary matched — avoids false positives like "mit" inside "committed"
  const UNIVERSITY_RE = /\b(university|universidad|college|institute|polytechnic|academy|seminary|iit|iim|mit|caltech)\b/i

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
    if (l.length < 3 || l.length > 60) return false
    if (/\d/.test(l)) return false
    if (l.includes('@') || l.includes('http') || l.includes('/') || l.includes('|')) return false
    const words = l.split(/\s+/).filter(Boolean)
    // LinkedIn always shows first + last name — require at least 2 words
    if (words.length < 2 || words.length > 6) return false
    // First word must start with uppercase
    if (!/^[A-Z]/.test(words[0])) return false
    // Every word: letters/apostrophes/hyphens, optionally ending with a dot (Dr., J., Jr.)
    if (!words.every(w => /^[A-Za-z][A-Za-z''\-]*\.?$/.test(w))) return false
    // Any lowercase word must be a known name particle (de, van, la…)
    const lowercaseWords = words.filter(w => /^[a-z]/.test(w))
    if (lowercaseWords.some(w => !NAME_PARTICLES.has(w.replace(/\.$/, '')))) return false
    return true
  }

  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i)
  const emailMatch    = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch    = text.match(/(\+\d[\d\s\-().]{8,15}|\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)

  // Only search within the profile area — stop before any "People you may know" section
  // which appears on post-connection confirmation screens and contains other people's names.
  const sectionBreakIdx = cleanLines.findIndex(l => isSectionBreak(l))
  const profileLines = sectionBreakIdx >= 0
    ? cleanLines.slice(0, sectionBreakIdx)
    : cleanLines.slice(0, 20)  // cap at 20 lines; name is always near the top

  // Extract the name portion from a line by taking only leading name-valid words.
  // Allows trailing dots for initials/honorifics: "Dr.", "J.", "Jr."
  // Handles: "Kathie Huang ⊙ She/Her · 3rd" → "Kathie Huang"
  //          "Dr. John Smith 2nd"            → "Dr. John Smith"
  //          "J. Robert Oppenheimer ✓ 3rd"   → "J. Robert Oppenheimer"
  const extractLeadingName = (l) => {
    const nameWords = []
    for (const w of l.split(/\s+/)) {
      if (/^[A-Za-z][A-Za-z''\-]*\.?$/.test(w)) nameWords.push(w)
      else break
    }
    return nameWords.join(' ')
  }

  // The name is always the first meaningful line — before headline, badge, pronouns,
  // and connection degree. Strip parenthetical nicknames first, then extract leading words.
  // "David (Dave) Chen ✓ 2nd" → strip parens → "David Chen ✓ 2nd" → extract → "David Chen"
  let nameLine = null
  for (const l of profileLines) {
    const stripped = l.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
    const candidate = extractLeadingName(stripped)
    if (candidate && looksLikeName(candidate) && !looksLikeLocation(candidate)) {
      nameLine = candidate
      break
    }
  }

  const atPattern = /^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|·•\-].*)?$/i
  const headlineLine = profileLines.find(l => atPattern.test(l) && looksLikeTitle(l))

  let jobTitle = null
  let company  = null

  if (headlineLine) {
    const m = headlineLine.match(atPattern)
    if (m) {
      jobTitle = m[1].trim()
      company  = m[2].trim().replace(/\s*[-–—·•]+\s*$/, '')
    }
  } else {
    const titleLine = profileLines.find(l => looksLikeTitle(l) && l !== nameLine)
    if (titleLine) jobTitle = titleLine
    const titleIdx = titleLine ? profileLines.indexOf(titleLine) : -1
    if (titleIdx >= 0) {
      const next = profileLines.slice(titleIdx + 1).find(l =>
        l.length < 80 && !looksLikeTitle(l) && !looksLikeLocation(l) &&
        !l.includes('@') && !/^\d/.test(l) &&
        !UNIVERSITY_RE.test(l)
      )
      if (next) company = next.split(/\s*[-–—·•]\s*/)[0].trim()
    }
  }

  // University: first profile line containing a university keyword. The education
  // line is often "Company · School" — split on separators and keep the segment
  // that actually names the school. Also extract company from before the school
  // if company wasn't found from the headline.
  const universityLineRaw = profileLines.find(l =>
    UNIVERSITY_RE.test(l) && !looksLikeTitle(l) && l.length < 120
  )
  let university = ''
  if (universityLineRaw) {
    const segments = universityLineRaw
      .split(/\s+[·•|–—-]+\s+/)
      .map(s => s.trim())
      .filter(Boolean)
    const uniIdx = segments.findIndex(s => UNIVERSITY_RE.test(s))
    university = uniIdx >= 0 ? segments[uniIdx] : universityLineRaw
    // If company not yet found, the segment immediately before the university is the company
    if (!company && uniIdx > 0) {
      company = segments[uniIdx - 1]
    }
  }

  const aboutMatch = text.match(/\bAbout\b[\s\n]+([\s\S]+?)(?=\n\s*(?:Activity|Experience|Education|Skills|Recommendations|Posts|Comments|Images|\d[\d,]*\s*follower))/i)
  const notes = aboutMatch
    ? aboutMatch[1].trim().replace(/\.{3}see more\s*$/i, '').trim()
    : null

  return {
    fullName:    nameLine        || '',
    jobTitle:    jobTitle        || '',
    company:     company         || '',
    university:  university       || '',
    email:       emailMatch ? emailMatch[0] : '',
    phone:       phoneMatch ? phoneMatch[0].trim() : '',
    linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '',
    notes:       notes           || '',
    linkedinFound: !!linkedinMatch,
  }
}
