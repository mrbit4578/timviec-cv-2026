import {
  SEARCH_URL,
  apiPost,
  buildBody,
  parseSearch,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  cityIds: number[]
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

export const PAGE_SIZE = 20

/** Keep cards posted within the last `days` days (client-side; the API has no date filter). */
export function withinDays(cards: JobCard[], days: number, now: Date = new Date()): JobCard[] {
  const cutoff = now.getTime() - days * 86400 * 1000
  return cards.filter((c) => {
    if (!c.date) return true // unknown date: keep, /scrape flags it as "date unknown"
    return new Date(`${c.date}T23:59:59+07:00`).getTime() >= cutoff
  })
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const header =
    "ID".padEnd(9) + " " + "TITLE".padEnd(44) + " " + "COMPANY".padEnd(28) + " " + "LOCATION".padEnd(20) + " " + "SALARY".padEnd(18) + " DATE"
  const rows = cards.map((c) => {
    const title = c.title.slice(0, 44).padEnd(44)
    const company = (c.company || "—").slice(0, 28).padEnd(28)
    const loc = (c.location || "—").slice(0, 20).padEnd(20)
    const salary = (c.salary || "—").slice(0, 18).padEnd(18)
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${salary} ${c.date || "—"}`
  })
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const body = buildBody({
      query: opts.query,
      cityIds: opts.cityIds,
      // A posting-age window only works on a newest-first list: filtering a
      // relevance-ranked page by date would drop fresh jobs ranked lower.
      newestFirst: opts.jobage !== undefined,
      page: opts.page,
      hitsPerPage: PAGE_SIZE,
    })
    const response = await apiPost(SEARCH_URL, body)
    if (response === null) {
      writeError("search endpoint returned 404 - the API may have moved; see url-reference.md", "SEARCH_FAILED")
      return 1
    }
    const { total, cards: parsed } = parseSearch(response)
    let cards = opts.jobage !== undefined ? withinDays(parsed, opts.jobage) : parsed
    if (opts.limit !== undefined) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.salary || "—"} · ${c.date || "—"}` +
              `${c.deadline ? ` (hạn nộp ${c.deadline})` : ""}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: cards.length, page: opts.page, total }, results: cards }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
