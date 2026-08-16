/**
 * TelegramAuthService - Handles public Telegram Bot configuration settings.
 * Removes insecure client-side OTP generation and token storage.
 */
class TelegramAuthService {
  constructor() {
    this.STORAGE_KEY_BOT_USERNAME = 'eurus_telegram_bot_username';
    // Default Bot Configuration (must be a valid/active bot as fallback)
    this.defaultBotUsername = 'GetIDBot'; // GetIDBot actually exists on Telegram
    
    // Proactively sync bot username from Supabase
    this.syncBotUsername();
  }

  getBotUsername() {
    return localStorage.getItem(this.STORAGE_KEY_BOT_USERNAME) || this.defaultBotUsername;
  }

  saveBotUsername(username) {
    if (username) {
      localStorage.setItem(this.STORAGE_KEY_BOT_USERNAME, username.replace('@', '').trim());
    }
  }

  async syncBotUsername() {
    if (window.supabaseService && window.supabaseService.isConfigured()) {
      try {
        const remoteValue = await window.supabaseService.fetchSetting('telegram_bot_username');
        if (remoteValue && remoteValue.trim()) {
          this.saveBotUsername(remoteValue.trim());
          console.log(`🤖 Synced Telegram Bot Username from Supabase: @${remoteValue.trim()}`);
          return remoteValue.trim();
        }
      } catch (err) {
        console.warn('Failed to sync bot username from Supabase:', err);
      }
    }
    return this.getBotUsername();
  }
}

window.telegramAuthService = new TelegramAuthService();
