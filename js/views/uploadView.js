/**
 * UploadView - Handles TXT file drag-and-drop, text parsing preview, syntax diagnostics, multiple sample presets,
 * and AI Quiz Generation using Google AI Studio Gemini API.
 */
class UploadView {
  constructor() {
    this.parsedResult = null;
  }

  init() {
    this.setupDropzone();
    this.setupDurationSync();
  }

  setupDurationSync() {
    const txtVal = document.getElementById('quiz-duration-value');
    const txtUnit = document.getElementById('quiz-duration-unit');
    const aiVal = document.getElementById('ai-duration-value');
    const aiUnit = document.getElementById('ai-duration-unit');

    if (!txtVal || !txtUnit || !aiVal || !aiUnit) return;

    let isSyncing = false;

    // Sync from TXT Card to AI Card
    const syncFromTxtToAi = () => {
      if (isSyncing) return;
      isSyncing = true;
      let val = parseInt(txtVal.value, 10);
      if (isNaN(val) || val <= 0) val = 15;
      aiVal.value = val;
      aiUnit.value = txtUnit.value;
      isSyncing = false;
    };

    // Sync from AI Card to TXT Card
    const syncFromAiToTxt = () => {
      if (isSyncing) return;
      isSyncing = true;
      let val = parseInt(aiVal.value, 10);
      if (isNaN(val) || val <= 0) val = 15;
      txtVal.value = val;
      txtUnit.value = aiUnit.value;
      isSyncing = false;
    };

    txtVal.addEventListener('input', syncFromTxtToAi);
    txtVal.addEventListener('change', syncFromTxtToAi);
    txtUnit.addEventListener('change', syncFromTxtToAi);

    aiVal.addEventListener('input', syncFromAiToTxt);
    aiVal.addEventListener('change', syncFromAiToTxt);
    aiUnit.addEventListener('change', syncFromAiToTxt);
  }

  setupDropzone() {
    const dropzone = document.getElementById('txt-dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.processFile(files[0]);
      }
    });
  }

  handleFileUpload(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  processFile(file) {
    if (!file.name.endsWith('.txt')) {
      window.app.showToast('Vui lòng chọn file đúng định dạng .txt', 'error');
      return;
    }

    const titleInput = document.getElementById('quiz-title-input');
    if (titleInput && (!titleInput.value || titleInput.value === 'Đề Thi Trắc Nghiệm Từ File TXT')) {
      titleInput.value = file.name.replace('.txt', '');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const textArea = document.getElementById('raw-txt-input');
      if (textArea) {
        textArea.value = content;
        this.handleLiveValidation();
        window.app.showToast(`Đã nạp thành công file ${file.name}!`, 'success');
      }
    };
    reader.onerror = () => {
      window.app.showToast('Lỗi đọc file TXT từ thiết bị.', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  }

  loadSampleQuiz(presetType = 'it') {
    let sampleTxt = '';
    let title = '';

    if (presetType === 'english') {
      title = 'Đề Thi Mẫu Tiếng Anh Công Sở (Grammar & Vocab)';
      sampleTxt = `Question 1: Select the correct word to complete the sentence: "The meeting has been _______ to next Monday."
A. postponed
B. cancelled
C. arrived
D. renewed
Answer: A
Explanation: "Postponed" means delayed or pushed back to a later date.

Question 2: What is the synonym of the word "EFFICIENT"?
A. Slow
B. Productive
C. Lazy
D. Confused
Answer: B
Explanation: Productive and efficient both describe achieving high output with minimum wasted effort.

Question 3: Choose the correct preposition: "She is responsible _______ managing the new project."
A. at
B. for
C. with
D. in
Answer: B
Explanation: The phrase "responsible for" is standard English usage.

Question 4: Identify the correct sentence structure:
A. Seldom we have seen such impressive results.
B. Seldom have we seen such impressive results.
C. Seldom we seen such impressive results.
D. Have we seldom seen such impressive results.
Answer: B
Explanation: Inversion occurs after negative frequency adverbs like "Seldom".

Question 5: What does "ASAP" stand for in business communication?
A. As Soon As Possible
B. As Simple As Planned
C. Always Save All Documents
D. After System Auto Processing
Answer: A
Explanation: ASAP is a universally recognized abbreviation for "As Soon As Possible".`;
    } else {
      title = 'Đề Thi Mẫu Kiến Thức Công Nghệ Thông Tin (5 câu)';
      sampleTxt = window.txtParserService.getSampleTxtContent();
    }

    const textArea = document.getElementById('raw-txt-input');
    const titleInput = document.getElementById('quiz-title-input');

    if (textArea) textArea.value = sampleTxt;
    if (titleInput) titleInput.value = title;

    this.handleLiveValidation();
    window.app.showToast(`Đã nạp đề trắc nghiệm mẫu: ${title}!`, 'info');
  }

  handleLiveValidation() {
    const rawTxt = document.getElementById('raw-txt-input').value;
    const badge = document.getElementById('parse-status-badge');
    const errorBox = document.getElementById('parse-errors-container');

    if (!rawTxt.trim()) {
      if (badge) badge.style.display = 'none';
      if (errorBox) errorBox.style.display = 'none';
      this.parsedResult = null;
      return;
    }

    this.parsedResult = window.txtParserService.parse(rawTxt);
    const { questions, parseErrors, totalParsed } = this.parsedResult;

    if (badge) {
      badge.style.display = 'inline-flex';
      if (totalParsed > 0 && parseErrors.length === 0) {
        badge.className = 'badge badge-pass';
        badge.textContent = `Hợp lệ: ${totalParsed} câu hỏi`;
      } else if (totalParsed > 0 && parseErrors.length > 0) {
        badge.className = 'badge badge-fail';
        badge.textContent = `Cảnh báo: ${totalParsed} câu chuẩn, ${parseErrors.length} câu lỗi`;
      } else {
        badge.className = 'badge badge-fail';
        badge.textContent = `Lỗi định dạng TXT`;
      }
    }

    if (errorBox) {
      if (parseErrors.length > 0) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = `<strong>⚠️ Phát hiện ${parseErrors.length} lỗi trong file TXT:</strong><br>` +
          parseErrors.map(e => `• Dòng ${e.line}: ${e.message}`).join('<br>');
      } else {
        errorBox.style.display = 'none';
      }
    }
  }

  clearContent() {
    document.getElementById('raw-txt-input').value = '';
    document.getElementById('quiz-title-input').value = 'Đề Thi Trắc Nghiệm Từ File TXT';
    this.handleLiveValidation();
  }

  startQuizFromTxt() {
    const rawTxt = document.getElementById('raw-txt-input').value;
    const titleInput = document.getElementById('quiz-title-input').value.trim();

    if (!rawTxt.trim()) {
      window.app.showToast('Vui lòng tải hoặc dán nội dung file TXT trước!', 'error');
      return;
    }

    const parseResult = window.txtParserService.parse(rawTxt);
    if (parseResult.questions.length === 0) {
      window.app.showToast('Không thể tạo bộ câu hỏi từ file TXT này. Vui lòng kiểm tra định dạng lỗi!', 'error');
      return;
    }

    // Read user configured duration value and unit
    const numElem = document.getElementById('quiz-duration-value');
    const unitElem = document.getElementById('quiz-duration-unit');
    
    let numValue = numElem ? parseInt(numElem.value, 10) : 15;
    if (isNaN(numValue) || numValue <= 0) numValue = 15;

    const unitValue = unitElem ? unitElem.value : 'minutes';
    let totalSeconds = 15 * 60;

    if (unitValue === 'seconds') {
      totalSeconds = Math.max(5, numValue);
    } else if (unitValue === 'hours') {
      totalSeconds = Math.max(5, numValue * 3600);
    } else { // 'minutes'
      totalSeconds = Math.max(5, numValue * 60);
    }

    // Start active quiz session
    try {
      window.quizEngineService.startSession({
        title: titleInput || 'Bài Trắc Nghiệm TXT',
        questions: parseResult.questions,
        durationSeconds: totalSeconds,
        durationMinutes: Math.ceil(totalSeconds / 60)
      });

      window.app.showToast(`Bắt đầu làm bài thi "${titleInput}"!`, 'success');
      window.app.router.navigate('quiz');
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }

  /* ===================================================================
     AI STUDIO GEMINI GENERATOR & API KEY MODAL CONTROLLERS
     =================================================================== */

  openAiConfigModal() {
    const modal = document.getElementById('ai-config-modal');
    const input = document.getElementById('ai-api-key-input');
    const badge = document.getElementById('ai-key-status-badge');

    if (input) {
      input.value = window.aiService.getApiKey();
    }
    if (badge) {
      badge.style.display = 'none';
    }
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeAiConfigModal() {
    const modal = document.getElementById('ai-config-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  toggleApiKeyVisibility() {
    const input = document.getElementById('ai-api-key-input');
    const btn = document.getElementById('btn-toggle-ai-key-visibility');
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🔒';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  }

  async testAiApiKey() {
    const input = document.getElementById('ai-api-key-input');
    const badge = document.getElementById('ai-key-status-badge');
    const key = input ? input.value.trim() : '';

    if (!key) {
      window.app.showToast('Vui lòng nhập API Key để kiểm tra!', 'error');
      return;
    }

    if (badge) {
      badge.style.display = 'inline-block';
      badge.className = 'badge';
      badge.style.background = 'rgba(59, 130, 246, 0.2)';
      badge.style.color = '#60a5fa';
      badge.style.border = '1px solid #60a5fa';
      badge.textContent = '⏳ Đang kiểm tra API Key...';
    }

    const res = await window.aiService.validateApiKey(key);

    if (badge) {
      if (res.valid) {
        badge.className = 'badge badge-pass';
        badge.textContent = '✔ API Key Hợp Lệ!';
        window.app.showToast('API Key Google AI Studio hợp lệ và hoạt động tốt!', 'success');
      } else {
        badge.className = 'badge badge-fail';
        badge.textContent = '✖ API Key Không Hợp Lệ!';
        window.app.showToast(res.error || 'API Key không hợp lệ!', 'error');
      }
    }
  }

  saveAiApiKey(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('ai-api-key-input');
    const key = input ? input.value.trim() : '';

    if (!key) {
      window.app.showToast('Vui lòng nhập API Key trước khi lưu!', 'error');
      return;
    }

    window.aiService.saveApiKey(key);
    this.closeAiConfigModal();
    window.app.showToast('Đã lưu cấu hình API Key Google AI Studio thành công!', 'success');
  }

  async generateAiQuiz() {
    const apiKey = window.aiService.getApiKey();
    if (!apiKey) {
      window.app.showToast('Chưa cấu hình API Key Google AI Studio! Vui lòng nhập chìa khóa API trước.', 'info');
      this.openAiConfigModal();
      return;
    }

    const topicInput = document.getElementById('ai-topic-input');
    const countSelect = document.getElementById('ai-count-select');
    const difficultySelect = document.getElementById('ai-difficulty-select');
    const langSelect = document.getElementById('ai-lang-select');
    const btn = document.getElementById('btn-generate-ai-quiz');

    const topic = topicInput ? topicInput.value.trim() : '';
    const count = countSelect ? parseInt(countSelect.value, 10) : 10;
    const difficulty = difficultySelect ? difficultySelect.value : 'Trung Bình';
    const language = langSelect ? langSelect.value : 'Tiếng Việt';

    if (!topic) {
      window.app.showToast('Vui lòng nhập chủ đề đề thi bạn muốn tạo!', 'error');
      if (topicInput) topicInput.focus();
      return;
    }

    const originalBtnText = btn ? btn.innerHTML : '✨ Tạo Đề Thi Bằng AI Studio';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `⏳ Đang Gọi AI Studio Biên Soạn (${count} câu)...`;
    }

    window.app.showToast(`Đang kết nối Google AI Studio tạo đề thi "${topic}"...`, 'info');

    try {
      const generatedTxt = await window.aiService.generateQuizContent({
        apiKey,
        topic,
        count,
        difficulty,
        language
      });

      const textArea = document.getElementById('raw-txt-input');
      const titleInput = document.getElementById('quiz-title-input');

      if (textArea) textArea.value = generatedTxt;
      if (titleInput) titleInput.value = `[AI Studio] Đề Thi: ${topic}`;

      this.handleLiveValidation();

      window.app.showToast(`✨ Đã khởi tạo thành công đề thi AI Studio: "${topic}" (${count} câu)!`, 'success');
    } catch (err) {
      console.error('Error generating AI quiz:', err);
      window.app.showToast(err.message || 'Lỗi khi gọi Google AI Studio!', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
      }
    }
  }
}

window.uploadView = new UploadView();
