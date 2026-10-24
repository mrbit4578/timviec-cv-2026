# ITviec - endpoint reference

Recorded 2026-10-22 while building the skill. Update this file when ITviec changes its markup.

## Search

`GET https://itviec.com/it-jobs[/<keyword-slug>][/<city-slug>][?page=N]` - server-rendered HTML,
20 job cards per page.

| Part | Values |
|------|--------|
| `<keyword-slug>` | lowercase, accents stripped, non-alphanumerics -> `-` (`react-native`, `data-engineer`); `.` dropped (`nodejs`), `#` -> `sharp`, `++` -> `plus-plus` |
| `<city-slug>` | `ho-chi-minh-hcm`, `ha-noi`, `da-nang` |
| `page` | 1-indexed; omit for page 1 |

`/it-jobs?query=<text>` redirects to the slug form and **drops `page`**, so the CLI builds the
slug itself. An unknown term returns HTTP 404 ("Search term not found").

### Card anchors (per `<div class='job-card ...'>` chunk)

| Field | Anchor |
|-------|--------|
| `id` (slug) | `data-search--job-selection-job-slug-value='<slug>'` |
| `title` | `<h3 ... data-search--job-selection-target='jobTitle'>` inner text |
| `company` | `<a class="text-rich-grey" href="/companies/...">` text |
| `date` | `Posted <n> <unit> ago` inside the first `<span>` (relative) |
| `workplace` | `<div class='text-rich-grey flex-shrink-0'>At office|Hybrid|Remote</div>` |
| `location` | `<div class='text-rich-grey text-truncate ...' title='Ha Noi'>` |
| `skills` | `<a ... data-responsive-tag-list-target="tag">` texts |

Hrefs on cards carry long tracking query strings; the CLI always rebuilds the URL as
`https://itviec.com/it-jobs/<slug>`.

## Detail

`GET https://itviec.com/it-jobs/<slug>` - read the `<script type='application/ld+json'>` block
whose `@type` is `JobPosting`:

| CLI field | JSON-LD |
|-----------|---------|
| `title` | `title` |
| `company` | `hiringOrganization.name` |
| `location` / `address` | `jobLocation[].address.addressRegion` / street + locality + region (`"Not Available"` parts dropped) |
| `date` | `datePosted` |
| `deadline` | `validThrough` |
| `employmentType` | `employmentType` |
| `skills` | `skills` (comma list) |
| `experienceMonths` | `experienceRequirements.monthsOfExperience` |
| `description` / `benefits` | `description` / `jobBenefits` (HTML) |

`baseSalary` is a placeholder ("You'll love it") for signed-out visitors and is ignored.

## robots.txt

`itviec.com/robots.txt`: `Allow: /`, only `/subscriptions/new` disallowed.
