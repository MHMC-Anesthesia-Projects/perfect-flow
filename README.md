# Perfect Flow 🏥⚡

> **Perioperative Patient Flow & OR Command Center**  
> Complementary to **Perfect Board** and **Perfect Call** in the Perfect clinical suite.

Built with Next.js 16 (Turbopack), React 19, TypeScript, and modern dual-theme Vanilla CSS. Engineered specifically for **65" wall touchscreens**, **clinical desktop workstations**, and **mobile smartphones**.

---

## 🚀 Quick Start

The dev server is running on **port 3002**:
```bash
npm run dev -- -p 3002
```
Access the application locally at:
👉 **[http://localhost:3002/flow](http://localhost:3002/flow)**  
*(Network access on the hospital/local subnet: `http://192.168.86.84:3002/flow`)*

---

## 🌟 Core Features & Views

### 1. OR Room Grid View (Default Launch View)
- **Room Columns**: Displays all operating suites (`MC OR 01` through `MC OR 08`, `MC ORT OR 06`, `Endo`).
- **Active In-Room Case Card**:
  - Live surgical elapsed timer calculating minutes since incision/cut with visual pulse indicator.
  - Phase status badges (`In Surgery`, `Closing`, `Room Turnover`).
  - 1-tap fast milestone actions (`Wheels In`, `Mark Closing`, `Send to PACU`, `Call Report`).
- **Queued Next Cases Stack**:
  - Compact upcoming case cards showing scheduled start time, surgeon, patient initials/name, and gatekeeper readiness badges (Consent, Site Marked, Anes Ready).
- **Left Telemetry Sidebar**:
  - Command roster for Board Runners (Anes ext, RN ext), late shifts (1st through 4th Late), and float personnel (WP Gen Float, CV Float, ORT Board Runners).

### 2. Interactive Gantt Timeline Schedule View
- **Hourly Ruler**: 07:00 to 19:00+ across all operating rooms.
- **Live "Now" Scrubber**: Real-time vertical red marker with current time indicator.
- **Phase Color-Coded Bars**:
  - 🔵 Scheduled (Slate)
  - 🟡 Pre-Op / Holding (Warm Amber)
  - 🟢 In Surgery / Cut (Vibrant Emerald)
  - 🟣 Closing (Neon Violet)
  - 🔷 PACU (Sky Blue)
  - ⬛ Completed (Charcoal)
- Tapping any case bar opens the Procedure Detail Modal.

### 3. Pre-Op Holding Bay Board
- **Bay-by-Bay Grid**: Dedicated tiles for Holding Bays 1–8, Labs, and Holding Beds.
- **"Green to Go" Clearance Matrix**:
  - 1-tap checklist buttons for `H&P`, `Surgical Consent`, `Anesthesia Consent`, `Site Marked`, `Ane. Ready`, and `Report Called`.
  - Prominent **CLEAR FOR OR** badge when all items are green, with an immediate `Wheels In to OR` action button.

### 4. PACU & Phase II Ambulatory Recovery Board
- **Recovery Bays**: PACU Phase I Bays 1–8 and Phase II Station Recliners 1–4.
- **Telemetry**: Arrival timestamp, live Length-of-Stay (LOS) counter, assigned PACU RN.
- **Signout & Handoff Actions**:
  - `Ready for Anes Signout` 1-tap toggle.
  - `PACU to Floor Hold` alert for inpatient bed delays.
  - `Transfer to Phase II` and `Discharge Patient Home` actions.

### 5. Multi-Tab Procedure Detail Modal (Clinical Dossier)
Modeled directly after hospital OR Control:
1. **Overview & Surgical Detail**: Full procedure description, CPT codes, case priority, case order (`B-3`), surgeon, anesthesia team, case comments, family communication contacts.
2. **Pre-Op & Holding Checkpoints**: Pre-op location, pre-op RN, H&P, consents, surgical site mark, UPT pregnancy test, hair clipping, anesthesia pre-op evaluation, and regional block status.
3. **Intra-Op & Operating Room**: Circulating RN, scrub tech, wheels in/out timestamps, incision start, closing, delay reasons, and blood bank crossmatch.
4. **PACU & Phase II Recovery**: PACU location, signouts, floor hold alerts, Phase II nurse, recovery needs, and patient disposition.

---

## 📱 65" Touchscreen & Kiosk Utilities
- **Touch PIN Pad**: 4-digit numeric keypad for switching between Board Runner (`1234`), Anesthesiologist (`2468`), Charge RN (`5555`), and Superuser (`9999`).
- **On-Screen Virtual Keyboard**: Slide-up touch QWERTY keyboard for searching or entering notes without physical peripherals.
- **HIPAA Privacy Toggle**: 1-click toggle between full patient names and protected initials (e.g. `PEREZ, JOSE ERNESTO` vs `PER, J`).
- **Fullscreen Kiosk Mode**: 1-click fullscreen toggle removing browser chrome for wall monitor displays.
- **Dual Themes**: Whiteboard Light Mode vs Surgical High-Contrast Dark Mode.

---

## 🗄 Data Model & Epic EMR Integration
- **State File**: `data/flow_state.json` with safe atomic reads and writes.
- **Epic OpTime Fields**: Every mock case adheres to Epic OpTime schema (MRN, Epic Case ID, CSN/Account #, CPT codes, and OpTime event milestones).
- **API Endpoints**:
  - `GET /flow/api/flow`: Returns current FlowState.
  - `POST /flow/api/flow`: Dispatches patient updates, room updates, and resets.
  - `POST /flow/api/epic/sync`: Dedicated gateway for receiving Epic OpTime HL7 / FHIR webhook payloads.
- **Supabase Integration**: Configured in `src/lib/supabase.ts` targeting schema `flow`, ready to connect to your Perfect Call Supabase instance.
