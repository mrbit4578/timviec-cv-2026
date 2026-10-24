---
name: vietnamworks-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs in Vietnam on
  VietnamWorks, or look up a specific VietnamWorks job posting. Covers every
  sector (IT, finance, accounting, marketing, sales, HR, engineering,
  manufacturing, etc.) and every Vietnamese province/city (Hồ Chí Minh, Hà Nội,
  Đà Nẵng...). Trigger phrases: find a job in Vietnam, job search Vietnam,
  VietnamWorks, tìm việc làm, tìm việc, việc làm, tuyển dụng, tin tuyển dụng,
  việc làm Hồ Chí Minh, việc làm Hà Nội, look up this VietnamWorks posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/vietnamworks-search/cli/src/cli.ts *)
---

# VietnamWorks Search Skill

Search live job listings on **VietnamWorks** (vietnamworks.com), one of Vietnam's largest
general job boards. The CLI reads the public JSON API behind the site's own search page:
no authentication, no API key, and **zero runtime dependencies** - it runs with just `bun`.
Postings are in Vietnamese, English, or both.

## ⚠️ Personal use only

This uses VietnamWorks' public search API, which is not a documented developer API.
**Keep volume low and don't use it commercially or for bulk data collection.** Run it on
your own responsibility.

## When to use this skill

- Search job openings anywhere in Vietnam, optionally scoped to one or more provinces/cities
- Limit to recent postings (last N days)
- Get the full description, requirements, benefits, salary and deadline of one posting

## Commands

### Search job listings

```bash
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role), Vietnamese or English. Recommended.
- `--location <text>` / `-l <text>` — province/city, accent-insensitive: `"Hồ Chí Minh"`, `"ha noi"`, `"Đà Nẵng"`, or short forms `hcm`, `hn`, `dn`. Comma-separate several (`"hcm,hn"`, OR). Omit for all of Vietnam. Unknown names exit 1 with `BAD_LOCATION`.
- `--jobage <days>` — posted within N days. The API has no date filter, so this sorts newest-first and filters client-side on the posting date.
- `--page <n>` — page number (1-indexed, 20 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

Each result carries `id`, `title`, `company`, `location`, `date` (posting date, YYYY-MM-DD),
`deadline` (application deadline), `salary` (as displayed, often "Thương lượng" = negotiable),
`level`, `url`.

### Fetch full job detail

```bash
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric job ID from `search` (e.g. `2121927`). A full `vietnamworks.com/...-<id>-jv`
URL also works. Returns description, requirements, benefits, skills, address, years of
experience, industries, deadline and `isActive` (false when the API marks it inactive or the
deadline has passed).

## Usage examples

```bash
# Data roles in Ho Chi Minh City, last 14 days
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "data analyst" -l "Hồ Chí Minh" --jobage 14 --format table

# Accounting jobs in Hanoi
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "kế toán" -l "Hà Nội" --format table

# Digital marketing in HCMC or Hanoi, 10 results
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "digital marketing" -l "hcm,hn" --limit 10 --format table

# Sales managers anywhere in Vietnam
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "sales manager" --format table

# Full details for one posting
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts detail 2121927 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Cities use VietnamWorks' own pre-2025 province list (the site still uses it after the 2025 merger); the full table is in `cli/src/helpers.ts`.
- Salary is often hidden ("Thương lượng"); treat a missing salary as unknown, never as low.
- Expired postings drop out of the API, so `detail` on an old ID returns `NOT_FOUND`.
- The CLI retries 429/5xx with exponential backoff. Keep volume low.
