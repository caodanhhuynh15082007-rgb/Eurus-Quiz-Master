-- ==============================================================================
-- EURUS QUIZ MASTER — SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- Bật extension pgcrypto để sinh UUID ngẫu nhiên
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG HỌC VIÊN / NGƯỜI DÙNG (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    fullname TEXT NOT NULL,
    phone TEXT,
    telegram_user TEXT,
    telegram_id TEXT UNIQUE,
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BẢNG LỊCH SỬ KẾT QUẢ BÀI THI (quiz_attempts)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    username TEXT DEFAULT 'Khách',
    quiz_title TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    skipped_count INTEGER NOT NULL,
    score_percentage INTEGER NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    is_official BOOLEAN DEFAULT false,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BẢNG BÀI KIỂM TRA ĐÃ LƯU (saved_quizzes)
CREATE TABLE IF NOT EXISTS public.saved_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    score_percentage INTEGER DEFAULT 0,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BẢNG BÁO CÁO LỖI & GÓP Ý CÂU HỎI (question_feedbacks)
CREATE TABLE IF NOT EXISTS public.question_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_title TEXT,
    question_id TEXT,
    question_text TEXT,
    category TEXT NOT NULL,
    comment TEXT NOT NULL,
    reported_by TEXT DEFAULT 'Khách Vãng Lai',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- KÍCH HOẠT ROW LEVEL SECURITY (RLS) & CHÍNH SÁCH TRUY CẬP (ANON ACCESS)
-- ==============================================================================

-- Bảng users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);

-- Bảng quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on quiz_attempts" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on quiz_attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);

-- Bảng saved_quizzes
ALTER TABLE public.saved_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on saved_quizzes" ON public.saved_quizzes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on saved_quizzes" ON public.saved_quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on saved_quizzes" ON public.saved_quizzes FOR DELETE USING (true);

-- Bảng question_feedbacks
ALTER TABLE public.question_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on question_feedbacks" ON public.question_feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on question_feedbacks" ON public.question_feedbacks FOR INSERT WITH CHECK (true);

-- 5. BẢNG CẤU HÌNH TOÀN CỤC (system_settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cấp quyền đọc ghi công khai cho bảng system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on system_settings" ON public.system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on system_settings" ON public.system_settings FOR UPDATE USING (true);

-- Seed cấu hình mặc định cho tên Bot Telegram
INSERT INTO public.system_settings (key, value)
VALUES ('telegram_bot_username', 'EurusQuizBot')
ON CONFLICT (key) DO NOTHING;
