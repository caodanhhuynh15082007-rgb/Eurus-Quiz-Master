/**
 * UploadView - Handles TXT file drag-and-drop, text parsing preview, syntax diagnostics, and multiple sample presets.
 */
class UploadView {
  constructor() {
    this.parsedResult = null;
  }

  init() {
    this.setupDropzone();
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

    // Start active quiz session
    try {
      window.quizEngineService.startSession({
        title: titleInput || 'Bài Trắc Nghiệm TXT',
        questions: parseResult.questions,
        durationMinutes: Math.max(5, parseResult.questions.length * 2) // 2 mins per question
      });

      window.app.showToast(`Bắt đầu làm bài thi "${titleInput}"!`, 'success');
      window.app.router.navigate('quiz');
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }
}

window.uploadView = new UploadView();
