/**
 * ProfileView - Renders student profile details, profile edit form, and aggregate learning stats.
 */
class ProfileView {
  renderView() {
    const currentUser = window.authService.getCurrentUser();
    
    const nameInput = document.getElementById('prof-fullname');
    const emailInput = document.getElementById('prof-email');
    const usernameInput = document.getElementById('prof-username');
    const displayAvatar = document.getElementById('profile-avatar-lg');
    const displayName = document.getElementById('prof-display-name');
    const displayStatus = document.getElementById('prof-display-status');

    if (currentUser) {
      if (nameInput) nameInput.value = currentUser.fullname || '';
      if (emailInput) emailInput.value = currentUser.email || '';
      if (usernameInput) usernameInput.value = currentUser.username || '';
      if (displayName) displayName.textContent = currentUser.fullname || currentUser.username;
      if (displayAvatar) displayAvatar.textContent = (currentUser.fullname || currentUser.username).charAt(0).toUpperCase();
      if (displayStatus) displayStatus.textContent = 'Học viên chính thức';
    } else {
      if (nameInput) nameInput.value = 'Khách Vãng Lai';
      if (emailInput) emailInput.value = 'khach@eurus.edu.vn';
      if (usernameInput) usernameInput.value = 'khach';
      if (displayName) displayName.textContent = 'Khách Vãng Lai';
      if (displayAvatar) displayAvatar.textContent = 'G';
      if (displayStatus) displayStatus.textContent = 'Chưa đăng nhập';
    }

    // Render Stats Overview
    const stats = window.historyService.getStudentStats(currentUser ? currentUser.id : null);
    document.getElementById('stat-total-attempts').textContent = stats.totalAttempts;
    document.getElementById('stat-avg-score').textContent = `${stats.avgScore}%`;
  }

  saveProfile(event) {
    event.preventDefault();
    const currentUser = window.authService.getCurrentUser();
    if (!currentUser) {
      window.app.showToast('Vui lòng đăng nhập trước khi cập nhật hồ sơ!', 'error');
      window.app.router.navigate('auth');
      return;
    }

    const fullname = document.getElementById('prof-fullname').value;
    const email = document.getElementById('prof-email').value;

    try {
      window.authService.updateProfile({ fullname, email });
      window.authView.renderUserBadge();
      this.renderView();
      window.app.showToast('Đã lưu thông tin hồ sơ học viên thành công!', 'success');
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }
}

window.profileView = new ProfileView();
