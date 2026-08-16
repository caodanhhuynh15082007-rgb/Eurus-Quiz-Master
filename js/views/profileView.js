/**
 * ProfileView - Renders student profile details, profile edit form, and aggregate learning stats.
 */
class ProfileView {
  renderView() {
    const currentUser = window.authService.getCurrentUser();
    
    const nameInput = document.getElementById('prof-fullname');
    const emailInput = document.getElementById('prof-email');
    const usernameInput = document.getElementById('prof-username');
    const phoneInput = document.getElementById('prof-phone');
    const telegramInput = document.getElementById('prof-telegram');
    const botUsernameInput = document.getElementById('bot-username');
    const displayAvatar = document.getElementById('profile-avatar-lg');
    const displayName = document.getElementById('prof-display-name');
    const displayStatus = document.getElementById('prof-display-status');

    if (currentUser) {
      if (nameInput) nameInput.value = currentUser.fullname || '';
      if (emailInput) emailInput.value = currentUser.email || '';
      if (usernameInput) usernameInput.value = currentUser.username || '';
      if (phoneInput) phoneInput.value = currentUser.phone || '';
      if (telegramInput) telegramInput.value = currentUser.telegramUser || '';
      if (displayName) displayName.textContent = currentUser.fullname || currentUser.username;
      if (displayAvatar) displayAvatar.textContent = (currentUser.fullname || currentUser.username).charAt(0).toUpperCase();
      if (displayStatus) {
        if (currentUser.isOfficial) {
          displayStatus.innerHTML = '<span class="badge badge-official">✔ Học viên chính thức (Telegram Verified)</span>';
        } else {
          displayStatus.innerHTML = '<span class="badge badge-guest">Học viên thường (Chưa xác thực OTP)</span>';
        }
      }
    } else {
      if (nameInput) nameInput.value = 'Khách Vãng Lai';
      if (emailInput) emailInput.value = 'khach@eurus.edu.vn';
      if (usernameInput) usernameInput.value = 'khach';
      if (phoneInput) phoneInput.value = 'Chưa đăng nhập';
      if (telegramInput) telegramInput.value = 'Chưa liên kết';
      if (displayName) displayName.textContent = 'Khách Vãng Lai';
      if (displayAvatar) displayAvatar.textContent = 'G';
      if (displayStatus) displayStatus.innerHTML = '<span class="badge badge-guest">⚠️ Chế độ Khách (F5 xóa sạch dữ liệu)</span>';
    }

    // Populate Telegram Bot inputs
    if (botUsernameInput) {
      botUsernameInput.value = window.telegramAuthService.getBotUsername();
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
    const phone = document.getElementById('prof-phone') ? document.getElementById('prof-phone').value : '';
    const telegramUser = document.getElementById('prof-telegram') ? document.getElementById('prof-telegram').value : '';

    try {
      window.authService.updateProfile({ fullname, email, phone, telegramUser });
      window.authView.renderUserBadge();
      this.renderView();
      window.app.showToast('Đã lưu thông tin hồ sơ học viên thành công!', 'success');
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }

  async saveBotConfig(event) {
    event.preventDefault();
    const username = document.getElementById('bot-username').value;

    try {
      // Save locally
      window.telegramAuthService.saveBotUsername(username);
      
      // Sync to Supabase
      if (window.supabaseService && window.supabaseService.isConfigured()) {
        const success = await window.supabaseService.updateSetting('telegram_bot_username', username);
        if (success) {
          window.app.showToast('Đã đồng bộ cấu hình Tên Bot Telegram lên Supabase!', 'success');
        } else {
          window.app.showToast('Đã lưu cục bộ (Lỗi đồng bộ lên Supabase!)', 'warning');
        }
      } else {
        window.app.showToast('Đã lưu cấu hình Tên Bot Telegram cục bộ (Offline)!', 'success');
      }
    } catch (e) {
      window.app.showToast(e.message, 'error');
    }
  }
}

window.profileView = new ProfileView();
