/**
 * AiService - Direct Google AI Studio (Gemini REST API) Client.
 * Handles API key persistence, lightweight validation pings, dual model endpoint fallbacks (gemini-1.5-flash / gemini-2.0-flash),
 * prompt construction, Markdown code fence stripping, and AbortController timeout guards.
 */
class AiService {
  constructor() {
    this.STORAGE_KEY_API_KEY = 'eurus_ai_studio_api_key';
    this.DEFAULT_MODEL = 'gemini-1.5-flash';
    this.FALLBACK_MODEL = 'gemini-2.0-flash';
    this.API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  /**
   * Retrieves stored API key from LocalStorage.
   * @returns {string}
   */
  getApiKey() {
    try {
      return localStorage.getItem(this.STORAGE_KEY_API_KEY) || '';
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
      if (apiKey && apiKey.trim()) {
        localStorage.setItem(this.STORAGE_KEY_API_KEY, apiKey.trim());
      } else {
        localStorage.removeItem(this.STORAGE_KEY_API_KEY);
      }
    } catch (e) {
      console.error('Error saving AI Studio API key to LocalStorage:', e);
    }
  }

  /**
   * Sends a lightweight test request to Gemini REST API to validate the key.
   * @param {string} apiKey 
   * @returns {Promise<{ valid: boolean, error?: string }>}
   */
  async validateApiKey(apiKey) {
    const key = apiKey || this.getApiKey();
    if (!key || !key.trim()) {
      return { valid: false, error: 'Vui lòng nhập API Key Google AI Studio!' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for ping

    try {
      const url = `${this.API_BASE_URL}/${this.DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(key.trim())}`;
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

      if (response.ok) {
        this.saveApiKey(key);
        return { valid: true };
      }

      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Lỗi HTTP ${response.status}: API Key không hợp lệ hoặc đã hết hạn ngạch.`;
      return { valid: false, error: errMsg };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return { valid: false, error: 'Quá thời gian kết nối (Timeout 12s). Vui lòng kiểm tra lại đường truyền mạng!' };
      }
      return { valid: false, error: err.message || 'Không thể kết nối đến máy chủ Google AI Studio.' };
    }
  }

  /**
   * Generates a full structured TXT quiz question bank via Gemini API.
   * @param {Object} params
   * @param {string} [params.apiKey]
   * @param {string} params.topic
   * @param {number} [params.count=10]
   * @param {string} [params.difficulty='Trung Bình']
   * @param {string} [params.language='Tiếng Việt']
   * @returns {Promise<string>} Raw TXT formatted string
   */
  async generateQuizContent({ apiKey = null, topic, count = 10, difficulty = 'Trung Bình', language = 'Tiếng Việt' }) {
    const key = apiKey || this.getApiKey();
    if (!key || !key.trim()) {
      throw new Error('Chưa cấu hình API Key Google AI Studio! Vui lòng bấm vào "⚙️ Cấu Hình API Key" để nhập chìa khóa.');
    }

    if (!topic || !topic.trim()) {
      throw new Error('Vui lòng nhập chủ đề bài thi cần tạo bằng AI!');
    }

    const numQuestions = Math.min(Math.max(parseInt(count, 10) || 10, 3), 25);

    const systemPrompt = `Bạn là một Chuyên gia Giáo dục và Biên soạn Đề thi Trắc nghiệm Hàng đầu.
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for AI generation

    let rawText = '';
    let lastError = null;

    // Try Primary Model first, then Fallback Model if needed
    const modelsToTry = [this.DEFAULT_MODEL, this.FALLBACK_MODEL];

    for (const model of modelsToTry) {
      try {
        const url = `${this.API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(key.trim())}`;
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

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            rawText = candidateText.trim();
            break; // Success!
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `Lỗi Google AI Studio (${response.status})`;
        }
      } catch (e) {
        lastError = e.message;
        if (e.name === 'AbortError') {
          clearTimeout(timeoutId);
          throw new Error('Quá thời gian xử lý AI (Timeout 35s). Vui lòng thử lại hoặc giảm số lượng câu hỏi!');
        }
      }
    }

    clearTimeout(timeoutId);

    if (!rawText) {
      throw new Error(lastError || 'Không thể tạo bộ câu hỏi từ Google AI Studio. Vui lòng kiểm tra lại API Key hoặc hạn ngạch tài khoản!');
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
