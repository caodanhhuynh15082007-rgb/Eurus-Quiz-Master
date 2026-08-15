# 📜 SPEC-2.0: AI Quiz Generator via Google AI Studio API Key & Universal Key Acceptance

> **Status:** SPEC_CHALLENGED_AND_LOCKED | **Feature:** Universal Google AI Studio API Key Acceptance & Multi-Endpoint Resilience

---

# 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

## 1.1 User Stories

- **As a Student / Educator**, I want ALL valid API Keys created from Google AI Studio (regardless of project tier, region, legacy vs new API versions) to be 100% accepted and verified in Eurus Quiz Master without any model-not-found false rejections.
- **As a User**, I want the API Key verification and AI Quiz generation system to automatically probe the official Model Catalog endpoint (`https://generativelanguage.googleapis.com/v1beta/models?key=KEY`) and dynamically pick any available generative model authorized for my key.
- **As a User**, I want robust error handling that translates complex Google Cloud / AI Studio errors into clear, friendly Vietnamese instructions (e.g. Quota, Network, Invalid Key).

---

## 1.2 Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Universal API Key Validation via Model Catalog Discovery
```gherkin
Given a user enters ANY valid API key created on Google AI Studio
When they click "🧪 Kiểm Tra API Key"
Then the system first requests `GET /v1beta/models?key=KEY` to discover all models authorized for that key
And automatically sets the active model dynamically from the available models list
And saves the key in LocalStorage, displaying a "✔ API Key Hợp Lệ!" green badge
```

### Scenario 2: Direct Model Fallback Matrix if Model Catalog is Blocked
```gherkin
Given the Model Catalog endpoint is restricted or times out
When the system validates or generates content
Then it falls back through a comprehensive prioritized matrix of 10+ Gemini models (e.g. `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash-latest`, `gemini-1.5-pro`, `gemini-1.0-pro`...)
And succeeds if ANY model responds positively
```

### Scenario 3: Friendly Error Translation & Clean Input Trimming
```gherkin
Given a user accidentally copies an API Key with leading/trailing spaces, newlines, or quotes
When the key is processed
Then `aiService` automatically sanitizes and trims all whitespace and non-printable characters
And if the key is genuinely invalid (HTTP 400 API_KEY_INVALID), displays "API Key không hợp lệ! Vui lòng kiểm tra lại chìa khóa từ aistudio.google.com"
```

---

# 📐 2. TECHNICAL ARCHITECTURE & NEGATIVE SPACE

## 2.1 API & Services Topology

```yaml
services:
  - name: aiService
    description: Universal Google AI Studio API Client with Dynamic Model Discovery & Resilient Fallback Matrix
    methods:
      - sanitizeApiKey(key): string
      - discoverModels(apiKey): Promise<string[]>
      - validateApiKey(apiKey): Promise<{ valid: boolean, error?: string, activeModel?: string }>
      - generateQuizContent({ apiKey, topic, count, difficulty, language }): Promise<string>
  - name: uploadView
    description: Enhanced with clear error feedback, model badge, and universal key acceptance
```

---

## 2.2 ⛔ Negative Space Boundaries

1. **No Hardcoded Single-Model Dependency**: The system MUST NOT rely on a single hardcoded model endpoint that can break when Google updates model names.
2. **No False-Negative Validation**: A valid API Key MUST NOT be reported as invalid simply because one model endpoint returned 404.
3. **No Unsanitized API Keys**: Leading/trailing spaces, quotes, or accidental formatting MUST be automatically cleaned before network dispatch.

---

# 📝 3. WORK CHECKPOINT MATRIX

## Task 1: Universal AI Service Upgrade
- [x] `[MODIFY]` [js/services/aiService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/aiService.js): Implement `sanitizeApiKey()`, Dynamic Model Discovery via `GET /models`, Expanded 10+ Model Fallback Matrix, and Vietnamese error translator.

## Task 2: UI & Feedback Enhancements
- [x] `[MODIFY]` [js/views/uploadView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/uploadView.js): Auto-trim input field on paste, display detected active model name in badge on success.
- [x] `[MODIFY]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html): Enhance API Key configuration instructions and status badge.
