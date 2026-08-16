# SPEC-4.0: PDF & Excel Report Export features for Quiz Results

This specification contract defines the functional requirements for exporting quiz results and histories to PDF and Excel formats using client-side JavaScript.

---

## 1. User Stories & Gherkin Scenarios

### Scenario 1: Exporting Single Attempt details to PDF
* **Given** the student or admin is viewing a completed quiz attempt result (either on the Result page or inside the History detail modal).
* **When** they click the **"📄 Xuất Báo Cáo PDF"** button.
* **Then** the browser downloads a professionally styled PDF report containing:
  - Header: Eurus Quiz Master logo/title, "BÁO CÁO KẾT QUẢ THI".
  - Student metadata: Fullname, Email, Date/Time, Score (Percentage & raw count), and Time Spent.
  - Question details table: Number, Question Content, Student's Selected Answer, Correct Answer, Result (Correct/Incorrect icon/badge), and Explanation text.

### Scenario 2: Exporting Quiz Attempt History to Excel (XLSX/CSV)
* **Given** the user is viewing the Quiz History list.
* **When** they click the **"📊 Xuất Lịch Sử Excel"** button.
* **Then** the browser downloads a `.xlsx` spreadsheet containing a clean table with columns:
  - `Mã học viên (User ID)`
  - `Họ và tên (Fullname)`
  - `Email`
  - `Tên bài kiểm tra (Quiz Title)`
  - `Số câu đúng (Correct Answers)`
  - `Tổng số câu (Total Questions)`
  - `Điểm số (%) (Score %)`
  - `Thời gian làm bài (Time Spent)`
  - `Thời điểm nộp bài (Submitted At)`

---

## 2. Technical Architecture & Constraints (Flat YAML)

```yaml
libraries:
  pdf_generation: "jspdf (v2.5.1) + jspdf-autotable (v3.8.2) via CDN"
  excel_generation: "xlsx (SheetJS v0.18.5) via CDN"
ui_integration:
  result_view:
    - button: "📄 Xuất PDF Chi Tiết" (class="btn btn-secondary")
    - button: "📊 Xuất Excel Chi Tiết" (class="btn btn-secondary")
  history_view:
    - button: "📄 Xuất PDF Lịch Sử" (class="btn btn-secondary")
    - button: "📊 Xuất Excel Lịch Sử" (class="btn btn-secondary")
  history_modal:
    - button: "📄 Xuất PDF Chi Tiết" (class="btn btn-secondary")
encoding:
  excel: "UTF-8 byte-order mark (BOM) compliance for Vietnamese character support"
  pdf: "Unicode font embedding support (Roboto/Noto Sans via jspdf) to avoid Vietnamese text corruption (dấu tiếng Việt bị lỗi font)"
```

---

## 3. Negative Space Bounds (Boundary Constraints)
1. **No Backend Dependency:** Export generation MUST run entirely client-side in the browser. Zero server-side API dependencies or external export API services.
2. **Vietnamese Font Crash Prevention:** Exported PDFs MUST NOT contain garbled text or corrupted Vietnamese letters (e.g. `Đ`, `ư`, `ơ`, `ạ`, `ỹ`). Must embed standard Vietnamese-compatible fonts or fall back safely.
3. **Large Dataset Protection:** History Excel exports with more than 100 entries must not crash the main thread; must process without blocking UI.
