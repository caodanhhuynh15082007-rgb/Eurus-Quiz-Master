/**
 * SupabaseClient - Direct Cloud Database Integration for Eurus Quiz Master.
 * Supports environment variables, window global runtime keys, and resilient LocalStorage fallbacks.
 */

class SupabaseService {
  constructor() {
    this.STORAGE_KEY_URL = 'eurus_supabase_url';
    this.STORAGE_KEY_KEY = 'eurus_supabase_key';

    // 1. Read from Environment (Vite / Node if present), window config, or LocalStorage
    this.supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
                       window.__ENV?.VITE_SUPABASE_URL ||
                       localStorage.getItem(this.STORAGE_KEY_URL) ||
                       '';

    this.supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
                           window.__ENV?.VITE_SUPABASE_ANON_KEY ||
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
    this.supabaseUrl = url.trim();
    this.supabaseAnonKey = anonKey.trim();
    this.initClient();
  }

  /**
   * Universal Helper to Insert Records with fallback
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

  /**
   * Fetch a setting value by key
   */
  async fetchSetting(key) {
    if (!this.client) this.initClient();
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.error(`Supabase Fetch Setting Error [${key}]:`, error);
        return null;
      }
      return data ? data.value : null;
    } catch (err) {
      console.error(`Supabase Network Error fetching setting [${key}]:`, err);
      return null;
    }
  }

  /**
   * Save or update a setting
   */
  async updateSetting(key, value) {
    if (!this.client) this.initClient();
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });

      if (error) {
        console.error(`Supabase Update Setting Error [${key}]:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Supabase Network Error updating setting [${key}]:`, err);
      return false;
    }
  }
}

window.supabaseService = new SupabaseService();
