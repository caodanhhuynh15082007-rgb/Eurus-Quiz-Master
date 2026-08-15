# 📜 SPEC-2.0: AI Quiz Generator via Google AI Studio API Key & Dynamic Model Auto-Sync

> **Status:** SPEC_CHALLENGED_AND_LOCKED | **Feature:** Dynamic Discovery for Quiz Generation & Auto-Purging Deprecated Endpoints

---

# 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

## 1.1 User Stories

- **As a User**, when I click "✨ Tạo Đề Thi Bằng AI Studio", the system must dynamically use the active model discovered during validation or dynamically call `discoverAvailableModels()` on-the-fly to query valid generation models from Google AI Studio.
- **As a User**, I want all deprecated/legacy models (like `gemini-1.0-pro` which Google has sunsetted from v1beta `generateContent`) to be removed, and if an individual candidate model returns 404, the generator loop must seamlessly continue trying other available models without throwing an uncaught 404 error.

---

## 1.2 Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: On-the-fly Dynamic Model Discovery in `generateQuizContent`
```gherkin
Given a user clicks "✨ Tạo Đề Thi Bằng AI Studio"
When `generateQuizContent()` executes
Then it first retrieves discovered models from `discoverAvailableModels()`
And queries only live models supporting `generateContent` (e.g., `gemini-2.0-flash`, `gemini-1.5-flash-latest`, `gemini-1.5-flash`, `gemini-1.5-pro`)
And produces the complete TXT quiz output with 100% explanations
```

### Scenario 2: Deprecated Model Elimination & 404 Model Skipping
```gherkin
Given Google AI Studio returns 404 for any deprecated or regional model
When the generator loop encounters HTTP 404
Then it ignores the 404 and continues immediately to the next live candidate model
And successfully parses and returns the response from the first working model
```

---

# 📐 2. TECHNICAL ARCHITECTURE & NEGATIVE SPACE

## 2.1 API & Services Topology

```yaml
services:
  - name: aiService
    methods:
      - discoverAvailableModels(apiKey): Promise<string[]>
      - generateQuizContent({ apiKey, topic, count, difficulty, language }): Promise<string> (uses discovered models first)
```

---

## 2.2 ⛔ Negative Space Boundaries

1. **No Deprecated Model Calls**: Never attempt deprecated `gemini-1.0-pro` endpoints.
2. **No False Termination on 404**: A 404 from a single candidate model must never terminate the loop before trying all other valid models.

---

# 📝 3. WORK CHECKPOINT MATRIX

## Task 1: Auto-Purge Deprecated Models & Enforce Dynamic Discovery in Generator
- [ ] `[MODIFY]` [js/services/aiService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/aiService.js): Purge `gemini-1.0-pro`, fetch `discoverAvailableModels()` inside `generateQuizContent()`, and ensure seamless multi-model fallback.
