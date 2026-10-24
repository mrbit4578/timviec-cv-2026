---
name: itviec-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for IT / software / tech
  jobs in Vietnam on ITviec, or look up a specific ITviec job posting. Covers
  developer, data, AI, DevOps, QA, product, IT management and other tech roles
  in Hồ Chí Minh, Hà Nội and Đà Nẵng. Trigger phrases: IT jobs Vietnam,
  developer jobs Vietnam, ITviec, tìm việc IT, việc làm IT, tuyển lập trình
  viên, việc làm công nghệ thông tin, tuyển dụng developer, look up this
  ITviec posting.
context: fork
enabled: false  # set to false to keep this portal installed but have /scrape skip it (non-IT candidates)
allowed-tools: Bash(bun run .agents/skills/itviec-search/cli/src/cli.ts *)
---

# ITviec Search Skill

Search live IT job listings on **ITviec** (itviec.com), Vietnam's best-known board for
software and tech roles. The CLI reads ITviec's public search pages and each posting's
schema.org `JobPosting` JSON-LD: no authentication, no API key, **zero runtime
dependencies** - it runs with just `bun`.

**IT roles only.** For non-IT roles use `vietnamworks-search` (or TopCV via
`job-scraper/search-queries.md`). Non-IT candidates can set `enabled: false` above.

## ⚠️ Personal use only

This reads ITviec's public web pages; automated access may be against ITviec's terms of
service. **Keep volume low and don't use it commercially or for bulk data collection.** Run
it on your own responsibility.

## When to use this skill

- Search IT jobs by skill or title, optionally in Hồ Chí Minh, Hà Nội or Đà Nẵng
- Filter by workplace (remote / hybrid / at office) and recency
- Get the full description, skills, address and deadline of one posting

## Commands

### Search job listings

```bash
bun run .agents/skills/itviec-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — an IT skill or title **in English**, as ITviec tags it: `"python"`, `"data engineer"`, `"react native"`, `"devops"`, `"business analyst"`. ITviec matches the term as a path slug, so Vietnamese phrases ("kế toán") or a term ITviec does not know return **0 results** (exit 0). Omit for all IT jobs.
- `--location <text>` / `-l <text>` — only `"Hồ Chí Minh"` (`hcm`), `"Hà Nội"` (`hn`), `"Đà Nẵng"` (`dn`), accent-insensitive. Any other city exits 1 with `BAD_LOCATION`; omit for all of Vietnam.
- `--remote <mode>` — `remote`, `hybrid` or `onsite` (filtered client-side on the card's workplace).
- `--jobage <days>` — posted within N days (client-side; see the date note below).
- `--page <n>` — page number (1-indexed, 20 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

Each result carries `id` (the posting slug), `title`, `company`, `location`, `workplace`,
`date`, `skills`, `url`. Salary is hidden behind ITviec sign-in, so it is not returned.

### Fetch full job detail

```bash
bun run .agents/skills/itviec-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

`slug` is the `id` from `search` (e.g. `ai-engineer-python-ai-apis-llms-forix-4550`); a full
`itviec.com/it-jobs/<slug>` URL also works. Returns description (incl. requirements),
benefits, skills, address, exact posting date, deadline (`validThrough`), employment type,
required experience in months, and `isActive` (false once the deadline has passed).

## Usage examples

```bash
# Python jobs in Ho Chi Minh City
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "python" -l "Hồ Chí Minh" --format table

# Data engineers in Hanoi, last 14 days
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "data engineer" -l hn --jobage 14 --format table

# Remote DevOps roles anywhere in Vietnam
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "devops" --remote remote --format table

# All IT jobs in Da Nang
bun run .agents/skills/itviec-search/cli/src/cli.ts search -l "Đà Nẵng" --format table

# Full details for one posting
bun run .agents/skills/itviec-search/cli/src/cli.ts detail ai-engineer-python-ai-apis-llms-forix-4550 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Dates:** search cards show only a relative age ("Posted 4 hours ago"), which ITviec resets when an employer refreshes a posting. The search `date` is that approximate day; `detail` returns the original `datePosted`, which can be weeks older. Treat the search date as "last refreshed", and use `detail` when the real age matters.
- Only Hồ Chí Minh, Hà Nội and Đà Nẵng have city listings; jobs elsewhere appear only in the nationwide search.
- Page size is fixed at 20.
- The CLI retries 429/5xx with exponential backoff. Keep volume low.
