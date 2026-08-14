/**
 * QuizEngineService - Controls active quiz sessions, timers, auto-grading, and transient state recovery.
 */
class QuizEngineService {
  constructor() {
    this.activeQuiz = null;
    this.userAnswers = {}; // questionId -> optionIndex (-1 for skipped)
    this.currentQuestionIndex = 0;
    this.timeSpentSeconds = 0;
    this.timerInterval = null;
    this.onTimerTick = null;
    this.onTimerExpire = null;
    this.STORAGE_KEY_SESSION_QUIZ = 'eurus_active_quiz_session';
  }

  /**
   * Start a fresh quiz session with question bank and duration (seconds or minutes).
   */
  startSession({ quizId, title, questions, durationSeconds = null, durationMinutes = 15 }) {
    if (!questions || questions.length === 0) {
      throw new Error('Bộ câu hỏi trắc nghiệm rỗng!');
    }

    const calculatedSeconds = durationSeconds ? Math.max(5, durationSeconds) : (durationMinutes * 60);

    this.activeQuiz = {
      quizId: quizId || 'quiz_' + Date.now(),
      title: title || 'Bài Trắc Nghiệm TXT',
      questions,
      durationSeconds: calculatedSeconds,
      totalQuestions: questions.length,
      startedAt: new Date().toISOString()
    };

    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    this.timeSpentSeconds = 0;

    // Save transient state to SessionStorage for browser refresh safety
    this.persistTransientState();
    this.startTimer();
    return this.activeQuiz;
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeSpentSeconds++;
      const remainingSeconds = this.activeQuiz.durationSeconds - this.timeSpentSeconds;

      if (this.onTimerTick) {
        this.onTimerTick(remainingSeconds, this.timeSpentSeconds);
      }

      // Check timer expiration
      if (remainingSeconds <= 0) {
        this.stopTimer();
        if (this.onTimerExpire) {
          this.onTimerExpire();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  recordAnswer(questionId, optionIndex) {
    this.userAnswers[questionId] = optionIndex;
    this.persistTransientState();
  }

  skipQuestion(questionId) {
    if (!(questionId in this.userAnswers)) {
      this.userAnswers[questionId] = -1;
    }
    this.persistTransientState();
  }

  persistTransientState() {
    if (!this.activeQuiz) return;
    const state = {
      activeQuiz: this.activeQuiz,
      userAnswers: this.userAnswers,
      currentQuestionIndex: this.currentQuestionIndex,
      timeSpentSeconds: this.timeSpentSeconds
    };
    try {
      sessionStorage.setItem(this.STORAGE_KEY_SESSION_QUIZ, JSON.stringify(state));
    } catch (e) {
      console.warn('SessionStorage state save warning:', e);
    }
  }

  restoreTransientState() {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY_SESSION_QUIZ);
      if (raw) {
        const state = JSON.parse(raw);
        this.activeQuiz = state.activeQuiz;
        this.userAnswers = state.userAnswers || {};
        this.currentQuestionIndex = state.currentQuestionIndex || 0;
        this.timeSpentSeconds = state.timeSpentSeconds || 0;
        this.startTimer();
        return true;
      }
    } catch (e) {
      console.warn('Error restoring transient quiz session:', e);
    }
    return false;
  }

  clearTransientState() {
    this.stopTimer();
    sessionStorage.removeItem(this.STORAGE_KEY_SESSION_QUIZ);
  }

  /**
   * Evaluates answers and produces a graded attempt result payload.
   */
  evaluateGrade() {
    this.stopTimer();
    if (!this.activeQuiz) {
      throw new Error('Không tìm thấy phiên trắc nghiệm hiện tại.');
    }

    const { questions, quizId, title } = this.activeQuiz;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const details = [];

    questions.forEach((q) => {
      const userAnswer = q.id in this.userAnswers ? this.userAnswers[q.id] : -1;
      const isCorrect = userAnswer === q.correctAnswerIndex;

      if (userAnswer === -1) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      details.push({
        questionId: q.id,
        number: q.number,
        questionText: q.questionText,
        options: q.options,
        userAnswer,
        correctAnswer: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation
      });
    });

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const attemptResult = {
      attemptId: 'attempt_' + Date.now(),
      quizId,
      quizTitle: title,
      totalQuestions,
      correctCount,
      wrongCount,
      skippedCount,
      scorePercentage,
      timeSpentSeconds: this.timeSpentSeconds,
      date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      details
    };

    this.clearTransientState();
    return attemptResult;
  }
}

window.quizEngineService = new QuizEngineService();
