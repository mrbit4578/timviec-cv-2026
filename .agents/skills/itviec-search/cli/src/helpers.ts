// Data source: ITviec's public search pages (server-rendered HTML) and each
// posting's schema.org JobPosting JSON-LD block. No authentication required.
// Search results are parsed with regex per job card; detail pages are read from
// JSON-LD, which is far more stable than the visual markup.

export const BASE_URL = "https://itviec.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; itviec-cli/1.0)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

// ---------------------------------------------------------------------------
// URL building
// ---------------------------------------------------------------------------

/** ITviec's city path segments. Only these three cities have their own listing. */
export const CITY_SLUGS: Record<string, string> = {
  hochiminh: "ho-chi-minh-hcm", hcm: "ho-chi-minh-hcm", tphcm: "ho-chi-minh-hcm", saigon: "ho-chi-minh-hcm",
  hanoi: "ha-noi", hn: "ha-noi",
  danang: "da-nang", dn: "da-nang",
}

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/^(tp|thanh pho)\s+/, "")
    .replace(/[^a-z0-9]/g, "")
}

export function citySlug(input: string): string | null {
  return CITY_SLUGS[fold(input)] ?? null
}

/**
 * Keyword -> ITviec path slug ("React Native" -> "react-native"). ITviec's
 * `?query=` form redirects to this slug and drops `page`, so the CLI builds the
 * slug itself. Dots are dropped ("node.js" -> "nodejs", ITviec's own skill
 * page), "#" becomes "sharp" ("c#" -> "c-sharp"), "++" becomes "plus-plus".
 * A term ITviec does not know returns its 404 "Search term not found" page,
 * which the CLI reports as zero results.
 */
export function keywordSlug(query: string): string {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/#/g, " sharp")
    .replace(/\+\+/g, " plus plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildSearchUrl(query: string | undefined, city: string | null, page: number): string {
  const parts = ["it-jobs"]
  const slug = query ? keywordSlug(query) : ""
  if (slug) parts.push(slug)
  if (city) parts.push(city)
  const url = `${BASE_URL}/${parts.join("/")}`
  return page > 1 ? `${url}?page=${page}` : url
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  workplace: string | null
  date: string | null
  skills: string[]
  url: string
}

export interface JobDetail {
  id: string
  title: string
  company: string | null
  location: string | null
  address: string | null
  date: string | null
  deadline: string | null
  employmentType: string | null
  skills: string[]
  experienceMonths: number | null
  description: string | null
  benefits: string | null
  url: string
  isActive: boolean
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
}

function clean(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

/** Vietnam-time calendar day of a Date, as YYYY-MM-DD. */
export function vnDay(d: Date): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

/**
 * "Posted 4 hours ago" / "2 days ago" / "3 weeks ago" -> approximate YYYY-MM-DD.
 * ITviec cards only show a relative age; the detail page has the exact date.
 */
export function relativeToDate(text: string, now: Date = new Date()): string | null {
  const t = text.toLowerCase()
  if (/just now|today|vừa|minute|phút|second|giây/.test(t) && !/day|week|month|year/.test(t)) return vnDay(now)
  const m = t.match(/(\d+|an?|one)\s*(minute|hour|day|week|month|year|phút|giờ|ngày|tuần|tháng|năm)/)
  if (!m) return null
  const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : 1
  const unitMs: Record<string, number> = {
    minute: 60e3, phút: 60e3, hour: 3600e3, giờ: 3600e3, day: 86400e3, ngày: 86400e3,
    week: 7 * 86400e3, tuần: 7 * 86400e3, month: 30 * 86400e3, tháng: 30 * 86400e3, year: 365 * 86400e3, năm: 365 * 86400e3,
  }
  return vnDay(new Date(now.getTime() - n * unitMs[m[2]]))
}

/**
 * Parse a search page: split on each job card and parse every chunk
 * independently so one malformed card cannot break the rest.
 */
export function parseJobCards(html: string, now: Date = new Date()): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<div class=['"]job-card /).slice(1)
  for (const chunk of chunks) {
    try {
      const slug = chunk.match(/data-search--job-selection-job-slug-value=['"]([a-z0-9-]+)['"]/i)?.[1]
      if (!slug) continue
      const titleHtml = chunk.match(/data-search--job-selection-target=['"]jobTitle['"][^>]*>([\s\S]*?)<\/h3>/i)?.[1]
      const title = titleHtml ? clean(titleHtml) : ""
      if (!title) continue
      const companyHtml = chunk.match(/<a[^>]*class=["']text-rich-grey["'][^>]*href=["']\/companies\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1]
      const posted = chunk.match(/Posted\s*([\s\S]*?)<\/span>/i)?.[1]
      const workplace = chunk.match(/<div class=['"]text-rich-grey flex-shrink-0['"]>\s*([^<]+?)\s*<\/div>/i)?.[1]
      const location = chunk.match(/<div class=['"]text-rich-grey text-truncate[^'"]*['"][^>]*title=['"]([^'"]+)['"]/i)?.[1]
      const skills: string[] = []
      for (const m of chunk.matchAll(/data-responsive-tag-list-target=["']tag["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        const s = clean(m[1])
        if (s && !skills.includes(s)) skills.push(s)
      }
      results.push({
        id: slug,
        title,
        company: companyHtml ? clean(companyHtml) || null : null,
        location: location ? decodeHtmlEntities(location).trim() || null : null,
        workplace: workplace ? decodeHtmlEntities(workplace).trim() || null : null,
        date: posted ? relativeToDate(clean(posted), now) : null,
        skills,
        url: `${BASE_URL}/it-jobs/${slug}`,
      })
    } catch {
      // skip a malformed card
    }
  }
  return results
}

/** Rich-text HTML -> readable plain text with paragraph/list breaks kept. */
export function htmlToText(html: unknown): string | null {
  if (typeof html !== "string" || !html.trim()) return null
  const withBreaks = html
    .replace(/\r\n?/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
  return (
    withBreaks
      .split("\n")
      .map((l) => decodeHtmlEntities(l).replace(/[ \t ]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n+• /g, "\n• ")
      .trim() || null
  )
}

type Raw = Record<string, any>

function asStr(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim().replace(/[\s,]+$/, "")
  // ITviec fills empty address parts with the literal "Not Available".
  return t && !/^not available$/i.test(t) ? t : null
}

/** Find the schema.org JobPosting object among a page's JSON-LD blocks. */
export function findJobPosting(html: string): Raw | null {
  for (const m of html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown
    try {
      data = JSON.parse(m[1])
    } catch {
      continue
    }
    const items: unknown[] = Array.isArray(data) ? data : [data, ...(((data as Raw)?.["@graph"] as unknown[]) ?? [])]
    for (const it of items) {
      if (it && typeof it === "object" && (it as Raw)["@type"] === "JobPosting") return it as Raw
    }
  }
  return null
}

export function parseJobDetail(html: string, slug: string, now: Date = new Date()): JobDetail | null {
  const jp = findJobPosting(html)
  if (!jp) return null
  const title = asStr(jp.title)
  if (!title) return null
  const locs: Raw[] = Array.isArray(jp.jobLocation) ? jp.jobLocation : jp.jobLocation ? [jp.jobLocation] : []
  const regions: string[] = []
  const addresses: string[] = []
  for (const l of locs) {
    const a = (l?.address ?? {}) as Raw
    const region = asStr(a.addressRegion)
    if (region && !regions.includes(region)) regions.push(region)
    const full = [a.streetAddress, a.addressLocality, a.addressRegion].map(asStr).filter(Boolean).join(", ")
    if (full && !addresses.includes(full)) addresses.push(full)
  }
  const skills = (asStr(jp.skills) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const deadline = asStr(jp.validThrough)?.slice(0, 10) ?? null
  const months = jp.experienceRequirements?.monthsOfExperience
  return {
    id: slug,
    title: decodeHtmlEntities(title),
    company: asStr(jp.hiringOrganization?.name),
    location: regions.length ? regions.join(", ") : null,
    address: addresses.length ? addresses.join(" | ") : null,
    date: asStr(jp.datePosted)?.slice(0, 10) ?? null,
    deadline,
    employmentType: asStr(jp.employmentType),
    skills,
    experienceMonths: typeof months === "number" ? months : null,
    description: htmlToText(jp.description),
    benefits: htmlToText(jp.jobBenefits),
    url: `${BASE_URL}/it-jobs/${slug}`,
    // validThrough is a calendar day; the posting stays open through that day.
    isActive: deadline ? deadline >= vnDay(now) : true,
  }
}
