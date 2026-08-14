# 📜 SPEC-1.0: Hệ Thống Web Làm Trắc Nghiệm Từ File TXT (v2.1 Enhanced)

> **Status:** SPEC_CHALLENGED_AND_LOCKED | **Feature:** Configurable Timer, Saved Quizzes View, Answer Statistics & Question Error Reporting

---

# 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

## 1.1 User Stories

- **As a Student / Instructor**, I want to manually configure the quiz countdown duration (in minutes) on the main Upload page so that I can set exact time limits for tests regardless of question count.
- **As a Student**, I want to save any completed quiz attempt directly from the History detail modal into a dedicated "Bài Kiểm Tra Đã Lưu" page so that I can easily review and re-take saved quizzes for revision.
- **As a Student**, I want a dedicated 4th view "Bài Kiểm Tra Đã Lưu" in the main navigation bar to browse, re-take, or remove saved quizzes.
- **As a Student**, I want every question in the History detail view to display a mandatory explanation for the CORRECT answer regardless of whether my answer was right or wrong.
- **As a Student**, I want to view answer selection statistics (percentages for options A, B, C, D) for each question in the History detail modal so that I can gauge the question's difficulty level.
- **As a Student**, I want to submit error reports or feedback for specific questions (e.g. typos, incorrect content, bad options) directly from the History review view.

---

## 1.2 Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: User Registration and Authentication
```gherkin
Given a user is on the Authentication page
When they submit valid registration credentials (username, email, password, full name)
Then the system creates a new Student Account with encrypted credentials
And automatically logs the user in, redirecting to the Main Dashboard
```

### Scenario 2: Parsing TXT File into Quiz Question Bank & Error Diagnostics
```gherkin
Given an authenticated or guest user uploads or pastes a `.txt` file containing questions and options
When the system parses the TXT content (supporting "Đáp án: A", "ANSWER: A", or "Key: A")
Then it validates the format line-by-line and converts valid syntax into a Quiz Question Bank
And if syntax errors exist on specific lines, it displays precise line numbers with actionable fix guidance without crashing
```

### Scenario 3: Configurable Quiz Timer Duration on Main Page
```gherkin
Given a user is on the main "Quản Lý File TXT" page
When they select or input a custom timer duration in minutes (e.g. 5, 10, 15, 30, 45, 60 minutes)
Then the system uses this exact configured duration for the quiz countdown ticker instead of auto-computing fixed limits
```

### Scenario 4: Read-Only History Detail Review & Compulsory Explanations
```gherkin
Given a student is viewing their Quiz History list
When they click "Xem Chi Tiết" on any completed attempt record
Then a dedicated Read-Only Review modal pops up displaying questions, submitted answers, correct answers, and compulsory explanations for EVERY correct answer (auto-generated if missing in original TXT)
And all option selectors are strictly read-only so past answers cannot be modified
```

### Scenario 5: Saving Quiz Attempt for Revision & 4th Navigation View "Bài Kiểm Tra Đã Lưu"
```gherkin
Given a student opens the History detail modal for a completed test
When they click the "⭐ Lưu Bài Kiểm Tra" button at the bottom right of the modal
Then the quiz is saved into their personal Saved Quizzes index
And appears in the new 4th navbar view "Bài Kiểm Tra Đã Lưu", where the student can re-take the test anytime
```

### Scenario 6: View Answer Selection Statistics & Difficulty Gauge
```gherkin
Given a student is inspecting a completed test in the History Detail Modal
When they toggle or view "Xem Thống Kê Đáp Án" for a question
Then the system renders a percentage bar breakdown of candidates who chose options A, B, C, or D (e.g. A: 65%, B: 20%, C: 10%, D: 5%)
And displays a difficulty rating badge (Dễ / Trung Bình / Khó) based on correct selection ratio
```

### Scenario 7: Question Error Reporting & Feedback Submission
```gherkin
Given a student notices an error or typo in a question inside the History Detail Modal
When they click "🚩 Báo Cáo Lỗi / Góp Ý" under that question
Then a feedback dialog opens allowing them to select error type (Typo, Wrong Key, Bad Content, Other) and write details
And submitting saves the report log to LocalStorage and displays a success confirmation toast
```

---

# 📐 2. TECHNICAL ARCHITECTURE & NEGATIVE SPACE

## 2.1 API & Services Topology

```yaml
services:
  - name: authService
    description: Student authentication & session storage
  - name: txtParserService
    description: Multi-format TXT parser & explanation generator
  - name: quizEngineService
    description: Timed quiz engine & auto-grader
  - name: historyService
    description: History logging & attempt reader
  - name: savedService
    description: Persistent saved quiz manager (Save, Delete, Re-take)
  - name: feedbackService
    description: Question error reporting & feedback manager
```

---

## 2.2 ⛔ Negative Space Boundaries

1. **No External Server Database Dependency**: Client-side LocalStorage / SessionStorage mock persistence.
2. **No Unvalidated File Upload Crashes**: Syntax line error catching and diagnostics.
3. **No Direct Answer Leak in Client Inspection**: Answer key obfuscation during active test taking.
4. **No Unbounded Storage Overflow**: Max 100 entries limit for History, Saved Quizzes, and Feedback logs.
5. **No Mid-Quiz Silent Data Loss**: Browser tab refresh/unload guards.
6. **No Editable Inputs in History Review**: Strictly read-only attempt modal review.
7. **No Auto-Overriding User Timer Selection**: User timer duration setting on Upload page MUST override auto-generated timing.
8. **No Empty Feedback Submissions**: Feedback modal MUST require error category and description text before saving.

---

# 📝 3. WORK CHECKPOINT MATRIX

## Task 1: Core Layout & Styling Infrastructure
- [x] `[NEW]` [css/styles.css](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/styles.css): Core design system, glassmorphic layout, modal overlays, answer statistics bars & feedback dialog styles.
- [x] `[NEW]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html): SPA HTML shell with 4 navbar links, History detail modal stats toggle & Feedback modal overlay.

## Task 2: Services Subsystem (Data & Business Logic Layer)
- [x] `[NEW]` [js/services/authService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/authService.js): Student auth & LocalStorage session persistence.
- [x] `[NEW]` [js/services/txtParserService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/txtParserService.js): Multi-format TXT parser with automatic correct answer explanation generator.
- [x] `[NEW]` [js/services/quizEngineService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/quizEngineService.js): Configurable timer session manager & auto-grader.
- [x] `[NEW]` [js/services/historyService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/historyService.js): History logging & search query reader.
- [x] `[NEW]` [js/services/savedService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/savedService.js): Saved quiz manager (save, delete, list, re-take).
- [x] `[NEW]` [js/services/feedbackService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/feedbackService.js): Question error reporting & feedback persistence manager.

## Task 3: Dynamic UI Views Layer
- [x] `[NEW]` [js/views/authView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/authView.js): Auth forms controller.
- [x] `[NEW]` [js/views/uploadView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/uploadView.js): Drag&Drop TXT uploader with custom timer duration input.
- [x] `[NEW]` [js/views/quizView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/quizView.js): Interactive quiz interface with smooth submit navigation.
- [x] `[NEW]` [js/views/resultView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/resultView.js): Result scorecard & compulsory correct answer explanations.
- [x] `[NEW]` [js/views/historyView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/historyView.js): History review with Answer Statistics bars, difficulty gauge & "🚩 Báo Cáo Lỗi" modal trigger.
- [x] `[NEW]` [js/views/savedView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/savedView.js): 4th navbar view "Bài Kiểm Tra Đã Lưu" controller.
- [x] `[NEW]` [js/views/profileView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/profileView.js): Student profile controller.

## Task 4: SPA Application Entry & Integration
- [x] `[NEW]` [js/app.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/app.js): Bootstrap SPA router with 4th view route ('saved') & feedbackService integration.
