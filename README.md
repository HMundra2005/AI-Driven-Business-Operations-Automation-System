# AI-Driven Business Operations Automation System
**Course:** CS1224 – Artificial Intelligence  
**Institution:** Institute of Engineering and Technology (IET), JK Lakshmipat University (JKLU), Jaipur  
**Submitted By:** Priyanshu Jain (2024BTech179), Harshit Mundra (2024BTech186), Kapil Kumawat (2024BTech151), Harshvardhan Singh Shekhawat (2024BTech089)  
**Supervisor:** Dr. Akshat Agrawal (Associate Professor | IET)  

---

## 1. Project Overview
Small-scale retail and wholesale businesses frequently juggle inventory, customer orders, supplier communications, and daily tasks through fragmented spreadsheets and manual tools. This project delivers a centralized, responsive web platform featuring:
1. **Inventory & Order Management (Module A)**: Real-time stock levels, automated deficit calculations upon order placement, and automatic generation of replenishment purchase-order drafts.
2. **Email & Communication Management (Module B)**: Automated background detection of incoming messages, entity extraction, categorization, and drafting of verified responses with mandatory human-in-the-loop sign-off for financial or complaint matters.
3. **Daily Operations & Task Coordination (Module C)**: Holistic priority aggregation, approval queues, and interactive task checklists.
4. **Multi-Tenant User Isolation**: Public registration, password encryption with `bcryptjs`, JWT session management, and database-level tenancy scoping (`user_id`).

---

## 2. Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js (Port 5000)
- **Database**: SQLite3 via native Node.js v26 `node:sqlite` (`DatabaseSync` with foreign keys and ACID transactions; schema 100% parity with Firebase Cloud Firestore)
- **Authentication**: JWT (`jsonwebtoken`) + `bcryptjs`
- **AI Engine (Phase 3 & 3.5)**: 3-Tier Multi-Model Cascade:
  - **Tier 1 (Google Gemini)**: `gemini-3.8-flash` -> `gemini-flash-lite-latest` -> `gemini-flash-latest` with native Function Calling (`thoughtSignature` preservation)
  - **Tier 2 (Groq LLM)**: `openai/gpt-oss-120b` cross-provider fallback
  - **Tier 3 (Offline Grounded Engine)**: Fail-safe local SQLite rule engine with expanded natural language intent routing

---

## 3. How to Run the Application on Localhost

### Prerequisites
- Node.js (v18 or higher; Node.js v22+ has native SQLite built in)
- npm

### Step 1: Install Dependencies (One-time)
```bash
npm install
```

### Step 2: Start the Backend API Server (Terminal 1)
```bash
npm run server
```
*The backend starts on `http://localhost:5000` with native SQLite database auto-migration, demo seed, and the background email processor.*

### Step 3: Start the Frontend Development Server (Terminal 2)
```bash
npm run dev
```
*The frontend starts on `http://localhost:3000` and automatically proxies `/api` calls to the backend.*

---

## 4. Default Demonstration Credentials
For fast, frictionless presentation and grading:
- **Email**: `demo@opsautomate.com`
- **Password**: `Demo@123`
- **Store Name**: Apex Wholesale & Retail

*Note: You can also click **"Register Store"** in the top-right profile menu to create a brand-new independent store account (e.g. `user2@store.com`), which receives its own completely isolated environment!*

---

## 5. How to Obtain Free AI API Keys (Takes ~60 Seconds)

The system is architected to support **Google Gemini API** (primary) and **Groq API** (secondary), along with an internal deterministic fallback engine so the application runs even without keys.

### A. How to Get a Free Google Gemini API Key:
1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with any standard Google / Gmail account.
3. Click on the blue **"Get API key"** button on the top-left navigation.
4. Click **"Create API key in new project"**.
5. Copy the generated key. (Free tier includes generous rate limits with zero credit card required).

### B. How to Get a Free Groq API Key:
1. Open [Groq Console](https://console.groq.com/).
2. Sign in with Google or GitHub.
3. Click **"API Keys"** in the left sidebar.
4. Click **"Create API Key"**, give it a name, and copy the key. (100% free with ultra-fast inference).

### C. Where to Add Your Keys:
Create a file named `.env` in the root project folder:
```env
PORT=5000
JWT_SECRET=opsautomate-super-secret-jwt-key-2026
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

---

## 6. Demonstration & Presentation Guide

### Workflow 1: Inventory & Stock Shortage Check
1. Go to the **Inventory & Stock** tab.
2. Observe current stock (e.g., *Basmati Rice Premium* has only 4 bags on hand; min threshold is 15).
3. Switch to the **Orders** sub-tab and click **"Simulate Customer Order"**.
4. Order **20 bags of Basmati Rice**.
5. Notice that the backend automatically:
   - Identifies the shortage of 16 units (`20 - 4 = 16`).
   - Flags the order status as `Pending (Stock Shortage)`.
   - Automatically drafts a **Purchase Order (PO)** to Supreme Agro Mills in the **Pending Approvals queue**!

### Workflow 2: Automated Email Processing & Approval Routing
1. Go to the **Communications** tab.
2. Click **"Simulate Incoming Email"** and select:
   - **"20-Day Credit Extension Request"** (Financial commitment) OR **"Damaged Goods & Credit Note Claim"** (Complaint).
3. Notice that the background intelligence worker immediately:
   - Detects the new email without needing to open it.
   - Categorizes it as `Billing/Invoicing` or `Complaint`.
   - Recognizes it as sensitive and flags `Owner Review Required`.
   - Automatically routes an action into the **Pending Approvals** center.
4. Review the AI-generated draft response, click **"Authorize & Send Reply"**, and watch the approval state resolve.
5. Click **"Generate Intelligence Summary"** to view holistic cross-email operational recommendations.

### Workflow 3: Daily Operations & Human-in-the-Loop Approvals
1. Go to the **Approvals** or **Tasks & Follow-ups** tab.
2. Review the pending Purchase Orders and sensitive customer decisions.
3. Click **"Approve & Execute"** on the Basmati Rice PO:
   - Notice the PO is recorded as approved.
   - A procurement payment task is automatically added to the staff checklist.
4. Check off or add new daily operational tasks with due times.

### Workflow 4: Multi-Tenant Data Isolation
1. Click the store avatar in the top-right header and click **"Log Out"**.
2. Click **"Register Store"** and create an account (e.g., `sharma@kirana.com` / `Test@123`).
3. Notice that this new user has their own completely isolated product catalog, orders, and inbox. Any changes made here never bleed into the demo account.
