<p align="center">
  <a href="https://suai.vn"><img src="assets/suai/logo-suai.png" alt="Sự AI" width="260"></a>
</p>

# AI Job Search - Bản Việt Nam

*Trợ lý tìm việc chạy trên máy của bạn - tìm tin trên VietnamWorks, ITviec, TopCV, viết CV và thư xin việc tiếng Việt chuẩn nhà tuyển dụng Việt Nam.*

Bộ công cụ xin việc bằng AI chạy trên [Claude Code](https://claude.com/claude-code). Điền hồ sơ một lần, sau đó Claude tìm tin tuyển dụng, chấm độ phù hợp, viết CV và thư xin việc riêng cho từng tin, có một agent thứ hai phản biện, và chuẩn bị phỏng vấn cho bạn.

Đây là **bản Việt hoá** của [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) (MIT). Tác giả gốc là Mads Lorentzen, một nhà địa vật lý. Ông dựng bộ công cụ này để tự tìm việc: 69 đơn ứng tuyển, 20 vòng phỏng vấn đầu, 1 hợp đồng.

> Dự án độc lập, không liên kết, không được Anthropic tài trợ hay bảo trợ. Anthropic và Claude Code chỉ được nhắc đến để mô tả công cụ mà quy trình này sử dụng.

## Bản Việt Nam có gì khác

| Hạng mục | Bản gốc | Bản Việt Nam |
|----------|---------|--------------|
| Cổng tìm việc | 4 cổng Đan Mạch + LinkedIn + freehire | **VietnamWorks** (CLI), **ITviec** (CLI), **TopCV** (WebFetch) + LinkedIn + freehire |
| Ngôn ngữ trò chuyện | Theo người dùng | Luôn trả lời **tiếng Việt** |
| CV | Mẫu tiếng Anh | Thêm `cv/main_example_vi.tex`: tiêu đề mục tiếng Việt, họ tên theo thứ tự Việt, ngày `MM/YYYY - nay`, tuỳ chọn ảnh |
| Thư xin việc | `cover.cls` (font Lato/Raleway **không có dấu tiếng Việt**) | Thêm `cover_vi.cls` + `cover_example_vi.tex` với font **Be Vietnam Pro** (OFL), "Kính gửi... Trân trọng," |
| Kiến thức thị trường | - | `10-vietnam-market.md`: lương gross/net theo tháng, tháng 13, làm thứ Bảy, thử việc theo Bộ luật Lao động 2019, email ứng tuyển, phỏng vấn kiểu Việt Nam |

```
/setup             /scrape                 /apply <url>
  |                   |                        |
  v                   v                        v
Điền hồ sơ       Tìm tin trên            Chấm độ phù hợp
                 VietnamWorks, ITviec,   & khuyến nghị
                 TopCV, LinkedIn               |
  |                   |                        v
  v                   v                  Viết CV + thư xin việc
Hồ sơ sẵn sàng   Danh sách tin            (LaTeX, đúng ngôn ngữ của tin)
                 kèm mức phù hợp               |
                      |                        v
                      v                  Agent phản biện
                 Chọn tin -> /apply      -> Sửa -> Bản cuối (PDF)
```

## Cần gì để chạy

- **Máy tính thường, không cần GPU.** Windows, macOS hoặc Linux.
- [Claude Code](https://claude.com/claude-code): bản dòng lệnh hoặc tab **Code** trong app Claude desktop. Claude Code không có gói miễn phí - cần Claude Pro/Max/Team hoặc API key (trả theo token, thường rẻ hơn nếu dùng thỉnh thoảng). **Đây là chi phí chính.**
- Python 3.10+
- [Bun](https://bun.sh) (cho các CLI tìm việc)
- LaTeX có `lualatex` và `xelatex`: [MiKTeX](https://miktex.org/) (Windows), [MacTeX](https://tug.org/mactex/), [TeX Live](https://tug.org/texlive/) hoặc [TinyTeX](https://yihui.org/tinytex/)
- Tuỳ chọn: `pip install pypdf` để `/apply` kiểm tra CV theo cách hệ thống lọc hồ sơ (ATS) đọc

Không cần viết code: mọi thao tác là gõ lệnh `/setup`, `/scrape`, `/apply` và trò chuyện bằng tiếng Việt.

## Bắt đầu nhanh

### 1. Fork and clone

Dùng cho bản thân thì **clone, không cần fork**:

```bash
git clone https://github.com/nguyenvansuai/ai-job-search-vn.git
cd ai-job-search-vn
```

(Hoặc bấm **Code → Download ZIP** trên GitHub.)

Chỉ fork khi muốn đóng góp sửa đổi:

```bash
gh repo fork nguyenvansuai/ai-job-search-vn --clone
```

> [!IMPORTANT]
> **Fork trên GitHub luôn là public** - GitHub không cho fork private từ repo public -
> mà `/setup` (bước 3) ghi **personal data** của bạn (họ tên, liên hệ, kinh nghiệm, lương
> mong muốn) vào các file **được git theo dõi**. Chỉ cần không push lên fork là an toàn.
> Muốn lưu hồ sơ lên GitHub thì dùng **repo private** với repo này làm `upstream` -
> cách làm trong [SETUP.md section 8](SETUP.md#8-pulling-upstream-updates-into-your-fork).

### 2. Cài công cụ tìm việc

```bash
python3 tools/install_portal_clis.py   # Windows: python tools\install_portal_clis.py
```

Mọi CLI đi kèm đều không có dependency lúc chạy; lệnh này chỉ cài type TypeScript, có thể bỏ qua.

### 3. Tạo hồ sơ

```bash
claude
# Trong Claude Code:
/setup
```

`/setup` có 3 cách: đọc thư mục `documents/` (CV PDF, file LinkedIn, bằng cấp, thư giới thiệu), nhập 1 CV dán vào chat, hoặc phỏng vấn từng phần. Claude tự nhận biết bạn có gì và hỏi.

### 4. Tìm việc

```bash
/scrape
```

Tìm trên VietnamWorks, ITviec, TopCV, LinkedIn theo hồ sơ của bạn, bỏ tin trùng, sắp xếp theo mức phù hợp. Chọn một tin để `/apply`, hoặc chạy `/rank` để chấm điểm hàng loạt khi có nhiều tin.

### 5. Ứng tuyển

```bash
/apply https://www.vietnamworks.com/<ten-tin>-2121927-jv
```

Không lấy được link (một số trang chặn truy cập tự động) thì dán thẳng nội dung tin:

```bash
/apply <dán toàn bộ nội dung tin tuyển dụng>
```

Quy trình: chấm độ phù hợp → viết CV + thư xin việc (tiếng Việt nếu tin viết tiếng Việt) → agent thứ hai nghiên cứu công ty và phản biện → sửa → biên dịch PDF và kiểm tra (CV đúng 2 trang, thư đúng 1 trang, ATS đọc được) → đưa bản cuối kèm checklist.

Tin tuyển dụng được coi là dữ liệu không tin cậy: Claude không làm theo lệnh nào nằm trong tin, không mở link trong tin. Mọi nội dung trong CV đều đối chiếu với hồ sơ thật - **không bao giờ bịa kỹ năng hay kinh nghiệm**.

## Các lệnh khác

| Lệnh | Dùng để |
|------|---------|
| `/interview` | Chuẩn bị phỏng vấn cho một đơn đã nộp: câu hỏi dự kiến, câu trả lời STAR, phỏng vấn thử |
| `/outcome` | Ghi kết quả (mời phỏng vấn, offer, trượt, im lặng), lưu lại CV/thư đã gửi |
| `/rank` | Chấm điểm hàng loạt các tin vừa tìm được, trả về danh sách rút gọn |
| `/upskill` | Phân tích kỹ năng còn thiếu so với các tin bạn nhắm tới, kèm lộ trình học |
| `/expand` | Bổ sung hồ sơ từ GitHub, portfolio, Google Scholar bạn đã liệt kê |
| `/html-report` | Xuất dashboard HTML theo dõi quá trình ứng tuyển (mở offline) |
| `/gmail-sync` | Đọc Gmail để cập nhật trạng thái đơn (cần kết nối Gmail) |
| `/notion-sync` | Đồng bộ một chiều danh sách đơn sang Notion |
| `/add-portal` | Tạo skill tìm việc cho cổng khác (CareerViet, JobsGO, TopDev...) |
| `/add-template` | Dùng mẫu CV/thư xin việc riêng của bạn |
| `/reset` | Xoá hồ sơ hoặc tài liệu để làm lại từ đầu |

## Cổng tìm việc Việt Nam

| Cổng | Cách tích hợp | Phạm vi | Ghi chú |
|------|---------------|---------|---------|
| VietnamWorks | CLI `vietnamworks-search` (API JSON công khai của trang tìm kiếm) | Mọi ngành, 63 tỉnh thành | Có lương hiển thị, hạn nộp, mô tả đầy đủ |
| ITviec | CLI `itviec-search` (trang công khai + JSON-LD) | Chỉ IT, HCM / Hà Nội / Đà Nẵng | Lương ẩn sau đăng nhập. Không làm IT: tắt bằng `enabled: false` |
| TopCV | WebFetch (`.claude/skills/job-scraper/search-queries.md`) | Mọi ngành | TopCV chặn công cụ tự động; repo **không** vượt rào chặn, chỉ dùng WebFetch/WebSearch |
| LinkedIn | CLI `linkedin-search` | Toàn cầu | `-l "Ho Chi Minh City, Vietnam"` |

Thử trực tiếp:

```bash
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "kế toán" -l "Hà Nội" --jobage 14 --format table
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "python" -l hcm --format table
```

⚠️ **Chỉ dùng cá nhân.** Các CLI đọc dữ liệu công khai với số request thấp. Không dùng để thu thập hàng loạt hay mục đích thương mại.

## Cấu trúc thư mục

```
ai-job-search-vn/
├── CLAUDE.md                          # Hồ sơ ứng viên + quy tắc làm việc (có phần tiếng Việt)
├── .claude/
│   ├── commands/                      # /setup, /apply, /rank, /interview, ...
│   ├── skills/
│   │   ├── job-application-assistant/ # Skill chính: 01-...09 + 10-vietnam-market.md
│   │   ├── job-scraper/               # /scrape + search-queries.md (có TopCV)
│   │   └── upskill/
│   └── settings.json                  # Quyền Claude Code (giới hạn theo từng lệnh)
├── .agents/skills/
│   ├── vietnamworks-search/           # VietnamWorks (Việt Nam)
│   ├── itviec-search/                 # ITviec (IT, Việt Nam)
│   ├── linkedin-search/               # LinkedIn (toàn cầu)
│   └── freehire-search/               # freehire.me (tech, đa thị trường)
├── cv/
│   ├── main_example.tex               # Mẫu CV tiếng Anh (moderncv)
│   └── main_example_vi.tex            # Mẫu CV tiếng Việt
├── cover_letters/
│   ├── cover.cls / cover_example.tex        # Thư tiếng Anh (Lato/Raleway)
│   ├── cover_vi.cls / cover_example_vi.tex  # Thư tiếng Việt (Be Vietnam Pro)
│   └── OpenFonts/fonts/               # lato, raleway, bevietnampro
├── documents/                         # Tài liệu gốc cho /setup (CV, bằng cấp...) - không lên git
├── tools/                             # Script kiểm tra PDF, chống trùng tin, bảo mật...
├── SETUP.md                           # Hướng dẫn cài đặt chi tiết (tiếng Việt)
└── job_search_tracker.csv             # Bảng theo dõi đơn ứng tuyển - không lên git
```

## Mẹo để kết quả tốt

- **Hồ sơ càng chi tiết, CV càng sát.** Đừng chỉ liệt kê chức danh: mô tả dự án cụ thể, công cụ đã dùng, kết quả có con số. "Xây báo cáo doanh thu tự động bằng Power BI cho 50 cửa hàng" tốt hơn nhiều so với "thành thạo Power BI".
- **Kể cả điều bạn thích và không thích.** Lúc `/setup`, nói rõ việc gì làm bạn hứng thú, việc gì làm bạn mệt, điều kiện không chấp nhận (làm thứ Bảy, đi công tác nhiều, lương dưới X). Claude dùng các điều kiện này để lọc và chấm điểm.
- **Ghi rõ ngoại ngữ và điểm thi** (IELTS, TOEIC, JLPT): tin yêu cầu ngoại ngữ bạn không khai sẽ bị loại.
- **Kiểm tra trước khi gửi.** Claude soạn, bạn là người quyết định và bấm gửi.

## Làm lại từ đầu

```
/reset profile    # xoá dữ liệu hồ sơ, giữ quy tắc framework
/reset documents  # xoá file trong documents/
/reset all        # cả hai
```

`/reset` hiện rõ những gì sẽ bị xoá và yêu cầu gõ `RESET` để xác nhận.

## Về bản Việt Nam

<p>
  <img src="assets/suai/avatar.jpg" alt="Nguyễn Văn Sự - Sự AI" width="120" align="left" style="margin-right:16px">
  Bản Việt Nam được thực hiện bởi <b>Sự AI</b> (<a href="https://suai.vn">suai.vn</a>) - Nguyễn Văn Sự, kỹ sư phần mềm hơn 18 năm kinh nghiệm, chuyên đào tạo và ứng dụng AI thực tế cho doanh nghiệp và người đi làm Việt Nam.
  Đào tạo AI, xây ứng dụng và workflow tự động hoá cho doanh nghiệp, coaching 1-1: <a href="https://suai.vn">suai.vn</a>.
</p>
<br clear="left">

Góp ý, báo lỗi (ví dụ một cổng việc làm đổi giao diện): mở [Issue](https://github.com/nguyenvansuai/ai-job-search-vn/issues).

## Ghi công & giấy phép

- Bản gốc: [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) - Mads Lorentzen. Tài liệu kỹ thuật chi tiết của từng lệnh nằm trong `.claude/commands/` (tiếng Anh, giữ nguyên để có thể nhận cập nhật từ bản gốc).
- CLI tìm việc gốc: [Mikkel Krogsholm](https://github.com/mikkelkrogsholm) ([skills repo](https://github.com/mikkelkrogsholm/skills)).
- Font Be Vietnam Pro: The Be Vietnam Pro Project Authors, SIL Open Font License 1.1 (`cover_letters/OpenFonts/fonts/bevietnampro/OFL.txt`).
- Giấy phép: MIT (`LICENSE`).
