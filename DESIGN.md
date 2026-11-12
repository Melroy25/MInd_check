# MediVault Design System & Developer Guide (`DESIGN.md`)

> **Single Source of Truth** for UI/UX consistency, architecture, color tokens, and portal development across the MediVault platform. Refer to this specification when building new features, portals (Doctor, Caretaker), or reviewing Git Pull Requests.

---

## 1. Brand Identity & Principles

MediVault gives patients complete, sovereign ownership over their medical records.

- **Patient-First Privacy:** Clean, transparent, zero dark patterns, no invasive third-party trackers.
- **Clinical Clarity & Warmth:** Soft, calming sage-green palette paired with warm off-white surfaces—avoiding harsh clinical blues and sterile clinic white.
- **Strict Anti-Pattern Rules:**
  - ❌ **STRICTLY NO EMOJIS anywhere** in the UI, modals, tags, or buttons. Use only clean SVG line icons.
  - ❌ **NO dark mode by default:** MediVault is designed as a clean, bright, highly-readable light mode application.
  - ❌ **NO third-party cloud tie-ins:** Do NOT introduce Google login or Google Drive dependencies. All flows operate via self-contained or user-permissioned vault storage.

---

## 2. Design Tokens & Color Palette

All screens and components **must** strictly use these standard color tokens.

### CSS Custom Properties
```css
:root {
  /* Primary Sage Greens */
  --green:    #74A842;   /* Primary accent, buttons, active states, active tab pill */
  --gd:       #5d8a32;   /* Hover / pressed dark green */
  --gl:       #EBF3E6;   /* Light pastel green tint (avatar bg, active icon wrap, hero card bg) */
  --bdg:      #d4e8c8;   /* Green tinted subtle borders */

  /* Neutrals & Canvas */
  --bg:       #F7F9F6;   /* Main canvas background (soft off-white) */
  --white:    #ffffff;   /* Pure white card and panel surfaces */
  --border:   #e5e7eb;   /* Subtle neutral gray border for cards and dividers */

  /* Typography */
  --charcoal: #1C2B1A;   /* Primary titles, headings, heavy text */
  --text:     #2d3a2e;   /* Body text, inputs, labels */
  --muted:    #6b7f6c;   /* Secondary text, dates, sub-labels, placeholders */

  /* Functional & File Type Accents */
  --red:      #dc2626;   /* PDF badge, Destructive actions (Revoke, Delete) */
  --blue:     #2563eb;   /* DOCX badge */
  --purple:   #7c3aed;   /* Image / Scan badge */
  --amber:    #d97706;   /* TXT badge, pending states */
}
```

### React Native / Expo Tokens (`App.js`)
```javascript
export const G = {
  green:    '#74A842',
  greenD:   '#5d8a32',
  greenL:   '#EBF3E6',
  bg:       '#F7F9F6',
  white:    '#ffffff',
  charcoal: '#1C2B1A',
  text:     '#2d3a2e',
  muted:    '#6b7f6c',
  border:   '#d4e8c8',
  shadow:   'rgba(116,168,66,0.12)',
};
```

---

## 3. Typography Hierarchy

MediVault uses standard system sans-serif typography for rapid loading and crisp rendering across iOS, Android, and Desktop:
```css
font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
```

| Element | Size | Weight | Color | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `32px` - `44px` | `800` (Extrabold) | `--charcoal` (`#1C2B1A`) | `letter-spacing: -0.8px; line-height: 1.15;` |
| **Page Title** | `clamp(24px, 3vw, 32px)` | `800` (Extrabold) | `--charcoal` (`#1C2B1A`) | `white-space: nowrap;` on desktop |
| **Card Header** | `17px` - `18px` | `700` (Bold) | `--charcoal` (`#1C2B1A`) | Clean, single-line with ellipsis |
| **Body Text** | `14px` | `400` / `500` | `--text` (`#2d3a2e`) | `line-height: 1.5;` |
| **Meta / Subtitle** | `12px` - `13px` | `500` (Medium) | `--muted` (`#6b7f6c`) | Used for dates, descriptions, timestamps |
| **File Type Badge** | `11px` | `700` (Bold) | Type Color | `letter-spacing: 0.5px; text-transform: uppercase;` |

---

## 4. Iconography Standards

> ⚠️ **Zero Emojis Allowed.** Do not use emoji characters (e.g., 📁, 📄, 🩺, 🔒).

### SVG Line Icon Guidelines:
1. **Attributes:**
   - `fill="none"`
   - `stroke="currentColor"` or `stroke="var(--green)"`
   - `stroke-width="1.75"` (or `2` for prominent actions)
   - `stroke-linecap="round"`
   - `stroke-linejoin="round"`
2. **Standard Dimensions:**
   - Inline badge / button icons: `14×14px` or `16×16px`
   - Sidebar nav items: `20×20px`
   - Section headers / action cards: `24×24px`
   - Mobile kebab menu target: `44×44px` button with centered `20×20px` icon

#### Standard SVG Icons Reference:
- **Shield / Logo:** `M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z` with centered cross `x1="12" y1="8" x2="12" y2="16"`
- **Folder:** `M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z`
- **Upload:** `path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"` + `polyline points="17 8 12 3 7 8"` + `line x1="12" y1="3" x2="12" y2="15"`
- **Search:** `circle cx="11" cy="11" r="8"` + `line x1="21" y1="21" x2="16.65" y2="16.65"`
- **Share:** `circle cx="18" cy="5" r="3"` + `circle cx="6" cy="12" r="3"` + `circle cx="18" cy="19" r="3"` + lines connecting centers

---

## 5. Layout Architecture & App Shell

```
┌────────────────────────────────────────────────────────────────────────┐
│ MediVault Header (72px fixed height)                                    │
│ [Logo + "MediVault"]                 [User Chip: Name & Role] [Logout] │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Fixed Sidebar (260px)    │ Main Scrollable Content Area                │
│                          │ (max-width: 1100px centered, overflow-y)    │
│  • My Folders            │                                             │
│  • Upload Files          │  1. Top Greeting ("Hello, Melroy Almeida")   │
│  • Convert to PDF        │  2. Omni-Search Bar (Pill style)            │
│  • Share & Permissions   │  3. Featured Vault Hero Card                │
│  • Add Third Party       │  4. "At your Fingertip" 6-card feature grid │
│  • Manage Access         │  5. Active Feature Workspace (Tabs/Views)   │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Desktop Layout Rules (Screens ≥ 768px):
- **Grid Layout:**
  ```css
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  grid-template-rows: 72px 1fr;
  height: 100vh;
  overflow: hidden;
  ```
- **Header:** Spans full width (`grid-column: 1 / -1; height: 72px; padding: 0 24px;`). User chip and logout button must have `white-space: nowrap; flex-shrink: 0;` so they never wrap onto multiple lines.
- **Sidebar:** Exactly `260px` width, `flex-shrink: 0`, full height under header. Nav item active state uses `--gl` (`#EBF3E6`) background with `--green` text and icon.
- **Content:** The only scrollable element (`overflow-y: auto; min-width: 0`). Internal wrapper is constrained to `max-width: 1100px; margin: 0 auto; padding: 32px;`.

### Mobile Layout Rules (Screens < 768px):
- **Desktop Sidebar is Hidden:** `display: none`.
- **Three-Dot / Kebab Menu (Far Left):**
  - Size: `44×44px` circular button with light green tint (`#EBF3E6`), `aria-label="Open menu"`.
  - Tapping opens a `280px` floating dropdown sheet anchored right under the header.
  - Items list all 6 features. Tapping any item switches view and closes menu.
  - Closes on outside tap, Escape key, or button re-tap.
- **Header Row:** Avatar and title shrink gracefully with `min-width: 0; flex: 1;`. Logout button remains compact on right.
- **Hero Card:** Stacks content vertically; shield icon box floats neatly to top-right corner (`56×56px`) without overlapping text.
- **Grid Stacking:** 6-card feature grid becomes `grid-cols-2` or `grid-cols-3` adapting cleanly down to 320px screens.

---

## 6. Portals Specification

### A. Patient Portal (`patient-dashboard.html`) — *Completed & Live*
1. **Folders View:** Organized cards (*Lab Reports*, *Prescriptions*, *Scans & Imaging*), displaying document count, date, description, and type tags. Clicking opens folder files.
2. **Upload & Convert:** Drag-and-drop zone accepting PDF, DOCX, IMG, and TXT with animated `0%` to `100%` upload bar and instant metadata preview card.
3. **Convert to PDF:** Select any non-PDF file and click "Convert to PDF" to generate a downloadable PDF representation with one click.
4. **Share & Permissions:** Omni-search for doctors and clinics, permission duration controls, and an "Active Permissions" table with 1-click **Revoke Access**.

---

### B. Doctor Portal (`doctor-dashboard.html`) — *Guideline for Teammates*
When developing the Doctor Portal branch (`feat/doctor-portal`):
- **Header:** User chip displays Doctor's name + `DOCTOR` role badge (e.g., `Dr. Sarah Jenkins`).
- **Sidebar Navigation:**
  1. `Assigned Patients`: Search and filter patients who granted active record access.
  2. `Patient Records`: View patient folder tree (Lab Reports, Imaging) with view-only or download access based on patient grant.
  3. `Write Prescription / Notes`: Upload clinical encounter summaries directly to the patient's vault.
  4. `Access Expiry Log`: Display remaining days of patient-granted access.
- **Design Rule:** Maintain identical `#74A842` sage green accents, `#F7F9F6` background, crisp white cards, and zero emojis.

---

### C. Caretaker Portal (`caretaker-dashboard.html`) — *Guideline for Teammates*
When developing the Caretaker Portal branch (`feat/caretaker-portal`):
- **Header:** Caretaker chip with `CARETAKER` role badge + "Switch Patient" dropdown (e.g., managing Mom, Child, or Spouse).
- **Sidebar Navigation:**
  1. `Dependent Overview`: Fast emergency summary (Allergies, Blood Group, Active Meds, Emergency Contacts).
  2. `Shared Folders`: Access to folders delegated by the patient.
  3. `Medication Tracker`: Schedule and checklist for daily medication.
  4. `Share with Clinic`: Forward designated records to an urgent care or specialist on behalf of the patient.
- **Design Rule:** Keep identical card borders (`#e5e7eb`), rounded corners (`16px`), and SVG line icons.

---

## 7. Git Workflow & Merge Protocol for Teammates

### 1. Branch Naming Convention
- Features: `feat/doctor-portal`, `feat/caretaker-portal`, `feat/offline-sync`
- Bug Fixes: `fix/mobile-kebab-menu`, `fix/upload-progress-animation`
- UI Polish: `style/button-spacing`, `docs/api-specs`

### 2. Pull Request (PR) Pre-Merge Checklist
Before submitting a PR to `main`:
- [ ] **No Emojis:** Verified that no emoji characters are present in any HTML, JSX, or text copy.
- [ ] **Color Palette:** Verified that only authorized colors (`#74A842`, `#5d8a32`, `#EBF3E6`, `#F7F9F6`, `#1C2B1A`) are used.
- [ ] **Mobile Responsiveness:** Tested on mobile width `< 768px` and small screens `360px`—no horizontal overflow.
- [ ] **Single Line Rule:** Header user chip and logo do not wrap or overlap.
- [ ] **Navigation Links:** Back/Logout button links to `patient-records-landing.html` or `index.html`.

---
*Created for the MediVault Team — Keep medical records secure, private, and patient-owned.*
