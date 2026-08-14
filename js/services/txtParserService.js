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

      // 3. Detect Combined Answer + Explanation on same line (e.g. "Đáp án: A - Lời giải: HTML là...")
      const ansWithExpMatch = line.match(/^(?:Đáp\s*án|Answer|Key|ĐÁP\s*ÁN)[\:\s]+([A-F])[\.\,\-\s]+(?:Lời\s*giải|Giải\s*thích|Explanation|LÝ\s*DO|Lý\s*do|Ghi\s*chú|Note|Reason)[\:\-\=\s]+(.*)/i);
      if (ansWithExpMatch) {
        const letter = ansWithExpMatch[1].toUpperCase();
        currentQuestion.correctAnswerIndex = letter.charCodeAt(0) - 65;
        currentQuestion.explanation = ansWithExpMatch[2].trim();
        continue;
      }

      // 4. Detect Answer Key (e.g., "Đáp án: A", "ANSWER: B", "Key: C", "ĐÁP ÁN: A")
      const ansMatch = line.match(/^(?:Đáp\s*án|Answer|Key|ĐÁP\s*ÁN)[\:\s]+([A-F])/i);
      if (ansMatch) {
        const letter = ansMatch[1].toUpperCase();
        const charCodeOffset = letter.charCodeAt(0) - 65; // A -> 0, B -> 1, C -> 2, D -> 3, E -> 4, F -> 5
        currentQuestion.correctAnswerIndex = charCodeOffset;
        continue;
      }

      // 5. Detect Explanation (e.g., "Lời giải: ...", "Giải thích: ...", "Explanation: ...", "Lý do: ...")
      const expMatch = line.match(/^(?:Lời\s*giải|Giải\s*thích|Explanation|LÝ\s*DO|Lý\s*do|Ghi\s*chú|Note|Reason)[\:\-\=\s]+(.*)/i);
      if (expMatch) {
        let expText = expMatch[1].trim();
        // Remove duplicate prefix if present
        expText = expText.replace(/^(?:Lời\s*giải|Giải\s*thích|Explanation|LÝ\s*DO|Lý\s*do|Ghi\s*chú|Note|Reason)[\:\-\=\s]+/i, '').trim();
        currentQuestion.explanation = expText;
        continue;
      }

      // 6. Append multi-line explanation if explanation header was already set
      if (currentQuestion.explanation && currentQuestion.explanation.length > 0 &&
          !line.match(/^(?:Câu|Question|\d+[\.\:\)])/i) &&
          !line.match(/^(\*?)\s*([A-F])[\.\:\)]/i) &&
          !line.match(/^(?:Đáp\s*án|Answer|Key)/i)) {
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
   */
  validateQuestion(q) {
    if (!q.questionText || q.questionText.trim().length === 0) {
      return { valid: false, error: `Câu ${q.number} thiếu nội dung câu hỏi.` };
    }
    if (q.options.length < 2) {
      return { valid: false, error: `Câu ${q.number} ("${q.questionText.substring(0, 25)}...") có ít hơn 2 phương án lựa chọn.` };
    }
    if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
      return { valid: false, error: `Câu ${q.number} chưa ghi rõ đáp án đúng (VD: Đáp án: A).` };
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
}

window.txtParserService = new TxtParserService();
