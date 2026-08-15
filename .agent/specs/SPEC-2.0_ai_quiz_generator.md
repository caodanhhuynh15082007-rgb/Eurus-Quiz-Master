# 📜 SPEC-2.0: AI Quiz Generator via Google AI Studio API Key & Custom AI Duration Control

> **Status:** SPEC_PLANNED | **Feature:** AI Quiz Generation with Custom Timer Controls (Gemini Flash API)

---

# 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

## 1.1 User Stories

- **As a Student / Educator**, I want to enter and securely save my Google AI Studio API Key in the application settings so that I can generate automated quiz question banks on any custom topic directly within the web app.
- **As a User**, I want an AI Quiz Generation panel on the main page where I can specify the topic (e.g. "Python Fundamentals", "World War II History", "TOEIC Grammar"), number of questions (5-20), difficulty level, language, AND custom quiz duration timer controls.
- **As a User**, I want to freely adjust the quiz duration (number value + unit: Seconds/Minutes/Hours) directly inside the AI Generator Card, exactly identical to the timer controls in the raw TXT file section.
- **As a User**, I want the AI to generate a complete quiz in standard TXT format with rich educational explanations (`Lời giải: ...`) and start the quiz with my specified duration time.

---

## 1.2 Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Google AI Studio API Key Configuration & Validation
```gherkin
Given a user is on the main Upload page or Settings panel
When they input their Google AI Studio API Key (e.g., "AIzaSy...") and click "🧪 Kiểm Tra API Key"
Then the system sends a lightweight test ping to the Google Gemini API REST endpoint (`gemini-1.5-flash` / `gemini-2.0-flash`)
And if valid, saves the key securely in LocalStorage (`eurus_ai_studio_api_key`) and displays a "API Key Hợp Lệ" green badge
```

### Scenario 2: Generating AI Quiz Question Bank by Custom Topic
```gherkin
Given a user has configured a valid Google AI Studio API Key
When they enter a custom Topic (e.g., "Kiến thức Lập Trình React.js"), select Question Count (10), Difficulty ("Trung Bình"), and Language ("Tiếng Việt")
And click "✨ Tạo Đề Thi Bằng AI Studio"
Then the system constructs a structured prompt ordering Gemini to return a valid TXT quiz bank
And streams/fetches the response, parsing it directly into the TXT editor with a success toast notification
```

### Scenario 3: AI Output Sanitization & Direct Quiz Taker Hydration
```gherkin
Given Gemini AI returns the generated quiz content (potentially wrapped in Markdown code fences ````txt ... ````)
When `aiService` automatically strips Markdown code fences and parses the TXT response through `txtParserService`
Then it validates that every question includes question text, 4 options (A-D), an answer key (`Đáp án: X`), and a detailed textual explanation (`Lời giải: ...`)
And populates the TXT textarea preview and enables the "🚀 Bắt Đầu Làm Bài Trắc Nghiệm" button instantly
```

### Scenario 4: Error Handling & API Quota Exceeded Guard
```gherkin
Given a user attempts AI Quiz Generation with an invalid API Key, exhausted quota, or lost internet connection
When the Gemini API returns an HTTP 400, 401, 429, or 500 error code
Then the system catches the exception without freezing the UI
And displays an actionable, human-readable error toast (e.g., "API Key không hợp lệ hoặc đã vượt quá hạn ngạch (quota) của Google AI Studio!")
```

### Scenario 5: Custom Quiz Duration Timer Control Inside AI Generator Card
```gherkin
Given a user is inside the AI Studio Quiz Generator Card (`#ai-generator-card`)
When they adjust the duration number field (`#ai-duration-value`) or unit dropdown (`#ai-duration-unit`: Giây / Phút / Giờ)
Then the system updates the quiz duration configuration
And syncs seamlessly with the main TXT timer controls so the quiz session timer reflects the user's exact duration setting
```

---

# 📐 2. TECHNICAL ARCHITECTURE & NEGATIVE SPACE

## 2.1 API & Services Topology

```yaml
services:
  - name: aiService
    description: Direct Google Gemini REST API client (`gemini-1.5-flash` / `gemini-2.0-flash`)
    methods:
      - validateApiKey(apiKey): Promise<{ valid: boolean, error?: string }>
      - generateQuizContent({ apiKey, topic, count, difficulty, language }): Promise<string>
  - name: uploadView
    description: Extended with AI Generator Card, API Key Configurator modal, and bi-directional AI duration timer sync
```

---

## 2.2 ⛔ Negative Space Boundaries

1. **No Backend Proxy Dependency**: The app MUST communicate directly with Google AI Studio Gemini API (`generativelanguage.googleapis.com`) using client-side `fetch()` without requiring a backend Node.js/Python proxy server.
2. **No Plaintext API Key Exposure**: The API key input MUST use password obfuscation (`type="password"` with show/hide toggle), stored in browser `LocalStorage`, and NEVER sent to any third-party server other than official `googleapis.com`.
3. **No UI Freezing or Silent Failures**: AI generation MUST run asynchronously with a clear loading spinner/progress animation and a 30-second `AbortController` timeout safety guard.
4. **No Unsanitized Markdown Block Leak**: AI responses wrapped in Markdown block fences (` ```txt ... ``` `) MUST be automatically stripped before TXT parsing.

---

# 📝 3. WORK CHECKPOINT MATRIX

## Task 1: Core AI Service Component
- [x] `[NEW]` [js/services/aiService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/aiService.js): Google Gemini REST API client with API Key validation, model endpoint fallback (`gemini-1.5-flash` / `gemini-2.0-flash`), prompt builder, Markdown code fence stripper, and 30s AbortController guard.

## Task 2: UI Layout & Styling Enhancements
- [x] `[MODIFY]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html): Add `#ai-config-modal` overlay with password input `#ai-api-key-input`, toggle visibility button, API test ping button, and AI Generator Card `#ai-generator-card` on the Upload page.
- [x] `[MODIFY]` [css/styles.css](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/styles.css): Add styles for AI Generator Card, glowing gradient border `.ai-generator-card`, glowing action button `.btn-ai-glow`, and status badges.
- [ ] `[MODIFY]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html): Add numerical duration input `#ai-duration-value` and unit dropdown `#ai-duration-unit` (Giây / Phút / Giờ) directly inside `#ai-generator-card`.

## Task 3: Dynamic Views & Router Integration
- [x] `[MODIFY]` [js/views/uploadView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/uploadView.js): Bind AI Config modal listeners, API Key test ping controller, AI Quiz generation click handler with live spinner status, and auto-hydration into TXT editor.
- [x] `[MODIFY]` [js/app.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/app.js): Register `window.aiService` into SPA application registry.
- [ ] `[MODIFY]` [js/views/uploadView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/uploadView.js): Add bi-directional sync listeners between `#ai-duration-value` / `#ai-duration-unit` and `#quiz-duration-value` / `#quiz-duration-unit`.
