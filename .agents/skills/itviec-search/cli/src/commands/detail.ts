import { BASE_URL, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

const ITVIEC_HOST = /(^|\.)itviec\.com$/i

/**
 * Accept a job slug (`data-engineer-vietinbank-1250`) or an itviec.com
 * `/it-jobs/<slug>` URL, with or without scheme and query string. Other hosts
 * are rejected through real URL parsing, so look-alike hosts and userinfo
 * tricks fall on the reject side.
 */
export function normalizeSlug(input: string): string | null {
  const trimmed = input.trim()
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/i.test(trimmed)) return trimmed.toLowerCase()
  const hasScheme = /^https?:\/\//i.test(trimmed)
  if (!hasScheme && !/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) return null
  let parsed: URL
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!ITVIEC_HOST.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/^\/it-jobs\/([a-z0-9]+(?:-[a-z0-9]+)*-\d+)(?:\/content)?\/?$/i)
  return m ? m[1].toLowerCase() : null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = normalizeSlug(opts.id)
  if (!slug) {
    writeError(`Could not parse an ITviec job slug from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(`${BASE_URL}/it-jobs/${slug}`)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, slug)
    if (!job) {
      writeError("No JobPosting data on the page (closed posting or markup change; see url-reference.md)", "NOT_FOUND")
      return 1
    }
    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        job.address ? `Địa chỉ: ${job.address}` : "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
        job.experienceMonths !== null ? `Kinh nghiệm: ${job.experienceMonths} tháng` : "",
        job.skills.length ? `Skills: ${job.skills.join(", ")}` : "",
        job.date ? `Ngày đăng: ${job.date}` : "",
        job.deadline ? `Hạn: ${job.deadline}` : "",
        `Status: ${job.isActive ? "ACTIVE" : "CLOSED / EXPIRED"}`,
        "",
        job.description || "(no description)",
        job.benefits ? `\n## Benefits\n${job.benefits}` : "",
        "",
        `URL: ${job.url}`,
      ]
      process.stdout.write(lines.filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "").join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
