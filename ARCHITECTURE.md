# System Architecture: AI-Driven Business Operations Automation System

## 1. Overview
The AI-Driven Business Operations Automation System is an integrated, responsive management platform designed specifically for small-scale retail and wholesale businesses. It consolidates three principal operational modules:
1. **Inventory and Order Management (Module A)**: Real-time stock levels, automated shortage calculations, replenishment requests, and purchase-order drafts.
2. **Email and Communication Management (Module B)**: Automated detection and parsing of incoming messages, entity extraction, business record retrieval, and drafting of verified responses with human-in-the-loop review.
3. **Daily Operations and Task Coordination (Module C)**: Holistic priority aggregation, task tracking, and approval queues.

The platform is fortified by a grounded **AI Assistant** (utilizing Gemini API / Groq API with an offline deterministic fallback) operating under strictly bounded backend tools. Consequential operations require human authorization.

---

## 2. Technology Stack & Architectural Decisions

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | High-performance SPA, modern clean UI, responsive layout with collapsible sidebar and 2×2 operational grid. |
| **Backend** | Node.js, Express.js | Lightweight REST API, modular middleware architecture, robust transaction and business rule validation. |
| **Database** | SQLite via built-in `node:sqlite` (Node v26 `DatabaseSync`) | Zero-configuration local database, zero cloud billing risk, 100% offline reliability for university presentation, ACID compliance, strict foreign key constraints. (Schema designed for seamless parity with Firebase Cloud Firestore). |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Multi-tenant isolation at the database layer (`user_id` enforced on every record and query). |
| **AI Integration** | Modular `AiService` (Gemini Flash + Groq Llama + Rule Fallback) | Free-tier scalability, low latency, function calling, fail-safe offline demonstration mode. |

---

## 3. Database Schema & Data Relationships

Every table enforces multi-tenant scoping via `user_id`:

```
USERS
├── id (TEXT PK)
├── email (TEXT UNIQUE)
├── password_hash (TEXT)
├── business_name (TEXT)
└── created_at (DATETIME)

PRODUCTS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── sku (TEXT)
├── name (TEXT)
├── category (TEXT)
├── current_stock (INTEGER)
├── min_threshold (INTEGER)
├── unit (TEXT)
├── unit_price (REAL)
├── supplier_id (TEXT FK -> SUPPLIERS.id)
└── updated_at (DATETIME)

CUSTOMERS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── name (TEXT)
├── contact_person (TEXT)
├── email (TEXT)
├── phone (TEXT)
└── address (TEXT)

SUPPLIERS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── name (TEXT)
├── contact_person (TEXT)
├── email (TEXT)
├── phone (TEXT)
└── lead_time_days (INTEGER)

ORDERS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── order_number (TEXT)
├── customer_id (TEXT FK -> CUSTOMERS.id)
├── status (TEXT: Pending, Processing, Dispatched, Cancelled)
├── total_amount (REAL)
├── notes (TEXT)
└── created_at (DATETIME)

ORDER_ITEMS
├── id (TEXT PK)
├── order_id (TEXT FK -> ORDERS.id)
├── product_id (TEXT FK -> PRODUCTS.id)
├── quantity (INTEGER)
├── unit_price (REAL)
└── status (TEXT: Available, Shortage)

EMAILS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── sender (TEXT)
├── sender_name (TEXT)
├── subject (TEXT)
├── body (TEXT)
├── category (TEXT: Order Inquiry, Delivery/Logistics, Billing/Invoicing, Complaint, General)
├── urgency (TEXT: High, Medium, Normal)
├── is_read (BOOLEAN)
├── is_processed (BOOLEAN)
├── requires_approval (BOOLEAN)
├── proposed_reply (TEXT)
└── received_at (DATETIME)

TASKS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── title (TEXT)
├── priority (TEXT: High, Medium, Normal)
├── due_time (TEXT)
├── category (TEXT)
├── status (TEXT: Pending, Completed)
└── created_at (DATETIME)

APPROVALS
├── id (TEXT PK)
├── user_id (TEXT FK -> USERS.id)
├── type (TEXT: Purchase Order, Credit Override, Damaged Return, Urgent Reply)
├── title (TEXT)
├── details (TEXT)
├── amount (REAL)
├── urgency (TEXT: High, Medium, Normal)
├── status (TEXT: Pending, Approved, Rejected)
├── reference_id (TEXT)
└── created_at (DATETIME)

USER_SETTINGS
├── user_id (TEXT PK FK -> USERS.id)
├── layout_json (TEXT)
└── auto_replies_enabled (BOOLEAN)
```

---

## 4. Multi-Tenant Data Isolation Principle
1. No endpoint executes a database query without validating the user's JWT.
2. The authentication middleware extracts `req.user.id`.
3. Every SQL query includes `WHERE user_id = ?` parameter binding.
4. User A (`demo@opsautomate.com`) and User B (`newuser@business.com`) have completely isolated environments.

---

## 5. Background Email Processing Workflow
1. Simulated or incoming email is saved with `is_processed = 0`.
2. A background worker periodically inspects unprocessed messages.
3. The message is classified and evaluated against live stock/order records.
4. If sensitive (financial commitments, dispute, out-of-stock commitments), it generates an approval item in `APPROVALS`.
5. If routine, a verified proposed draft response is created.
6. The record is updated to `is_processed = 1`.

---

## 6. AI Agent Tool Governance
The AI model interacts with business logic exclusively through controlled backend functions:
- `get_inventory_status`
- `check_order_stock_feasibility`
- `create_replenishment_draft`
- `get_pending_approvals`
- `execute_approval_action`
- `search_communications`
- `draft_email_reply`
- `get_daily_operational_summary`
- `create_operational_task`

Direct SQL execution or unvalidated state changes by the LLM are strictly blocked.
