/**
 * TelegramAuthService - Handles public Telegram Bot configuration settings.
 * Removes insecure client-side OTP generation and token storage.
 */
class TelegramAuthService {
  constructor() {
    this.STORAGE_KEY_BOT_USERNAME = 'eurus_telegram_bot_username';
    // Default Bot Configuration
    this.defaultBotUsername = 'EurusQuizBot';
  }

  getBotUsername() {
    return localStorage.getItem(this.STORAGE_KEY_BOT_USERNAME) || this.defaultBotUsername;
  }

  saveBotUsername(username) {
    if (username) {
      localStorage.setItem(this.STORAGE_KEY_BOT_USERNAME, username.replace('@', '').trim());
    }
  }
}

window.telegramAuthService = new TelegramAuthService();
