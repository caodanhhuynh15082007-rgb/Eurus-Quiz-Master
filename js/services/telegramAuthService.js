/**
 * TelegramAuthService - Handles 6-digit OTP generation, Telegram Bot API dispatching,
 * countdown timers, and official account verification.
 */
class TelegramAuthService {
  constructor() {
    this.STORAGE_KEY_BOT_TOKEN = 'eurus_telegram_bot_token';
    this.STORAGE_KEY_BOT_USERNAME = 'eurus_telegram_bot_username';
    this.STORAGE_KEY_PENDING_REG = 'eurus_pending_official_reg';

    // Default Bot Configuration (can be updated via UI or admin settings)
    this.defaultBotUsername = 'EurusQuizBot';
    this.activeOtp = null; // { code: '123456', expiresAt: timestamp, payload: {} }
  }

  getBotToken() {
    return localStorage.getItem(this.STORAGE_KEY_BOT_TOKEN) || '';
  }

  saveBotToken(token) {
    if (token) {
      localStorage.setItem(this.STORAGE_KEY_BOT_TOKEN, token.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY_BOT_TOKEN);
    }
  }

  getBotUsername() {
    return localStorage.getItem(this.STORAGE_KEY_BOT_USERNAME) || this.defaultBotUsername;
  }

  saveBotUsername(username) {
    if (username) {
      localStorage.setItem(this.STORAGE_KEY_BOT_USERNAME, username.replace('@', '').trim());
    }
  }

  /**
   * Generate a random 6-digit OTP valid for 3 minutes (180s)
   */
  generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Initiates official registration by creating OTP and sending it via Telegram Bot API or simulation.
   * @param {Object} payload { fullname, username, email, password, telegramUser, phone, telegramChatId }
   */
  async requestRegistrationOtp(payload) {
    if (!payload.telegramUser && !payload.phone) {
      throw new Error('Vui lòng cung cấp Username Telegram (hoặc Chat ID) và Số điện thoại!');
    }

    const otp = this.generateOtpCode();
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes validity

    this.activeOtp = {
      code: otp,
      expiresAt,
      payload
    };

    // Store in session storage for resilience
    sessionStorage.setItem(this.STORAGE_KEY_PENDING_REG, JSON.stringify(this.activeOtp));

    // Dispatch via Telegram Bot if token and chat ID/username are available
    const botToken = this.getBotToken();
    const targetChat = payload.telegramChatId || (payload.telegramUser ? payload.telegramUser.replace('@', '') : '');

    let sendSuccess = false;
    let deliveryMessage = '';

    if (botToken && targetChat) {
      try {
        const textMessage = `🎓 <b>EURUS QUIZ MASTER — MÃ XÁC THỰC</b>\n\nXin chào <b>${payload.fullname}</b>,\nMã xác nhận (OTP) để tạo Tài Khoản Chính Thức của bạn là:\n\n🔐 <code>${otp}</code>\n\n<i>Mã có hiệu lực trong 3 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai!</i>`;
        
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChat,
            text: textMessage,
            parse_mode: 'HTML'
          })
        });

        const data = await res.json();
        if (data.ok) {
          sendSuccess = true;
          deliveryMessage = `Đã gửi mã xác nhận 6 chữ số đến Telegram (@${targetChat})!`;
        } else {
          console.warn('Telegram Bot API returned error:', data);
          deliveryMessage = `Đã phát mã xác thực. (Ghi chú: Để nhận tin nhắn thực qua Bot, hãy đảm bảo bạn đã mở cuộc trò chuyện với @${this.getBotUsername()})`;
        }
      } catch (err) {
        console.error('Error connecting to Telegram Bot API:', err);
        deliveryMessage = `Đang ở chế độ kết nối nội bộ. Mã xác thực đã sẵn sàng!`;
      }
    } else {
      deliveryMessage = `Mã xác nhận 6 số đã được kích hoạt thành công!`;
    }

    return {
      success: true,
      otpCode: otp, // available for preview/simulation popup
      expiresAt,
      deliveryMessage,
      botUsername: this.getBotUsername()
    };
  }

  /**
   * Verifies the 6-digit OTP code entered by the student.
   * @param {string} inputCode 
   */
  verifyOtp(inputCode) {
    if (!this.activeOtp) {
      const stored = sessionStorage.getItem(this.STORAGE_KEY_PENDING_REG);
      if (stored) {
        this.activeOtp = JSON.parse(stored);
      }
    }

    if (!this.activeOtp) {
      throw new Error('Chưa có yêu cầu gửi mã xác nhận hoặc phiên đăng ký đã hết hạn. Vui lòng bấm nhận mã mới!');
    }

    if (Date.now() > this.activeOtp.expiresAt) {
      this.activeOtp = null;
      sessionStorage.removeItem(this.STORAGE_KEY_PENDING_REG);
      throw new Error('Mã xác thực đã hết hạn sau 3 phút. Vui lòng yêu cầu gửi lại mã!');
    }

    const cleanInput = (inputCode || '').trim();
    if (cleanInput !== this.activeOtp.code) {
      throw new Error('Mã xác nhận gồm 6 chữ số không chính xác. Vui lòng kiểm tra lại tin nhắn Telegram!');
    }

    // Success: Return user registration payload to commit official account
    const userPayload = this.activeOtp.payload;
    this.activeOtp = null;
    sessionStorage.removeItem(this.STORAGE_KEY_PENDING_REG);

    return userPayload;
  }
}

window.telegramAuthService = new TelegramAuthService();
