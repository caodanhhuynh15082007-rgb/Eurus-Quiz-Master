/**
 * HistoryService - Manages persistent quiz attempt history with search filters & quota guards.
 */
class HistoryService {
  constructor() {
    this.STORAGE_KEY_HISTORY = 'eurus_quiz_attempts_history';
    this.MAX_HISTORY_ENTRIES = 100;
  }

  getAttempts(userId = null, searchQuery = '') {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_HISTORY);
      let attempts = raw ? JSON.parse(raw) : [];

      if (userId) {
        attempts = attempts.filter(a => a.userId === userId || !a.userId);
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        attempts = attempts.filter(a =>
          a.quizTitle.toLowerCase().includes(query) ||
          a.date.toLowerCase().includes(query)
        );
      }

      // Sort newest first
      return attempts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (e) {
      console.error('Error loading history from LocalStorage:', e);
      return [];
    }
  }

  saveAttempt(attemptResult, user = null) {
    const attempts = this.getAttempts();
    
    const record = {
      ...attemptResult,
      userId: user ? user.id : 'guest',
      username: user ? user.username : 'Khách'
    };

    attempts.unshift(record);

    // Enforce Negative Space Boundary: Trim beyond MAX_HISTORY_ENTRIES
    if (attempts.length > this.MAX_HISTORY_ENTRIES) {
      attempts.length = this.MAX_HISTORY_ENTRIES;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(attempts));
    } catch (e) {
      console.warn('LocalStorage full, attempting emergency trim:', e);
      // Emergency trim to 30 items
      attempts.length = Math.min(attempts.length, 30);
      localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(attempts));
    }

    return record;
  }

  getAttemptById(attemptId) {
    const attempts = this.getAttempts();
    return attempts.find(a => a.attemptId === attemptId) || null;
  }

  getStudentStats(userId = null) {
    const attempts = this.getAttempts(userId);
    const totalAttempts = attempts.length;
    if (totalAttempts === 0) {
      return { totalAttempts: 0, avgScore: 0, topScore: 0 };
    }

    const totalScore = attempts.reduce((acc, a) => acc + (a.scorePercentage || 0), 0);
    const avgScore = Math.round(totalScore / totalAttempts);
    const topScore = Math.max(...attempts.map(a => a.scorePercentage || 0));

    return { totalAttempts, avgScore, topScore };
  }
}

window.historyService = new HistoryService();
