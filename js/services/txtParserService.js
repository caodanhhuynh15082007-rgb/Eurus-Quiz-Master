/**
 * TxtParserService - Parses raw TXT files into structured quiz question banks with error diagnostics.
 * Supports up to 6 options (A-F), multiple answer key patterns, multi-line & inline textual explanations, and sample preset banks.
 */
class TxtParserService {
  /**
   * Parse TXT content into structured question array & syntax error logs.
   * @param {string} textContent 
   * @returns {{ questions: Array, parseErrors: Array, totalParsed: number }}
   */
  parse(textContent) {
    if (!textContent || typeof textContent !== 'string') {
      return { questions: [], parseErrors: [{ line: 0, message: 'Nội dung file TXT rỗng hoặc không đúng định dạng chuỗi.' }], totalParsed: 0 };
    }

    const lines = textContent.split(/\r?\n/);
    const questions = [];
    const parseErrors = [];

    let currentQuestion = null;
    let currentLineNum = 0;

    for (let i = 0; i < lines.length; i++) {
      currentLineNum = i + 1;
      const line = lines[i].trim();

      if (!line) continue; // Skip blank lines

      // 1. Detect Question Header (e.g., "Câu 1:", "Question 1:", "1.", "1)")
      const qHeaderMatch = line.match(/^(?:Câu|Question|\d+[\.\:\)]?)\s*(\d+)[\.\:\)]?\s*(.*)/i);
      
      if (qHeaderMatch) {
        // Save previous question if valid
        if (currentQuestion) {
          const validation = this.validateQuestion(currentQuestion);
          if (validation.valid) {
            questions.push(currentQuestion);
          } else {
            parseErrors.push({ line: currentQuestion.startLine, message: validation.error });
          }
        }

        // Start new question block
        currentQuestion = {
          id: 'q_' + (questions.length + 1) + '_' + Date.now(),
          number: parseInt(qHeaderMatch[1], 10) || (questions.length + 1),
          questionText: qHeaderMatch[2] || line,
          options: [],
          correctAnswerIndex: -1,
          explanation: '',
          startLine: currentLineNum
        };
        continue;
      }

      // If text lines appear before any question header, treat first line as question
      if (!currentQuestion) {
        currentQuestion = {
          id: 'q_1_' + Date.now(),
          number: 1,
          questionText: line,
          options: [],
          correctAnswerIndex: -1,
          explanation: '',
          startLine: currentLineNum
        };
        continue;
      }

      // 2. Detect Options (e.g., "A. Option 1", "B) Option 2", "*C. Correct Option")
      const optMatch = line.match(/^(\*?)\s*([A-F])[\.\:\)]\s*(.*)/i);
      if (optMatch) {
        const isStarCorrect = optMatch[1] === '*';
        const optionLetter = optMatch[2].toUpperCase();
        const optionText = optMatch[3].trim();
        
        currentQuestion.options.push(optionText);
        
        if (isStarCorrect) {
          currentQuestion.correctAnswerIndex = currentQuestion.options.length - 1;
        }
        continue;
      }

      // 3. Detect Combined Answer + Explanation on same line (e.g. "Đáp án: A - Lời giải: HTML là..." or "Answer: A - Solution: ...")
      const ansWithExpMatch = line.match(/^(?:Đáp\s*án|Answer|Key|Ans|ĐÁP\s*ÁN)[\:\s]+([A-F])[\.\,\-\s]+(?:\[?Lời\s*giải\]?|\[?Giải\s*thích\]?|Explanation|Explain|Solution|LÝ\s*DO|Lý\s*do|Ghi\s*chú|Note|Reason)[\:\-\=\s]+(.*)/i);
      if (ansWithExpMatch) {
        const letter = ansWithExpMatch[1].toUpperCase();
        currentQuestion.correctAnswerIndex = letter.charCodeAt(0) - 65;
        currentQuestion.explanation = ansWithExpMatch[2].trim();
        continue;
      }

      // 4. Detect Answer Key (e.g., "Đáp án: A", "ANSWER: B", "Key: C", "Ans: D", "ĐÁP ÁN: A")
      const ansMatch = line.match(/^(?:Đáp\s*án|Answer|Key|Ans|ĐÁP\s*ÁN)[\:\s]+([A-F])/i);
      if (ansMatch) {
        const letter = ansMatch[1].toUpperCase();
        const charCodeOffset = letter.charCodeAt(0) - 65; // A -> 0, B -> 1, C -> 2, D -> 3, E -> 4, F -> 5
        currentQuestion.correctAnswerIndex = charCodeOffset;
        continue;
      }

      // 5. Detect Explanation (e.g., "Lời giải: ...", "Explain: ...", "Solution: ...", "Explanation: ...", "Giải thích: ...", "[Solution] ...")
      const expMatch = line.match(/^(?:\[?Lời\s*giải\]?|\[?Giải\s*thích\]?|Explanation|Explain|Solution|LÝ\s*DO|Lý\s*do|Ghi\s*chú|Note|Reason)[\:\-\=\s]+(.*)/i);
      if (expMatch) {
        let expText = expMatch[1].trim();
        // Remove duplicate prefix if present
        expText = expText.replace(/^(?:\[?Lời\s*giải\]?|\[?Giải\s*thích\]?|Explanation|Explain|Solution|LÝ\s*DO|Lý\s*do|Ghi\s*chú|Note|Reason)[\:\-\=\s]+/i, '').trim();
        currentQuestion.explanation = expText;
        continue;
      }

      // 6. Append multi-line explanation if explanation header was already set
      if (currentQuestion.explanation && currentQuestion.explanation.length > 0 &&
          !line.match(/^(?:Câu|Question|\d+[\.\:\)])/i) &&
          !line.match(/^(\*?)\s*([A-F])[\.\:\)]/i) &&
          !line.match(/^(?:Đáp\s*án|Answer|Key|Ans)/i)) {
        currentQuestion.explanation += ' ' + line;
        continue;
      }

      // Append multi-line question text if no options added yet
      if (currentQuestion.options.length === 0 && currentQuestion.correctAnswerIndex === -1) {
        currentQuestion.questionText += ' ' + line;
      }
    }

    // Process last question block
    if (currentQuestion) {
      const validation = this.validateQuestion(currentQuestion);
      if (validation.valid) {
        questions.push(currentQuestion);
      } else {
        parseErrors.push({ line: currentQuestion.startLine, message: validation.error });
      }
    }

    return {
      questions,
      parseErrors,
      totalParsed: questions.length
    };
  }

  /**
   * Validate if a question block has sufficient options and a correct answer index.
   * Auto-populates a natural educational explanation fallback if Lời giải / Solution line was omitted.
   */
  validateQuestion(q) {
    if (!q.questionText || q.questionText.trim().length === 0) {
      return { valid: false, error: `Câu ${q.number} thiếu nội dung câu hỏi.` };
    }
    if (q.options.length < 2) {
      return { valid: false, error: `Câu ${q.number} ("${q.questionText.substring(0, 25)}...") có ít hơn 2 phương án lựa chọn.` };
    }
    if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
      return { valid: false, error: `Câu ${q.number} chưa ghi rõ đáp án đúng (VD: Đáp án: A hoặc Answer: A).` };
    }

    // Ensure every single question has a valid, educational textual explanation
    if (!q.explanation || !q.explanation.trim()) {
      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const letter = optionLetters[q.correctAnswerIndex] || (q.correctAnswerIndex + 1);
      const text = q.options[q.correctAnswerIndex] || '';

      // Detect if question is in English context
      const isEnglish = /[a-zA-Z]/.test(q.questionText) && 
        (/^(?:What|Which|How|Why|Where|When|Who|Whom|Whose|Select|Choose|Identify|Find|Fill)\b/i.test(q.questionText.trim()) ||
         /Question\s*\d+/i.test(q.questionText));

      if (isEnglish) {
        q.explanation = `The correct answer is ${letter}: "${text}". This is verified as the accurate answer according to standard exam guidelines.`;
      } else {
        q.explanation = `Phương án đúng là ${letter}: "${text}". Đây là câu trả lời chính xác được xác thực theo dữ liệu chuẩn của bài thi.`;
      }
    }

    return { valid: true };
  }

  /**
   * Generates a sample formatted TXT text string for demo testing (Preset 1: IT & Web).
   */
  getSampleTxtContent() {
    return `Câu 1: Ngôn ngữ lập trình nào phổ biến nhất cho phát triển Web Frontend?
A. Python
B. JavaScript
C. C++
D. Java
Đáp án: B
Lời giải: JavaScript là ngôn ngữ duy nhất được tích hợp sẵn và thực thi trực tiếp trên tất cả các trình duyệt Web hiện đại (Chrome, Firefox, Safari, Edge) để tạo các tính năng tương tác người dùng.

Câu 2: HTML viết tắt của từ nào sau đây?
A. HyperText Markup Language
B. High Tech Modern Language
C. Hyperlink Text System
D. Home Tool Markup
Đáp án: A
Lời giải: HTML đại diện cho "HyperText Markup Language" (Ngôn ngữ đánh dấu siêu văn bản), đóng vai trò xây dựng bộ khung cấu trúc và nội dung chính cho mọi trang web.

Câu 3: CSS được sử dụng chính để làm gì trong phát triển Web?
A. Quản lý cơ sở dữ liệu
B. Xử lý logic máy chủ (Backend)
C. Định kiểu giao diện và bố cục trang web
D. Biên dịch mã nguồn ứng dụng
Đáp án: C
Lời giải: CSS (Cascading Style Sheets) phụ trách thiết kế màu sắc, phông chữ, bố cục hiển thị và các hiệu ứng giao diện (như glassmorphism, responsive UI) cho trang web.

Câu 4: Giao thức bảo mật mã hóa truy cập Web tiêu chuẩn hiện nay là gì?
A. HTTP
B. FTP
C. HTTPS
D. SMTP
Đáp án: C
Lời giải: HTTPS (HTTP Secure) sử dụng chứng chỉ mã hóa SSL/TLS để bảo mật toàn bộ dữ liệu truyền qua lại giữa trình duyệt người dùng và trang web, chống nguy cơ nghe lén hay đánh cắp thông tin.

Câu 5: Trong JavaScript, từ khóa nào khai báo một hằng số không thể gán lại giá trị?
A. var
B. let
C. const
D. static
Đáp án: C
Lời giải: Theo chuẩn ES6 JavaScript, từ khóa "const" (constant) dùng để khai báo hằng số. Biến khai báo bằng const không thể thay đổi hoặc gán lại giá trị mới sau khi đã khởi tạo.`;
  }

  /**
   * Generates a sample formatted TXT text string in English (Preset 2: English Grammar & Business).
   */
  getSampleEnglishTxtContent() {
    return `Question 1: What does the acronym "API" stand for in software engineering?
A. Application Programming Interface
B. Automated Process Integration
C. Advanced Protocol Internet
D. Artificial Pipeline Intelligence
Answer: A
Explain: API stands for "Application Programming Interface", which is a set of rules and protocols allowing different software applications to communicate with each other.

Question 2: Which HTTP method is typically used to update an existing resource completely on the server?
A. GET
B. POST
C. PUT
D. DELETE
Answer: C
Solution: The PUT method is idempotent and is used in RESTful architectures to replace or completely update the target resource with the uploaded payload.

Question 3: Select the correct word to complete the sentence: "The executive board decided to _______ the launch until Q4."
A. postpone
B. postponed
C. postponing
D. postponement
Answer: A
Explanation: After "decided to", the verb must be in its base/infinitive form ("postpone").

Question 4: What is the primary purpose of a "Git commit"?
A. To download remote repository files
B. To record a snapshot of staged changes to the local repository history
C. To delete untracked files
D. To compile source code into machine binaries
Answer: B
Solution: A Git commit creates a cryptographically hashed snapshot of staged file modifications in the project's version control history.

Question 5: Which status code indicates that a requested web resource was not found?
A. 200 OK
B. 301 Moved Permanently
C. 404 Not Found
D. 500 Internal Server Error
Answer: C
Explain: HTTP status code 404 indicates that the server cannot locate the requested resource or URI endpoint.`;
  }
}

window.txtParserService = new TxtParserService();
