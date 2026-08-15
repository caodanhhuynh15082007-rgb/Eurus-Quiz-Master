# 📜 SPEC-2.0: AI Quiz Generator via Google AI Studio API Key

> **Status:** SPEC_DRAFTED | **Feature:** AI Quiz Generation with Google AI Studio (Gemini Flash API)

---

# 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

## 1.1 User Stories

- **As a Student / Educator**, I want to enter and securely save my Google AI Studio API Key in the application settings so that I can generate automated quiz question banks on any custom topic directly within the web app.
- **As a User**, I want an AI Quiz Generation panel on the main page where I can specify the topic (e.g. "Python Fundamentals", "World War II History", "TOEIC Grammar"), number of questions (5-20), difficulty level, and language.
- **As a User**, I want the AI to generate a complete quiz in the standard TXT format with 4 options (A-D), correct answer key (`Đáp án: X`), and rich educational explanations (`Lời giải: ...`) for every single question.
- **As a User**, I want the generated AI quiz to automatically load into the TXT editor and Quiz Taker Engine with one click so I can test my knowledge immediately.

---

## 1.2 Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Google AI Studio API Key Configuration & Validation
```gherkin
Given a user is on the main Upload page or Settings panel
When they input their Google AI Studio API Key (e.g., "AIzaSy...") and click "🧪 Kiểm Tra API Key"
Then the system sends a lightweight test ping to the Google Gemini API REST endpoint (`gemini-1.5-flash` or `gemini-2.0-flash`)
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

### Scenario 3: AI Output Parsing & Direct Quiz Taker Hydration
```gherkin
Given Gemini AI returns the generated quiz content in TXT format
When the system parses the AI response through `txtParserService`
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

---

# 📐 2. TECHNICAL ARCHITECTURE & NEGATIVE SPACE

## 2.1 API & Services Topology

```yaml
services:
  - name: aiService
    description: Direct Google Gemini REST API client (`gemini-1.5-flash` / `gemini-2.0-flash`)
    methods:
      - validateApiKey(apiKey): Promise<boolean>
      - generateQuizContent({ apiKey, topic, count, difficulty, language }): Promise<string>
  - name: uploadView
    description: Extended with AI Generator Card, API Key Configurator modal/drawer, and generation status indicator
```

---

## 2.2 ⛔ Negative Space Boundaries

1. **No Backend Proxy Dependency**: The app MUST communicate directly with Google AI Studio Gemini API (`generativelanguage.googleapis.com`) using client-side `fetch()` without requiring a backend Node.js/Python proxy server.
2. **No Plaintext API Key Exposure**: The API key input MUST use password obfuscation (`type="password"` with show/hide toggle), stored in browser `LocalStorage`, and NEVER sent to any third-party server other than official `googleapis.com`.
3. **No UI Freezing or Silent Failures**: AI generation MUST run asynchronously with a clear loading spinner/progress animation and a 30-second abort timeout safety guard.
