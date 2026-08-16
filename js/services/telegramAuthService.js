/**
 * TelegramAuthService - DEPRECATED stub.
 * Telegram Login Widget integration has been removed.
 * Kept as no-op to prevent 404 errors from cached HTML references.
 */
class TelegramAuthService {
  getBotUsername() { return ''; }
  saveBotUsername() {}
  async syncBotUsername() { return ''; }
}

window.telegramAuthService = new TelegramAuthService();
