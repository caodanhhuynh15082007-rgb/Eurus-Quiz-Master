/**
 * HistoryView - Renders student attempt history logs, search filtering, and detailed attempt view triggers.
 */
class HistoryView {
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

    window.views.result.renderResult(attempt);
    window.app.router.navigate('result');
  }

  escapeHtml(str) {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}

window.historyView = new HistoryView();
