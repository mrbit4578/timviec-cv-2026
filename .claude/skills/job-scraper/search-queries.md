# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; the Vietnamese `vietnamworks-search` and `itviec-search` and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language.

## Search Sites

Primary (your market's job boards - scaffold one with `/add-portal`):
- **vietnamworks.com** - VietnamWorks (covered by `vietnamworks-search` CLI for Đồng Nai `--city 19` and TP. Hồ Chí Minh `--city hcm`)
- **linkedin.com/jobs** - LinkedIn job listings (filter: Vietnam / Dong Nai / Ho Chi Minh City); also covered by `linkedin-search` CLI
- **topcv.vn** - TopCV Vietnam (Accounting / Korean FDI roles in Đồng Nai & TP.HCM)
- **careerlink.vn** - CareerLink Vietnam (FDI Industrial Zone roles in Nhơn Trạch / Biên Hòa / Long Thành)

Vietnam (shipped with this Vietnamese edition):
- **vietnamworks.com** - covered by the `vietnamworks-search` CLI (all sectors, all provinces)
- **itviec.com** - covered by the `itviec-search` CLI (disabled via `enabled: false` for non-IT Accounting profile)
- **topcv.vn** - no CLI (TopCV's bot protection refuses automated clients, and this repo does not work around that). Covered by **WebFetch** as described in the TopCV block below - fresher than WebSearch. Delete the block if TopCV is not relevant.

### TopCV (WebFetch, no CLI)

TopCV listing pages render for WebFetch. For each query term, WebFetch the listing URL and extract, per posting: title, company, location, salary, the relative posting age ("Đăng 3 ngày trước"), and the posting URL **without its query string** (`https://www.topcv.vn/viec-lam/<slug>/<id>.html`). Treat these results exactly like Step 1c fallback results: tag them with portal `topcv` and source `websearch`, fetch details with WebFetch on the posting URL, and never invent a field the page does not show.

```
https://www.topcv.vn/tim-viec-lam-ke-toan-tong-hop
https://www.topcv.vn/tim-viec-lam-ke-toan-tieng-han
```

`[YOUR_KEYWORD_SLUG]` = the Vietnamese or English keyword, lowercase, accents removed, spaces as `-` (e.g. `ke-toan`, `nhan-vien-marketing`, `data-analyst`). The listing is nationwide; filter by location from each result's location field (TopCV labels post-2025 provinces like "Hồ Chí Minh (mới)"). If WebFetch is refused or returns no postings, fall back to WebSearch:

```
site:topcv.vn/viec-lam "kế toán tổng hợp" "Đồng Nai"
```

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies

## Query Categories

Queries are grouped by priority. Write **each category in every language from your Languages table** (see Language scope above). Combine each query with your location terms (e.g. your city, region, or metro area) where the site supports it.

**Organize by function, not job title.** The same underlying work carries different titles across companies and markets (a "Data Scientist" role at one employer may be posted as "Insights Analyst" or "Data Consultant" at another). Name each priority category after the function it covers, and list several plausible job titles as query variants within that category rather than betting an entire priority tier on one exact title string.

### Priority 1: Kế toán Tổng hợp & Kế toán Tiếng Hàn (General Accountant / 총괄 회계)

These match your strongest and most desired career direction.

```
site:vietnamworks.com "kế toán tổng hợp" "Đồng Nai"
site:vietnamworks.com "kế toán" "tiếng Hàn" "Đồng Nai"
site:vietnamworks.com "kế toán tổng hợp" "Hồ Chí Minh"
site:linkedin.com/jobs "General Accountant" "Korean" Vietnam
```

### Priority 2: Kế toán Thuế, Hoàn thuế & Kiểm soát Nội bộ (Tax & Internal Control Accountant)

These match your domain expertise.

```
site:vietnamworks.com "kế toán thuế" "Đồng Nai" OR "Hồ Chí Minh"
site:vietnamworks.com "internal accounting control" OR "kiểm soát nội bộ" "Hồ Chí Minh"
site:linkedin.com/jobs "Tax Accountant" OR "Internal Control" "Dong Nai" Vietnam
```

### Priority 3: Phụ trách Kế toán / Kế toán Trưởng & Nhân sự - Kế toán Tiếng Hàn

Adjacent roles you could pivot into.

```
site:vietnamworks.com "kế toán trưởng" OR "phụ trách kế toán" "Đồng Nai"
site:vietnamworks.com "tiếng Hàn" "Nhơn Trạch" "Đồng Nai"
```

### Priority 4: Broader ERP Accounting & FDI Administration

Wider net for general technical roles.

```
site:vietnamworks.com "Ecount" "kế toán" "Đồng Nai" OR "Hồ Chí Minh"
site:linkedin.com/jobs "Korean" "Accountant" "Ho Chi Minh"
site:topcv.vn/viec-lam "kế toán" "Nhơn Trạch"
```

## Location Filter

When evaluating results, verify the job location is within reasonable commute distance from your home. Define acceptable areas:
- Nhơn Trạch, Đồng Nai (KCN Nhơn Trạch 1, 2, 3, 5, 6 - ưu tiên hàng đầu, ngay nơi cư trú Phú Đông)
- Long Thành, Biên Hòa, Trảng Bom - Đồng Nai
- TP. Hồ Chí Minh (Quận 2/Thủ Đức, Quận 7, Quận 1, Bình Thạnh - qua phà Cát Lái hoặc cao tốc Long Thành - Dầu Giây)
- Bình Dương / Bà Rịa - Vũng Tàu giáp ranh (borderline - ~45-60 min)
- Hà Nội / Đà Nẵng / Miền Bắc & Miền Trung (too far)

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table. When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring a language you haven't declared at all is excluded; a posting requiring a higher level than you declared in a language you do work in is not excluded, flag it clearly instead (see `job-scraper/SKILL.md`'s Step 3 "Quick Fit Assessment" for how the flag surfaces in `/scrape` output). Postings simply *written* in a language you don't work in, that don't require it on the job, are fine.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape [focus_area]" -> relevant category queries + custom focus-specific queries
