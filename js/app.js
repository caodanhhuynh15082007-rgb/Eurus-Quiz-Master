/**
 * App.js - Main Application Entrypoint, SPA Router, Global Keyboard Shortcuts & Toast Engine.
 */
class App {
  constructor() {
    this.services = {
      auth: window.authService,
      txtParser: window.txtParserService,
      quizEngine: window.quizEngineService,
      history: window.historyService
    };

    this.views = {
      auth: window.authView,
      upload: window.uploadView,
      quiz: window.quizView,
      result: window.resultView,
      history: window.historyView,
      profile: window.profileView
    };

    this.router = {
      currentView: 'upload',
      navigate: (viewName) => this.switchView(viewName)
    };
  }

  init() {
    console.log('⚡ Bootstrapping Eurus Web Quiz System SPA...');
    
    // Initialize Views
    this.views.auth.init();
    this.views.upload.init();
    this.views.quiz.init();
    this.setupGlobalKeyboardShortcuts();

    // Check transient quiz session recovery on refresh
    const restored = this.services.quizEngine.restoreTransientState();
    if (restored) {
      this.showToast('Khôi phục bài thi trắc nghiệm đang dở dang!', 'info');
      this.switchView('quiz');
    } else {
      this.switchView('upload');
    }
  }

  setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only active during quiz view and when not typing in an input/textarea
      if (this.router.currentView !== 'quiz') return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowLeft') {
        this.views.quiz.prevQuestion();
      } else if (e.key === 'ArrowRight') {
        this.views.quiz.nextQuestion();
      }
    });
  }

  switchView(viewName) {
    const viewSectionId = `view-${viewName}`;
    const targetSection = document.getElementById(viewSectionId);
    if (!targetSection) return;

    // Hide all view sections
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // Update nav buttons active status
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));

    const activeNavBtn = document.getElementById(`nav-${viewName}`);
    if (activeNavBtn) activeNavBtn.classList.add('active');

    // Show target view
    targetSection.classList.add('active');
    this.router.currentView = viewName;
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Trigger view render lifecycle
    if (viewName === 'quiz') {
      this.views.quiz.renderView();
    } else if (viewName === 'history') {
      this.views.history.renderView();
    } else if (viewName === 'profile') {
      this.views.profile.renderView();
    } else if (viewName === 'auth') {
      this.views.auth.renderUserBadge();
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
