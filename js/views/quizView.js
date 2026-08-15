/**
 * QuizView - Renders the interactive quiz interface, option selectors, timer ticker, and sidebar grid navigator.
 */
class QuizView {
  constructor() {
    this.currentQIndex = 0;
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    // Bind timer callbacks from QuizEngineService
    window.quizEngineService.onTimerTick = (remainingSeconds) => {
      this.renderTimer(remainingSeconds);
    };

    window.quizEngineService.onTimerExpire = () => {
      window.app.showToast('⏱️ Đã hết giờ làm bài! Tự động nộp bài thi...', 'error');
      this.submitQuiz();
    };

    // Unload warning guard for page refresh during active quiz
    window.addEventListener('beforeunload', (e) => {
      if (window.quizEngineService.activeQuiz) {
        e.preventDefault();
        e.returnValue = 'Bạn có chắc chắn muốn rời đi? Tiến trình làm bài trắc nghiệm sẽ bị gián đoạn!';
        return e.returnValue;
      }
    });
  }

  renderView() {
    const session = window.quizEngineService.activeQuiz;
    if (!session || !session.questions || session.questions.length === 0) {
      window.app.showToast('Chưa có bài thi trắc nghiệm nào đang diễn ra!', 'error');
      window.app.router.navigate('upload');
      return;
    }

    this.currentQIndex = window.quizEngineService.currentQuestionIndex || 0;
    
    // Render static header info
    document.getElementById('active-quiz-title').textContent = session.title;
    this.renderQuestion(this.currentQIndex);
    this.renderQuestionGrid();
  }

  renderTimer(seconds) {
    const timerElem = document.getElementById('timer-countdown');
    if (!timerElem) return;

    if (seconds <= 0) {
      timerElem.textContent = '00:00';
      return;
    }

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    timerElem.textContent = formatted;
  }

  renderQuestion(index) {
    const session = window.quizEngineService.activeQuiz;
    if (!session) return;

    const questions = session.questions;
    if (index < 0 || index >= questions.length) return;

    this.currentQIndex = index;
    window.quizEngineService.currentQuestionIndex = index;

    const q = questions[index];
    const userAnswers = window.quizEngineService.userAnswers;
    const selectedOption = q.id in userAnswers ? userAnswers[q.id] : -1;

    // Progress UI
    document.getElementById('quiz-progress-text').textContent = `Câu ${index + 1} / ${questions.length}`;
    const progressPercent = Math.round(((index + 1) / questions.length) * 100);
    document.getElementById('quiz-progress-fill').style.width = `${progressPercent}%`;

    // Question content
    document.getElementById('q-badge').textContent = `CÂU HỎI ${q.number || (index + 1)}`;
    document.getElementById('q-text').textContent = q.questionText;

    // Render option cards
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    q.options.forEach((optText, optIdx) => {
      const isSelected = selectedOption === optIdx;
      const optLetter = optionLetters[optIdx] || String(optIdx + 1);

      const optionDiv = document.createElement('div');
      optionDiv.className = `option-item ${isSelected ? 'selected' : ''}`;
      optionDiv.onclick = () => this.selectOption(q.id, optIdx);

      optionDiv.innerHTML = `
        <div class="option-letter">${optLetter}</div>
        <div class="option-label">${this.escapeHtml(optText)}</div>
      `;
      optionsContainer.appendChild(optionDiv);
    });

    // Prev / Next button state
    document.getElementById('btn-prev-q').disabled = index === 0;
    document.getElementById('btn-prev-q').style.opacity = index === 0 ? '0.5' : '1';

    this.renderQuestionGrid();
  }

  selectOption(questionId, optionIdx) {
    window.quizEngineService.recordAnswer(questionId, optionIdx);
    this.renderQuestion(this.currentQIndex);
  }

  skipQuestion() {
    const session = window.quizEngineService.activeQuiz;
    if (!session) return;

    const q = session.questions[this.currentQIndex];
    window.quizEngineService.skipQuestion(q.id);
    this.nextQuestion();
  }

  nextQuestion() {
    const session = window.quizEngineService.activeQuiz;
    if (!session) return;

    if (this.currentQIndex < session.questions.length - 1) {
      this.renderQuestion(this.currentQIndex + 1);
    } else {
      window.app.showToast('Bạn đã ở câu hỏi cuối cùng! Nhấp "Nộp Bài Thi Ngay" để hoàn thành.', 'info');
    }
  }

  prevQuestion() {
    if (this.currentQIndex > 0) {
      this.renderQuestion(this.currentQIndex - 1);
    }
  }

  renderQuestionGrid() {
    const session = window.quizEngineService.activeQuiz;
    const gridContainer = document.getElementById('question-nav-grid');
    if (!session || !gridContainer) return;

    gridContainer.innerHTML = '';
    const userAnswers = window.quizEngineService.userAnswers;

    session.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      const isAnswered = q.id in userAnswers && userAnswers[q.id] !== -1;
      const isCurrent = idx === this.currentQIndex;

      let btnClass = 'nav-q-btn';
      if (isAnswered) btnClass += ' answered';
      if (isCurrent) btnClass += ' current';

      btn.className = btnClass;
      btn.textContent = idx + 1;
      btn.onclick = () => this.renderQuestion(idx);

      gridContainer.appendChild(btn);
    });
  }

  confirmSubmit() {
    const session = window.quizEngineService.activeQuiz;
    if (!session) return;

    const answeredCount = Object.values(window.quizEngineService.userAnswers).filter(val => val !== -1).length;
    const totalCount = session.questions.length;
    const unAnswered = totalCount - answeredCount;

    let confirmMsg = `Bạn đã làm ${answeredCount}/${totalCount} câu.`;
    if (unAnswered > 0) {
      confirmMsg += ` Còn ${unAnswered} câu chưa trả lời.`;
    }
    confirmMsg += '\nBạn có chắc chắn muốn nộp bài ngay không?';

    if (confirm(confirmMsg)) {
      this.submitQuiz();
    }
  }

  async submitQuiz() {
    try {
      const attemptResult = window.quizEngineService.evaluateGrade();
      const currentUser = window.authService.getCurrentUser();
      
      // 1. Save local history log
      window.historyService.saveAttempt(attemptResult, currentUser);

      // 2. Cloud Sync to Supabase Database (quiz_attempts)
      if (window.supabaseService) {
        window.supabaseService.insertRecord('quiz_attempts', {
          user_id: currentUser ? currentUser.id : 'guest',
          username: currentUser ? (currentUser.fullname || currentUser.username) : 'Khách',
          quiz_title: attemptResult.quizTitle,
          total_questions: attemptResult.totalQuestions,
          correct_count: attemptResult.correctCount,
          wrong_count: attemptResult.wrongCount,
          skipped_count: attemptResult.skippedCount,
          score_percentage: attemptResult.scorePercentage,
          time_spent_seconds: attemptResult.timeSpentSeconds,
          is_official: !!(currentUser && currentUser.isOfficial),
          details: attemptResult.details
        }).then(res => {
          if (res && res.success) {
            window.app.showToast('☁️ Đã đồng bộ kết quả bài thi lên đám mây Supabase!', 'success');
          }
        });
      }

      window.app.showToast('Đã nộp bài thành công! Đang chuyển đến bảng kết quả...', 'success');
      
      // Render result view using correct window.resultView reference
      window.resultView.renderResult(attemptResult);
      window.app.router.navigate('result');
    } catch (e) {
      window.app.showToast('Lỗi khi nộp bài: ' + e.message, 'error');
    }
  }

  escapeHtml(str) {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}

window.quizView = new QuizView();
