import { buildSearchUrl, htmlFetch, parseJobCards, writeError, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query?: string
  city: string | null
  jobage?: number
  remote?: "remote" | "hybrid" | "onsite"
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

const WORKPLACE: Record<string, string> = { remote: "remote", hybrid: "hybrid", onsite: "at office" }

/** Keep cards posted within the last `days` days; unknown dates are kept. */
export function withinDays(cards: JobCard[], days: number, now: Date = new Date()): JobCard[] {
  const cutoff = now.getTime() - days * 86400 * 1000
  return cards.filter((c) => !c.date || new Date(`${c.date}T23:59:59+07:00`).getTime() >= cutoff)
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const header =
    "ID".padEnd(48) + " " + "TITLE".padEnd(40) + " " + "COMPANY".padEnd(24) + " " + "LOCATION".padEnd(12) + " " + "MODE".padEnd(9) + " DATE"
  const rows = cards.map(
    (c) =>
      `${c.id.slice(0, 48).padEnd(48)} ${c.title.slice(0, 40).padEnd(40)} ${(c.company || "—").slice(0, 24).padEnd(24)} ` +
      `${(c.location || "—").slice(0, 12).padEnd(12)} ${(c.workplace || "—").slice(0, 9).padEnd(9)} ${c.date || "—"}`,
  )
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildSearchUrl(opts.query, opts.city, opts.page))
    // "" = ITviec's 404 "Search term not found" page: an unknown keyword is zero results.
    let cards = html ? parseJobCards(html) : []
    if (opts.remote) {
      const want = WORKPLACE[opts.remote]
      cards = cards.filter((c) => (c.workplace || "").toLowerCase() === want)
    }
    if (opts.jobage !== undefined) cards = withinDays(cards, opts.jobage)
    if (opts.limit !== undefined) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.workplace || "—"} · ${c.date || "—"}` +
              `${c.skills.length ? `\n  skills: ${c.skills.join(", ")}` : ""}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(JSON.stringify({ meta: { count: cards.length, page: opts.page }, results: cards }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
