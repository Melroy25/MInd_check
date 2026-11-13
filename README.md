# MediVault 🌿

> **Patient-Owned, Sovereign Medical Records Platform**
> Complete medical history organized, private, secure, and ready to share — without third-party cloud tie-ins or tracking.

---

## 🚀 Quick Start for Teammates & Collaborators

### 1. Clone the Repository
```bash
git clone https://github.com/Melroy25/MInd_check.git
cd MInd_check
```

---

### 2. Run the Interactive Web Prototypes (Instant, No Install Needed)

You can view and test the complete frontend directly in your web browser:

- **Landing Page & Role Selection:** Open [`index.html`](./index.html) or [`patient-records-landing.html`](./patient-records-landing.html) in Chrome, Edge, or Firefox.
- **Patient Dashboard & Medical History Vault:** Open [`patient-dashboard.html`](./patient-dashboard.html) directly in your browser.

All interactive flows (folder browsing, animated file uploads, PDF conversions, sharing search, permission management, and responsive mobile menu) are 100% self-contained and run locally!

---

### 3. Run the React Native (Expo) Mobile & Web App

To run the React Native mobile codebase:

```bash
# 1. Install dependencies
npm install

# 2. Run the Expo development server
npx expo start

# 3. Choose your target:
# Press 'w' in terminal to open Web
# Press 'a' to run on Android emulator or connected device
# Press 'i' to run on iOS simulator (macOS only)
# Or scan the QR code using Expo Go on your physical phone
```

---

## 🩺 AI Consultation Assistant & Decision Support

The Doctor Portal features a real-time **AI Consultation Assistant**:
1. **Live Speech-to-Text Transcription:**
   - Powered by Groq's `whisper-large-v3-turbo` model with sub-second chunk turnaround.
   - **Zero Audio Storage Guarantee:** Audio streams are processed strictly in transient memory buffers and discarded immediately after transcription. No audio files or raw consultation transcripts are ever persisted to disk, cloud storage, or database.
2. **Clinical Decision Support:**
   - Real-time extraction of symptoms, probable diagnosis (explicitly labeled *"possible"*), allergies, and current patient medications.
   - Clinical medicine suggestions with structured rationales: *Why*, *Key Advantages*, *Contraindications/Risks*, and *Allergy Warnings*.
3. **Doctor-Specific Medicine Memory:**
   - Learns each doctor's prescription habits in Supabase table `doctor_preferred_medicines`.
   - Prioritizes the doctor's usual medications in AI prompt suggestions.
   - Automatically saves and increments `usage_count` when a doctor prescribes or accepts medications.
4. **Automatic 4-Key Failover Pool:**
   - Automatically rotates across `EXPO_PUBLIC_GROK_API_KEY_1..4` with a 60-second cooldown on HTTP 429/503.
   - Remembers the last working key to eliminate latency.
5. **Printable Prescription Generator:**
   - Doctor reviews accepted medications, customizes dosages, and exports a signed clinical PDF prescription.

---

## 🔐 Supabase Authentication & Real Backend

1. **Database Schema:** Execute `supabase_schema.sql` in your Supabase SQL Editor.
2. **Environment Variables:** Define in `.env.local`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
   ```
3. **Instant Sign-Up Tip:** In Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**, toggle **"Confirm email"** to **OFF** for instant login during testing.


Before building new features or creating new portals, please read:

👉 **[`DESIGN.md`](./DESIGN.md)**

It documents:
- **Color Tokens:** Sage-green palette (`#74A842`, `#5d8a32`, `#EBF3E6`, `#F7F9F6`, `#1C2B1A`)
- **Strict Anti-Pattern Rule:** **Zero emojis** anywhere in the project (use only clean SVG line icons)
- **Layout Architecture:** CSS Grid app shell (72px header, fixed 260px sidebar, 1100px max content container)
- **Mobile Responsive Specs:** Kebab menu (`44×44px` touch target), vertical stack for screens `< 768px`
- **Portal Roadmaps:** Architectural specifications for the upcoming **Doctor Portal** and **Caretaker Portal**

---

## 🌿 Git Branching Workflow

When collaborating, create a new branch from `main`:

```bash
# 1. Ensure you have the latest main
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feat/doctor-portal
# or
git checkout -b feat/caretaker-portal

# 3. Make your changes and commit
git add .
git commit -m "feat: implement doctor portal patient search and view"

# 4. Push your branch
git push origin feat/doctor-portal
```

---

## 📂 Repository Structure

```
MED_CHECK/
├── App.js                     # React Native / Expo application
├── DESIGN.md                  # Complete design system & developer specs
├── README.md                  # Project overview & quick start
├── app.json                   # Expo configuration
├── package.json               # Dependencies and scripts
├── index.html                 # Web Landing Page entry point
├── patient-records-landing.html # Detailed landing page with role selector modal
├── patient-dashboard.html     # Full interactive Patient Dashboard
└── assets/                    # App icons and splash screens
```

---

## 🔑 Google Gemini API Setup & Automatic Key Rotation

MedFlow includes a resilient, multi-key rotation client (`services/geminiClient.js`) that automatically balances load and fails over if a key encounters rate limits (HTTP 429), server errors (500/503), or quota exhaustion (403).

### Setting Up API Keys

1. Create a `.env.local` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env.local
```

2. Add between 1 and 5 Gemini API keys:
```env
EXPO_PUBLIC_GEMINI_API_KEY_1=your_first_gemini_key
EXPO_PUBLIC_GEMINI_API_KEY_2=your_second_gemini_key
EXPO_PUBLIC_GEMINI_API_KEY_3=
EXPO_PUBLIC_GEMINI_API_KEY_4=
EXPO_PUBLIC_GEMINI_API_KEY_5=

EXPO_PUBLIC_GEMINI_MODEL=gemini-3.1-flash-lite
```

### Rotation & Failover Features
- **Zero Config:** Add anywhere from 1 to 5 keys; empty placeholders are automatically filtered out.
- **Smart Rotation:** Starts with the last working key to prevent unnecessary failover latency.
- **Automatic Cooldown:** On rate limit (429), server error (500/503), or quota limit (403), the active key is placed on a 60-second cooldown and the request immediately retries with the next available key.
- **Security:** API keys are sent via the `x-goog-api-key` header (never in the URL) and logs mask all but the last 4 characters (`...EPnw`).

---

*Built with care for patients, doctors, and caretakers.*
