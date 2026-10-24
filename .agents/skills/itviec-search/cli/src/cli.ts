#!/usr/bin/env bun
// Self-contained CLI for searching IT jobs on ITviec (Vietnam) from its public
// search pages and JobPosting JSON-LD. Zero runtime dependencies: runs anywhere
// `bun` is available.
//
// Personal use only. Keep volume low and do not use it commercially or for
// bulk data collection. Run it on your own responsibility.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { citySlug } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `itviec-cli — tìm việc IT trên ITviec (Việt Nam)

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Kỹ năng/chức danh IT bằng tiếng Anh: "python", "data engineer",
                          "react native", "devops". Không có = mọi việc IT.
  --location, -l <text>   Chỉ 3 thành phố: "Hồ Chí Minh" (hcm), "Hà Nội" (hn), "Đà Nẵng" (dn).
                          Mặc định: toàn quốc.
  --remote <mode>         remote | hybrid | onsite (lọc phía client theo hình thức làm việc).
  --jobage <days>         Chỉ lấy tin đăng trong N ngày (lọc phía client, ngày đăng xấp xỉ).
  --page <n>              Trang (bắt đầu từ 1, 20 tin/trang). Mặc định 1.
  --limit, -n <n>         Giới hạn số kết quả in ra.
  --format <fmt>          json (mặc định) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "python" -l "Hồ Chí Minh" --format table
  bun run src/cli.ts search -q "data engineer" -l hn --jobage 14 --format table
  bun run src/cli.ts search -q "devops" --remote remote --format table
  bun run src/cli.ts detail data-engineer-sql-nosql-hadoop-python-java-vietinbank-1250 --format plain

Personal use only — keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["query", "location", "remote", "jobage", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

function fail(error: string, code: string): number {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
  return 1
}

function wholeNumber(name: string, raw: string | boolean | string[]): number | null {
  const val = typeof raw === "string" ? Number(raw.trim()) : NaN
  if (!Number.isInteger(val) || val < 1) {
    fail(`--${name} must be a whole number of at least 1, got "${raw}"`, "BAD_ARG")
    return null
  }
  return val
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  // Unknown flags are rejected, never silently dropped: a discarded filter
  // changes what the search returns with no error.
  const known = KNOWN_FLAGS[cmd]
  if (known) {
    for (const key of Object.keys(flags)) {
      if (key === "_" || known.has(key)) continue
      return fail(
        `unknown flag --${key} for '${cmd}' - flags are never silently ignored, because a discarded filter changes what the search returns; see --help for the supported flags`,
        "UNKNOWN_FLAG",
      )
    }
  }

  if (cmd === "search") {
    if (flags.query !== undefined && (typeof flags.query !== "string" || !flags.query.trim())) {
      return fail("--query requires a non-empty value", "BAD_ARG")
    }
    const fmt = flags.format !== undefined ? String(flags.format) : "json"
    if (!["json", "table", "plain"].includes(fmt)) {
      return fail(`--format must be one of json|table|plain, got "${fmt}"`, "BAD_ARG")
    }
    let city: string | null = null
    if (flags.location !== undefined) {
      if (typeof flags.location !== "string" || !flags.location.trim()) {
        return fail("--location requires a non-empty value", "BAD_ARG")
      }
      city = citySlug(flags.location)
      if (city === null) {
        return fail(
          `unknown location "${flags.location.trim()}" - ITviec lists only Hồ Chí Minh (hcm), Hà Nội (hn) and Đà Nẵng (dn); omit --location for all of Vietnam`,
          "BAD_LOCATION",
        )
      }
    }
    const remoteModes = ["remote", "hybrid", "onsite"]
    if (flags.remote !== undefined && (typeof flags.remote !== "string" || !remoteModes.includes(flags.remote.toLowerCase()))) {
      const got = typeof flags.remote === "string" ? `"${flags.remote}"` : "no value"
      return fail(`--remote must be one of remote|hybrid|onsite, got ${got}`, "BAD_ARG")
    }
    let jobage: number | undefined
    let page = 1
    let limit: number | undefined
    if (flags.jobage !== undefined) {
      const v = wholeNumber("jobage", flags.jobage)
      if (v === null) return 1
      jobage = v
    }
    if (flags.page !== undefined) {
      const v = wholeNumber("page", flags.page)
      if (v === null) return 1
      page = v
    }
    if (flags.limit !== undefined) {
      const v = wholeNumber("limit", flags.limit)
      if (v === null) return 1
      limit = v
    }
    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query.trim() : undefined,
      city,
      remote: typeof flags.remote === "string" ? (flags.remote.toLowerCase() as SearchOpts["remote"]) : undefined,
      jobage,
      page,
      limit,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) return fail("detail requires an <id|url>", "NO_ID")
    const fmt = flags.format !== undefined ? String(flags.format) : "json"
    if (!["json", "plain"].includes(fmt)) {
      return fail(`--format must be one of json|plain, got "${fmt}"`, "BAD_ARG")
    }
    const opts: DetailOpts = { id, format: fmt as DetailOpts["format"] }
    return runDetail(opts)
  }

  return fail(`Unknown command "${cmd}"`, "BAD_CMD")
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "INTERNAL_ERROR" }) + "\n",
    )
    process.exit(1)
  })
