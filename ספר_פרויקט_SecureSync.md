# ספר פרויקט — SecureSync
### מערכת מאובטחת לאחסון והעברת קבצים בסביבות ארגוניות

---

| | |
|---|---|
| **שם הפרויקט** | SecureSync |
| **שם התלמיד** | [שם פרטי ומשפחה] |
| **מספר ת.ז.** | [מספר] |
| **מורה מנחה** | [שם] |
| **מוסד לימודים** | [שם בית הספר] |
| **שנת לימודים** | תשפ"ו — 2026 |

---

## תוכן עניינים

1. תקציר
2. רקע
   - 2.1 תיאור הפרויקט
   - 2.2 מטרות הפרויקט
   - 2.3 מערכות דומות
   - 2.4 ניתוח SWOT
3. דרישות המערכת
4. סביבת פיתוח וכלים
5. לוח זמנים
6. סקר טכנולוגי
7. ארכיטקטורת המערכת
8. תכנון מסד הנתונים
9. ממשק משתמש — מסכים
10. תכנון מפורט (Top-Down + Agile)
11. ממשק תכנות — API
12. אבטחת מידע
13. Use Cases / UML
14. Screen Flow Diagram
15. בדיקות
16. אתגרים ופתרונות
17. סיכום ומסקנות
18. נספחים

---

## 1. תקציר (Abstract)

SecureSync היא מערכת full-stack לאחסון והעברת קבצים מאובטחת המיועדת לסביבות ארגוניות. הבעיה המרכזית: ארגונים שמעבירים קבצים רגישים חשופים לגניבת מידע — הן מתקפות חיצוניות והן ממפעיל השרת עצמו.

המערכת מיישמת **הצפנה מקצה לקצה (E2E)** בצד הלקוח בלבד, כך שהשרת לא רואה בשום שלב את תוכן הקובץ, שמו, סוגו או גודלו — ארכיטקטורת **Zero-Knowledge**.

**טכנולוגיות מרכזיות:** React, Node.js/Express, MongoDB, Python (ML), AES-256-GCM, TLS 1.3, JWT, WebSocket.

**תכונות עיקריות:** אימות דו-שלבי (2FA), ניהול הרשאות, גרסאות קבצים, זיהוי חריגות עם 4 אלגוריתמים (Z-score, EWMA, Isolation Forest, One-class SVM), דשבורד ניהולי, וניהול מכשירים.

---

## 2. רקע

### 2.1 תיאור הפרויקט

SecureSync נולד מהצורך של ארגונים להעביר קבצים רגישים (מסמכים משפטיים, נתוני לקוחות, קניין רוחני) בלי לסמוך על ספקי ענן שעשויים לסרוק את התוכן.

המערכת בנויה בשלוש שכבות:
- **קליינט (React)** — מצפין קבצים לפני שליחה לשרת
- **שרת (Node.js/Express)** — מאחסן ciphertext בלבד, מנהל הרשאות ואודיט
- **מיקרוסרביס Python** — מנתח דפוסי שימוש וזיהוי חריגות עם Machine Learning

### 2.2 מטרות הפרויקט

| מטרה | פרטים |
|------|-------|
| הצפנת קצה-לקצה | AES-256-GCM בדפדפן לפני העלאה לשרת |
| Zero-Knowledge | השרת לא רואה שם/סוג/תוכן קובץ |
| אימות חזק | JWT + 2FA OTP שנשלח לאימייל |
| הרשאות גישה | שיתוף קבצים עם תפקידים: read / write / admin |
| גרסאות קבצים | שמירת היסטוריית גרסאות לכל קובץ |
| אודיט מלא | רישום כל פעולה עם IP, זמן, תוצאה |
| זיהוי חריגות | 4 אלגוריתמי ML + התראות בזמן אמת |
| ניהול מכשירים | ניטור מכשירים מחוברים, חסימת מכשירים |
| TLS 1.3 | תקשורת מוצפנת בין קליינט לשרת |

### 2.3 מערכות דומות

| מערכת | הצפנת E2E | Zero-Knowledge | Anomaly Detection | ניהול ארגוני |
|-------|-----------|---------------|-------------------|-------------|
| Google Drive | ✗ | ✗ | ✗ | חלקי |
| Dropbox | ✗ | ✗ | ✗ | ✓ |
| ProtonDrive | ✓ | ✓ | ✗ | ✗ |
| OneDrive | ✗ | ✗ | ✗ | ✓ |
| **SecureSync** | **✓** | **✓** | **✓** | **✓** |

**מסקנה:** SecureSync ייחודי בשילוב Zero-Knowledge + Anomaly Detection + דשבורד ניהולי.

### 2.4 ניתוח SWOT

#### 2.4.1 חוזקות (Strengths)
- הצפנה AES-256-GCM בצד הלקוח — השרת לא יכול לקרוא קבצים גם אם נפרץ
- Zero-Knowledge Architecture — metadata מוצפן (שם קובץ, סוג, גודל)
- אימות דו-שלבי (2FA) — מניעת גישה לא מורשית
- 4 אלגוריתמי זיהוי חריגות עם Machine Learning
- חתימה דיגיטלית (RSA) — הגנה מפני שיבוש קבצים
- TLS 1.3 — הצפנת תקשורת מלאה
- אודיט מלא של כל פעולה

#### 2.4.2 חולשות (Weaknesses)
- פרויקט לימודי — לא מוכן לסביבת production
- Self-signed certificates — לא מאושר על ידי CA רשמי
- ריצה מקומית — אין deployment לענן
- אין mobile app

#### 2.4.3 הזדמנויות (Opportunities)
- ביקוש גובר לפתרונות אבטחת מידע בארגונים
- תקנות GDPR ו-HIPAA מחייבות הצפנה
- שוק אחסון הענן הארגוני גדל מדי שנה
- AI ו-ML בתחום הסייבר מתפתח במהירות

#### 2.4.4 איומים (Threats)
- ספקי ענן גדולים (Google, Microsoft, Amazon) עם משאבים עצומים
- מתקפות סייבר מתוחכמות יותר ויותר
- שינויי רגולציה

#### 2.4.5 סיכום SWOT
המערכת מציגה פתרון ייחודי המשלב Zero-Knowledge עם Anomaly Detection — שילוב שלא קיים בפתרונות הקיימים. החולשות הן בעיקר עקב אופי הפרויקט הלימודי.

---

## 3. דרישות המערכת

### דרישות פונקציונליות

| # | דרישה | עדיפות |
|---|-------|--------|
| F1 | רישום משתמש עם אימות אימייל ו-2FA | גבוהה |
| F2 | התחברות עם JWT session management | גבוהה |
| F3 | העלאת קובץ עם הצפנה בדפדפן | גבוהה |
| F4 | הורדת קובץ ופענוח אוטומטי | גבוהה |
| F5 | שיתוף קובץ עם הרשאות (read/write/admin) | גבוהה |
| F6 | גרסאות קבצים — העלאת גרסה חדשה | בינונית |
| F7 | מחיקת קובץ | גבוהה |
| F8 | דשבורד ניהולי עם audit logs | בינונית |
| F9 | התראות בזמן אמת על חריגות (WebSocket) | בינונית |
| F10 | ניהול וחסימת משתמשים/מכשירים | בינונית |
| F11 | ניטור מכשירים (OS, Antivirus, פורטים פתוחים) | נמוכה |

### דרישות לא-פונקציונליות

| # | דרישה | פרטים |
|---|-------|-------|
| NF1 | אבטחה | AES-256-GCM + TLS 1.3 + SHA-256 |
| NF2 | ביצועים | העלאה/הורדה עד 100MB |
| NF3 | זמינות | שרת Node.js עם nodemon |
| NF4 | תחזוקה | קוד מודולרי, ESM modules |
| NF5 | נגישות | ממשק HTML/CSS ללא תלות בספריות UI |

---

## 4. סביבת פיתוח וכלים

| רכיב | כלי / טכנולוגיה | גרסה |
|------|-----------------|------|
| מערכת הפעלה | Windows 11 | — |
| עורך קוד | Visual Studio Code | — |
| שפת לקוח | JavaScript (React 18) | 18 |
| שפת שרת | Node.js + Express | 22 / 5 |
| שפת ML | Python | 3.11 |
| מסד נתונים | MongoDB Atlas | — |
| ניהול גרסאות | Git | — |
| Build Tool | Vite | — |
| מנהל חבילות | npm / pip | — |
| בדיקות API | Postman / Browser DevTools | — |
| ניהול תהליכים | nodemon | — |

---

## 5. לוח זמנים (Gantt)

| שלב | שבועות | משימות |
|-----|--------|--------|
| 1 — אפיון | 1-2 | תכנון ארכיטקטורה, הגדרת דרישות, בחירת טכנולוגיות |
| 2 — תשתית | 3-4 | הקמת שרת Express, MongoDB, ניתוב בסיסי |
| 3 — אימות | 5-6 | JWT, רישום/התחברות, 2FA OTP |
| 4 — הצפנה | 7-8 | WebCrypto AES-256-GCM, העלאה/הורדה |
| 5 — הרשאות | 9-10 | Permission model, שיתוף קבצים, גרסאות |
| 6 — אודיט | 11 | AuditLog, Session management |
| 7 — ML | 12-13 | Python microservice, Z-score, Isolation Forest, SVM |
| 8 — דשבורד | 14 | React Dashboard, WebSocket התראות |
| 9 — מכשירים | 15 | Device model, heartbeat, חסימה |
| 10 — PKI | 16 | RSA key pairs, digital signatures |
| 11 — TLS | 17 | HTTPS, self-signed certificates |
| 12 — סיום | 18 | בדיקות, תיקוני באגים, ספר פרויקט |

---

## 6. סקר טכנולוגי

### 6.1 טכנולוגיות Frontend

**React 18**
- תיאור: ספריית JavaScript לבניית ממשקי משתמש
- יתרונות: component-based, hooks, virtual DOM מהיר
- סיבת בחירה: פופולרי, תמיכה רחבה, מתאים ל-SPA

**WebCrypto API**
- תיאור: API מובנה בדפדפן לפעולות קריפטוגרפיות
- יתרונות: native, ללא ספריות חיצוניות, מהיר, מאובטח
- שימוש בפרויקט: הצפנת AES-256-GCM, RSA-OAEP key wrapping

**Vite**
- תיאור: build tool מודרני לפיתוח React
- יתרונות: HMR מהיר, ESM native, proxy support

### 6.2 טכנולוגיות Backend

**Node.js + Express 5**
- תיאור: שרת JavaScript async
- יתרונות: אותה שפה כמו הקליינט, async I/O, קהילה ענקית
- שימוש: REST API, WebSocket, File serving

**JWT (JSON Web Tokens)**
- תיאור: תקן לאימות stateless
- יתרונות: ניתן לאימות בלי DB, מכיל claims
- שיפור בפרויקט: blacklist של tokens ב-MongoDB (Session model)

**Multer**
- תיאור: middleware לטיפול בקבצים (multipart/form-data)
- שימוש: קבלת קבצים מוצפנים בהעלאה

**Nodemailer**
- תיאור: שליחת אימיילים מ-Node.js
- שימוש: שליחת קוד OTP לאחר התחברות

**ws (WebSocket)**
- תיאור: WebSocket server ל-Node.js
- שימוש: שידור התראות אנומליה בזמן אמת

### 6.3 מסד הנתונים

**MongoDB + Mongoose**
- תיאור: NoSQL document database
- יתרונות: גמישות schema, מהיר לפיתוח, Mongoose ODM
- סיבת בחירה: מתאים לנתונים גמישים (קבצים, permissions, logs)
- מספר models: 20 schemas מוגדרים

### 6.4 אבטחה

**AES-256-GCM**
- סוג: הצפנה סימטרית עם AEAD (Authenticated Encryption)
- מפתח: 256 ביט
- יתרון: מכיל authentication tag — מונע שיבוש ciphertext
- שימוש: הצפנת קובץ + metadata

**RSA-OAEP (2048 bit)**
- סוג: הצפנה אסימטרית
- שימוש: Key Wrapping — הצפנת מפתח AES עם המפתח הציבורי של המשתמש
- תוצאה: רק בעל המפתח הפרטי יכול לפענח

**SHA-256**
- שימוש: חישוב hash של ciphertext לפני שליחה ואימות בשרת
- מטרה: הגנה מפני שיבוש קובץ בדרך (anti-tampering)

**TLS 1.3**
- שימוש: הצפנת כל התקשורת בין קליינט לשרת
- יישום: HTTPS על Node.js עם self-signed certificate

**Digital Signatures (RSA)**
- שימוש: חתימה על כל קובץ שמועלה
- מטרה: אימות שהקובץ לא שונה על דיסק השרת

---

## 7. ארכיטקטורת המערכת

```
┌──────────────────────────────────┐
│          Browser (React)         │
│  WebCrypto: AES-256-GCM encrypt  │
│  RSA-OAEP: key wrapping          │
└────────────┬─────────────────────┘
             │ HTTPS / TLS 1.3
             │ WSS (WebSocket Secure)
┌────────────▼─────────────────────┐
│      Node.js / Express Server    │
│  - JWT Authentication            │
│  - File routes (upload/download) │
│  - Permission management         │
│  - Audit logging                 │
│  - WebSocket broadcast           │
└──────┬──────────────┬────────────┘
       │              │
┌──────▼──────┐  ┌────▼──────────────┐
│  MongoDB    │  │  Python Service   │
│  Atlas      │  │  (port 5001)      │
│  20 models  │  │  Z-score, EWMA,   │
│             │  │  Isolation Forest │
│             │  │  One-class SVM    │
└─────────────┘  └───────────────────┘
```

**עקרון Defense in Depth — שכבות הגנה:**
1. TLS 1.3 — הצפנת תקשורת
2. JWT + 2FA — אימות זהות
3. AES-256-GCM — הצפנת תוכן
4. SHA-256 + RSA Signature — שלמות קובץ
5. Permission model — בקרת גישה
6. Anomaly Detection — זיהוי חריגות
7. Audit Log — נראות ומעקב

---

## 8. תכנון מסד הנתונים

### ERD — מודלים ויחסים

```
User ──< Session (1:N)
User ──< File (1:N)
User ──< AuditLog (1:N)
User ──< Device (1:N)
User ──< KeyPair (1:1)
File ──< Permission (1:N)
File ──< FileVersion (1:N)
```

### מודלים מרכזיים

**User**
```
_id, email (unique), name, passwordHash (bcrypt),
totpSecret, createdAt, updatedAt
```

**File**
```
_id, userId (ref: User), storedName (random hex),
ciphertextSize, ciphertextSha256B64,
algorithm ("AES-GCM"), ivB64, wrappedKeyB64,
encryptedMetaB64, metaIvB64,
signature (RSA), createdAt
```
*הערה: שם הקובץ המקורי מוצפן ב-encryptedMetaB64 — השרת לא יכול לקרוא אותו*

**Permission**
```
_id, fileId (ref: File), grantedTo (ref: User),
grantedBy (ref: User), role (read/write/admin),
expiresAt, revokedAt, riskOverride
```

**AuditLog**
```
_id, userId (ref: User), action (upload/download/delete/share),
outcome (success/failure), ip, fileId, detail, createdAt
```

**Session**
```
_id, userId (ref: User), jti (JWT ID unique),
ip, expiresAt, createdAt
```
*כל logout מבטל את ה-jti מה-DB — JWT blacklist*

**AnomalyScore**
```
_id, userId, action, zScore, ewma, details,
anomaly (boolean), createdAt
```

**Device**
```
_id, userId (ref: User), hostname, os, osVersion,
ipAddress, openPorts (array), antivirus (boolean),
pendingUpdates, status (online/offline), lastSeen
```

**BlockRule**
```
_id, hostname, ipAddress, userId (ref: User),
reason, blockedBy (ref: User), active (boolean),
createdAt
```

**FileVersion**
```
_id, fileId (ref: File), versionNumber,
storedName, ciphertextSize, ciphertextSha256B64,
algorithm, ivB64, wrappedKeyB64,
encryptedMetaB64, metaIvB64, createdAt
```

**KeyPair**
```
_id, userId (ref: User), publicKey (PEM),
privateKeyEnc (encrypted), createdAt
```

---

## 9. ממשק משתמש — מסכים

### 9.1 מסך התחברות / רישום
- שדות: Email, Name (לרישום), Password
- כפתורים: Login, Register
- תמיכה ב-Enter לשליחה
- הודעות שגיאה מתחת לטופס

### 9.2 מסך אימות OTP (2FA)
- תצוגת אימייל שאליו נשלח הקוד
- שדה קוד 4 ספרות (inputMode="numeric")
- כפתור אמת / חזרה
- Auto-focus על השדה

### 9.3 מסך ראשי — ניהול קבצים
- **פס עליון:** כפתור Dashboard + Logout
- **אזור העלאה:** input file + "Encrypt + Upload" + Refresh
- **סטטוס:** הודעות progress / שגיאה
- **התראות WebSocket:** banner עם אנומליות בזמן אמת
- **טבלת קבצים:** originalName | storedName | Algorithm | Created | פעולות
- **פעולות לקובץ בבעלות:** Download+Decrypt | Share | New Version | Delete
- **פעולות לקובץ משותף:** Download+Decrypt | Delete (leave)
- **חלון שיתוף:** אימייל + תפקיד (read/write/admin)
- **חלון גרסה:** input file + upload

### 9.4 דשבורד ניהולי
5 טאבים:
- **Audit Logs** — User | Action | Result | IP | Time
- **Anomaly Scores** — User | Action | Z-Score | Details | Time
- **Active Sessions** — User | IP | Created | Expiry
- **Devices** — Hostname | OS | IP | Open Ports | Antivirus | Last Seen | Status | Pending Updates | Block
- **Users** — Email | Name | Registered | Status | Block/Unblock

### 9.5 התראות אנומליה
- banner קבוע בפינה ימנית עליונה (position: fixed)
- צבע אדום (#c62828), Z-index: 9999
- מציג: userId, action, Z-score, details
- כפתור "סגור התראות"

---

## 10. תכנון מפורט

### 10.1 Top-Down Level Design

```
SecureSync
│
├── Authentication Module
│   ├── POST /users/register → bcrypt hash → send OTP
│   ├── POST /users/login → verify password → send OTP
│   ├── POST /users/verify-otp → validate → create JWT + Session
│   └── POST /users/logout → invalidate Session (jti)
│
├── File Management Module
│   ├── POST /files/upload
│   │   ├── multer → save ciphertext to disk
│   │   ├── validate SHA-256
│   │   ├── sign with RSA private key
│   │   └── save File doc to MongoDB
│   ├── GET /files/ → own files + shared files
│   ├── GET /files/:id/download
│   │   ├── check ownership or Permission
│   │   ├── verify RSA signature
│   │   └── stream ciphertext + x-securesync-meta header
│   └── DELETE /files/:id → unlink file + delete doc + delete permissions
│
├── Permission Module
│   ├── POST /files/:id/share → find user by email → create Permission
│   └── DELETE /files/:id/share/:permId → revoke Permission
│
├── Versioning Module
│   ├── POST /files/:id/versions → save new version
│   └── GET /files/:id/versions → list versions
│
├── Security / PKI Module
│   ├── generateKeyPair() → RSA-2048 → save KeyPair doc
│   ├── signBuffer(data, privateKey) → RSA signature
│   └── verifySignature(data, sig, publicKey) → boolean
│
├── Anomaly Detection Module
│   ├── Node.js: analyzeEvent({userId, action})
│   │   └── POST http://localhost:5001/analyze → Python
│   └── Python Flask:
│       ├── Z-score (statistical)
│       ├── EWMA (time-weighted)
│       ├── Isolation Forest (ML)
│       └── One-class SVM (ML)
│
├── Monitoring Module
│   ├── AuditLog → every action logged
│   ├── WebSocket → broadcast anomaly alerts
│   └── Device heartbeat → update Device doc
│
└── Admin Module
    ├── GET /admin/audit-logs
    ├── GET /admin/anomaly-scores
    ├── GET /admin/sessions
    ├── GET /admin/users
    ├── POST /admin/block → create BlockRule
    └── DELETE /admin/block/:id → deactivate BlockRule
```

### 10.2 מתודולוגיית Agile

הפרויקט פותח ב-Sprints שבועיים:

| Sprint | תוצר |
|--------|------|
| 1 | תשתית שרת + DB |
| 2 | אימות משתמשים (JWT + 2FA) |
| 3 | הצפנת קבצים (WebCrypto) |
| 4 | הרשאות + גרסאות |
| 5 | Audit + Session management |
| 6 | Python anomaly service |
| 7 | WebSocket + Dashboard |
| 8 | Device management + PKI |
| 9 | TLS 1.3 + bug fixes |

### 10.3 מסד הנתונים — גישת Mongoose

כל schema מוגדר עם:
- `timestamps: true` — createdAt/updatedAt אוטומטי
- `ref` לקישור בין מודלים
- `index` על שדות נפוצים לשאילתות

### 10.4 ניהול אבטחה — שכבה בשכבה

```
כל Request ↓
[TLS 1.3 Decryption]
↓
[JWT Verification — jti in DB?]
↓
[BlockRule check — user blocked?]
↓
[Route handler]
↓
[Permission check — owns file or has Permission?]
↓
[SHA-256 / Signature verification]
↓
[AuditLog → analyzeEvent → anomaly?]
↓
[WebSocket broadcast if anomaly]
```

### 10.5 WebSocket Architecture

```
Client connects: ws://localhost:4000?token=JWT
Server: verifies token → maps userId → ws
On anomaly:
  Python → POST /analyze → Node.js
  Node.js: analyzeEvent() → result.anomaly = true
  Node.js: sendToUser(userId, alert) OR broadcast(alert)
  Client: receives → updates state → shows banner
```

---

## 11. ממשק תכנות — API

### 11.1 Authentication Routes

| Method | Route | Auth | תיאור | Response |
|--------|-------|------|-------|---------|
| POST | /users/register | ✗ | רישום משתמש | `{message: "OTP sent"}` |
| POST | /users/login | ✗ | התחברות + שליחת OTP | `{message: "OTP sent"}` |
| POST | /users/verify-otp | ✗ | אימות OTP | `{token: "JWT..."}` |
| POST | /users/logout | ✓ | ביטול session | `{message: "Logged out"}` |

### 11.2 File Routes

| Method | Route | Auth | תיאור | Response |
|--------|-------|------|-------|---------|
| POST | /files/upload | ✓ | העלאת קובץ מוצפן | `{id: "fileId"}` |
| GET | /files/ | ✓ | רשימת קבצים | `[File...]` |
| GET | /files/:id/download | ✓ | הורדת קובץ | binary + x-securesync-meta header |
| DELETE | /files/:id | ✓ | מחיקת קובץ | `{message: "Deleted"}` |

### 11.3 Permission Routes

| Method | Route | Auth | תיאור |
|--------|-------|------|-------|
| POST | /files/:id/share | ✓ | שיתוף קובץ עם משתמש |
| DELETE | /files/:id/share/:permId | ✓ | ביטול שיתוף |
| DELETE | /files/:id/leave | ✓ | עזיבת קובץ משותף |

### 11.4 File Version Routes

| Method | Route | Auth | תיאור |
|--------|-------|------|-------|
| POST | /files/:id/versions | ✓ | העלאת גרסה חדשה |
| GET | /files/:id/versions | ✓ | רשימת גרסאות |

### 11.5 Admin Routes

| Method | Route | Auth | תיאור |
|--------|-------|------|-------|
| GET | /admin/audit-logs | ✓ | לוג כל הפעולות |
| GET | /admin/anomaly-scores | ✓ | ניקודי חריגה |
| GET | /admin/sessions | ✓ | סשנים פעילים |
| GET | /admin/users | ✓ | כל המשתמשים |
| POST | /admin/block | ✓ | חסימת מכשיר / משתמש |
| DELETE | /admin/block/:id | ✓ | ביטול חסימה |

### 11.6 Device Routes

| Method | Route | Auth | תיאור |
|--------|-------|------|-------|
| POST | /devices/heartbeat | ✓ | דיווח מצב מכשיר (OS, Antivirus, Ports) |
| GET | /devices/ | ✓ | רשימת כל המכשירים |

### 11.7 Python Anomaly Service (port 5001)

| Method | Route | תיאור |
|--------|-------|-------|
| POST | /analyze | ניתוח אנומליה עבור userId + action |

**Request body:**
```json
{ "userId": "abc123", "action": "download" }
```

**Response:**
```json
{
  "anomaly": true,
  "zScore": 3.44,
  "details": "download rate 3.44 std above baseline",
  "score": 3.44
}
```

---

## 12. אבטחת מידע — מנגנוני הגנה

### 12.1 הצפנת קבצים — Zero-Knowledge Flow

```
[Client]
1. generateKeyPair(RSA-2048)              ← once per user
2. generateKey(AES-256-GCM)               ← per file
3. encrypt(file, AES_key) → ciphertext
4. encryptMeta({name, type, size}, AES_key) → encryptedMeta
5. wrapKey(AES_key, RSA_publicKey) → wrappedKey
6. SHA256(ciphertext) → hash

[Upload to Server]
→ ciphertext + ivB64 + wrappedKeyB64 + encryptedMetaB64
  + metaIvB64 + ciphertextSha256B64 + algorithm

[Server]
7. verify SHA256(ciphertext) === received hash
8. sign(ciphertext, RSA_privateKey) → signature
9. save File doc (NO plaintext!)

[Download]
[Server]
10. verify signature → detect tampering
11. send ciphertext + meta header

[Client]
12. unwrapKey(wrappedKey, RSA_privateKey) → AES_key
13. decrypt(ciphertext, AES_key) → file
14. decryptMeta(encryptedMeta) → {name, type}
15. trigger download with original filename
```

### 12.2 זיהוי חריגות — Anomaly Detection

4 אלגוריתמים עצמאיים:

| אלגוריתם | עקרון | ספריה |
|---------|-------|-------|
| Z-score | סטיית תקן מהממוצע ההיסטורי | numpy |
| EWMA | ממוצע נע עם דגש על פעולות אחרונות | numpy |
| Isolation Forest | עצי החלטה לזיהוי outliers | sklearn |
| One-class SVM | hyperplane המפריד normal מ-anomaly | sklearn |

**החלטה סופית:** `anomaly = (z_score > 2) OR if_anomaly OR svm_anomaly`

**שמירה:** כל ניתוח נשמר כ-AnomalyScore ב-MongoDB ומוצג בדשבורד.

### 12.3 Session Management
- כל JWT מכיל `jti` (JWT ID) ייחודי
- ה-`jti` נשמר ב-Session collection ב-MongoDB
- Logout: מוחק את ה-Session — JWT לא יתקבל שוב
- `authRequired` middleware: בודק `jti` ב-DB + BlockRule

---

## 13. Use Cases / UML

### 13.1 Use Case Diagram

**Actors:**
- **משתמש רגיל** — מנהל את הקבצים שלו
- **מנהל (Admin)** — ניהול כל המשתמשים והמכשירים

**Use Cases — משתמש:**
- UC-01: התחבר עם 2FA
- UC-02: העלה קובץ מוצפן
- UC-03: הורד וסרוק קובץ
- UC-04: שתף קובץ עם הרשאות
- UC-05: העלה גרסה חדשה
- UC-06: מחק קובץ

**Use Cases — מנהל:**
- UC-07: צפה ב-Audit Logs
- UC-08: צפה בניקודי חריגה
- UC-09: חסום/שחרר מכשיר
- UC-10: חסום/שחרר משתמש
- UC-11: צפה בסשנים פעילים

### 13.2 Use Cases מפורטים

---
**UC-01: התחברות עם 2FA**

| | |
|---|---|
| Actor | משתמש |
| Pre-condition | משתמש רשום במערכת |
| Main Flow | 1. משתמש מזין email + password |
| | 2. שרת מאמת password (bcrypt) |
| | 3. שרת שולח OTP לאימייל |
| | 4. משתמש מזין OTP |
| | 5. שרת מאמת OTP + יוצר JWT + Session |
| | 6. JWT נשמר ב-localStorage |
| Alternative | OTP שגוי → שגיאה, ניסיון חוזר |
| Post-condition | משתמש מחובר עם JWT תקף |

---
**UC-02: העלאת קובץ מוצפן**

| | |
|---|---|
| Actor | משתמש מחובר |
| Pre-condition | משתמש מחובר, קובץ נבחר |
| Main Flow | 1. משתמש בוחר קובץ |
| | 2. WebCrypto מייצר מפתח AES-256 |
| | 3. קובץ ו-metadata מוצפנים |
| | 4. מפתח AES מוצפן עם RSA-OAEP |
| | 5. SHA-256 מחושב על ה-ciphertext |
| | 6. FormData נשלחת לשרת |
| | 7. שרת מאמת SHA-256 |
| | 8. שרת חותם ושומר ב-MongoDB |
| Alternative | SHA-256 לא תואם → שרת דוחה, קובץ נמחק |
| Post-condition | קובץ מוצפן שמור, שרת לא יודע תוכנו |

---
**UC-03: הורדת קובץ**

| | |
|---|---|
| Actor | בעלים / בעל הרשאה |
| Pre-condition | קובץ קיים, למשתמש יש גישה |
| Main Flow | 1. משתמש לוחץ Download |
| | 2. שרת בודק בעלות / Permission |
| | 3. שרת מאמת RSA signature |
| | 4. ciphertext + metadata header נשלחים |
| | 5. קליינט מפענח מפתח AES עם RSA |
| | 6. קובץ מפוענח |
| | 7. הורדה אוטומטית עם שם מקורי |
| Alternative | Signature invalid → 403, קובץ חסום |
| Post-condition | קובץ מפוענח אצל המשתמש |

### 13.3 Class Diagram (עיקרי)

```
┌──────────────┐         ┌──────────────┐
│    User      │1      N │    File      │
│──────────────│─────────│──────────────│
│ _id          │         │ _id          │
│ email        │         │ userId       │
│ name         │         │ storedName   │
│ passwordHash │         │ algorithm    │
│ totpSecret   │         │ ivB64        │
└──────┬───────┘         │ wrappedKeyB64│
       │                 │ encryptedMeta│
       │1              N │ signature    │
       ▼                 └──────┬───────┘
┌──────────────┐                │1
│   Session    │              N │
│──────────────│         ┌──────▼───────┐
│ userId       │         │ Permission   │
│ jti          │         │──────────────│
│ ip           │         │ fileId       │
│ expiresAt    │         │ grantedTo    │
└──────────────┘         │ role         │
                         │ expiresAt    │
┌──────────────┐         └──────────────┘
│  AuditLog    │
│──────────────│         ┌──────────────┐
│ userId       │         │ AnomalyScore │
│ action       │         │──────────────│
│ outcome      │         │ userId       │
│ ip           │         │ action       │
│ detail       │         │ zScore       │
└──────────────┘         │ anomaly      │
                         └──────────────┘
```

### 13.4 Sequence Diagram — Upload

```
User → Client: select file
Client → WebCrypto: generateKey(AES-256)
WebCrypto → Client: AES_key
Client → WebCrypto: encrypt(file, AES_key)
WebCrypto → Client: ciphertext + iv
Client → WebCrypto: wrapKey(AES_key, RSA_pub)
WebCrypto → Client: wrappedKey
Client → Client: SHA256(ciphertext)
Client → Server: POST /files/upload (FormData)
Server → Server: verify SHA256
Server → Server: sign(ciphertext, RSA_priv)
Server → MongoDB: File.create({...})
Server → Python: POST /analyze
Python → Server: {anomaly, zScore}
Server → WebSocket: broadcast if anomaly
Server → Client: {id: fileId}
```

---

## 14. Screen Flow Diagram

```
[מסך Login]
    │
    ├── Register → POST /users/register
    │                    │
    └── Login → POST /users/login
                     │
               [מסך OTP Verify]
                     │
               POST /users/verify-otp
                     │
         ┌──────────────────────────────┐
         │      [מסך קבצים ראשי]        │
         │                              │
         ├── [Upload] → encrypt         │
         │              → POST /upload  │
         │                              │
         ├── [Refresh] → GET /files/    │
         │                              │
         ├── [Download+Decrypt]         │
         │    → GET /:id/download       │
         │    → decrypt → save          │
         │                              │
         ├── [Share] → [Share Dialog]   │
         │    → POST /:id/share         │
         │                              │
         ├── [New Version]              │
         │    → [Version Dialog]        │
         │    → POST /:id/versions      │
         │                              │
         ├── [Delete] → DELETE /:id     │
         │                              │
         └── [Dashboard] ──────────────►│
                │         [Audit Logs]  │
                │         [Anomalies]   │
                │         [Sessions]    │
                │         [Devices]     │
                │              └──[Block/Unblock]
                │         [Users]       │
                │              └──[Block/Unblock]
                └── [← Back]            │
         │                              │
         └── [Logout] → POST /logout    │
                                        │
         [WebSocket Alert Banner] ←─────┘
         (floating, top-right)
```

---

## 15. בדיקות

### 15.1 בדיקות פונקציונליות

| # | תרחיש | פעולה | תוצאה צפויה | ✓/✗ |
|---|-------|-------|------------|-----|
| 1 | רישום משתמש חדש | POST /users/register | OTP נשלח לאימייל | ✓ |
| 2 | OTP שגוי | POST /users/verify-otp | שגיאה 400 | ✓ |
| 3 | OTP נכון | POST /users/verify-otp | JWT מתקבל | ✓ |
| 4 | העלאת קובץ | POST /files/upload | {id: fileId} | ✓ |
| 5 | רשימת קבצים | GET /files/ | מערך קבצים | ✓ |
| 6 | הורדת קובץ | GET /files/:id/download | ciphertext + header | ✓ |
| 7 | פענוח קובץ בדפדפן | WebCrypto | קובץ מקורי | ✓ |
| 8 | שיתוף קובץ | POST /files/:id/share | Permission נוצר | ✓ |
| 9 | גישה לקובץ משותף | GET /files/ (user B) | קובץ מופיע | ✓ |
| 10 | גרסה חדשה | POST /files/:id/versions | גרסה נשמרת | ✓ |
| 11 | מחיקת קובץ | DELETE /files/:id | נמחק מ-DB ומהדיסק | ✓ |
| 12 | Logout | POST /users/logout | Session נמחק | ✓ |

### 15.2 בדיקות אבטחה

| # | תרחיש | תוצאה צפויה | ✓/✗ |
|---|-------|------------|-----|
| 1 | גישה לקובץ של משתמש אחר | 403 Access denied | ✓ |
| 2 | JWT פג תוקף | 401 Unauthorized | ✓ |
| 3 | JWT אחרי logout | 401 Invalid session | ✓ |
| 4 | SHA-256 לא תואם | 400 mismatch | ✓ |
| 5 | RSA signature שגויה | 403 tampering detected | ✓ |
| 6 | משתמש חסום | 403 User is blocked | ✓ |
| 7 | מכשיר חסום | 403 Device is blocked | ✓ |
| 8 | בקשה ללא JWT | 401 | ✓ |

### 15.3 בדיקות Anomaly Detection

**שלבי הבדיקה:**
1. הוספת 59 לוגי AuditLog היסטוריים ל-MongoDB (baseline)
2. הרצת פעולות download רבות בזמן קצר
3. Python service מחשב Z-score, Isolation Forest, SVM
4. תוצאה: Z-score = 3.44 (מעל סף 2.0)
5. anomaly = true → WebSocket broadcast
6. Banner אדום הופיע בקליינט בזמן אמת ✓
7. AnomalyScore נשמר ב-DB ומוצג בדשבורד ✓

---

## 16. אתגרים ופתרונות

| # | אתגר | פתרון |
|---|------|-------|
| 1 | Zero-knowledge: שמירת שם קובץ בלי שהשרת ידע | metadata (שם, סוג, גודל) מוצפן ב-AES בנפרד → encryptedMetaB64 |
| 2 | SHA-256 על ciphertext שמשתנה עם כל הצפנה | חישוב hash על ה-ciphertext הסופי → hash עקבי |
| 3 | np.True_ לא תואם pymongo | עטיפת כל boolean ב-`bool()` לפני שמירה ל-MongoDB |
| 4 | EWMA מייצר יותר מדי False Positives | הסרת EWMA מהחלטה הסופית — שאר 3 אלגוריתמים הספיקו |
| 5 | TLS cert generation — openssl לא מותקן | שימוש ב-npm selfsigned package (async API בגרסה 5) |
| 6 | תיקיות כפולות Server/src vs Server/Src | גילוי שהקוד הפעיל ב-Src (capital S) — תיקון נתיבים |
| 7 | WebSocket מקבל כל חיבור ללא אימות | הוספת token query param → אימות JWT בחיבור |
| 8 | Mongoose deprecation — `new: true` | שינוי ל-`returnDocument: "after"` |
| 9 | result.details.join is not a function | details הוא string, לא array — הסרת `.join()` |
| 10 | דפדפן דוחה self-signed cert | הקלדת `thisisunsafe` על דף השגיאה → ה-exception נשמר |

---

## 17. סיכום ומסקנות

### מה הושג

SecureSync מממש מערכת אבטחת קבצים ארגונית מלאה עם 7 שכבות הגנה (Defense in Depth):

1. **TLS 1.3** — הצפנת כל התקשורת
2. **JWT + 2FA** — אימות זהות חזק
3. **AES-256-GCM** — הצפנת תוכן קצה-לקצה
4. **SHA-256 + RSA Signature** — שלמות קובץ ואנטי-שיבוש
5. **Permission Model** — בקרת גישה מדויקת
6. **Anomaly Detection (4 אלגוריתמים)** — זיהוי חריגות ב-ML
7. **Audit Log מלא** — נראות מלאה על כל פעולה

### לקחים

- **WebCrypto API** עוצמתי ומספיק להצפנה חזקה בדפדפן בלי ספריות חיצוניות
- **Zero-Knowledge** מחייב תכנון קפדני — כל metadata חייב להיות מוצפן
- **Anomaly Detection** דורש tuning — ספים גבוהים מדי מפספסים, נמוכים מדי מייצרים רעש
- **Defense in Depth** — אמינות מגיעה מריבוי שכבות, לא שכבה אחת מושלמת

### שיפורים עתידיים

- PKI מלא עם Certificate Authority
- mTLS (mutual TLS) בין Agent לשרת
- Mobile app
- Deployment לענן (AWS/Azure)
- מגבלות גודל קובץ + quota
- Password reset flow

---

## 18. נספחים

### נספח א׳ — מבנה הקוד

```
SecureSync/
├── Server/
│   ├── cert.pem / key.pem          ← TLS certificates
│   ├── generate-certs.cjs          ← cert generator
│   ├── package.json
│   ├── anomaly_service/
│   │   ├── main.py                 ← Flask + ML algorithms
│   │   └── requirements.txt
│   └── Src/
│       ├── index.js                ← HTTPS server + routes
│       ├── models/
│       │   ├── File.js
│       │   ├── User.model.js
│       │   ├── AuditLog.js
│       │   ├── Session.js
│       │   ├── Permission.js
│       │   ├── FileVersion.js
│       │   ├── Device.js
│       │   ├── KeyPair.js
│       │   ├── BlockRule.js
│       │   ├── AnomalyScore.js
│       │   └── ... (10 more)
│       ├── controller/
│       │   ├── File.controller.js
│       │   ├── User.controller.js
│       │   ├── permission.controller.js
│       │   ├── fileVersion.controller.js
│       │   ├── device.controller.js
│       │   └── admin.controller.js
│       ├── routes/
│       │   ├── files.js
│       │   ├── User.routes.js
│       │   ├── permission.routes.js
│       │   ├── FileVersion.routes.js
│       │   ├── device.routes.js
│       │   └── admin.routes.js
│       ├── middlewares/
│       │   └── auth.js             ← JWT + BlockRule check
│       └── utils/
│           ├── audit.js            ← logAudit()
│           ├── anomaly.js          ← analyzeEvent()
│           ├── websocket.js        ← sendToUser() + broadcast()
│           └── pki.js              ← sign/verify signatures
│
└── Client/
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← Main UI
        ├── api.js                  ← API functions
        ├── crypto/
        │   └── crypto.js           ← WebCrypto operations
        ├── hooks/
        │   ├── useApp.js           ← Main state management
        │   └── useWebSocket.js     ← WebSocket connection
        └── components/
            └── Dashboard.jsx       ← Admin dashboard
```

### נספח ב׳ — טכנולוגיות לפי גרסה

| Package | גרסה |
|---------|------|
| react | 18.x |
| vite | latest |
| express | 5.2.1 |
| mongoose | 9.2.3 |
| jsonwebtoken | 9.0.3 |
| bcrypt | 6.0.0 |
| nodemailer | 8.0.1 |
| multer | 2.1.0 |
| ws | 8.19.0 |
| selfsigned | 5.5.0 |
| nodemon | 3.1.14 |
| Flask | latest |
| scikit-learn | latest |
| numpy | latest |
| pymongo | latest |

### נספח ג׳ — הגדרות אבטחה מרכזיות

```javascript
// AES-256-GCM Key Generation
window.crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// RSA-OAEP Key Pair
window.crypto.subtle.generateKeyPair(
  { name: "RSA-OAEP", modulusLength: 2048, ... },
  true,
  ["encrypt", "decrypt"]
);

// Anomaly threshold
anomaly = (z_score > 2.0) OR isolation_forest OR one_class_svm
```

---

*ספר פרויקט — SecureSync | תשפ"ו 2026*
