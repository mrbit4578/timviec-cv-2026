# Hướng dẫn cài đặt (Setup Guide)

Hướng dẫn từng bước để chạy bộ công cụ AI Job Search - bản Việt Nam.

## 1. Prerequisites

Cần cài sẵn trên máy (Windows, macOS hoặc Linux đều được, **không cần GPU**):

### Claude Code

Cài Claude Code (CLI của Anthropic). Cách dễ nhất cho người không quen dòng lệnh: cài app **Claude desktop** rồi dùng tab **Code**. Hoặc cài bản dòng lệnh:

```bash
npm install -g @anthropic-ai/claude-code
```

Cần gói Claude Pro/Max/Team hoặc API key (trả theo token). Xem [tài liệu Claude Code](https://docs.anthropic.com/en/docs/claude-code).

### Python

Cần Python 3.10 trở lên. Kiểm tra:

```bash
python3 --version
```

Trên Windows thường dùng `py --version` hoặc `python --version`. Nếu máy chỉ có lệnh `python` (không có `python3`), thay `python3` bằng `python` trong mọi lệnh bên dưới.

### Bun (cho công cụ tìm việc)

Các CLI tìm việc (`vietnamworks-search`, `itviec-search`, `linkedin-search`, `freehire-search`) viết bằng TypeScript và chạy bằng Bun.

- macOS/Linux:

```bash
curl -fsSL https://bun.sh/install | bash
```

- Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://bun.sh/install.ps1 | iex"
```

Hoặc trên Windows: `winget install Oven-sh.Bun`.

### LaTeX (để xuất CV và thư xin việc ra PDF)

- **Windows:** [MiKTeX](https://miktex.org/download)
- **macOS:** [MacTeX](https://tug.org/mactex/)
- **Linux:** `sudo apt install texlive-full` hoặc `sudo dnf install texlive-scheme-full`

CV biên dịch bằng `lualatex` (pdflatex hay lỗi `fontawesome5` trên MiKTeX mới). Thư xin việc biên dịch bằng `xelatex` vì `cover.cls` / `cover_vi.cls` cần `fontspec` để nạp font đi kèm.

**Tiếng Việt:** CV dùng font Latin Modern mặc định, đủ dấu tiếng Việt. Thư xin việc tiếng Việt **phải** dùng `cover_vi.cls` (font Be Vietnam Pro, đã kèm trong `cover_letters/OpenFonts/fonts/bevietnampro/`). `cover.cls` gốc dùng Lato/Raleway không có dấu tiếng Việt - chữ như "ạ, ấ, ơ, ư" sẽ bị mất.

#### Cài TeX tối giản: TinyTeX/BasicTeX

Bản TeX đầy đủ chạy được ngay; bản tối giản cần cài thêm vài gói.

macOS, cài TinyTeX cho riêng user (không cần `sudo`):

```bash
curl -fsSL https://yihui.org/tinytex/install-bin-unix.sh -o /tmp/tinytex-install-bin-unix.sh
sh /tmp/tinytex-install-bin-unix.sh /tmp --no-path
export PATH="$HOME/Library/TinyTeX/bin/universal-darwin:$PATH"
```

Lệnh `export` chỉ có tác dụng trong cửa sổ terminal hiện tại. Lưu vĩnh viễn:

```bash
echo 'export PATH="$HOME/Library/TinyTeX/bin/universal-darwin:$PATH"' >> ~/.zshrc
source ~/.zshrc
lualatex --version   # phải in ra phiên bản, không phải "command not found"
```

(Dùng bash thì ghi vào `~/.bash_profile`.)

Cài các gói mà template cần:

```bash
tlmgr install \
  moderncv fontawesome5 fontawesome6 academicons import luatexbase pgf \
  titlesec textpos xltxtra xunicode cite realscripts needspace
```

Thử biên dịch sau khi cài:

```bash
cd cv && lualatex -interaction=nonstopmode -halt-on-error main_example_vi.tex && cd ..
cd cover_letters && xelatex -interaction=nonstopmode -halt-on-error cover_example_vi.tex && cd ..
```

#### Windows: Basic MiKTeX

Bản MiKTeX đầy đủ chạy ngay. Bản **Basic MiKTeX** chỉ có ít gói và mặc định hiện cửa sổ hỏi mỗi khi cần cài gói mới - việc này làm treo Claude Code. Bật tự cài im lặng:

```powershell
initexmf --admin --set-config-value=[MPM]AutoInstall=1
initexmf --set-config-value=[MPM]AutoInstall=1
```

(Dòng đầu chạy trong PowerShell quyền Admin nếu cài MiKTeX cho mọi user; dòng hai cho cài đặt riêng user. Chạy cả hai cũng không sao.)

Hoặc cài sẵn các gói:

```powershell
mpm --admin --install=moderncv --install=fontawesome5 --install=fontawesome6 --install=academicons --install=import --install=luatexbase --install=pgf --install=titlesec --install=textpos --install=xltxtra --install=xunicode --install=cite --install=realscripts --install=needspace
```

Bỏ `--admin` nếu MiKTeX chỉ cài cho user hiện tại.

Thử biên dịch (PowerShell):

```powershell
Set-Location cv; lualatex -interaction=nonstopmode -halt-on-error main_example_vi.tex; Set-Location ..
Set-Location cover_letters; xelatex -interaction=nonstopmode -halt-on-error cover_example_vi.tex; Set-Location ..
```

### Tuỳ chọn: kiểm tra ATS (pypdf, rồi pdftotext)

`/apply` kiểm tra CV theo cách hệ thống lọc hồ sơ (ATS) đọc: trích lớp chữ của PDF, kiểm tra thông tin liên hệ, thứ tự đọc và độ phủ từ khoá.

Mặc định dùng **pypdf** (`pip install pypdf`). Poppler `pdftotext` là phương án dự phòng:

- **macOS:** `brew install poppler`
- **Debian/Ubuntu:** `sudo apt install poppler-utils`
- **Windows:** `choco install poppler`

Nếu không có cả hai, `/apply` bỏ qua bước kiểm tra tự động (có cảnh báo) và xem PDF bằng mắt - mọi thứ khác vẫn chạy bình thường.

## 2. Fork and clone

(Lấy mã nguồn về máy.) Chỉ để **dùng cho bản thân**, cách đơn giản và an toàn nhất là clone, không fork:

```bash
git clone https://github.com/nguyenvansuai/ai-job-search-vn.git
cd ai-job-search-vn
```

Hoặc tải file ZIP từ GitHub (nút **Code → Download ZIP**) rồi giải nén.

Chỉ fork khi muốn đóng góp sửa đổi ngược lại:

```bash
gh repo fork nguyenvansuai/ai-job-search-vn --clone
cd ai-job-search-vn
gh repo set-default <your-github-username>/ai-job-search-vn
```

> **Dòng `set-default` là bắt buộc khi fork.** `gh repo fork --clone` đặt repo gốc làm
> repo mặc định của gh, và gh dùng repo mặc định để **tạo issue và PR**. Thiếu dòng này,
> mọi lệnh `gh issue create` sau đó (do bạn hoặc do agent chạy) sẽ đăng lên trang issue
> **public** của repo gốc, dưới tên GitHub của bạn.

> **Lưu ý trước khi đi tiếp: fork luôn là public.** GitHub không cho đặt fork của repo
> public thành private, mà `/setup` (mục 4) ghi **personal data** (họ tên, liên hệ, kinh
> nghiệm, mức lương mong muốn) vào các file **được git theo dõi** - push lên fork là công
> khai những thông tin đó. Nếu chỉ dùng để tìm việc cho mình, hãy dùng **repo private**
> với repo này làm `upstream`: xem section 8, bước 1. Mọi hướng dẫn khác giữ nguyên.

## 3. Install job search CLI dependencies

(Cài thư viện cho các CLI tìm việc.) Chạy ở thư mục gốc của repo:

```bash
python3 tools/install_portal_clis.py   # Windows: python tools\install_portal_clis.py
```

Lệnh này chạy `bun install` trong mọi CLI ở `.agents/skills/*/cli/`. Tất cả CLI đi kèm đều **không có dependency lúc chạy**; `bun install` chỉ cài type TypeScript, nên bước này thực ra có thể bỏ qua.

Cổng việc làm đi kèm:

| Cổng | Cách dùng | Ghi chú |
|------|-----------|---------|
| VietnamWorks | CLI `vietnamworks-search` | Mọi ngành, mọi tỉnh thành |
| ITviec | CLI `itviec-search` | Chỉ việc IT. Không làm IT: đặt `enabled: false` trong `.agents/skills/itviec-search/SKILL.md` |
| TopCV | WebFetch (cấu hình trong `.claude/skills/job-scraper/search-queries.md`) | TopCV chặn công cụ tự động nên không có CLI |
| LinkedIn | CLI `linkedin-search` | Dùng `-l "Ho Chi Minh City, Vietnam"` |
| freehire.me | CLI `freehire-search` | Việc tech, remote quốc tế |

Muốn thêm cổng khác (CareerViet, JobsGO, TopDev...): chạy `/add-portal` trong Claude Code.

## 4. Run the setup interview

(Tạo hồ sơ.) Mở Claude Code trong thư mục repo:

```bash
claude
```

Rồi gõ:

```
/setup
```

Claude đưa ra 3 cách:

- **Cách A (thư mục documents):** bỏ CV, file LinkedIn xuất ra, bằng cấp, thư giới thiệu, đơn ứng tuyển cũ vào `documents/`. Claude đọc và đối chiếu trước khi đề xuất hồ sơ. Tốt nhất khi có nhiều tài liệu.
- **Cách B (nhập 1 CV):** đính kèm CV bằng `@ten-file` hoặc dán nội dung. Claude trích thông tin và hỏi thêm phần còn thiếu.
- **Cách C (phỏng vấn):** trả lời từng nhóm câu hỏi.

Cả ba cách đều cho ra bộ hồ sơ đầy đủ. Claude luôn trả lời bằng tiếng Việt; khi được hỏi "CV language", chọn tiếng Việt nếu bạn chủ yếu nộp cho công ty trong nước, tiếng Anh nếu nộp cho công ty nước ngoài/IT.

### What gets populated

| File | Nội dung |
|------|----------|
| `CLAUDE.md` | Hồ sơ ứng viên đầy đủ |
| `01-candidate-profile.md` | Học vấn, kinh nghiệm, kỹ năng (có cấu trúc) |
| `02-behavioral-profile.md` | Đánh giá tính cách, phong cách làm việc |
| `04-job-evaluation.md` | Kỹ năng trọng tâm và mục tiêu nghề nghiệp |
| `05-cv-templates.md` | Mẫu đoạn giới thiệu theo từng loại vị trí |
| `07-interview-prep.md` | Ví dụ STAR từ kinh nghiệm thật |
| `cv/main_example.tex` / `cv/main_example_vi.tex` | CV LaTeX với thông tin thật |
| `search-queries.md` | Từ khoá tìm việc cho `/scrape` |

### Re-running setup

Cập nhật từng phần sau này:

```
/setup --section skills
/setup --section experience
/setup --section search
```

`--section search` rất hữu ích khi mục tiêu thay đổi: chạy lại phần cấu hình tìm việc và gợi ý thêm vị trí có thể bạn chưa nghĩ tới.

## 5. Optional: Set up salary benchmarking

(Tuỳ chọn: so sánh lương.) Nếu có dữ liệu lương (báo cáo lương của TopCV/ITviec/Navigos, khảo sát, tự tổng hợp):

1. **Cách A:** tự tạo `salary_data.json` ở thư mục gốc (định dạng xem `tools/README_SALARY_TOOL.md`)
2. **Cách B:** chuyển từ Excel:
   ```bash
   pip install openpyxl
   python3 tools/convert_salary_excel.py duong-dan/luong.xlsx --source "Bao cao luong 2026"
   ```

Không có dữ liệu thì bước so sánh lương được bỏ qua. Lưu ý lương ở Việt Nam thường là **gross theo tháng, VND**.

## 6. Test the workflow

(Chạy thử.) Tìm một tin tuyển dụng bạn quan tâm, rồi:

```
/apply https://www.vietnamworks.com/<ten-tin>-1234567-jv
```

Hoặc dán thẳng nội dung tin (ví dụ tin TopCV):

```
/apply [dán nội dung tin tuyển dụng]
```

Claude sẽ:
1. Đánh giá mức độ phù hợp với hồ sơ của bạn
2. Hỏi bạn có muốn làm tiếp không
3. Viết CV và thư xin việc riêng cho tin đó (tiếng Việt nếu tin viết tiếng Việt)
4. Cho một agent khác phản biện bản nháp
5. Sửa lại và đưa ra bản cuối

## 7. Compile your documents

(Xuất PDF.) Sau khi `/apply` tạo file LaTeX (thường Claude tự biên dịch luôn):

```bash
# Bash / zsh / Git Bash
cd cv && lualatex main_<company>_<role>.tex && cd ..
cd cover_letters && xelatex cover_<company>_<role>.tex && cd ..
```

```powershell
# PowerShell
Set-Location cv; lualatex main_<company>_<role>.tex; Set-Location ..
Set-Location cover_letters; xelatex cover_<company>_<role>.tex; Set-Location ..
```

Muốn dùng mẫu CV riêng (LaTeX, Typst...): chạy `/add-template`.

## 8. Pulling upstream updates into your fork

(Cập nhật phiên bản mới.) Repo này sẽ tiếp tục được cập nhật, nên chuẩn bị từ đầu:

**Ưu tiên bản release thay vì `master`.** Các [release](../../releases) là mốc đã kiểm tra. Lấy tag bằng `git fetch upstream --tags` rồi merge tag đó.

1. **Commit phần cá nhân hoá - nhưng biết commit đi đâu.** `/setup` sửa trực tiếp CLAUDE.md và các file hồ sơ; commit chúng thì cập nhật mới merge gọn. Nhưng **fork của repo public cũng là public**, nên đừng push hồ sơ lên fork. Muốn có bản trên GitHub: tạo **repo private**, push lên đó, rồi thêm repo này làm `upstream`:
   ```bash
   git remote rename origin upstream          # nếu đã clone từ repo này
   git remote add origin https://github.com/<your-github-username>/<repo-private>.git
   git push -u origin master
   ```
   Chỉ commit ở máy, không push, cũng được. Các file thật sự nhạy cảm (tracker, dữ liệu lương, `documents/`, hồ sơ đã nộp) đã nằm trong `.gitignore`.
2. **Xem trước thay đổi:**
   ```bash
   git fetch upstream
   python3 tools/check_upstream_updates.py
   ```
   Lệnh này so `framework_version` trong các file phương pháp của bạn với bản mới và liệt kê đúng file nào đã đổi, kèm lệnh xem diff.
3. **Merge bình thường.** `git merge upstream/master` - phần lớn cập nhật không đụng vào dòng `/setup` đã điền nên merge gọn. Gặp conflict ở file đã cá nhân hoá: giữ dữ liệu của bạn, nhận phần phương pháp mới xung quanh.

Bản Việt Nam này dựa trên [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search); người duy trì bản VN theo dõi repo gốc qua `tools/upstream_triage.py` và workflow `upstream-watch.yml`.

## Troubleshooting

### "salary_data.json not found"
Bình thường nếu chưa cài so sánh lương. `/apply` tự bỏ qua bước này.

### CLI tìm việc không chạy
Kiểm tra đã cài Bun (`bun --version`). CLI cần mạng để lấy tin. Thử trực tiếp:
```bash
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "kế toán" -l "Hà Nội" --format table
```
Nếu một cổng đổi giao diện/API, xem `url-reference.md` trong thư mục skill đó; `/scrape health` kiểm tra nhanh tình trạng từng cổng.

### Lỗi biên dịch LaTeX
- CV: dùng `lualatex`
- Thư xin việc: dùng `xelatex`
- Bản LaTeX cần có gói `moderncv`

### Thư xin việc tiếng Việt bị mất dấu
Đang dùng `\documentclass{cover}`. Đổi thành `\documentclass{cover_vi}` và đổi font trong khối gạch đầu dòng sang `BeVietnamPro-Regular` (xem `cover_letters/cover_example_vi.tex`).

### Không tìm thấy font trong thư xin việc
Template cần font trong `cover_letters/OpenFonts/fonts/` (Lato, Raleway, Be Vietnam Pro). Kiểm tra thư mục này còn đủ file.

### File `.claude/settings.local.json` cũ
Quyền dùng chung của Claude Code nằm trong `.claude/settings.json` (danh sách lệnh được phép, lệnh luôn hỏi trước, lệnh bị cấm - xem `SECURITY.md`). Nếu có file `.claude/settings.local.json` cũ cấp quyền rộng hơn, xoá nó:

```bash
rm .claude/settings.local.json
```
