/**
 * ReportExportService - Handles client-side PDF & Excel reports generation for Eurus Quiz Master.
 * Integrates jsPDF, jsPDF-AutoTable, and SheetJS. Supports dynamic Google Fonts fetch to fix Vietnamese encoding.
 */
class ReportExportService {
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
  }

  async loadUnicodeFont(doc) {
    try {
      // Fetch Roboto Regular from Google Fonts CDN to support Vietnamese characters
      const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf';
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error('CDN response was not ok');
      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to Base64
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);

      // Register with jsPDF Virtual File System (VFS)
      doc.addFileToVFS('Roboto-Regular.ttf', base64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
      console.log('🤖 Loaded Roboto Unicode font successfully for PDF rendering.');
      return true;
    } catch (e) {
      console.warn('Could not load Unicode Roboto font, falling back to Helvetica:', e);
      doc.setFont('helvetica');
      return false;
    }
  }

  async exportAttemptToPDF(attempt) {
    if (!attempt || !attempt.details) {
      window.app.showToast('Không có dữ liệu bài kiểm tra để xuất!', 'error');
      return;
    }

    window.app.showToast('Đang khởi tạo tệp báo cáo PDF...', 'info');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. Load Unicode Font to handle Vietnamese characters
    await this.loadUnicodeFont(doc);

    // 2. Add Header Banner and metadata
    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241); // Primary Indigo color
    doc.text('BÁO CÁO KẾT QUẢ THI - EURUS QUIZ MASTER', 14, 20);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 24, 196, 24);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    let formattedTime = '';
    if (attempt.timeSpentSeconds !== undefined) {
      const m = Math.floor(attempt.timeSpentSeconds / 60);
      const s = attempt.timeSpentSeconds % 60;
      formattedTime = `${m} phút ${s} giây`;
    } else {
      formattedTime = attempt.timeSpent || 'Không rõ';
    }

    doc.text(`Tên bài trắc nghiệm: ${attempt.quizTitle}`, 14, 32);
    doc.text(`Học viên: ${attempt.username || 'Khách'}`, 14, 38);
    doc.text(`Ngày thi: ${attempt.date || 'Không rõ'}`, 14, 44);
    
    // Add Score block on right side
    doc.setFontSize(11);
    doc.text(`Tổng câu hỏi: ${attempt.totalQuestions}`, 130, 32);
    doc.text(`Số câu đúng: ${attempt.correctCount}`, 130, 38);
    
    doc.setFontSize(13);
    doc.setTextColor(16, 124, 65); // Emerald Green
    doc.text(`Điểm số đạt được: ${attempt.scorePercentage}%`, 130, 47);

    doc.line(14, 52, 196, 52);

    // 3. Populate rows for the autoTable
    const rows = attempt.details.map((q, idx) => {
      const qText = this.stripHtml(q.questionText);
      const expl = q.explanation ? `\n\n[Lời giải: ${this.stripHtml(q.explanation)}]` : '';
      const fullQuestionText = `${qText}${expl}`;
      
      const userAnsText = q.userAnswer === -1 ? 'Bỏ qua' : this.stripHtml(q.options[q.userAnswer]);
      const correctAnsText = this.stripHtml(q.options[q.correctAnswer]);
      const status = q.isCorrect ? 'Đúng' : (q.userAnswer === -1 ? 'Bỏ qua' : 'Sai');

      return [
        q.number || (idx + 1),
        fullQuestionText,
        userAnsText,
        correctAnsText,
        status
      ];
    });

    // 4. Generate PDF table
    doc.autoTable({
      head: [['Câu', 'Nội dung câu hỏi & Lời giải', 'Lựa chọn của bạn', 'Đáp án đúng', 'Kết quả']],
      body: rows,
      startY: 58,
      theme: 'striped',
      styles: { 
        font: doc.getFont().fontName, 
        fontSize: 9, 
        cellPadding: 4, 
        valign: 'middle'
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 95 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
        4: { cellWidth: 18, halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.cell.section === 'body') {
          if (data.cell.text[0] === 'Đúng') {
            data.cell.styles.textColor = [16, 124, 65]; // Emerald
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Sai') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [100, 116, 139]; // Slate Gray
          }
        }
      }
    });

    // 5. Save/Download report
    doc.save(`Eurus_BaoCao_${attempt.attemptId}.pdf`);
    window.app.showToast('Đã tải xuống báo cáo PDF bài thi!', 'success');
  }

  exportAttemptToExcel(attempt) {
    if (!attempt || !attempt.details) return;

    const data = attempt.details.map(q => {
      const userAns = q.userAnswer === -1 ? 'Bỏ qua' : this.stripHtml(q.options[q.userAnswer]);
      const correctAns = this.stripHtml(q.options[q.correctAnswer]);
      return {
        'Câu Số': q.number,
        'Nội Dung Câu Hỏi': this.stripHtml(q.questionText),
        'Lựa Chọn Của Bạn': userAns,
        'Đáp Án Đúng': correctAns,
        'Kết Quả': q.isCorrect ? 'Đúng' : (q.userAnswer === -1 ? 'Bỏ qua' : 'Sai'),
        'Giải Thích / Lời Giải': this.stripHtml(q.explanation || '')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chi Tiết Bài Thi');

    // Auto widths mapping
    const maxLen = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = String(row[key] || '');
        maxLen[key] = Math.max(maxLen[key] || key.length, val.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLen).map(key => ({
      wch: Math.min(maxLen[key] + 3, 50)
    }));

    XLSX.writeFile(workbook, `Eurus_ChiTiet_${attempt.attemptId}.xlsx`);
    window.app.showToast('Đã tải xuống bảng điểm Excel bài thi!', 'success');
  }

  async exportHistoryToPDF(attempts) {
    if (!attempts || attempts.length === 0) {
      window.app.showToast('Không có dữ liệu lịch sử để xuất!', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    await this.loadUnicodeFont(doc);

    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241);
    doc.text('BÁO CÁO LỊCH SỬ THI - EURUS QUIZ MASTER', 14, 20);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 24, 196, 24);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tổng số lượt làm bài: ${attempts.length}`, 14, 30);
    doc.text(`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`, 14, 36);

    const rows = attempts.map((a, idx) => {
      let formattedTime = '';
      if (a.timeSpentSeconds !== undefined) {
        const m = Math.floor(a.timeSpentSeconds / 60);
        const s = a.timeSpentSeconds % 60;
        formattedTime = `${m}p ${s}s`;
      } else {
        formattedTime = a.timeSpent || 'Không rõ';
      }

      return [
        idx + 1,
        a.date || '',
        a.username || 'Khách',
        a.quizTitle || '',
        `${a.scorePercentage}% (${a.correctCount}/${a.totalQuestions})`,
        formattedTime
      ];
    });

    doc.autoTable({
      head: [['STT', 'Thời Gian', 'Học Viên', 'Tên Bài Trắc Nghiệm', 'Điểm Số (Tỷ lệ)', 'Thời Gian Làm']],
      body: rows,
      startY: 42,
      theme: 'striped',
      styles: { font: doc.getFont().fontName, fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 30 },
        3: { cellWidth: 68 },
        4: { cellWidth: 36, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' }
      }
    });

    doc.save(`Eurus_LichSuThi_${Date.now()}.pdf`);
    window.app.showToast('Đã tải xuống lịch sử làm bài dạng PDF!', 'success');
  }

  exportHistoryToExcel(attempts) {
    if (!attempts || attempts.length === 0) {
      window.app.showToast('Không có dữ liệu lịch sử để xuất!', 'error');
      return;
    }

    const data = attempts.map(a => {
      let formattedTime = '';
      if (a.timeSpentSeconds !== undefined) {
        const m = Math.floor(a.timeSpentSeconds / 60);
        const s = a.timeSpentSeconds % 60;
        formattedTime = `${m}p ${s}s`;
      } else {
        formattedTime = a.timeSpent || '';
      }

      return {
        'Họ và tên': a.username || 'Khách',
        'Tên Bài Trắc Nghiệm': a.quizTitle,
        'Điểm Số (%)': a.scorePercentage,
        'Số Câu Đúng': a.correctCount,
        'Tổng Số Câu': a.totalQuestions,
        'Thời Gian Làm Bài': formattedTime,
        'Thời Điểm Nộp': a.date
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch Sử Thi');

    // Auto widths mapping
    const maxLen = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = String(row[key] || '');
        maxLen[key] = Math.max(maxLen[key] || key.length, val.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLen).map(key => ({
      wch: maxLen[key] + 3
    }));

    XLSX.writeFile(workbook, `Eurus_LichSuThi_${Date.now()}.xlsx`);
    window.app.showToast('Đã xuất Excel lịch sử thi thành công!', 'success');
  }
}

window.reportExportService = new ReportExportService();
