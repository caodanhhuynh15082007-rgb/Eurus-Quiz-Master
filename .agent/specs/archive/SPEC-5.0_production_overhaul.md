# SPEC-5.0: Production Overhaul (Telegram Removal, Kaspersky CDN Bypass, OLED Dark Theme)

## 📐 1. USER STORIES & GHERKIN SCENARIOS

### Story 1: Pure Client-Side Authentication (No Third-Party Widgets)
As a student of Eurus Quiz Master,
I want to log in and register using simple input credentials,
So that I don't experience broken login widget frames or security suite warnings.

* **Scenario: Authentication View tab initialization**
  Given the student navigates to the Auth View section,
  Then only two tabs ("Đăng Nhập", "Đăng Ký") must be displayed,
  And the "Đăng Nhập" tab and form must be active by default.

* **Scenario: Clean Username/Email input parsing**
  Given the student inputs their credentials in the login or register forms,
  When they submit the form,
  Then all input values must be trimmed of leading and trailing whitespace before verification.

---

### Story 2: 100% Offline/Self-Hosted Assets (Kaspersky CDN Bypass)
As a security-conscious user running antivirus protection (e.g. Kaspersky),
I want the application to load all scripts, styles, and font dependencies from local directories,
So that no external script trackers or CDN hosts trigger browser blocking notifications.

* **Scenario: Library asset loading**
  Given the application bootstrap lifecycle initiates,
  Then `supabase.min.js`, `jspdf.umd.min.js`, `jspdf.plugin.autotable.min.js`, and `xlsx.full.min.js` must be loaded exclusively from the local `js/libs/` directory.

* **Scenario: Local Font Asset Rendering**
  Given the client renders the UI or exports a PDF report,
  Then the fonts "Inter", "Outfit", and "Roboto" must be loaded exclusively from local font files in `css/fonts/` via `@font-face` stylesheet rules,
  And no network fetch calls to `fonts.gstatic.com` or `fonts.googleapis.com` may occur.

---

### Story 3: True OLED Dark Theme
As a night-mode student,
I want a deeper dark theme interface,
So that readability is improved and eye strain is reduced.

* **Scenario: OLED Color Tokens**
  Given the dark theme styles are applied,
  Then `--bg-primary` must resolve to `#070b12` and `--bg-secondary` to `#0d1117`,
  And the body background radial gradients must have an opacity at or below 0.10.

---

## 📐 2. TECHNICAL ARCHITECTURE

### File Topology Changes
* `[NEW]` [supabase.min.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/libs/supabase.min.js)
* `[NEW]` [jspdf.umd.min.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/libs/jspdf.umd.min.js)
* `[NEW]` [jspdf.plugin.autotable.min.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/libs/jspdf.plugin.autotable.min.js)
* `[NEW]` [xlsx.full.min.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/libs/xlsx.full.min.js)
* `[NEW]` [Inter-Regular.ttf](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/fonts/Inter-Regular.ttf)
* `[NEW]` [Outfit-Regular.ttf](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/fonts/Outfit-Regular.ttf)
* `[NEW]` [Roboto-Regular.ttf](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/fonts/Roboto-Regular.ttf)
* `[MODIFY]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html)
* `[MODIFY]` [css/app.css](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/css/app.css)
* `[MODIFY]` [js/views/authView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/authView.js)
* `[MODIFY]` [js/views/profileView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/profileView.js)
* `[MODIFY]` [js/services/supabaseClient.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/supabaseClient.js)
* `[MODIFY]` [js/services/reportExportService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/reportExportService.js)
* `[MODIFY]` [js/services/telegramAuthService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/telegramAuthService.js) (Stub)

---

## ⛔ NEGATIVE SPACE BOUNDARIES
1. **No External CDNs**: Absolutely no script tags referencing external CDN hosts (e.g. `jsdelivr`, `cdnjs`, `unpkg`).
2. **No Telegram Third-Party Requests**: The authentication flow must never query the external `telegram.org` login widget API.
3. **No Dynamic Google Fonts API calls**: No `@import` or `<link>` tags fetching from Google Fonts API at runtime.

---

## 📝 3. WORK CHECKPOINT MATRIX
- [x] **Task 1: Self-Host All Libraries**
  - [x] Download UMD bundles for Supabase, jsPDF, AutoTable, and SheetJS into `js/libs/`
- [x] **Task 2: Self-Host All Font Assets**
  - [x] Download Inter, Outfit, and Roboto TTF files into `css/fonts/`
  - [x] Setup relative `@font-face` rules in `css/app.css`
- [x] **Task 3: Remove Telegram Features**
  - [x] Remove official registration form and login widget container from `index.html`
  - [x] Remove Telegram Config card from profile section
  - [x] Remove widget setup and callback event handlers from `authView.js` and `profileView.js`
- [x] **Task 4: Polish & Secure Codebase**
  - [x] Enforce trim rules on auth inputs
  - [x] Null-guard badge elements to prevent script crashes on page transitions
  - [x] Relabel verified badges to reflect simple registration status
