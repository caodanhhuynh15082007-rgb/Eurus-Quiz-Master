/**
 * HistoryView - Renders student attempt history logs, search filtering, Read-Only Modal inspection,
 * Answer Statistics breakdown, difficulty gauges, and Question Error Reporting.
 */
class HistoryView {
  constructor() {
    this.activeModalAttempt = null;
    this.activeFeedbackQuestion = null;
  }

  renderView() {
    this.handleSearch();
  }

  handleSearch() {
    const searchInput = document.getElementById('history-search-input');
    const query = searchInput ? searchInput.value : '';
    const currentUser = window.authService.getCurrentUser();

    const attempts = window.historyService.getAttempts(currentUser ? currentUser.id : null, query);
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (attempts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            📜 Chưa có lịch sử làm bài trắc nghiệm nào ${query ? 'phù hợp với từ khóa "' + query + '"' : ''}.
          </td>
        </tr>
      `;
      return;
    }

    attempts.forEach((a) => {
      const row = document.createElement('tr');
      const mins = Math.floor(a.timeSpentSeconds / 60);
      const secs = a.timeSpentSeconds % 60;
      const timeFormatted = `${mins > 0 ? mins + 'm ' : ''}${secs}s`;

      const isPass = a.scorePercentage >= 50;

      row.innerHTML = `
        <td style="font-size: 0.85rem; color: var(--text-muted);">${a.date}</td>
        <td><strong style="color: var(--text-main);">${this.escapeHtml(a.quizTitle)}</strong></td>
        <td>
          <span class="badge ${isPass ? 'badge-pass' : 'badge-fail'}">
            ${a.scorePercentage}%
          </span>
        </td>
        <td style="font-size: 0.88rem;">
          <span style="color: var(--accent-emerald);">✔ ${a.correctCount}</span> / 
          <span style="color: var(--accent-rose);">✖ ${a.wrongCount}</span> / 
          <span style="color: var(--accent-amber);">➖ ${a.skippedCount || 0}</span>
        </td>
        <td style="font-size: 0.88rem; color: var(--text-muted);">${timeFormatted}</td>
        <td>
          <button class="btn btn-secondary btn-icon-only" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;" onclick="app.views.history.viewDetail('${a.attemptId}')">
            🔍 Xem Chi Tiết
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  viewDetail(attemptId) {
    const attempt = window.historyService.getAttemptById(attemptId);
    if (!attempt) {
      window.app.showToast('Không tìm thấy chi tiết bài làm!', 'error');
      return;
    }

    this.activeModalAttempt = attempt;

    // Populate Read-Only Modal Header
    document.getElementById('hm-quiz-title').textContent = `${attempt.quizTitle} (Chế độ xem lại - Thống kê & Góp ý)`;
    document.getElementById('hm-date-time').textContent = `Ngày làm bài: ${attempt.date}`;
    document.getElementById('hm-score').textContent = `${attempt.scorePercentage}%`;
    document.getElementById('hm-counts').textContent = `${attempt.correctCount} / ${attempt.totalQuestions}`;

    const container = document.getElementById('hm-questions-container');
    container.innerHTML = '';

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    attempt.details.forEach((item, qIdx) => {
      let cardClass = 'glass-card review-question-card';
      let statusBadge = '';

      if (item.isCorrect) {
        cardClass += ' correct';
        statusBadge = '<span class="badge badge-pass">✔ ĐÚNG</span>';
      } else if (item.userAnswer === -1) {
        cardClass += ' skipped';
        statusBadge = '<span class="badge" style="background: rgba(245,158,11,0.2); color: var(--accent-amber); border: 1px solid var(--accent-amber);">➖ BỎ QUA</span>';
      } else {
        cardClass += ' wrong';
        statusBadge = '<span class="badge badge-fail">✖ SAI</span>';
      }

      const card = document.createElement('div');
      card.className = cardClass;
      card.style.marginBottom = '1.25rem';

      // 1. Option List HTML
      let optionsHtml = '<div class="options-list" style="margin-top: 0.85rem; pointer-events: none; user-select: none;">';
      item.options.forEach((optText, optIdx) => {
        const letter = optionLetters[optIdx] || String(optIdx + 1);
        const isUserChoice = item.userAnswer === optIdx;
        const isCorrectChoice = item.correctAnswer === optIdx;

        let optClass = 'option-item';
        let badgeTag = '';

        if (isCorrectChoice) {
          optClass += ' selected';
          badgeTag = '<span style="color: var(--accent-emerald); font-weight: 700; margin-left: auto;">(Đáp án chuẩn)</span>';
        }
        if (isUserChoice && !isCorrectChoice) {
          badgeTag = '<span style="color: var(--accent-rose); font-weight: 700; margin-left: auto;">(Học viên đã chọn)</span>';
        }

        optionsHtml += `
          <div class="${optClass}" style="${isUserChoice && !isCorrectChoice ? 'border-color: var(--accent-rose); background: rgba(239, 68, 68, 0.15);' : ''}">
            <div class="option-letter">${letter}</div>
            <div class="option-label">${this.escapeHtml(optText)}</div>
            ${badgeTag}
          </div>
        `;
      });
      optionsHtml += '</div>';

      // 2. Textual Explanation HTML (Parsed from TXT file)
      const correctLetter = optionLetters[item.correctAnswer] || String(item.correctAnswer + 1);
      const correctOptionText = item.options[item.correctAnswer] || '';

      let expHtml = '';
      if (item.explanation && item.explanation.trim()) {
        expHtml = `
          <div class="explanation-box" style="margin-top: 0.85rem; border-left: 3px solid var(--accent-emerald); background: rgba(16, 185, 129, 0.08); padding: 0.85rem 1rem; border-radius: var(--radius-md);">
            💡 <strong>Lời Giải / Lý Do Chọn Đáp Án Đúng:</strong> ${this.escapeHtml(item.explanation.trim())}
          </div>
        `;
      } else {
        expHtml = `
          <div class="explanation-box" style="margin-top: 0.85rem; border-left: 3px solid var(--glass-border); background: rgba(15, 23, 42, 0.4); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; color: var(--text-muted);">
            ℹ️ <em>(Nội dung file TXT chưa bao gồm dòng 'Lời giải:' cho câu này. Phương án chuẩn: ${correctLetter} - "${this.escapeHtml(correctOptionText)}")</em>
          </div>
        `;
      }

      // 3. Answer Statistics & Difficulty Rating HTML
      const statsData = window.feedbackService.getAnswerStatistics(item.questionId || ('q_' + qIdx), item.correctAnswer, item.options.length);
      
      let statsBarsHtml = `
        <div class="stat-bar-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">📊 Thống Kê Lựa Chọn Đáp Án (Tỉ Lệ Thí Sinh)</span>
            <span class="badge" style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--glass-border); color: ${statsData.difficulty.color};">
              Độ khó: <strong>${statsData.difficulty.label}</strong>
            </span>
          </div>
      `;

      item.options.forEach((_, optIdx) => {
        const letter = optionLetters[optIdx] || String(optIdx + 1);
        const percent = statsData.distributionPercentages[optIdx] || 0;
        const isCorrectChoice = item.correctAnswer === optIdx;

        statsBarsHtml += `
          <div class="stat-bar-row">
            <span style="min-width: 24px; font-weight: 700; color: ${isCorrectChoice ? 'var(--accent-emerald)' : 'var(--text-muted)'};">${letter}:</span>
            <div class="stat-bar-container">
              <div class="stat-bar-fill ${isCorrectChoice ? 'correct-fill' : ''}" style="width: ${percent}%;"></div>
            </div>
            <span class="stat-percent-text" style="${isCorrectChoice ? 'color: var(--accent-emerald);' : ''}">${percent}%</span>
          </div>
        `;
      });
      statsBarsHtml += '</div>';

      // 4. Report Error / Feedback Action Button HTML
      const feedbackActionHtml = `
        <div style="display: flex; justify-content: flex-end; margin-top: 0.75rem;">
          <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;" onclick="app.views.history.openReportModal('${item.questionId || ('q_' + qIdx)}', '${this.escapeJsString(item.questionText)}')">
            🚩 Báo Cáo Lỗi / Góp Ý Câu Hỏi
          </button>
        </div>
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="question-number-badge">CÂU ${item.number || (qIdx + 1)}</span>
          ${statusBadge}
        </div>
        <div class="question-text" style="font-size: 1.05rem; margin-bottom: 0.5rem;">${this.escapeHtml(item.questionText)}</div>
        ${optionsHtml}
        ${expHtml}
        ${statsBarsHtml}
        ${feedbackActionHtml}
      `;

      container.appendChild(card);
    });

    // Show modal
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('active');
  }

  openReportModal(questionId, questionText) {
    this.activeFeedbackQuestion = { questionId, questionText };
    document.getElementById('fb-question-id').value = questionId;
    document.getElementById('fb-question-preview').textContent = `Câu hỏi: "${questionText.substring(0, 70)}${questionText.length > 70 ? '...' : ''}"`;
    document.getElementById('fb-comment-text').value = '';
    
    const feedbackModal = document.getElementById('feedback-modal');
    if (feedbackModal) feedbackModal.classList.add('active');
  }

  closeFeedbackModal() {
    const feedbackModal = document.getElementById('feedback-modal');
    if (feedbackModal) feedbackModal.classList.remove('active');
  }

  submitFeedback(event) {
    event.preventDefault();
    const category = document.getElementById('fb-category-select').value;
    const comment = document.getElementById('fb-comment-text').value;
    const currentUser = window.authService.getCurrentUser();

    try {
      window.feedbackService.submitFeedback({
        quizTitle: this.activeModalAttempt ? this.activeModalAttempt.quizTitle : 'Bài Trắc Nghiệm',
        questionId: this.activeFeedbackQuestion ? this.activeFeedbackQuestion.questionId : 'unknown',
        questionText: this.activeFeedbackQuestion ? this.activeFeedbackQuestion.questionText : '',
        category,
        comment,
        user: currentUser
      });

      window.app.showToast('Cảm ơn bạn! Báo cáo lỗi / góp ý đã được gửi thành công.', 'success');
      this.closeFeedbackModal();
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }

  saveCurrentModalQuiz() {
    if (!this.activeModalAttempt) {
      window.app.showToast('Không tìm thấy dữ liệu bài kiểm tra để lưu!', 'error');
      return;
    }

    const currentUser = window.authService.getCurrentUser();
    try {
      window.savedService.saveQuiz(this.activeModalAttempt, currentUser);
      window.app.showToast(`Đã lưu bài thi "${this.activeModalAttempt.quizTitle}" vào danh sách Bài Kiểm Tra Đã Lưu!`, 'success');
      this.closeModal();
      window.app.router.navigate('saved');
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }

  closeModal() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.remove('active');
  }

  escapeHtml(str) {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }

  escapeJsString(str) {
    return str ? str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ') : '';
  }
}

window.historyView = new HistoryView();
