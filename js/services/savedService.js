/**
 * SavedService - Manages saved quizzes for revision in LocalStorage.
 */
class SavedService {
  constructor() {
    this.STORAGE_KEY_SAVED = 'eurus_saved_quizzes';
    this.MAX_SAVED = 100;
  }

  getSavedQuizzes(userId = null, searchQuery = '') {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_SAVED);
      let list = raw ? JSON.parse(raw) : [];

      if (userId) {
        list = list.filter(item => item.userId === userId || !item.userId);
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        list = list.filter(item =>
          item.quizTitle.toLowerCase().includes(query)
        );
      }

      return list.sort((a, b) => (b.savedTimestamp || 0) - (a.savedTimestamp || 0));
    } catch (e) {
      console.error('Error reading saved quizzes:', e);
      return [];
    }
  }

  saveQuiz(attempt, user = null) {
    const list = this.getSavedQuizzes();
    
    // Check if already saved
    const existingIndex = list.findIndex(item => item.quizTitle === attempt.quizTitle);
    if (existingIndex !== -1) {
      throw new Error('Bài kiểm tra này đã có trong danh sách Bài Kiểm Tra Đã Lưu!');
    }

    const savedRecord = {
      savedId: 'saved_' + Date.now(),
      quizId: attempt.quizId,
      quizTitle: attempt.quizTitle,
      totalQuestions: attempt.totalQuestions,
      savedDate: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      savedTimestamp: Date.now(),
      scorePercentage: attempt.scorePercentage,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      skippedCount: attempt.skippedCount,
      userId: user ? user.id : 'guest',
      // Reconstruct question list for re-taking
      questions: attempt.details.map((d, idx) => ({
        id: d.questionId || 'q_' + (idx + 1),
        number: d.number || (idx + 1),
        questionText: d.questionText,
        options: d.options,
        correctAnswerIndex: d.correctAnswer,
        explanation: d.explanation
      }))
    };

    list.unshift(savedRecord);
    if (list.length > this.MAX_SAVED) {
      list.length = this.MAX_SAVED;
    }

    localStorage.setItem(this.STORAGE_KEY_SAVED, JSON.stringify(list));
    return savedRecord;
  }

  deleteSavedQuiz(savedId) {
    const list = this.getSavedQuizzes();
    const filtered = list.filter(item => item.savedId !== savedId);
    localStorage.setItem(this.STORAGE_KEY_SAVED, JSON.stringify(filtered));
    return true;
  }
}

window.savedService = new SavedService();
