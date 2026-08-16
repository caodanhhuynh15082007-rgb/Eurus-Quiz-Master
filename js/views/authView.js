/**
 * AuthView - Handles UI interactions for Login, Registration, Telegram OTP Verification, and Official Badges.
 */
class AuthView {
  constructor() {
    this.activeTab = 'login';
  }

  init() {
    this.renderUserBadge();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const officialRegForm = document.getElementById('official-register-form');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const regTabBtn = document.getElementById('tab-register-btn');
    const officialTabBtn = document.getElementById('tab-official-btn');

    if (loginForm) loginForm.style.display = tabName === 'login' ? 'block' : 'none';
    if (regForm) regForm.style.display = tabName === 'register' ? 'block' : 'none';
    if (officialRegForm) officialRegForm.style.display = tabName === 'official' ? 'block' : 'none';

    if (loginTabBtn) loginTabBtn.className = tabName === 'login' ? 'btn btn-primary' : 'btn btn-secondary';
    if (regTabBtn) regTabBtn.className = tabName === 'register' ? 'btn btn-primary' : 'btn btn-secondary';
    if (officialTabBtn) officialTabBtn.className = tabName === 'official' ? 'btn btn-primary' : 'btn btn-secondary';

    if (tabName === 'official') {
      this.renderTelegramWidget();
    }
  }

  renderUserBadge() {
    const currentUser = window.authService.getCurrentUser();
    const navUsername = document.getElementById('nav-username');
    const navStatus = document.getElementById('nav-user-status');
    const navAvatar = document.getElementById('nav-avatar');

    if (currentUser) {
      navUsername.textContent = currentUser.fullname || currentUser.username;
      if (currentUser.isOfficial) {
        navStatus.innerHTML = '<span style="color: #34d399; font-weight: 600;">✔ Học viên chính thức</span>';
        navAvatar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      } else {
        navStatus.innerHTML = '<span style="color: #fbbf24;">Học viên thường</span>';
        navAvatar.style.background = 'var(--gradient-primary)';
      }
      navAvatar.textContent = (currentUser.fullname || currentUser.username).charAt(0).toUpperCase();
    } else {
      navUsername.textContent = 'Khách (Tạm thời)';
      navStatus.innerHTML = '<span style="color: #f87171;">F5 xóa dữ liệu</span>';
      navAvatar.textContent = 'G';
      navAvatar.style.background = 'rgba(255, 255, 255, 0.1)';
    }
  }

  handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;

    try {
      const user = window.authService.login(usernameInput, passwordInput);
      this.renderUserBadge();
      window.app.showToast(`Chào mừng trở lại, ${user.fullname}!`, 'success');
      window.app.router.navigate('upload');
    } catch (err) {
      window.app.showToast(err.message, 'error');
    }
  }

  handleRegister(event) {
    event.preventDefault();
    const fullname = document.getElementById('reg-fullname').value;
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
      const user = window.authService.register({ username, email, password, fullname, isOfficial: false });
      this.renderUserBadge();
      window.app.showToast(`Đăng ký thành công tài khoản học viên ${user.fullname}!`, 'success');
      window.app.router.navigate('upload');
    } catch (err) {
      window.app.showToast(err.message, 'error');
    }
  }

  /* ===================================================================
     TELEGRAM LOGIN WIDGET INTEGRATION
     =================================================================== */

  async renderTelegramWidget() {
    const container = document.getElementById('telegram-widget-container');
    if (!container) return;

    container.innerHTML = ''; // clear existing widget

    // Set placeholder text
    const placeholder = document.getElementById('telegram-widget-placeholder');
    if (placeholder) {
      placeholder.style.display = 'block';
      placeholder.textContent = 'Đang tải nút xác thực Telegram...';
    }

    // Dynamic bot username discovery from Supabase setting
    let botUsername = window.telegramAuthService.getBotUsername();
    try {
      botUsername = await window.telegramAuthService.syncBotUsername();
    } catch (e) {
      console.warn('Could not fetch Telegram bot username from Supabase, using local fallback:', e);
    }

    // Set global callback for the Widget
    window.onTelegramAuth = (user) => {
      this.handleTelegramAuthSuccess(user);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    const warning = document.getElementById('telegram-widget-warning');
    if (warning) warning.style.display = 'none';

    // Timeout check for Brave Shield or AdBlockers blocking Telegram scripts
    const checkTimeout = setTimeout(() => {
      const iframe = container.querySelector('iframe');
      if (!iframe) {
        if (warning) warning.style.display = 'block';
        if (placeholder) placeholder.textContent = 'Không thể tải nút Telegram. Vui lòng kiểm tra chặn quảng cáo!';
      }
    }, 3500);

    script.onload = () => {
      setTimeout(() => {
        const iframe = container.querySelector('iframe');
        if (iframe) {
          if (placeholder) placeholder.style.display = 'none';
          if (warning) warning.style.display = 'none';
          clearTimeout(checkTimeout);
        }
      }, 300);
    };

    container.appendChild(script);
  }

  handleTelegramAuthSuccess(user) {
    console.log('Telegram verification success:', user);
    
    const fullnameInput = document.getElementById('off-fullname');
    const telegramInput = document.getElementById('off-telegram');
    const telegramIdInput = document.getElementById('off-telegram-id');
    const submitBtn = document.getElementById('btn-submit-official-req');

    if (fullnameInput) {
      fullnameInput.value = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Học Viên Telegram';
      fullnameInput.style.opacity = '1';
    }
    if (telegramInput) {
      telegramInput.value = user.username ? `@${user.username}` : `ID: ${user.id}`;
      telegramInput.style.opacity = '1';
    }
    if (telegramIdInput) {
      telegramIdInput.value = user.id;
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🚀 Hoàn Tất Đăng Ký Tài Khoản';
    }

    window.app.showToast('Xác thực Telegram thành công! Vui lòng hoàn tất đăng ký.', 'success');
  }

  handleOfficialRegister(event) {
    event.preventDefault();
    const email = document.getElementById('off-email').value;
    const password = document.getElementById('off-password').value;
    const fullname = document.getElementById('off-fullname').value;
    const telegramUser = document.getElementById('off-telegram').value;
    const telegramId = document.getElementById('off-telegram-id').value;

    if (!telegramId) {
      window.app.showToast('Vui lòng hoàn tất liên kết xác thực Telegram trước!', 'error');
      return;
    }

    // Auto-generate unique username using email prefix & Telegram ID
    const emailPrefix = email.split('@')[0];
    const username = `${emailPrefix}_${telegramId}`;

    try {
      const user = window.authService.register({
        username,
        email,
        password,
        fullname,
        telegramUser,
        telegramId,
        isOfficial: true
      });

      this.renderUserBadge();
      window.app.showToast(`🎉 Đăng ký thành công! Chào mừng ${user.fullname} đến với Học Viên Chính Thức.`, 'success');
      window.app.router.navigate('upload');
    } catch (err) {
      window.app.showToast(err.message, 'error');
    }
  }

  handleLogout() {
    window.authService.logout();
    this.renderUserBadge();
    window.app.showToast('Đã đăng xuất tài khoản.', 'info');
    window.app.router.navigate('auth');
  }
}

window.authView = new AuthView();

