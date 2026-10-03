# Vadiva's Tech & Design Fest 2.0 - Lead Generation Landing Page

Production-ready, mobile-first Meta Ads lead generation landing page for **Vadiva's Tech & Design Fest 2.0**.

- **Event:** 3-Day International Tech & Design Festival
- **Dates:** 23, 24 & 25 October 2026
- **Venue:** TVIS, Ponneri
- **Powered by:** VadivaLabs
- **Target Route:** `https://vadivacreativelabs.com/techfestregistration`
- **Robots Policy:** `noindex, nofollow` (Private Meta Ads Destination URL)

---

## 🚀 Key Features

- **Multi-Step Form UX (4 Steps):**
  - **Step 1:** Participant Name, Parent / Caretaker Name
  - **Step 2:** Dynamic Education Level (School Students: Grade 6–12 / College Students: 1st–5th Year, PG/Master's)
  - **Step 3:** Institution Name, City
  - **Step 4:** Contact Number (10-digit Indian Mobile Validation), WhatsApp Number (Optional), Email ID
- **Google Sheets Integration:** Direct server-side / Apps Script lead ingestion into spreadsheet ID `1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc` (Columns A through V).
- **Meta Ads & Pixel Tracking:** Automatically captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, and `fbclid`. Fires `PageView` / `ViewContent` on load and standard `Lead` / `CompleteRegistration` conversion events strictly upon verified submission.
- **Duplicate Lead Protection:** Normalizes and prevents accidental multiple submissions for `Participant Name + Contact Number`.
- **Spam Trap:** Invisible honeypot field + IP flood throttle.
- **Zero-Friction Mobile Experience:** Fast loading, responsive layout, sticky mobile CTA bar, seamless step transitions.

---

## 📁 Repository Structure

```
├── techfestregistration.html        # Main landing page route (/techfestregistration)
├── techfestregistration/
│   ├── index.html                   # Directory fallback
│   └── assets/
│       └── techfest26-logo.png      # Event origami swan logo
├── api/
│   ├── techfest-lead.php            # Secure server-side PHP submission proxy
│   └── config.example.php           # API config template
├── google-apps-script-techfest.js   # Google Apps Script code for Google Sheets
├── package.json                     # NPM configuration & scripts
├── .env.example                     # Environment template
├── .gitignore                       # Ignored files & secrets protection
└── README.md                        # Project documentation
```

---

## 🛠️ Local Development & Testing

1. **Install & Run Locally:**
   ```bash
   # Using Node / live-server
   npm run dev
   # Or using npx serve
   npx serve .
   ```
2. **Access Landing Page in Browser:**
   `http://localhost:3000/techfestregistration.html`

3. **Run Automated Test Suite:**
   ```bash
   npm test
   ```

---

## 📊 Google Sheets Setup (Spreadsheet ID: `1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc`)

1. Open your target Google Spreadsheet:
   `https://docs.google.com/spreadsheets/d/1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc/edit`
2. Click **Extensions** > **Apps Script**.
3. Replace the script editor code with the contents of `google-apps-script-techfest.js`.
4. Click **Deploy** > **New deployment**.
5. Select type: **Web App**.
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone`
6. Copy the generated Web App URL (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).
7. Add this URL to your production environment or `api/config.php` as `TECHFEST_GAS_URL`.

### Google Sheet Column Structure (A to V):
| Column | Header | Description |
|---|---|---|
| **A** | Timestamp | IST formatted date & time |
| **B** | Participant Name | Full participant name |
| **C** | Parent / Caretaker Name | Parent / caretaker name |
| **D** | Current Level of Study | School Students / College Students |
| **E** | Grade / College Year | Dynamic Grade (6–12) or Year (1st–PG) |
| **F** | Institution Name | School or college name |
| **G** | City | Participant city |
| **H** | Contact Number | 10-digit Indian phone |
| **I** | WhatsApp Number | Optional WhatsApp number |
| **J** | Email ID | Validated email address |
| **K** | Lead Source | Meta Ads / Source |
| **L** | Campaign | Meta Campaign Name |
| **M** | Ad Set | Meta Ad Set Name |
| **N** | Ad | Meta Ad Name |
| **O** | UTM Source | `utm_source` |
| **P** | UTM Medium | `utm_medium` |
| **Q** | UTM Campaign | `utm_campaign` |
| **R** | UTM Content | `utm_content` |
| **S** | UTM Term | `utm_term` |
| **T** | FBCLID | `fbclid` click identifier |
| **U** | Landing Page | URL where registration occurred |
| **V** | Submission Status | Verified Lead |

---

## 🎯 Meta Ads Campaign URL Configuration

When setting up ads in Meta Ads Manager (Facebook / Instagram Ads), use the destination URL formatted with UTM tracking parameters:

```
https://vadivacreativelabs.com/techfestregistration?utm_source=facebook&utm_medium=paid_social&utm_campaign=techfest_2026&utm_content={{ad.name}}&utm_term={{adset.name}}
```

The landing page automatically extracts, stores, and attaches these parameters to the Google Sheet lead entry.

---

## 🔒 Privacy & Search Engine Exclusion

The page is configured with:
```html
<meta name="robots" content="noindex, nofollow">
```
It is not linked from public website navigation, headers, footers, or sitemaps, keeping it dedicated exclusively to Meta Ads traffic.
