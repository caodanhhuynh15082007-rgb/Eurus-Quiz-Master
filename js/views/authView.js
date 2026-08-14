/**
 * AuthView - Handles UI interactions for Login, Registration, and User Badge updates.
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

    if (tabName === 'login') {
      loginForm.style.display = 'block';
      regForm.style.display = 'none';
      loginTabBtn.className = 'btn btn-primary';
      regTabBtn.className = 'btn btn-secondary';
    } else {
      loginForm.style.display = 'none';
      regForm.style.display = 'block';
      loginTabBtn.className = 'btn btn-secondary';
      regTabBtn.className = 'btn btn-primary';
    }
  }

  renderUserBadge() {
    const currentUser = window.authService.getCurrentUser();
    const navUsername = document.getElementById('nav-username');
    const navStatus = document.getElementById('nav-user-status');
    const navAvatar = document.getElementById('nav-avatar');

    if (currentUser) {
      navUsername.textContent = currentUser.fullname || currentUser.username;
      navStatus.textContent = 'Đã đăng nhập';
      navAvatar.textContent = (currentUser.fullname || currentUser.username).charAt(0).toUpperCase();
    } else {
      navUsername.textContent = 'Khách';
      navStatus.textContent = 'Chưa đăng nhập';
      navAvatar.textContent = 'G';
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
      const user = window.authService.register({ username, email, password, fullname });
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
    window.app.showToast('Đã đăng xuất tài khoản thành công.', 'info');
    window.app.router.navigate('auth');
  }
}

window.authView = new AuthView();
