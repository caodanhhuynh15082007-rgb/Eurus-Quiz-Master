/**
 * ResultView - Renders the post-quiz scorecard, percentage score gauge, and question-by-question review breakdown.
 */
class ResultView {
  renderResult(attempt) {
    if (!attempt) return;

    // Score percent & title
    document.getElementById('res-score-percent').textContent = `${attempt.scorePercentage}%`;
    document.getElementById('res-grade-title').textContent = this.getGradeTitle(attempt.scorePercentage);
    document.getElementById('res-quiz-title').textContent = attempt.quizTitle;

    // Time spent
    const mins = Math.floor(attempt.timeSpentSeconds / 60);
    const secs = attempt.timeSpentSeconds % 60;
    document.getElementById('res-time-spent').textContent = `Thời gian làm bài: ${mins > 0 ? mins + ' phút ' : ''}${secs} giây`;

    // Stat counts
    document.getElementById('res-count-correct').textContent = attempt.correctCount;
    document.getElementById('res-count-wrong').textContent = attempt.wrongCount;
    document.getElementById('res-count-skipped').textContent = attempt.skippedCount;

    // Render detailed review list
    const container = document.getElementById('review-cards-container');
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

      let optionsHtml = '<div class="options-list" style="margin-top: 1rem;">';
      item.options.forEach((optText, optIdx) => {
        const letter = optionLetters[optIdx] || String(optIdx + 1);
        const isUserChoice = item.userAnswer === optIdx;
        const isCorrectChoice = item.correctAnswer === optIdx;

        let optClass = 'option-item';
        let badgeTag = '';

        if (isCorrectChoice) {
          optClass += ' selected';
          badgeTag = '<span style="color: var(--accent-emerald); font-weight: 700; margin-left: auto;">(Đáp án đúng)</span>';
        }
        if (isUserChoice && !isCorrectChoice) {
          optClass += ' wrong-choice';
          badgeTag = '<span style="color: var(--accent-rose); font-weight: 700; margin-left: auto;">(Bạn đã chọn)</span>';
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

      const correctLetter = optionLetters[item.correctAnswer] || String(item.correctAnswer + 1);
      const correctOptionText = item.options[item.correctAnswer] || '';
      
      let expText = (item.explanation && item.explanation.trim())
        ? item.explanation.trim()
        : `Phương án đúng là ${correctLetter}: "${correctOptionText}". Đây là câu trả lời chính xác được xác nhận theo dữ liệu chuẩn của bài thi.`;

      const expHtml = `
        <div class="explanation-box" style="margin-top: 0.85rem; border-left: 3px solid var(--accent-emerald); background: rgba(16, 185, 129, 0.08); padding: 0.85rem 1rem; border-radius: var(--radius-md);">
          💡 <strong>Lời Giải / Giải Thích Đáp Án:</strong> ${this.escapeHtml(expText)}
        </div>
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="question-number-badge">CÂU ${item.number}</span>
          ${statusBadge}
        </div>
        <div class="question-text" style="font-size: 1.05rem; margin-bottom: 0.75rem;">${this.escapeHtml(item.questionText)}</div>
        ${optionsHtml}
        ${expHtml}
      `;

      container.appendChild(card);
    });
  }

  getGradeTitle(score) {
    if (score >= 90) return 'Xuất Sắc 🏆';
    if (score >= 80) return 'Giỏi 🌟';
    if (score >= 65) return 'Khá 👍';
    if (score >= 50) return 'Đạt Chuẩn ✔';
    return 'Cần Cố Gắng thêm 💡';
  }

  escapeHtml(str) {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}

window.resultView = new ResultView();
