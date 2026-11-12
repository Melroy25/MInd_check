# MediVault 🌿

> **Patient-Owned, Sovereign Medical Records Platform**
> Complete medical history organized, private, secure, and ready to share — without third-party cloud tie-ins or tracking.

---

## 🚀 Quick Start for Teammates & Collaborators

### 1. Clone the Repository
```bash
git clone https://github.com/Keerthana857/MED_CHECK.git
cd MED_CHECK
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

## 🎨 Design System & Developer Guide

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

*Built with care for patients, doctors, and caretakers.*
