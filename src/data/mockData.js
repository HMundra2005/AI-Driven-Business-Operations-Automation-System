/**
 * Mock data for the AI-Driven Business Operations Automation System
 * Tailored for small-scale retail and wholesale businesses.
 * 
 * NOTE: This is purely client-side prototype data.
 * In future phases, these records will be fetched from the backend API.
 */

export const INITIAL_SUMMARY_METRICS = {
  pendingOrders: {
    value: 8,
    label: "Pending Orders",
    subtext: "3 orders require dispatch today",
    change: "+2 since yesterday",
    badge: "Action Needed",
    type: "orders",
  },
  lowStockItems: {
    value: 5,
    label: "Low-Stock Items",
    subtext: "2 items below critical threshold",
    change: "Stock alert active",
    badge: "Attention",
    type: "inventory",
  },
  pendingApprovals: {
    value: 3,
    label: "Pending Approvals",
    subtext: "1 PO & 2 customer credit overrides",
    change: "₹1,25,450 total value",
    badge: "Owner Review",
    type: "approvals",
  },
};

export const MOCK_INVENTORY_ITEMS = [
  {
    id: "SKU-1001",
    name: "Basmati Rice Premium (25kg Bag)",
    category: "Grains & Staples",
    currentStock: 4,
    reorderLevel: 15,
    unit: "bags",
    unitPrice: 2100,
    status: "Critical",
  },
  {
    id: "SKU-1002",
    name: "Refined Sunflower Oil (15L Tin)",
    category: "Edible Oils",
    currentStock: 8,
    reorderLevel: 20,
    unit: "tins",
    unitPrice: 1650,
    status: "Low Stock",
  },
  {
    id: "SKU-1003",
    name: "Whole Wheat Flour / Atta (10kg)",
    category: "Flour & Pulses",
    currentStock: 12,
    reorderLevel: 30,
    unit: "bags",
    unitPrice: 380,
    status: "Low Stock",
  },
  {
    id: "SKU-1004",
    name: "Toor Dal Super Grade (50kg Bag)",
    category: "Pulses",
    currentStock: 2,
    reorderLevel: 10,
    unit: "bags",
    unitPrice: 6400,
    status: "Critical",
  },
  {
    id: "SKU-1005",
    name: "Organic Jaggery Blocks (1kg Pouch)",
    category: "Sweeteners",
    currentStock: 15,
    reorderLevel: 25,
    unit: "pouches",
    unitPrice: 75,
    status: "Low Stock",
  },
];

export const MOCK_PENDING_APPROVALS = [
  {
    id: "PO-2026-089",
    type: "Purchase Order",
    title: "Supreme Agro Mills - Basmati Restock",
    requestedBy: "Arvind (Store Mgr)",
    amount: "₹42,000",
    date: "Today, 09:45 AM",
    urgency: "High",
    status: "Awaiting Approval",
    details: "Restock for 20 bags of 25kg Basmati Rice ahead of weekend demand.",
  },
  {
    id: "CR-2026-034",
    type: "Credit Limit Override",
    title: "Sharma Traders - 15-day Credit Extension",
    requestedBy: "Accounts Desk",
    amount: "₹78,500",
    date: "Today, 10:30 AM",
    urgency: "Medium",
    status: "Review Required",
    details: "Existing credit cap is ₹50,000. Customer has good 2-year payment track record.",
  },
  {
    id: "RET-2026-012",
    type: "Damaged Return Credit",
    title: "Metro Mart Wholesale - Oil Tin Replacement",
    requestedBy: "Logistics Team",
    amount: "₹4,950",
    date: "Yesterday",
    urgency: "Normal",
    status: "Pending Sign-off",
    details: "Credit note authorization for 3 oil tins damaged during transit.",
  },
];

export const MOCK_COMMUNICATIONS = [
  {
    id: "COMM-301",
    sender: "Metro Grocers (Wholesale Client)",
    contactPerson: "Kunal Mehra",
    subject: "Urgent: Delivery status for 50-bag wheat flour order #ORD-4491",
    preview: "Could you confirm if our dispatch vehicle will arrive by 3 PM? Our warehouse needs to schedule unloading staff.",
    time: "45 mins ago",
    urgency: "High",
    channel: "WhatsApp Business",
  },
  {
    id: "COMM-302",
    sender: "Sunrise Logistics (Carrier)",
    contactPerson: "Dispatcher Harish",
    subject: "Transit Delay Notice - Consignment #SN-8921",
    preview: "Vehicle experienced a tire delay near toll gate. Updated arrival estimate shifted by 2 hours.",
    time: "2 hours ago",
    urgency: "High",
    channel: "Email",
  },
  {
    id: "COMM-303",
    sender: "Rajeshwari Retailers",
    contactPerson: "Sunil Jain",
    subject: "Quote Request: Bulk Festive Gift Hamper Pricing",
    preview: "Requesting rate card for 120 custom dry fruit and grain packaging hampers for corporate gifting.",
    time: "3.5 hours ago",
    urgency: "Medium",
    channel: "Email",
  },
  {
    id: "COMM-304",
    sender: "Bharat Packaging Supplies",
    contactPerson: "Amit Verma",
    subject: "Tax Invoice #BP-8890 Attached for Shipping Boxes",
    preview: "Attached please find the tax invoice for 400 corrugated boxes delivered yesterday afternoon.",
    time: "5 hours ago",
    urgency: "Normal",
    channel: "Email",
  },
];

export const MOCK_TODAYS_TASKS = [
  {
    id: "TSK-101",
    title: "Follow up with Sunrise Logistics on delayed delivery ETA",
    dueTime: "11:30 AM",
    priority: "High",
    assignedTo: "Rajesh (Owner)",
    status: "Pending",
    category: "Supply Chain",
  },
  {
    id: "TSK-102",
    title: "Review & authorize purchase order PO-2026-089 for Basmati Rice",
    dueTime: "01:00 PM",
    priority: "High",
    assignedTo: "Rajesh (Owner)",
    status: "Pending",
    category: "Procurement",
  },
  {
    id: "TSK-103",
    title: "Perform physical stock count for Toor Dal batch #TD-440",
    dueTime: "03:30 PM",
    priority: "Medium",
    assignedTo: "Warehouse Team",
    status: "In Progress",
    category: "Inventory",
  },
  {
    id: "TSK-104",
    title: "Call Sharma Traders regarding payment receipt verification",
    dueTime: "05:00 PM",
    priority: "Medium",
    assignedTo: "Accounts",
    status: "Pending",
    category: "Finance",
  },
];

// Additional Available Widget Mock Data
export const MOCK_SUPPLIER_FOLLOWUPS = [
  {
    id: "SUP-01",
    supplier: "Supreme Agro Mills",
    contact: "Mahesh Rawat",
    pendingItem: "20 bags Basmati Rice shipment dispatch confirmation",
    lastContact: "Oct 27, 2026",
    nextAction: "Confirm dispatch e-way bill",
    urgency: "High",
  },
  {
    id: "SUP-02",
    supplier: "Krishna Edible Oils Ltd.",
    contact: "Pooja Hegde",
    pendingItem: "Rebate credit note for festival bulk order",
    lastContact: "Oct 26, 2026",
    nextAction: "Request signed credit note",
    urgency: "Medium",
  },
  {
    id: "SUP-03",
    supplier: "Apex Packaging Solutions",
    contact: "Sanjay Singhal",
    pendingItem: "Sample approval for eco-friendly grain sacks",
    lastContact: "Oct 28, 2026",
    nextAction: "Review material GSM sample",
    urgency: "Normal",
  },
];

export const MOCK_CUSTOMER_ISSUES = [
  {
    id: "ISS-104",
    customer: "Anand Provisions",
    issue: "2 torn sacks in batch #224 flour consignment",
    reported: "Yesterday, 4:15 PM",
    status: "Under Investigation",
    severity: "High",
  },
  {
    id: "ISS-103",
    customer: "City Supermarket",
    issue: "Driver missing physical stamped copy of invoice",
    reported: "Yesterday, 11:30 AM",
    status: "Resolved - PDF Sent",
    severity: "Medium",
  },
  {
    id: "ISS-098",
    customer: "Vikas Traders",
    issue: "Duplicate payment verification for RTGS #9921",
    reported: "Oct 27, 2026",
    status: "Pending Bank Confirmation",
    severity: "Medium",
  },
];

export const MOCK_RECENT_ACTIVITY = [
  {
    id: "ACT-01",
    action: "Order Dispatched",
    details: "Order #ORD-4491 dispatched to Verma General Store (₹14,200)",
    time: "25 mins ago",
    badge: "Orders",
  },
  {
    id: "ACT-02",
    action: "Payment Received",
    details: "₹55,000 received via NEFT from Balaji Wholesalers",
    time: "1 hour ago",
    badge: "Finance",
  },
  {
    id: "ACT-03",
    action: "Stock Alert Triggered",
    details: "Toor Dal (50kg Bag) reached critical threshold (2 remaining)",
    time: "2.5 hours ago",
    badge: "Inventory",
  },
  {
    id: "ACT-04",
    action: "Price Quotation Sent",
    details: "Quotation #QT-8821 sent to City Mart for Diwali supplies",
    time: "4 hours ago",
    badge: "Sales",
  },
];

export const MOCK_UPCOMING_DEADLINES = [
  {
    id: "DL-01",
    title: "GST Return Filing (GSTR-3B) Reconciliation",
    dueDate: "Oct 31, 2026",
    daysRemaining: "2 days left",
    priority: "High",
    category: "Compliance",
  },
  {
    id: "DL-02",
    title: "Vendor Payment: Supreme Agro Mills (₹1,24,000)",
    dueDate: "Nov 02, 2026",
    daysRemaining: "4 days left",
    priority: "High",
    category: "Accounts Payable",
  },
  {
    id: "DL-03",
    title: "Warehouse Fire Safety & Sensor Inspection",
    dueDate: "Nov 05, 2026",
    daysRemaining: "7 days left",
    priority: "Medium",
    category: "Operations",
  },
];

export const MOCK_ORDER_STATUS = [
  {
    id: "ORD-4495",
    client: "City Mart Superstore",
    items: "18 items (Grains & Pulses)",
    amount: "₹32,000",
    status: "Packing in Warehouse",
    statusColor: "amber",
  },
  {
    id: "ORD-4494",
    client: "Khandelwal Kirana",
    items: "6 items (Edible Oil & Sugar)",
    amount: "₹18,400",
    status: "Ready for Dispatch",
    statusColor: "blue",
  },
  {
    id: "ORD-4493",
    client: "Singhania Stores",
    items: "40 items (Wholesale Assortment)",
    amount: "₹64,500",
    status: "Payment Clearance Pending",
    statusColor: "purple",
  },
  {
    id: "ORD-4492",
    client: "Goyal Brothers Retail",
    items: "8 items (Spices & Pulses)",
    amount: "₹11,200",
    status: "Out for Delivery",
    statusColor: "emerald",
  },
];

export const MOCK_COMPLETED_TASKS = [
  {
    id: "CMP-01",
    title: "Reconcile daily cash register with POS terminal report",
    completedBy: "Arvind (Store Mgr)",
    completedAt: "Today, 09:15 AM",
  },
  {
    id: "CMP-02",
    title: "Send weekly wholesale wholesale rate card broadcast to retail network",
    completedBy: "Neha (Sales)",
    completedAt: "Today, 10:00 AM",
  },
  {
    id: "CMP-03",
    title: "Inspect incoming shipment of refined sunflower oil from Krishna Oils",
    completedBy: "Warehouse Team",
    completedAt: "Today, 11:20 AM",
  },
];

/**
 * Registry of all available widgets for the 2x2 grid.
 */
export const AVAILABLE_WIDGET_CONFIGS = [
  {
    id: "inventory",
    title: "Inventory & Stock",
    category: "Inventory",
    description: "Low-stock alerts and items requiring immediate reorder.",
    defaultPosition: 0, // Position 1 (Top-Left)
  },
  {
    id: "approvals",
    title: "Pending Approvals",
    category: "Management",
    description: "Purchase orders and credit overrides awaiting owner sign-off.",
    defaultPosition: 1, // Position 2 (Top-Right)
  },
  {
    id: "communications",
    title: "Communications Requiring Attention",
    category: "Customer & Vendor",
    description: "Urgent client messages, delay notices, and complaint follow-ups.",
    defaultPosition: 2, // Position 3 (Bottom-Left)
  },
  {
    id: "tasks",
    title: "Today's Tasks & Priorities",
    category: "Operations",
    description: "Action items and operational deadlines scheduled for today.",
    defaultPosition: 3, // Position 4 (Bottom-Right)
  },
  // Additional Available Widget Types
  {
    id: "supplier-followups",
    title: "Supplier Follow-ups",
    category: "Supply Chain",
    description: "Active vendor inquiries, delivery tracking, and sample approvals.",
  },
  {
    id: "customer-issues",
    title: "Unresolved Customer Issues",
    category: "Customer Service",
    description: "Complaints, damaged goods reports, and dispute resolutions.",
  },
  {
    id: "recent-activity",
    title: "Recent Activity",
    category: "Audit Log",
    description: "Live feed of shop orders, payments received, and status updates.",
  },
  {
    id: "upcoming-deadlines",
    title: "Upcoming Deadlines",
    category: "Compliance & Finance",
    description: "Critical compliance dates, vendor payout cut-offs, and audits.",
  },
  {
    id: "order-status",
    title: "Order Status Overview",
    category: "Sales & Dispatch",
    description: "Current stage of today's customer wholesale and retail dispatches.",
  },
  {
    id: "completed-tasks",
    title: "Completed Tasks",
    category: "Operations",
    description: "Tasks finalized today across store, sales, and warehouse staff.",
  },
];

export const DEFAULT_LAYOUT = [
  "inventory",      // Position 1 (Top-Left)
  "approvals",      // Position 2 (Top-Right)
  "communications", // Position 3 (Bottom-Left)
  "tasks",          // Position 4 (Bottom-Right)
];
