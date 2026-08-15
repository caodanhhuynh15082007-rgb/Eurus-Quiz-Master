/**
 * AuthView - Handles UI interactions for Login, Registration, Telegram OTP Verification, and Official Badges.
 */
class AuthView {
  constructor() {
    this.activeTab = 'login';
    this.otpTimerInterval = null;
  }

  init() {
    this.renderUserBadge();
    this.setupOtpInputAutoJump();
  }

  setupOtpInputAutoJump() {
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (!input) continue;

      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length >= 1) {
          e.target.value = val.slice(-1); // keep single digit
          if (i < 6) {
            const next = document.getElementById(`otp-digit-${i + 1}`);
            if (next) next.focus();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 1) {
          const prev = document.getElementById(`otp-digit-${i - 1}`);
          if (prev) {
            prev.focus();
            prev.value = '';
          }
        }
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const officialRegForm = document.getElementById('form-official-register');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const regTabBtn = document.getElementById('tab-register-btn');
    const officialTabBtn = document.getElementById('tab-official-btn');

    if (loginForm) loginForm.style.display = tabName === 'login' ? 'block' : 'none';
    if (regForm) regForm.style.display = tabName === 'register' ? 'block' : 'none';
    if (officialRegForm) officialRegForm.style.display = tabName === 'official' ? 'block' : 'none';

    if (loginTabBtn) loginTabBtn.className = tabName === 'login' ? 'btn btn-primary' : 'btn btn-secondary';
    if (regTabBtn) regTabBtn.className = tabName === 'register' ? 'btn btn-primary' : 'btn btn-secondary';
    if (officialTabBtn) officialTabBtn.className = tabName === 'official' ? 'btn btn-primary' : 'btn btn-secondary';
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
     TELEGRAM BOT OTP OFFICIAL REGISTRATION FLOW
     =================================================================== */

  async startOfficialRegistration(event) {
    event.preventDefault();
    const fullname = document.getElementById('off-fullname').value;
    const username = document.getElementById('off-username').value;
    const email = document.getElementById('off-email').value;
    const password = document.getElementById('off-password').value;
    const phone = document.getElementById('off-phone').value;
    const telegramUser = document.getElementById('off-telegram').value;
    const telegramChatId = document.getElementById('off-chat-id') ? document.getElementById('off-chat-id').value : '';

    const btn = document.getElementById('btn-submit-official-req');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang kết nối Bot Telegram...';
    }

    try {
      const result = await window.telegramAuthService.requestRegistrationOtp({
        fullname,
        username,
        email,
        password,
        phone,
        telegramUser,
        telegramChatId
      });

      this.openOtpModal(result);
      window.app.showToast(result.deliveryMessage || 'Đã phát mã xác thực 6 số!', 'success');
    } catch (err) {
      window.app.showToast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Xác Nhận & Nhận Mã OTP Qua Telegram';
      }
    }
  }

  openOtpModal(otpResult) {
    const modal = document.getElementById('telegram-otp-modal');
    const botLink = document.getElementById('telegram-bot-direct-link');
    const demoOtpDisplay = document.getElementById('demo-otp-preview');

    if (botLink) {
      botLink.href = `https://t.me/${otpResult.botUsername || 'EurusQuizBot'}`;
      botLink.textContent = `@${otpResult.botUsername || 'EurusQuizBot'}`;
    }

    if (demoOtpDisplay) {
      demoOtpDisplay.textContent = otpResult.otpCode;
    }

    // Reset OTP inputs
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input) input.value = '';
    }
    const first = document.getElementById('otp-digit-1');
    if (first) setTimeout(() => first.focus(), 150);

    // Start 180s countdown timer
    this.startOtpCountdown(180);

    if (modal) modal.classList.add('active');
  }

  closeOtpModal() {
    const modal = document.getElementById('telegram-otp-modal');
    if (modal) modal.classList.remove('active');
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);
  }

  startOtpCountdown(durationSeconds) {
    let timeLeft = durationSeconds;
    const timerElem = document.getElementById('otp-countdown-text');
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);

    const updateText = () => {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      if (timerElem) {
        timerElem.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      if (timeLeft <= 0) {
        clearInterval(this.otpTimerInterval);
        if (timerElem) timerElem.textContent = '00:00 (Mã đã hết hạn)';
      }
      timeLeft--;
    };

    updateText();
    this.otpTimerInterval = setInterval(updateText, 1000);
  }

  submitOtpVerification(event) {
    if (event) event.preventDefault();

    let otpCode = '';
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input) otpCode += input.value.trim();
    }

    if (otpCode.length !== 6) {
      window.app.showToast('Vui lòng nhập đầy đủ 6 chữ số mã xác thực!', 'error');
      return;
    }

    try {
      const userPayload = window.telegramAuthService.verifyOtp(otpCode);
      
      // Register official account
      const newUser = window.authService.register({
        ...userPayload,
        isOfficial: true
      });

      this.closeOtpModal();
      this.renderUserBadge();
      window.app.showToast(`🎉 Chúc mừng ${newUser.fullname}! Bạn đã trở thành Học Viên Chính Thức. Toàn bộ Lịch Sử & Bài Đã Lưu sẽ được bảo lưu vĩnh viễn!`, 'success');
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

