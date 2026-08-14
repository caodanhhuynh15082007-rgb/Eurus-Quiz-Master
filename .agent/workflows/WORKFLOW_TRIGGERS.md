# 🚀 SHORTCUT WORKFLOW TRIGGERS (LỆNH TẮT TỰ ĐỘNG V2.4)

Khi người dùng gõ lệnh Slash hoặc các cụm từ tiếng Việt / tiếng Anh dưới đây, Agent BẮT BUỘC tự động thực thi đúng Workflow tương ứng:

---

### 1. `start` / `@init` / `/init` / `đầu ngày` (Bắt Đầu / Onboard Phiên Mới)
**Hành động tự động của Agent:**
1. Đọc `AGENTS.md` và `.agent/workflows/active_context.md` để nạp ngay bối cảnh & 7-tab/module architecture.
2. Kiểm tra dự án thuộc **Trạng Thái Nào** (State 1: Mới | State 2: Đang làm dở | State 3: Đã xong/Fork).
3. Chạy test runner cô lập `/test` để xác nhận sức khỏe hệ thống.
4. Báo cáo ngắn 3 dòng:
   - 🟢 Trạng thái hệ thống & Checkpoint gần nhất.
   - 📌 Công việc / Feature đang thực hiện.
   - ❓ Sẵn sàng nhận nhiệm vụ mới.

---

### 2. `continue` / `@resume` / `/resume` / `tiếp tục` (Tiếp Tục Phiên Giữa Chừng)
**Hành động tự động của Agent:**
1. Đọc nhanh checkpoint cuối cùng trong `.agent/workflows/active_context.md`.
2. Tóm tắt ngắn 2-3 dòng công việc đang làm dở dang.
3. Bắt tay vào làm ngay task tiếp theo trong Ma Trận Task.

---

### 3. `save` / `end` / `@ship` / `/ship` / `cuối ngày` / `xong rồi` (Tự Động Kết Thúc & Đóng Gói)
**Hành động tự động của Agent (Auto-Pilot Pipeline):**
1. Tổng hợp toàn bộ thay đổi file, feature mới, lỗi phát sinh & bài học kinh nghiệm.
2. Nối (append) checkpoint mới vào `.agent/workflows/active_context.md` và `.agent/workflows/history_archive.md`.
3. Chạy test runner cô lập `/test`.
4. Tự động thực hiện `git add .`, `git commit -m "feat: [summary]"` và `git push origin main`.
5. Trả ra báo cáo tóm tắt ngắn gọn các file đã thay đổi cho người dùng!

---

### 4. `fork` / `@branch` / `phát triển mới` (Nâng Cấp / Fork Ý Tưởng Mới)
**Hành động tự động của Agent:**
1. Cất các Spec cũ vào `.agent/specs/archive/`.
2. Tạo nhánh Git mới hoặc mở Phase mới trong `.agent/docs/ROADMAP.md`.
3. Cập nhật `active_context.md` sẵng sàng cho ý tưởng mới mà bảo tồn 100% tri thức cũ.
