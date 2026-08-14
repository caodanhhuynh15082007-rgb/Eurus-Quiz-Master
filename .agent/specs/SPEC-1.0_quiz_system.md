# 📜 SPEC-1.0: Hệ Thống Web Làm Trắc Nghiệm Từ File TXT

> **Status:** SPEC_CHALLENGED_AND_LOCKED | **Feature:** Web Quiz System with TXT File Parser, Auth, Student Management, Automatic Grading, Read-Only History Review

---

# 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

## 1.1 User Stories

- **As a Student / User**, I want to register and log in to the web application so that I can maintain my personal profile and save my quiz history.
- **As an Instructor / Student**, I want to upload or paste a `.txt` file containing quiz questions so that the system automatically parses and generates interactive multiple-choice tests.
- **As a Student**, I want to take a timed multiple-choice quiz with immediate auto-grading and score evaluation so that I can test my knowledge efficiently.
- **As a Student**, I want to review my quiz history and inspect detailed past attempts in read-only mode (no editing allowed) so that I can track my learning progress without accidental data tampering.

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

### Scenario 3: Taking Quiz, Timer Expiry & Automatic Grading
```gherkin
Given a student starts a quiz session generated from a question bank with a configurable timer
When the student selects answers or the timer reaches 00:00
Then the system automatically freezes inputs, evaluates all answered and skipped questions
And computes percentage score, correct/wrong/skipped counts, time spent, and detailed answer explanation breakdown
```

### Scenario 4: Quiz History & Read-Only Attempt Review (No Modification Allowed)
```gherkin
Given a student is viewing their Quiz History list
When they click "Xem Chi Tiết" on any completed attempt record
Then a dedicated Read-Only Review interface pops up displaying full questions, user's submitted answers, correct answers, and explanations
And all option selectors and inputs are strictly read-only and disabled so the student cannot edit or alter past answers
```

### Scenario 5: Page Refresh Resilience Mid-Quiz
```gherkin
Given a student is actively taking a timed quiz
When the student accidentally reloads or refreshes the browser tab
Then the system intercepts with a warning dialog or restores current quiz progress and remaining time seamlessly
```

---

# 📐 2. TECHNICAL ARCHITECTURE & NEGATIVE SPACE

## 2.1 API Flat YAML Schema

```yaml
endpoints:
  - path: /api/auth/register
    method: POST
    description: Register a new student account
    request:
      username: string
      email: string
      password: string
      fullname: string
    response:
      success: boolean
      user: { id: string, username: string, email: string, fullname: string }
      token: string
    errors:
      409: "Username or Email already registered"

  - path: /api/auth/login
    method: POST
    description: Authenticate student credentials
    request:
      username: string
      password: string
    response:
      success: boolean
      user: { id: string, username: string, email: string, fullname: string }
      token: string
    errors:
      401: "Invalid username or password"

  - path: /api/profile
    method: PUT
    description: Update student profile details
    request:
      fullname: string
      email: string
      avatar: string
    response:
      success: boolean
      user: { id: string, username: string, email: string, fullname: string }

  - path: /api/quiz/parse-txt
    method: POST
    description: Parse raw TXT file string or upload into structured quiz payload
    request:
      fileContent: string
      title: string
    response:
      success: boolean
      quizId: string
      title: string
      questionCount: number
      questions:
        - id: string
          questionText: string
          options: list[string]
          correctAnswerIndex: number
          explanation: string
      parseErrors:
        - line: number
          message: string

  - path: /api/quiz/submit
    method: POST
    description: Grade submitted answers and persist attempt result
    request:
      quizId: string
      quizTitle: string
      userAnswers: map[string, number] # questionId -> optionIndex (-1 for skipped)
      timeSpentSeconds: number
    response:
      attemptId: string
      scorePercentage: number
      totalQuestions: number
      correctCount: number
      wrongCount: number
      skippedCount: number
      details:
        - questionId: string
          userAnswer: number
          correctAnswer: number
          isCorrect: boolean
          explanation: string

  - path: /api/history
    method: GET
    description: Retrieve user quiz attempt history logs with optional search query
    request:
      searchQuery: string
      limit: number
    response:
      attempts:
        - attemptId: string
          quizTitle: string
          date: string
          scorePercentage: number
          correctCount: number
          totalQuestions: number
          timeSpentSeconds: number
```

---

## 2.2 ⛔ Negative Space Boundaries

1. **No External Server Database Dependency**: The initial build MUST be zero-config client-side / local storage backed with smooth mock persistence (LocalStorage / SessionStorage) so it can run immediately without requiring manual server or DB setup.
2. **No Unvalidated File Upload Crashes**: The TXT parser MUST NOT crash or freeze on invalid/malformed text files; it MUST gracefully catch line syntax errors, show line numbers, and allow partial parsing if valid questions exist.
3. **No Direct Answer Leak in Client Inspection**: Answer key indexes in active test mode MUST NOT be rendered directly into public DOM dataset attributes before submission to prevent simple developer-console cheating.
4. **No Unbounded Storage Overflow**: Quiz history entries MUST store compact JSON payloads and trim records beyond 100 historical attempts to avoid exceeding browser LocalStorage quota limits.
5. **No Mid-Quiz Silent Data Loss**: Browser refresh or navigation events during an active quiz MUST be guarded by a browser warning or restored from transient session state.
6. **No Editable Inputs in History Review**: History attempt review MUST be strictly read-only; users cannot modify submitted answers, re-grade completed attempts, or tamper with saved history records.

---

# 📝 3. WORK CHECKPOINT MATRIX

## Task 1: Core Layout & Styling Infrastructure
- [x] `[NEW]` [css/styles.css](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/styles.css): Implement core design system (dark glassmorphism palette, Google Fonts Inter/Outfit, responsive layout, dynamic badges, countdown ring, card hover effects, toasts).
- [x] `[NEW]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html): Construct SPA HTML shell with navbar header, sidebar, dynamic view containers (Auth, Upload, Quiz, Result, History, Profile), modal overlays, and toast containers.

## Task 2: Services Subsystem (Business Logic & Data Layer)
- [x] `[NEW]` [js/services/authService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/authService.js): Implement student registration, login, mock hash validation, profile updates, and LocalStorage auth session persistence.
- [x] `[NEW]` [js/services/txtParserService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/txtParserService.js): Implement robust TXT file parser supporting multi-format answer keys (`Đáp án: A`, `ANSWER: A`, `Key: A`), line-by-line validation, error diagnostic logging, and question bank generator.
- [x] `[NEW]` [js/services/quizEngineService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/quizEngineService.js): Implement quiz session state manager, countdown timer ticker, answer recorder, automatic grading engine, percentage score calculation, and transient session caching.
- [x] `[NEW]` [js/services/historyService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/historyService.js): Implement quiz attempt persistence, history list retrieval with search filter, detailed attempt review reader, and LocalStorage quota auto-trim (max 100 entries).

## Task 3: Dynamic UI Views Layer
- [x] `[NEW]` [js/views/authView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/authView.js): Implement login & registration forms controller, input validation feedback, and avatar selection.
- [x] `[NEW]` [js/views/uploadView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/uploadView.js): Implement drag-and-drop TXT file uploader, raw text paste editor, live syntax check report view, sample file loader, and quiz preview list.
- [x] `[NEW]` [js/views/quizView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/quizView.js): Implement interactive quiz taking interface with question navigator grid, timer ring countdown, option select cards, auto-submit modal, and page unload guard.
- [x] `[NEW]` [js/views/resultView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/resultView.js): Implement quiz result scorecard, score percentage gauge, stats breakdown (correct/wrong/skipped), detailed question-by-question review with explanations.
- [x] `[NEW]` [js/views/historyView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/historyView.js): Implement attempt history table/card list, search filter input, score indicators, and attempt detail review modal viewer.
- [x] `[NEW]` [js/views/profileView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/profileView.js): Implement student profile view, profile edit form handler, and aggregate statistics overview.

## Task 4: SPA Application Entry & Integration
- [x] `[NEW]` [js/app.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/app.js): Bootstrap SPA router, state manager, global view switcher navigation listeners, sample TXT pre-loader, and toast notification system.
