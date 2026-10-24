import { SEARCH_URL, apiPost, buildBody, parseDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

const VNW_HOST = /(^|\.)vietnamworks\.com$/i

/**
 * Accept a numeric job id or a vietnamworks.com posting URL
 * (`.../<slug>-<id>-jv` or `-jd`, with or without scheme and tracking query).
 * A URL on any other host is rejected - real URL parsing, so look-alike hosts
 * (vietnamworks.com.evil.io) and userinfo tricks fall on the reject side.
 */
export function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{5,}$/.test(trimmed)) return trimmed
  const hasScheme = /^https?:\/\//i.test(trimmed)
  if (!hasScheme && !/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) return null
  let parsed: URL
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!VNW_HOST.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/-(\d{5,})-j[vd]\/?$/i)
  return m ? m[1] : null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse a VietnamWorks job id from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const response = (await apiPost(SEARCH_URL, buildBody({ jobId: id, page: 1, hitsPerPage: 1 }))) as
      | { data?: unknown[] }
      | null
    const raw = response && Array.isArray(response.data) ? (response.data[0] as Record<string, unknown>) : undefined
    const job = raw && String(raw.jobId) === id ? parseDetail(raw) : null
    if (!job) {
      writeError("Job not found (expired postings drop out of the API)", "NOT_FOUND")
      return 1
    }
    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        job.address ? `Địa chỉ: ${job.address}` : "",
        job.salary ? `Lương: ${job.salary}` : "",
        job.level ? `Cấp bậc: ${job.level}` : "",
        job.yearsOfExperience !== null ? `Kinh nghiệm: ${job.yearsOfExperience} năm` : "",
        job.industries ? `Ngành: ${job.industries}` : "",
        job.skills.length ? `Kỹ năng: ${job.skills.join(", ")}` : "",
        job.date ? `Ngày đăng: ${job.date}` : "",
        job.deadline ? `Hạn nộp: ${job.deadline}` : "",
        `Status: ${job.isActive ? "ACTIVE" : "CLOSED / EXPIRED"}`,
        "",
        "## Mô tả công việc",
        job.description || "(không có)",
        "",
        "## Yêu cầu",
        job.requirements || "(không có)",
        job.benefits.length ? `\n## Phúc lợi\n${job.benefits.map((b) => `• ${b}`).join("\n")}` : "",
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
