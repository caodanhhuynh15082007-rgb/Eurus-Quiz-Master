/**
 * AuthView - Handles UI interactions for Login and Registration.
 * Note: Official Telegram account registration has been removed.
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
    const loginTabBtn = document.getElementById('tab-login-btn');
    const regTabBtn = document.getElementById('tab-register-btn');

    if (loginForm) loginForm.style.display = tabName === 'login' ? 'block' : 'none';
    if (regForm) regForm.style.display = tabName === 'register' ? 'block' : 'none';

    if (loginTabBtn) loginTabBtn.className = tabName === 'login' ? 'btn btn-primary' : 'btn btn-secondary';
    if (regTabBtn) regTabBtn.className = tabName === 'register' ? 'btn btn-primary' : 'btn btn-secondary';
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

  handleLogout() {
    window.authService.logout();
    this.renderUserBadge();
    window.app.showToast('Đã đăng xuất tài khoản.', 'info');
    window.app.router.navigate('auth');
  }
}

window.authView = new AuthView();
