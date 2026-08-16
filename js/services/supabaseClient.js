/**
 * SupabaseClient - Direct Cloud Database Integration for Eurus Quiz Master.
 * Supports environment variables, window global runtime keys, and resilient LocalStorage fallbacks.
 * Note: system_settings table methods removed (Telegram integration deprecated).
 */

class SupabaseService {
  constructor() {
    this.STORAGE_KEY_URL = 'eurus_supabase_url';
    this.STORAGE_KEY_KEY = 'eurus_supabase_key';

    // Read from window config or LocalStorage
    this.supabaseUrl = window.__ENV?.VITE_SUPABASE_URL ||
                       localStorage.getItem(this.STORAGE_KEY_URL) ||
                       '';

    this.supabaseAnonKey = window.__ENV?.VITE_SUPABASE_ANON_KEY ||
                           localStorage.getItem(this.STORAGE_KEY_KEY) ||
                           '';

    this.client = null;
    this.initClient();
  }

  initClient() {
    if (this.supabaseUrl && this.supabaseAnonKey && window.supabase && window.supabase.createClient) {
      try {
        this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
        console.log('⚡ Connected successfully to Supabase Database!');
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
  }

  isConfigured() {
    return !!(this.supabaseUrl && this.supabaseAnonKey);
  }

  saveConfig(url, anonKey) {
    if (url) localStorage.setItem(this.STORAGE_KEY_URL, url.trim());
    if (anonKey) localStorage.setItem(this.STORAGE_KEY_KEY, anonKey.trim());
    // Fix #6: only assign after guard to avoid .trim() on undefined
    this.supabaseUrl = url ? url.trim() : this.supabaseUrl;
    this.supabaseAnonKey = anonKey ? anonKey.trim() : this.supabaseAnonKey;
    this.initClient();
  }

  /**
   * Universal Helper to Insert Records with offline fallback.
   * Used for quiz_attempts, saved_quizzes, question_feedbacks.
   */
  async insertRecord(tableName, payload) {
    if (!this.client) {
      this.initClient();
    }

    if (!this.client) {
      console.log(`[Supabase Offline Mode] Skipped remote sync to table "${tableName}".`);
      return { success: false, offline: true };
    }

    try {
      const { data, error } = await this.client
        .from(tableName)
        .insert([payload])
        .select();

      if (error) {
        console.error(`Supabase Insert Error [${tableName}]:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✔ Synced record to Supabase [${tableName}]:`, data);
      return { success: true, data };
    } catch (err) {
      console.error(`Supabase Network Error [${tableName}]:`, err);
      return { success: false, error: err.message };
    }
  }
}

window.supabaseService = new SupabaseService();
