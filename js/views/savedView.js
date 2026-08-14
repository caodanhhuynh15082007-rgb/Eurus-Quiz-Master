/**
 * SavedView - Manages UI rendering for the 4th navbar view "Bài Kiểm Tra Đã Lưu".
 */
class SavedView {
  renderView() {
    this.handleSearch();
  }

  handleSearch() {
    const searchInput = document.getElementById('saved-search-input');
    const query = searchInput ? searchInput.value : '';
    const currentUser = window.authService.getCurrentUser();

    const list = window.savedService.getSavedQuizzes(currentUser ? currentUser.id : null, query);
    const container = document.getElementById('saved-cards-container');
    if (!container) return;

    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="grid-column: span 3; text-align: center; padding: 3rem; color: var(--text-muted);">
          ⭐ Chưa có bài kiểm tra nào được lưu. ${query ? 'Không tìm thấy kết quả cho "' + query + '"' : ''}<br>
          <span style="font-size: 0.88rem; color: var(--text-dim); margin-top: 0.5rem; display: inline-block;">
            Bạn có thể làm một bài trắc nghiệm và bấm "⭐ Lưu Bài Kiểm Tra" trong mục Lịch Sử để lưu vào đây ôn tập lại!
          </span>
        </div>
      `;
      return;
    }

    list.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifySpaceBetween = 'space-between';

      const isPass = item.scorePercentage >= 50;

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <span class="badge ${isPass ? 'badge-pass' : 'badge-fail'}">Điểm từng làm: ${item.scorePercentage}%</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${item.savedDate}</span>
          </div>

          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; line-height: 1.4;">
            ${this.escapeHtml(item.quizTitle)}
          </h3>

          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            📊 Tổng số câu hỏi: <strong>${item.totalQuestions} câu</strong>
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
          <button class="btn btn-primary" style="flex: 2; font-size: 0.88rem; padding: 0.6rem 0.85rem;" onclick="app.views.saved.retakeQuiz('${item.savedId}')">
            🔄 Làm Lại Bài Thi
          </button>
          <button class="btn btn-danger btn-icon-only" style="flex: 1; font-size: 0.88rem; padding: 0.6rem;" onclick="app.views.saved.deleteQuiz('${item.savedId}')" title="Xóa khỏi danh sách lưu">
            🗑️ Xóa
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  retakeQuiz(savedId) {
    const currentUser = window.authService.getCurrentUser();
    const list = window.savedService.getSavedQuizzes(currentUser ? currentUser.id : null);
    const target = list.find(item => item.savedId === savedId);

    if (!target) {
      window.app.showToast('Không tìm thấy dữ liệu bài thi đã lưu!', 'error');
      return;
    }

    try {
      window.quizEngineService.startSession({
        title: target.quizTitle,
        questions: target.questions,
        durationMinutes: 15 // Standard duration
      });

      window.app.showToast(`Bắt đầu ôn tập lại bài thi "${target.quizTitle}"!`, 'success');
      window.app.router.navigate('quiz');
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }

  deleteQuiz(savedId) {
    if (confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này khỏi danh sách đã lưu?')) {
      window.savedService.deleteSavedQuiz(savedId);
      window.app.showToast('Đã xóa bài thi khỏi danh sách đã lưu.', 'info');
      this.renderView();
    }
  }

  escapeHtml(str) {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}

window.savedView = new SavedView();
