/**
 * HistoryView - Renders student attempt history logs, search filtering, and dedicated Read-Only Modal inspection.
 */
class HistoryView {
  constructor() {
    this.activeModalAttempt = null;
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

    // Populate Read-Only Modal
    document.getElementById('hm-quiz-title').textContent = `${attempt.quizTitle} (Chế độ xem lại - Không thể chỉnh sửa)`;
    document.getElementById('hm-date-time').textContent = `Ngày làm bài: ${attempt.date}`;
    document.getElementById('hm-score').textContent = `${attempt.scorePercentage}%`;
    document.getElementById('hm-counts').textContent = `${attempt.correctCount} / ${attempt.totalQuestions}`;

    const container = document.getElementById('hm-questions-container');
    container.innerHTML = '';

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    attempt.details.forEach((item) => {
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
      card.style.marginBottom = '1rem';

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

      // Always display explanation for the CORRECT answer regardless of correct/wrong/skipped
      const correctLetter = optionLetters[item.correctAnswer] || String(item.correctAnswer + 1);
      const correctOptionText = item.options[item.correctAnswer] || '';
      const explanationText = item.explanation && item.explanation.trim()
        ? item.explanation.trim()
        : `Đáp án đúng chính xác là phương án ${correctLetter}: "${correctOptionText}".`;

      const expHtml = `
        <div class="explanation-box" style="margin-top: 0.75rem; border-left: 3px solid var(--accent-emerald);">
          💡 <strong>Lời giải / Giải thích đáp án đúng:</strong> ${this.escapeHtml(explanationText)}
        </div>
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="question-number-badge">CÂU ${item.number}</span>
          ${statusBadge}
        </div>
        <div class="question-text" style="font-size: 1.05rem; margin-bottom: 0.5rem;">${this.escapeHtml(item.questionText)}</div>
        ${optionsHtml}
        ${expHtml}
      `;

      container.appendChild(card);
    });

    // Show modal
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('active');
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
}

window.historyView = new HistoryView();
