// Data source: the public JSON search API that backs www.vietnamworks.com's own
// search page (POST, no authentication, no API key). The same endpoint serves
// single-job lookups through a jobId filter, so search and detail share one
// request shape. Every field the CLI emits is read from that JSON - no HTML
// scraping, so markup changes on the website do not break this skill.

export const SEARCH_URL = "https://ms.vietnamworks.com/job-search/v1.0/search"
export const SITE_URL = "https://www.vietnamworks.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; vietnamworks-cli/1.0)"

/**
 * POST a JSON body with exponential backoff on 429/5xx.
 * Returns null on a 404 instead of throwing.
 */
export async function apiPost(url: string, body: unknown): Promise<unknown | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      },
      body: JSON.stringify(body),
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
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }
  throw new Error("Request failed after max retries")
}

// ---------------------------------------------------------------------------
// Cities. VietnamWorks filters by its own numeric city id. The table is the
// site's own `metaCities` list (pre-2025 provinces, which VietnamWorks still
// uses after the 2025 province merger). Matching is accent-, case- and
// punctuation-insensitive, so "Hồ Chí Minh", "ho chi minh" and "hcm" all work.
// ---------------------------------------------------------------------------

export const CITIES: Record<number, string> = {
  2: "An Giang", 3: "Bà Rịa - Vũng Tàu", 4: "Bắc Kạn", 5: "Bắc Giang", 6: "Bạc Liêu",
  7: "Bắc Ninh", 8: "Bến Tre", 10: "Bình Định", 11: "Bình Dương", 12: "Bình Phước",
  13: "Bình Thuận", 14: "Cà Mau", 15: "Cần Thơ", 16: "Cao Bằng", 17: "Đà Nẵng",
  18: "Đắk Lắk", 19: "Đồng Nai", 20: "Đồng Tháp", 21: "Gia Lai", 22: "Hà Giang",
  23: "Hà Nam", 24: "Hà Nội", 26: "Hà Tĩnh", 27: "Hải Dương", 28: "Hải Phòng",
  29: "Hồ Chí Minh", 30: "Hòa Bình", 32: "Hưng Yên", 33: "Khánh Hòa", 34: "Kon Tum",
  35: "Lai Châu", 36: "Lâm Đồng", 37: "Lạng Sơn", 38: "Lào Cai", 39: "Long An",
  40: "Nam Định", 41: "Nghệ An", 42: "Ninh Bình", 43: "Ninh Thuận", 44: "Phú Thọ",
  45: "Phú Yên", 46: "Quảng Bình", 47: "Quảng Nam", 48: "Quảng Ngãi", 49: "Quảng Ninh",
  50: "Quảng Trị", 51: "Sóc Trăng", 52: "Sơn La", 53: "Tây Ninh", 54: "Thái Bình",
  55: "Thái Nguyên", 56: "Thanh Hóa", 57: "Thừa Thiên Huế", 58: "Tiền Giang", 59: "Trà Vinh",
  60: "Tuyên Quang", 61: "Kiên Giang", 62: "Vĩnh Long", 63: "Vĩnh Phúc", 65: "Yên Bái",
  66: "Khác", 69: "Điện Biên", 70: "Quốc tế", 71: "ĐBSCL", 72: "Hậu Giang", 73: "Đắk Nông",
}

const CITY_ALIASES: Record<string, number> = {
  hcm: 29, tphcm: 29, hochiminhcity: 29, saigon: 29, sg: 29,
  hn: 24, hanoi: 24,
  dn: 17, danang: 17,
  hp: 28, haiphong: 28, ct: 15, cantho: 15,
  hue: 57, vungtau: 3, brvt: 3,
  dongnai: 19, dnai: 19, bienhoa: 19, nhontrach: 19, longthanh: 19,
  binhduong: 11, bd: 11, dian: 11, thuanan: 11,
  bacninh: 6, bn: 6,
  longan: 39,
  international: 70, remote: 70,
}

/** Fold Vietnamese text to bare lowercase ASCII letters and digits. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/^(tp|thanh pho|tinh)\s+/, "")
    .replace(/[^a-z0-9]/g, "")
}

/** Resolve a user-supplied city name to a VietnamWorks city id, or null. */
export function cityId(input: string): number | null {
  const key = fold(input)
  if (!key) return null
  if (/^\d+$/.test(input.trim()) && CITIES[Number(input.trim())]) return Number(input.trim())
  if (CITY_ALIASES[key] !== undefined) return CITY_ALIASES[key]
  for (const [id, name] of Object.entries(CITIES)) {
    if (fold(name) === key) return Number(id)
  }
  return null
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  deadline: string | null
  salary: string | null
  level: string | null
  url: string
}

export interface JobDetail extends JobCard {
  address: string | null
  yearsOfExperience: number | null
  industries: string | null
  skills: string[]
  benefits: string[]
  description: string | null
  requirements: string | null
  companyProfile: string | null
  isActive: boolean
}

type Raw = Record<string, unknown>

function str(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t ? t : null
}

/** "2026-10-21T15:25:29+07:00" -> "2026-10-21" (the date as posted, Vietnam time). */
export function isoDay(v: unknown): string | null {
  const s = str(v)
  const m = s?.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

/** Drop tracking query strings so the stored URL is the stable posting URL. */
export function cleanUrl(v: unknown, id: string): string {
  const s = str(v)
  if (!s) return `${SITE_URL}/job-${id}-jv`
  try {
    const u = new URL(s)
    return `${u.origin}${u.pathname}`
  } catch {
    return s.split("?")[0]
  }
}

function locationsOf(raw: Raw): string | null {
  const locs = Array.isArray(raw.workingLocations) ? (raw.workingLocations as Raw[]) : []
  const names: string[] = []
  for (const l of locs) {
    const n = str(l?.cityNameVI) ?? str(l?.cityName)
    if (n && !names.includes(n)) names.push(n)
  }
  return names.length ? names.join(", ") : null
}

function salaryOf(raw: Raw): string | null {
  const pretty = str(raw.prettySalary)
  if (pretty) return pretty
  const min = typeof raw.salaryMin === "number" ? raw.salaryMin : 0
  const max = typeof raw.salaryMax === "number" ? raw.salaryMax : 0
  const cur = str(raw.salaryCurrency) ?? ""
  if (min && max) return `${min} - ${max} ${cur}`.trim()
  if (max) return `<= ${max} ${cur}`.trim()
  if (min) return `>= ${min} ${cur}`.trim()
  return null
}

export function parseCard(raw: Raw): JobCard | null {
  const idNum = raw.jobId
  const id = typeof idNum === "number" || typeof idNum === "string" ? String(idNum) : ""
  const title = str(raw.jobTitle)
  if (!id || !title) return null
  return {
    id,
    title: decodeHtmlEntities(title),
    company: str(raw.companyName),
    location: locationsOf(raw),
    date: isoDay(raw.approvedOn) ?? isoDay(raw.createdOn),
    deadline: isoDay(raw.expiredOn),
    salary: salaryOf(raw),
    level: str(raw.jobLevelVI) ?? str(raw.jobLevel),
    url: cleanUrl(raw.jobUrl, id),
  }
}

/**
 * Parse an API response into cards. Each hit is parsed independently so one
 * malformed record cannot break the rest.
 */
export function parseSearch(body: unknown): { total: number | null; cards: JobCard[] } {
  const b = (body ?? {}) as Raw
  const meta = (b.meta ?? {}) as Raw
  const data = Array.isArray(b.data) ? (b.data as Raw[]) : []
  const cards: JobCard[] = []
  for (const hit of data) {
    try {
      const c = parseCard(hit)
      if (c) cards.push(c)
    } catch {
      // skip a malformed hit
    }
  }
  return { total: typeof meta.nbHits === "number" ? meta.nbHits : null, cards }
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

/** Rich-text HTML -> readable plain text with paragraph/list breaks kept. */
export function htmlToText(html: unknown): string | null {
  const s = str(html)
  if (!s) return null
  const withBreaks = s
    .replace(/\r\n?/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|li|ul|ol|div|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
  const lines = withBreaks
    .split("\n")
    .map((l) => decodeHtmlEntities(l).replace(/[ \t ]+/g, " ").trim())
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n+• /g, "\n• ").trim() || null
}

export function parseDetail(raw: Raw, now: Date = new Date()): JobDetail | null {
  const card = parseCard(raw)
  if (!card) return null
  const skills = (Array.isArray(raw.skills) ? (raw.skills as Raw[]) : [])
    .map((s) => str(s?.skillName))
    .filter((s): s is string => !!s)
  const benefits = (Array.isArray(raw.benefits) ? (raw.benefits as Raw[]) : [])
    .map((b) => {
      const name = str(b?.benefitNameVI) ?? str(b?.benefitName)
      const value = str(b?.benefitValue)
      return name && value ? `${name}: ${decodeHtmlEntities(value)}` : name ?? value
    })
    .filter((s): s is string => !!s)
  const industries = (Array.isArray(raw.industriesV3) ? (raw.industriesV3 as Raw[]) : [])
    .map((i) => str(i?.industryV3NameVI) ?? str(i?.industryV3Name))
    .filter((s): s is string => !!s)
  // Closed = the API says inactive, or the application deadline has passed.
  // The deadline is end-of-day Vietnam time (+07:00), which Date parses.
  const expired = str(raw.expiredOn)
  const pastDeadline = expired ? new Date(expired).getTime() < now.getTime() : false
  return {
    ...card,
    address: str(raw.address),
    yearsOfExperience: typeof raw.yearsOfExperience === "number" ? raw.yearsOfExperience : null,
    industries: industries.length ? industries.join(", ") : null,
    skills,
    benefits,
    description: htmlToText(raw.jobDescription),
    requirements: htmlToText(raw.jobRequirement),
    companyProfile: htmlToText(raw.companyProfile),
    isActive: raw.isActive !== false && !pastDeadline,
  }
}

/** Build the API request body. */
export function buildBody(opts: {
  query?: string
  cityIds?: number[]
  newestFirst?: boolean
  jobId?: string
  page: number
  hitsPerPage: number
}): Raw {
  const filter: Raw[] = []
  if (opts.jobId) filter.push({ field: "jobId", value: opts.jobId })
  // Several cities go in ONE filter as a comma list (OR). Repeating the filter
  // object does not OR: the API keeps only the first one (verified 2026-10-22).
  if (opts.cityIds && opts.cityIds.length) {
    filter.push({ field: "workingLocations.cityId", value: opts.cityIds.join(",") })
  }
  return {
    userId: 0,
    query: opts.query ?? "",
    filter,
    ranges: [],
    order: opts.newestFirst ? [{ field: "approvedOn", value: "desc" }] : [],
    hitsPerPage: opts.hitsPerPage,
    page: opts.page - 1,
  }
}
