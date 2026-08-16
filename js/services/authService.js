/**
 * AuthService - Manages student authentication, registration, session state, and profile updates.
 */
class AuthService {
  constructor() {
    this.STORAGE_KEY_USERS = 'eurus_quiz_users';
    this.STORAGE_KEY_SESSION = 'eurus_quiz_session';
    this.initDefaultAdmin();
  }

  // Seed a default official student account for instant demo use
  initDefaultAdmin() {
    const users = this.getAllUsers();
    if (users.length === 0) {
      const demoStudent = {
        id: 'user_official_1',
        username: 'hocvien',
        email: 'hocvien@eurus.edu.vn',
        fullname: 'Nguyễn Văn Học Viên',
        phone: '0901234567',
        telegramUser: '@hocvien_eurus',
        isOfficial: true,
        passwordHash: this.hashPassword('123456'),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify([demoStudent]));
    }
  }

  // Basic mock hashing function for passwords
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'sha256_mock_' + Math.abs(hash).toString(16);
  }

  getAllUsers() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading users from LocalStorage:', e);
      return [];
    }
  }

  register({ username, email, password, fullname, isOfficial = false, telegramUser = '', phone = '', telegramId = '' }) {
    const users = this.getAllUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate username or email
    const exists = users.find(u => u.username === cleanUsername || u.email === cleanEmail);
    if (exists) {
      throw new Error('Tên đăng nhập hoặc Email này đã tồn tại trên hệ thống!');
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username: cleanUsername,
      email: cleanEmail,
      fullname: fullname.trim(),
      phone: (phone || '').trim(),
      telegramUser: (telegramUser || '').trim(),
      telegramId: (telegramId || '').trim(),
      isOfficial: !!isOfficial,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));

    // Auto login
    this.setSession(newUser);
    return newUser;
  }

  login(usernameOrEmail, password) {
    const users = this.getAllUsers();
    const inputClean = usernameOrEmail.trim().toLowerCase();
    const inputHash = this.hashPassword(password);

    const user = users.find(
      u => (u.username === inputClean || u.email === inputClean) && u.passwordHash === inputHash
    );

    if (!user) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }

    this.setSession(user);
    return user;
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  isOfficialUser() {
    const user = this.getCurrentUser();
    return !!(user && user.isOfficial);
  }

  setSession(user) {
    const sessionData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      phone: user.phone || '',
      telegramUser: user.telegramUser || '',
      telegramId: user.telegramId || '',
      isOfficial: !!user.isOfficial,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(sessionData));
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY_SESSION);
  }

  updateProfile({ fullname, email, phone = '', telegramUser = '', telegramId = '' }) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Vui lòng đăng nhập trước khi cập nhật hồ sơ!');

    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
      users[userIndex].fullname = fullname.trim();
      users[userIndex].email = email.trim().toLowerCase();
      if (phone) users[userIndex].phone = phone.trim();
      if (telegramUser) users[userIndex].telegramUser = telegramUser.trim();
      if (telegramId) users[userIndex].telegramId = telegramId.trim();
      localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));

      // Update active session
      currentUser.fullname = users[userIndex].fullname;
      currentUser.email = users[userIndex].email;
      currentUser.phone = users[userIndex].phone;
      currentUser.telegramUser = users[userIndex].telegramUser;
      currentUser.telegramId = users[userIndex].telegramId;
      localStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(currentUser));
    }
    return currentUser;
  }
}

window.authService = new AuthService();
