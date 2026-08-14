/**
 * TxtParserService - Parses raw TXT files into structured quiz question banks with error diagnostics.
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

      // 1. Detect Question Header (e.g., "Câu 1: HTML là gì?", "1. HTML là gì?", "Question 1: ...")
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

      // 2. Detect Options (e.g., "A. Option 1", "B) Option 2", "a. Option")
      const optMatch = line.match(/^([A-D])[\.\:\)]\s*(.*)/i);
      if (optMatch) {
        const optionText = optMatch[2].trim();
        currentQuestion.options.push(optionText);
        continue;
      }

      // 3. Detect Answer Key (e.g., "Đáp án: A", "ANSWER: B", "Key: C", "ĐÁP ÁN A")
      const ansMatch = line.match(/^(?:Đáp\s*án|Answer|Key|ĐÁP\s*ÁN)[\:\s]+([A-D])/i);
      if (ansMatch) {
        const letter = ansMatch[1].toUpperCase();
        const charCodeOffset = letter.charCodeAt(0) - 65; // A -> 0, B -> 1, C -> 2, D -> 3
        currentQuestion.correctAnswerIndex = charCodeOffset;
        continue;
      }

      // 4. Detect Explanation (e.g., "Lời giải: ...", "Giải thích: ...")
      const expMatch = line.match(/^(?:Lời\s*giải|Giải\s*thích|Explanation)[\:\s]+(.*)/i);
      if (expMatch) {
        currentQuestion.explanation = expMatch[1].trim();
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
   * Generates a sample formatted TXT text string for demo testing.
   */
  getSampleTxtContent() {
    return `Câu 1: Ngôn ngữ lập trình nào phổ biến nhất cho phát triển Web Frontend?
A. Python
B. JavaScript
C. C++
D. Java
Đáp án: B
Lời giải: JavaScript là ngôn ngữ duy nhất chạy mặc định trên tất cả trình duyệt web hiện đại.

Câu 2: HTML viết tắt của từ nào sau đây?
A. HyperText Markup Language
B. High Tech Modern Language
C. Hyperlink Text System
D. Home Tool Markup
Đáp án: A
Lời giải: HTML đại diện cho HyperText Markup Language, định dạng cấu trúc cho trang web.

Câu 3: CSS được sử dụng chính để làm gì trong phát triển Web?
A. Quản lý cơ sở dữ liệu
B. Xử lý logic máy chủ (Backend)
C. Định kiểu giao diện và bố cục trang web
D. Biên dịch mã nguồn ứng dụng
Đáp án: C
Lời giải: CSS (Cascading Style Sheets) phụ trách màu sắc, font chữ, layout và hiệu ứng giao diện.

Câu 4: Giao thức bảo mật mã hóa truy cập Web tiêu chuẩn hiện nay là gì?
A. HTTP
B. FTP
C. HTTPS
D. SMTP
Đáp án: C
Lời giải: HTTPS (HTTP Secure) sử dụng SSL/TLS để mã hóa dữ liệu truyền giữa client và server.

Câu 5: Trong JavaScript, từ khóa nào khai báo một hằng số không thể gán lại giá trị?
A. var
B. let
C. const
D. static
Đáp án: C
Lời giải: Tuần thủ ES6, const được dùng để khai báo hằng số cố định.`;
  }
}

window.txtParserService = new TxtParserService();
