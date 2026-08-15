/**
 * AiService - Universal Google AI Studio (Gemini REST API) Client.
 * Implements Dynamic Model Discovery (`GET /v1beta/models`), Robust Key Sanitization,
 * Multi-Tier Model Fallback (Gemini 2.5, 2.0, 1.5 Flash/Pro), Vietnamese Error Translator,
 * and AbortController timeout guards.
 */
class AiService {
  constructor() {
    this.STORAGE_KEY_API_KEY = 'eurus_ai_studio_api_key';
    this.STORAGE_KEY_ACTIVE_MODEL = 'eurus_ai_studio_active_model';
    
    // Modern candidate Gemini models (purged deprecated gemini-1.0-pro)
    this.CANDIDATE_MODELS = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest'
    ];
    this.API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Cleans and sanitizes API key string (strips quotes, whitespace, accidental formatting).
   * @param {string} key 
   * @returns {string}
   */
  sanitizeApiKey(key) {
    if (!key) return '';
    return key.toString()
      .replace(/["'`]/g, '')     // Strip quotes
      .replace(/\s+/g, '')       // Strip all whitespace and newlines
      .trim();
  }

  /**
   * Retrieves stored API key from LocalStorage.
   * @returns {string}
   */
  getApiKey() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_API_KEY) || '';
      return this.sanitizeApiKey(raw);
    } catch (e) {
      console.warn('Error reading AI Studio API key from LocalStorage:', e);
      return '';
    }
  }

  /**
   * Saves API key to LocalStorage.
   * @param {string} apiKey 
   */
  saveApiKey(apiKey) {
    try {
      const clean = this.sanitizeApiKey(apiKey);
      if (clean) {
        localStorage.setItem(this.STORAGE_KEY_API_KEY, clean);
      } else {
        localStorage.removeItem(this.STORAGE_KEY_API_KEY);
      }
    } catch (e) {
      console.error('Error saving AI Studio API key to LocalStorage:', e);
    }
  }

  /**
   * Dynamically discovers available models authorized for this API key.
   * @param {string} apiKey 
   * @returns {Promise<string[]>}
   */
  async discoverAvailableModels(apiKey) {
    const key = this.sanitizeApiKey(apiKey);
    if (!key) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = `${this.API_BASE_URL}/models?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          // Filter models that support generateContent method and are modern (exclude 1.0)
          const supported = data.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''))
            .filter(m => !m.includes('1.0'));
          
          if (supported.length > 0) {
            return supported;
          }
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn('Model discovery probe returned:', e.message);
    }
    return [];
  }

  /**
   * Translates Google API error messages into user-friendly Vietnamese explanations.
   * @param {string} rawError 
   * @param {number} status 
   * @returns {string}
   */
  translateApiError(rawError = '', status = 0) {
    const msg = (rawError || '').toLowerCase();
    
    if (msg.includes('api key not valid') || msg.includes('api_key_invalid') || status === 400 && msg.includes('key')) {
      return 'API Key không hợp lệ! Vui lòng kiểm tra lại chìa khóa sao chép từ https://aistudio.google.com/app/apikey';
    }
    if (msg.includes('quota') || msg.includes('resource_exhausted') || status === 429) {
      return 'Đã vượt quá hạn ngạch (Quota limit) miễn phí của tài khoản Google AI Studio trong phút này. Vui lòng đợi 30 giây rồi thử lại!';
    }
    if (msg.includes('permission_denied') || status === 403) {
      return 'Tài khoản không có quyền truy cập mô hình này hoặc API Key bị hạn chế dịch vụ.';
    }
    if (msg.includes('user location is not supported') || msg.includes('location')) {
      return 'Khu vực địa lý hiện tại chưa được hỗ trợ trực tiếp. Vui lòng bật VPN hoặc đổi vùng Google Cloud Project.';
    }
    if (status >= 500) {
      return 'Máy chủ Google AI Studio đang bận hoặc bảo trì tạm thời. Vui lòng thử lại sau giây lát.';
    }
    return rawError || 'Không thể kết nối đến máy chủ Google AI Studio.';
  }

  /**
   * Sends a lightweight test request across discovered and candidate models to validate the key.
   * @param {string} apiKey 
   * @returns {Promise<{ valid: boolean, error?: string, activeModel?: string }>}
   */
  async validateApiKey(apiKey) {
    const key = this.sanitizeApiKey(apiKey || this.getApiKey());
    if (!key) {
      return { valid: false, error: 'Vui lòng nhập API Key Google AI Studio!' };
    }

    // 1. Try dynamic discovery first
    const discovered = await this.discoverAvailableModels(key);
    
    // 2. Build prioritized models queue (discovered models first, followed by default candidates)
    const modelsQueue = Array.from(new Set([...discovered, ...this.CANDIDATE_MODELS]));

    let lastError = '';
    let lastStatus = 0;

    for (const model of modelsQueue) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s per test

      try {
        const url = `${this.API_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping' }] }],
            generationConfig: { maxOutputTokens: 5 }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        lastStatus = response.status;

        if (response.ok) {
          this.saveApiKey(key);
          try {
            localStorage.setItem(this.STORAGE_KEY_ACTIVE_MODEL, model);
          } catch (e) {}
          return { valid: true, activeModel: model };
        }

        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || `Lỗi HTTP ${response.status}`;
        
        // If it's a definitive invalid key error, stop scanning immediately
        if (response.status === 400 && lastError.toLowerCase().includes('api key not valid')) {
          return { valid: false, error: this.translateApiError(lastError, response.status) };
        }
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err.message;
      }
    }

    return { valid: false, error: this.translateApiError(lastError, lastStatus) };
  }

  /**
   * Generates a full structured TXT quiz question bank via Gemini API with resilient model fallback.
   * @param {Object} params
   * @param {string} [params.apiKey]
   * @param {string} params.topic
   * @param {number} [params.count=10]
   * @param {string} [params.difficulty='Trung Bình']
   * @param {string} [params.language='Tiếng Việt']
   * @returns {Promise<string>} Raw TXT formatted string
   */
  async generateQuizContent({ apiKey = null, topic, count = 10, difficulty = 'Trung Bình', language = 'Tiếng Việt' }) {
    const key = this.sanitizeApiKey(apiKey || this.getApiKey());
    if (!key) {
      throw new Error('Chưa cấu hình API Key Google AI Studio! Vui lòng bấm vào "⚙️ Cấu Hình API Key" để nhập chìa khóa.');
    }

    if (!topic || !topic.trim()) {
      throw new Error('Vui lòng nhập chủ đề bài thi cần tạo bằng AI!');
    }

    const numQuestions = Math.min(Math.max(parseInt(count, 10) || 10, 3), 25);
    const isEng = language && (language.toLowerCase().includes('english') || language.toLowerCase().includes('anh'));

    const systemPrompt = isEng ?
`You are an elite Educational Assessment & Multiple-Choice Exam Specialist.
Your task is to generate a comprehensive, accurate multiple-choice quiz bank of exactly ${numQuestions} questions about "${topic.trim()}" at "${difficulty}" difficulty level in English.

MANDATORY OUTPUT FORMAT RULES (Each question MUST strictly adhere to this format, NEVER omit the explanation line):

Question 1: [Clear, unambiguous question text]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Answer: [Single capital letter: A, B, C, or D]
Explanation: [Detailed, rich educational explanation of why the answer is correct and key conceptual insights]

CRITICAL CONSTRAINTS:
1. Return purely raw TXT content directly without markdown codeblocks (\`\`\` or \`\`\`txt).
2. Exactly ${numQuestions} questions must be generated.
3. Every single question MUST include the "Answer:" and "Explanation:" lines.` :
`Bạn là một Chuyên gia Giáo dục và Biên soạn Đề thi Trắc nghiệm Hàng đầu.
Nhiệm vụ của bạn là tạo ra một bộ câu hỏi trắc nghiệm hoàn chỉnh gồm chính xác ${numQuestions} câu hỏi về chủ đề "${topic.trim()}" ở mức độ "${difficulty}" bằng ngôn ngữ "${language}".

YÊU CẦU ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (Mỗi câu hỏi phải đúng chuẩn định dạng TXT sau, KHÔNG được bỏ sót dòng Lời giải):

Câu 1: [Nội dung câu hỏi rõ ràng, chính xác]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
Đáp án: [Chỉ ghi 1 chữ cái viết hoa A, B, C, hoặc D]
Lời giải: [Văn bản giải thích chi tiết, đầy đủ lý do vì sao đáp án đó lại chọn đúng và phân tích khái niệm liên quan]

CHÚ Ý QUAN TRỌNG:
1. Trả về trực tiếp nội dung chuỗi văn bản TXT.
2. Tuyệt đối KHÔNG bao bọc bởi mã code fence Markdown như \`\`\`txt hoặc \`\`\`
3. Phải tạo đủ đúng ${numQuestions} câu hỏi. Tất cả các câu hỏi ĐỀU BẮT BUỘC có dòng "Lời giải:" giải thích chi tiết lý do.`;

    let rawText = '';
    let lastError = null;
    let lastStatus = 0;

    // 1. Discover live models dynamically on-the-fly
    const discovered = await this.discoverAvailableModels(key);
    
    // 2. Saved model preference if present
    const savedModel = localStorage.getItem(this.STORAGE_KEY_ACTIVE_MODEL);
    
    // 3. Build prioritized candidate list with only live valid models
    const candidateList = Array.from(new Set([
      ...(savedModel && !savedModel.includes('1.0') ? [savedModel] : []),
      ...discovered,
      ...this.CANDIDATE_MODELS
    ]));

    for (const model of candidateList) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

      try {
        const url = `${this.API_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        lastStatus = response.status;

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            rawText = candidateText.trim();
            try {
              localStorage.setItem(this.STORAGE_KEY_ACTIVE_MODEL, model);
            } catch (e) {}
            break; // Success!
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `Lỗi Google AI Studio (${response.status})`;
        }
      } catch (e) {
        clearTimeout(timeoutId);
        lastError = e.message;
      }
    }

    if (!rawText) {
      throw new Error(this.translateApiError(lastError, lastStatus));
    }

    // Strip Markdown Code Fences (```txt ... ``` or ``` ...)
    rawText = this.stripMarkdownCodeFences(rawText);
    return rawText;
  }

  /**
   * Strips Markdown code block wrappers from generated text string.
   * @param {string} text 
   * @returns {string} Clean text
   */
  stripMarkdownCodeFences(text) {
    if (!text) return '';
    let cleaned = text.replace(/^```[a-zA-Z]*\r?\n/i, ''); // Strip opening ```txt or ```
    cleaned = cleaned.replace(/\r?\n```$/i, ''); // Strip closing ```
    return cleaned.trim();
  }
}

window.aiService = new AiService();
