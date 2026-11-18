# Project Changelog

All notable changes to the **AI-Driven Business Operations Automation System** are recorded here in chronological order.

---

## [Phase 1: Analysis & Technical Planning] - 2026-11-19
### Added
- Completed comprehensive academic project analysis aligning the university syllabus/synopsis (`Synopsis.pdf`) with the Master Instructions.
- 18-point technical proposal evaluating architectural feasibility, free AI providers, and 24-hour presentation constraints.
- `ARCHITECTURE.md` documenting schema, data relationships, multi-tenant isolation, and background workers.
- Technical decisions formally approved by user:
  1. SQLite via native Node.js v26 `node:sqlite` approved for 100% offline-safe, zero-billing, robust local operation.
  2. Free AI Provider setup guide (Gemini / Groq) with deterministic offline fallback approved.
  3. Dashboard simplification (maximum 3 items per widget) approved.

---

## [Phase 2: Common Foundation & Core Modules] - 2026-11-19
### Added
- **Express REST Backend (`server/index.js`)**: Runs on port 5000 with CORS, JSON body parser, and error handling.
- **SQLite Database Engine (`server/db/database.js`)**: Leverages Node.js v26 built-in `node:sqlite` with strict foreign key constraints and ACID transaction safety.
- **Multi-Tenant User Isolation (`server/middleware/auth.js`)**:
  - Public registration (`POST /api/auth/register`) with `bcryptjs` password hashing.
  - Login (`POST /api/auth/login`) with signed JWT tokens.
  - Profile retrieval (`GET /api/auth/me`).
  - Tested and verified: User A (`demo@opsautomate.com`) and User B (`student@jklu.edu.in`) have completely isolated product catalogs, orders, emails, and tasks. Cross-tenant access is blocked at the database level.
- **Seeded FMCG Demonstration Dataset (`server/db/seed.js`)**: Pre-populated with realistic retail and wholesale items (Basmati Rice, Sunflower Oil, Toor Dal, Wheat Flour, Sugar, Jaggery), active suppliers, customers, and pre-configured shortage scenarios.
- **Inventory & Order Management Module A**:
  - `GET /api/inventory/products` & `POST /api/inventory/products`: Real-time stock catalog.
  - `PUT /api/inventory/products/:productId/stock`: Increment/decrement stock with immediate audit timestamps.
  - `POST /api/orders`: Deterministic stock feasibility comparison. If requested quantity > available stock, automatically flags item as `Shortage`, calculates exact deficit, and creates an automated Replenishment Purchase Order draft in Pending Approvals.
  - `PUT /api/orders/:orderId/status`: Dispatching an order decrements physical stock safely.
  - Interactive view (`InventoryOrdersView.jsx`) with live stock adjustment and order simulator.
- **Email & Communication Management Module B**:
  - `GET /api/communications`: Lists incoming customer and vendor communications.
  - `POST /api/communications/simulate`: Simulates incoming messages with 1-click presets (Carrier transit delay, Credit extension request, Damaged goods complaint, Urgent order inquiry) or custom form.
  - **Automated Background Detection Worker (`server/services/emailWorker.js`)**: Runs every 10 seconds to detect and classify unprocessed emails whether read or unread, without requiring the user to have the page open.
  - **Approval Routing Rule**: Messages involving financial matters (credit extension), invoices, or complaints automatically set `requires_approval = 1` and route an action into the Approvals queue.
  - `POST /api/communications/:emailId/reply`: Owner review and sign-off for outgoing responses.
  - `GET /api/communications/summary`: Holistic summarization across all messages and action recommendations.
  - Interactive view (`CommunicationsView.jsx`).
- **Daily Operations & Approvals Module C**:
  - `GET /api/approvals`: Filtered list of pending actions (Purchase Orders, Credit Overrides, Damaged Returns, Sensitive Email Actions).
  - `POST /api/approvals/:approvalId/approve`: Human-in-the-loop authorization executing consequential business side-effects.
  - `POST /api/approvals/:approvalId/reject`: Dismisses proposed actions with recorded reasoning.
  - `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:taskId/toggle`, `DELETE /api/tasks/:taskId`: Daily checklist and operational priorities.
  - Interactive view (`OperationsView.jsx`).
- **Dashboard Simplification & Live Wiring**:
  - `GET /api/dashboard/summary`: Calculates 3 live indicators (Pending Orders, Low-Stock Items, Pending Approvals).
  - `GET /api/dashboard/widgets`: Capped at a **maximum of 3 items per widget** across all 10 widgets.
  - `GET /api/dashboard/layout` & `POST /api/dashboard/layout`: Persists 4-slot 2×2 grid preferences with duplicate prevention.
- **Frontend Architecture**:
  - Vite proxy configured to forward `/api` to `http://localhost:5000`.
  - Global `AuthContext` with automatic demo login and instant account switcher.
  - `AuthModal.jsx` for public registration, login, and demo switching.
  - Verified compilation: `npm run build` succeeds in 2.09s with zero errors.

---

## [Phase 3: AI Assistant & Tool Calling Engine] - 2026-11-19
### Added
- **Tool Registry (`server/tools/toolRegistry.js`)**: Implemented 9 controlled backend tools:
  1. `get_inventory_status`: Real-time stock levels & critical thresholds.
  2. `check_order_stock_feasibility`: Checks order items against inventory and calculates exact deficits.
  3. `create_replenishment_draft`: Drafts purchase orders into Pending Approvals without modifying stock without authorization.
  4. `get_pending_approvals`: Retrieves owner queue.
  5. `execute_approval_action`: Approves or rejects consequential items.
  6. `search_communications`: Searches messages and flags approvals.
  7. `draft_email_reply`: Drafts contextual replies for review.
  8. `get_daily_operational_summary`: Consolidates low stock, delayed shipments, pending orders, and urgent tasks.
  9. `create_operational_task`: Inserts tasks into today's priority list.
- **Dual-Engine AI Service (`server/services/aiService.js`)**:
  - Primary: Groq API with `openai/gpt-oss-120b` supporting structured function calling.
  - Fail-Safe Fallback: Deterministic SQLite tool caller ensuring presentation queries never crash or hallucinate.
- **Interactive AI Assistant Overlay (`src/components/ai/AiAssistantModal.jsx`)**:
  - Connected directly to `/api/ai/chat`.
  - Displays tool execution badges in chat bubbles.
  - Clearly reports source (`Groq LLM` or `Live SQLite Engine`).
  - Suggested prompts: "What needs my attention today?", "Check critical low-stock items", "Draft restock PO for Basmati Rice".
- Verified compilation: `npm run build` succeeds in 2.15s.


## [2026-11-19] - Phase 3.5: Multi-Model LLM Cascading & Gemini Integration
- **Google Gemini Integration**: Connected verified Gemini API key (`gemini-3.8-flash`, `gemini-flash-lite-latest`, `gemini-flash-latest`) using Google Generative Language v1beta REST API with native Function Calling (`getGeminiToolsFormat`).
- **3-Tier Fault-Tolerant AI Cascade**:
  1. **Tier 1 (Gemini Multi-Model Cascade)**: `gemini-3.8-flash` -> `gemini-flash-lite-latest` -> `gemini-flash-latest`. Seamlessly catches 503 high-demand or 429 quota spikes and escalates to the next model in milliseconds.
  2. **Tier 2 (Groq LLM)**: `openai/gpt-oss-120b` acts as the cross-provider backup if all Google models are unavailable.
  3. **Tier 3 (Enhanced Deterministic SQLite Fallback)**: Offline failsafe covering inventory, PO drafting, orders, tasks, and communications (including `'mail'`, `'email'`, `'inbox'`, `'last mail'`, `'latest'`).
- **Thought Signature Preservation**: Fixed 2-turn function response flow to maintain Gemini's required `thoughtSignature` and `functionResponse` contract.
- **Config Initialization Fix**: Added early `dotenv.config()` in `server/config.js` to ensure environment variables are populated prior to any module imports.
- **Frontend AI Assistant UI Update**: Header updated to display "Gemini 3.8 + Groq LLM + Live SQLite" with active model reflection.
