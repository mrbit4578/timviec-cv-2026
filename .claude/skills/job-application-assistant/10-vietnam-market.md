---
framework_version: 1.1.0
---

# Vietnam Market Conventions (Vietnamese edition)

This file is the Vietnamese edition's localization layer. It does not replace the
framework rules in the other files - it adds the conventions Vietnamese employers expect.
Where it conflicts with a generic rule elsewhere, this file wins for Vietnamese
applications; everything else (no fabrication, verification checklist, PDF checks,
posting_guard, tracker) applies unchanged.

## 1. Conversation language

- **Talk to the user in Vietnamese** (có dấu), whatever language the prompts are written in. Keep file names, command names and code identifiers as they are.
- Evaluation tables, fit verdicts, interview prep and questions to the user are in Vietnamese. Quote posting text in its original language.

## 2. Document language

| Posting written in | CV | Cover letter |
|--------------------|----|--------------|
| Vietnamese | Vietnamese (`cv/main_example_vi.tex`) | Vietnamese (`cover_letters/cover_example_vi.tex`, class `cover_vi`) |
| English (common at FDI companies, banks, IT) | English (`cv/main_example.tex`) | English (`cover_letters/cover_example.tex`, class `cover`) |
| Korean / Korean FDI (Samsung, LG, CJ, Hyosung, Woori, KCN Đồng Nai/Bình Dương/Bắc Ninh) | Korean / Bilingual KO-VI (`이력서 / 경력기술서`) or Vietnamese (`cv/main_example_vi.tex`) | Korean (`자기소개서`) or Vietnamese (`cover_letters/cover_example_vi.tex`) |
| Both languages | Ask the user; default to English/Korean for FDI employers, Vietnamese for domestic companies | Same as the CV |

The candidate's `CV language` in CLAUDE.md is the default only when the posting does not decide it.

**Korean FDI & Korean-language CV conventions (`이력서`):**
- Include both full Vietnamese name with diacritics (`PHẠM THỊ PHƯƠNG`) and Hangul transliteration (`팜 티 프엉`).
- Highlight ERP systems widely used in Korean FDI firms in Vietnam: **Ecount ERP**, **Smart Pro**, **Fast**, **MISA**, **SAP**, **Amis**.
- For Accounting / HR / GA roles in Korean companies (`총괄 회계 담당자` / `인사·총무`), explicitly highlight regulatory liaison experience (`세무서` tax office, `사회보험` social insurance, `시장 관리 기관` market management, `식품 위생·안전` food safety, `소방서` fire safety/PCCC) and **foreigner Work Permit applications (`외국인 근로자 취업 허가`)**.
- Close Korean CVs with the standard affirmation `상기 내용은 사실과 다름없음을 확인합니다.` followed by the date (`YYYY년 MM월 DD일`) and candidate signature.

**Fonts:** the stock `cover.cls` uses Lato/Raleway builds that have **no Vietnamese glyphs** (ạ, ả, ấ, ơ, ư... render as blanks). Any cover letter containing Vietnamese text must use `\documentclass{cover_vi}` (Be Vietnam Pro, SIL OFL, bundled in `cover_letters/OpenFonts/fonts/bevietnampro/`). The bullet-list wrapper then uses `\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}` instead of Raleway-Medium. The CV needs nothing special: moderncv's Latin Modern font under lualatex covers Vietnamese fully. After compiling, check the text layer (`tools/verify_pdf.py --dump-text`) for missing diacritics.

## 3. Vietnamese CV conventions

- **Section headings** (translate all of them, per `05-cv-templates.md`): `Mục tiêu nghề nghiệp` or `Giới thiệu`, `Năng lực chính`, `Kinh nghiệm làm việc`, `Học vấn`, `Chứng chỉ`, `Ngoại ngữ`, `Dự án` (optional), `Giải thưởng`, `Hoạt động` (optional), `Người tham chiếu` with `Sẵn sàng cung cấp khi được yêu cầu.`
- **Name order:** Vietnamese order (Họ - tên đệm - tên): `\name{Nguyễn Văn}{An}`. On an English CV use the order the candidate uses on LinkedIn.
- **Dates:** `MM/YYYY - nay` (present) / `MM/YYYY - MM/YYYY`.
- **Contact:** phone in `+84` or `0xxx` form; email; city/district only - never a full home address. Zalo is commonly reachable on the same number; mention it only if the candidate wants.
- **Personal data:** do **not** add date of birth, gender, marital status, ID number or hometown unless the posting explicitly asks and the candidate agrees. Many Vietnamese templates include them; they invite bias and are not required.
- **Photo:** common on Vietnamese CVs, optional. `cv/main_example_vi.tex` has a commented `\photo` line - enable it only when the candidate supplies a professional photo. English CVs for FDI/IT employers: no photo by default.
- **Career objective:** Vietnamese recruiters read "Mục tiêu nghề nghiệp" first. Make it specific to the role (what the candidate brings and where they want to grow), 3-5 lines - never generic ("mong muốn được làm việc trong môi trường chuyên nghiệp" is filler).
- **Languages:** state test scores where they exist (IELTS 7.0, TOEIC 850, JLPT N2, HSK 4) - Vietnamese employers screen on them.
- **Degree classification** (`Xếp loại Giỏi/Khá`, GPA) is worth listing for candidates with under ~3 years of experience.
- **File name:** `CV_<Vị trí>_<Họ tên không dấu>.pdf` (e.g. `CV_DataAnalyst_NguyenVanAn.pdf`) - recruiters download dozens of files named `CV.pdf`.

## 4. Vietnamese cover letter (thư xin việc) conventions

- Header line: `[Thành phố], ngày [dd] tháng [mm] năm [yyyy]`.
- Salutation: `Kính gửi: Anh/Chị [Tên] - [Chức danh], [Công ty],` or `Kính gửi: Phòng Nhân sự [Công ty],` when no name is known.
- Self-reference: **"tôi"** throughout. "Em" reads as junior and informal; use it only if the user explicitly asks (some fresh graduates prefer it for small local companies).
- Address the reader as "Anh/Chị" (or "Quý Công ty" for the company).
- Structure is the same as `06-cover-letter-templates.md`: opening (role + source + strongest fit), evidence bullets, why this company (verified specifics), personal fit, close.
- Closing: `Tôi rất mong có cơ hội được trao đổi trực tiếp với Anh/Chị.` then `Trân trọng,` and the full name.
- The `03-writing-style.md` rules apply in Vietnamese too: no em-dashes, no clichés ("năng động, nhiệt huyết, ham học hỏi" without evidence is the Vietnamese equivalent of "passionate team player"), every claim backed by a specific example.

## 5. Application email (thư ứng tuyển qua email)

Many Vietnamese postings say "gửi CV qua email". When the user asks for the email:
- Subject: follow the posting's format exactly if it gives one; otherwise `[Ứng tuyển] <Vị trí> - <Họ tên>`.
- Body: 4-6 lines - greeting, role and source, one-sentence strongest fit, attachments list, availability, phone. The cover letter is attached as PDF, not pasted.
- Draft only. Never send.

## 6. Salary and benefits

- Vietnamese salaries are quoted **monthly, in VND** (`15 - 25 triệu`), and usually **gross** unless the posting says net (`lương net`). Always ask or flag which one when benchmarking.
- "Thương lượng" / "Cạnh tranh" = negotiable; treat as unknown, never as low.
- Common package items to weigh in the evaluation: tháng lương 13 (13th-month salary) or "24-26 tháng lương/năm", thưởng KPI, BHXH/BHYT/BHTN on the full salary vs. the minimum, bảo hiểm sức khoẻ, ngày phép, làm thứ Bảy (Saturday work is a real deal-breaker for many - check it), hybrid/WFH days.
- `salary_lookup.py` works with any salary data the user provides (TopCV/ITviec salary reports, Navigos reports, personal research) - see `tools/README_SALARY_TOOL.md`.

## 7. Job evaluation additions

When scoring with `04-job-evaluation.md`, also check:
- **Saturday work** (`làm việc thứ 7`, `T2-T7`) - compare with the candidate's deal-breakers.
- **Probation** (`thử việc`, Bộ luật Lao động 2019 Art. 25-26): at most 60 days for jobs requiring a college degree or higher, 30 days for vocational/technical jobs, 6 working days for other jobs, 180 days for enterprise managers; probation pay at least 85% of the job's salary. Flag postings that exceed these.
- **Company type:** FDI / multinational vs. domestic private vs. state-owned (doanh nghiệp nhà nước) vs. startup - culture, process and language expectations differ sharply.
- **Company reviews:** ITviec company reviews, Reviewcongty, Glassdoor (for multinationals), and the company's own fanpage/LinkedIn.
- **Post-2025 provinces:** since the 2025 administrative merger, postings may say "Hồ Chí Minh (mới)" for areas of former Bình Dương or Bà Rịa - Vũng Tàu. Check the actual work address against the candidate's commute constraints.

## 8. Interview conventions

- First rounds are often a phone/Zalo screening call by HR, then a technical or line-manager round, sometimes a test or case study, then an offer round.
- Expect questions on salary expectation (have a gross range ready), reason for leaving, notice period (thời gian báo nghỉ: commonly 30-45 days), and, at domestic companies, sometimes personal questions (family, plans) - prepare the candidate to answer politely or redirect.
- Use the STAR framework from `07-interview-prep.md` unchanged; prepare answers in the interview's language.

## 9. Vietnamese job boards

| Board | How this repo covers it |
|-------|-------------------------|
| VietnamWorks | `vietnamworks-search` CLI (all sectors) |
| ITviec | `itviec-search` CLI (IT only) |
| TopCV | WebFetch, configured in `job-scraper/search-queries.md` |
| LinkedIn | `linkedin-search` CLI with `-l "Ho Chi Minh City, Vietnam"` / `"Hanoi, Vietnam"` |
| CareerViet, JobsGO, TopDev, Glints... | Not shipped - add with `/add-portal` |
