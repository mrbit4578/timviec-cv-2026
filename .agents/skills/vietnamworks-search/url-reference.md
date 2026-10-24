# VietnamWorks - endpoint reference

Recorded 2026-10-22 while building the skill. Update this file when the API changes.

## Search (also used for detail)

`POST https://ms.vietnamworks.com/job-search/v1.0/search` with `Content-Type: application/json`.
No authentication. This is the API the website's own search page calls.

Request body:

```json
{
  "userId": 0,
  "query": "data engineer",
  "filter": [{ "field": "workingLocations.cityId", "value": "29,24" }],
  "ranges": [],
  "order": [{ "field": "approvedOn", "value": "desc" }],
  "hitsPerPage": 20,
  "page": 0
}
```

| Field | Notes |
|-------|-------|
| `query` | Free-text keywords. `""` = everything. |
| `filter` | `workingLocations.cityId` - several cities as ONE comma list (OR). Repeating the filter object keeps only the first. `jobId` - exact job id (used by `detail`). |
| `ranges` | Accepted but date ranges on `approvedOn` were ignored in testing, so `--jobage` filters client-side. |
| `order` | `[]` = relevance. `approvedOn desc` = newest first. |
| `page` | 0-indexed (the CLI's `--page` is 1-indexed). |

Response: `{ "meta": { "nbHits", "page", "nbPages", "hitsPerPage" }, "data": [ ... ] }`.

Fields used per hit:

| CLI field | API field |
|-----------|-----------|
| `id` | `jobId` |
| `title` | `jobTitle` |
| `company` | `companyName` |
| `location` | `workingLocations[].cityNameVI` |
| `date` | `approvedOn` (fallback `createdOn`), first 10 chars |
| `deadline` | `expiredOn` |
| `salary` | `prettySalary` (fallback `salaryMin`/`salaryMax`/`salaryCurrency`) |
| `level` | `jobLevelVI` |
| `url` | `jobUrl` without query string |
| detail `description` / `requirements` | `jobDescription` / `jobRequirement` (HTML) |
| detail `benefits` | `benefits[].benefitNameVI` + `benefitValue` |
| detail `skills` | `skills[].skillName` |

## City ids

From `props.pageProps.metaCities.idBased` in the `__NEXT_DATA__` of
`https://www.vietnamworks.com/viec-lam?q=...`. Main ones: Hồ Chí Minh 29, Hà Nội 24,
Đà Nẵng 17, Hải Phòng 28, Cần Thơ 15, Bình Dương 11, Đồng Nai 19, Quốc tế 70.

## Posting URLs

`https://www.vietnamworks.com/<slug>-<jobId>-jv` (or `-jd`). The CLI's `detail` parses the id from
the trailing `-<digits>-jv|jd`.

## robots.txt

`www.vietnamworks.com/robots.txt` disallows profile, login and apply paths only; search and
job pages are allowed. `ms.vietnamworks.com/robots.txt` returns 404 (no rules).
