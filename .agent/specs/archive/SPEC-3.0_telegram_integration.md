# 📜 SPEC-3.0: Secure Telegram Integration & Verification (Adversarial Design)

> **Status:** UNDER_CHALLENGE | **Feature:** Secure Telegram Client-Side Login & Verification

---

## 🎯 1. BUSINESS REQUIREMENTS & GHERKIN

### 1.1 Current Flow Pain Points (The Challenge)
1. **Security Vulnerability:** The current implementation attempts to send OTP messages via a Telegram Bot API directly from the client browser. If the token is stored in the database or shared, it exposes the Admin's private Bot API Token to any user via DevTools. If kept in `localStorage`, other students cannot access it, making the OTP verification process fail and fall back to local simulation.
2. **Dead Bot:** A bot created on `@BotFather` is unresponsive. If a student messages it, it will not guide them or reply without a webhook server.
3. **High User Friction:** The student must manually find their numeric Chat ID via `@userinfobot`, search for the admin's bot, press Start, and manually copy-paste the Chat ID into the web registration form.

### 1.2 Proposed Flow: Official Telegram Login Widget
Instead of generating and sending OTPs, we integrate the official **Telegram Login Widget**.
* The Admin/Host enters only their public **Telegram Bot Username** in the settings. No private API Token is needed or stored!
* During registration, the student clicks the official **"Log in with Telegram"** button.
* Telegram authenticates the student and returns their Telegram User profile (ID, Username, First Name) directly to the callback.
* The account is instantly verified and registered as an **Official Account**.

### 1.3 Acceptance Criteria (Gherkin Scenarios)

#### Scenario 1: Setup Custom Bot Username without Token
```gherkin
Given a host is on the Profile page
When they enter their custom "Telegram Bot Username" (e.g., MyQuizBot) and click Save
Then the system saves the username in LocalStorage
And no API Token is requested, keeping the system 100% secure
```

#### Scenario 2: One-Click Registration and Verification
```gherkin
Given a student is on the Register page
When they click the "Log in with Telegram" button
And authorize the request in Telegram
Then the Telegram login widget executes the callback with user data (id, username, first_name)
And the system registers the student as an "Official Account (Telegram Verified)"
And populates their name and username automatically
```

---

## 📐 2. TECHNICAL ARCHITECTURE & SECURITY

### 2.1 Telegram Login Widget Script Injection
We will dynamically inject the Telegram Widget script based on the saved `Bot Username` so that the button renders dynamically.

```javascript
// Example dynamic widget loader
function renderTelegramLoginButton(botUsername, containerId, callbackName) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = ''; // clear
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', botUsername);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '10');
  script.setAttribute('data-onauth', callbackName);
  script.setAttribute('data-request-access', 'write');
  
  container.appendChild(script);
}
```

### 2.2 ⛔ Negative Space Boundaries
1. **No Bot Token Exposure:** Under no circumstances should the Telegram Bot Token be entered, stored, or processed on the client browser.
2. **No Manual Chat ID Input:** Students should never be asked to manually search for external ID bots or copy-paste numeric Chat IDs.
3. **Graceful Fallback:** If the widget fails to load (e.g. network block or missing bot username configuration), the system must fallback to standard Username/Password registration (Guest/Regular mode) without blocking the user.

### 2.3 🛡️ Adversarial Audit & Edge-Case Safeguards
1. **Ad-Blocker & Script Blocking Shield:**
   - *Risk:* Brave Shield, uBlock Origin, or other ad-blockers may block the external widget script from `telegram.org`.
   - *Mitigation:* We will set a timeout check. If `window.Telegram` is not loaded within 3 seconds, render a warning banner below the login button area: *"Nếu nút đăng nhập bằng Telegram không hiển thị, vui lòng tắt trình chặn quảng cáo (Adblocker/Brave Shield) cho trang web này."*
2. **Domain Mismatch Safeguard:**
   - *Risk:* Telegram Widget checks the domain against the one configured in `@BotFather` `/setdomain`. If mismatch, it errors out with "Bot domain invalid".
   - *Mitigation:* On localhost/development environment, if the configured domain is mismatch, provide a visible helper link to the Admin on how to temporarily set the domain to `localhost` or create a developer bot.
3. **Database Schema Alignment:**
   - *Risk:* The `users` table lacks a `telegram_id` to uniquely prevent multiple registrations using the same Telegram account.
   - *Mitigation:* Modify `schema.sql` to include `telegram_id TEXT UNIQUE` and enforce uniqueness constraint.

---

## 📝 3. WORK CHECKPOINT MATRIX

### Task 1: UI & Service Clean-up
- [x] `[MODIFY]` [js/services/telegramAuthService.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/services/telegramAuthService.js): Remove token storage and OTP sending logic. Add helper to check configured bot username.
- [x] `[MODIFY]` [index.html](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/index.html): Clean up old OTP verification modal and inputs. Replace them with the Telegram Login Widget container.
- [x] `[MODIFY]` [js/views/authView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/authView.js): Integrate the dynamic Telegram Widget callback to handle user data and register the official account.

### Task 2: Profile Settings Update
- [x] `[MODIFY]` [js/views/profileView.js](file:///c:/Users/ACER/OneDrive/Documents/spec_coding/js/views/profileView.js): Update the Telegram card to ONLY require the public Bot Username and show a link to `@BotFather` instructing how to set `/setdomain`.
