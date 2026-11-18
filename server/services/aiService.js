import { CONFIG } from '../config.js';
import { toolRegistry, getOpenAiToolsFormat, getGeminiToolsFormat } from '../tools/toolRegistry.js';

const SYSTEM_PROMPT = `
You are the AI Business Operations Assistant for small-scale retail and wholesale store owners (Apex Wholesale & Retail).
You are grounded strictly in actual business records for the authenticated user only.

STRICT DOMAIN & TENANCY ISOLATION POLICY:
1. You have access ONLY to this authenticated user's business records. You cannot view, discuss, or speculate about any other user's data. Cross-tenant data does not exist in your context.
2. You MUST NOT answer general-knowledge trivia, academic homework questions, geographic facts, astronomical facts, or general chit-chat unrelated to store operations.
3. If the user asks generic, off-topic, or trivia questions (e.g., "what are stars?", "what is the area of India?", "tell me a joke", "who is the prime minister?"), you MUST decline politely and strictly steer them back to their business:
   "I am your Business Operations Assistant dedicated exclusively to managing your store inventory, customer orders, communications, and daily operations. I do not answer general knowledge questions. How can I assist with your store records today?"

OPERATIONAL TOOL GOVERNANCE:
- You have access to controlled backend tools to retrieve inventory, check order stock feasibility, draft replenishment POs, review incoming emails, and manage daily tasks.
- All deterministic calculations (such as stock deficits: required - available) are performed by backend tools, not by hallucinating numbers.
- Consequential actions (purchase orders, credit overrides, financial refunds, supplier commitments) are drafted into the Pending Approvals queue for the owner to authorize.
- You can summarize daily operations, explain situations clearly, and guide the owner with concise, actionable steps.
- Be professional, concise, and direct.
`;

// List of Gemini models to cascade through (if one is busy/503/429, try the next)
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest'
];

/**
 * Main AI entry point with 3-tier cascade:
 * Tier 1: Gemini Cascade (Flash 3.8 -> Flash-Lite -> Flash Latest)
 * Tier 2: Groq LLM (openai/gpt-oss-120b)
 * Tier 3: Deterministic Grounded Engine (Offline Fail-Safe)
 */
export async function processAiMessage(userId, userMessage, conversationHistory = []) {
  const text = userMessage.toLowerCase().trim();

  // 1. Business Scope & Trivia Filter
  const isGenericTrivia = [
    'what are star', 'what is a star', 'stars', 'area of india', 'capital of', 
    'who wrote', 'tell me a joke', 'prime minister', 'president of', 
    'weather in', 'distance to moon', 'speed of light', 'who is einstein'
  ].some(term => text.includes(term));

  if (isGenericTrivia) {
    return {
      response: "I am your Business Operations Assistant dedicated exclusively to managing your store inventory, customer orders, communications, and daily operations. I do not answer general knowledge questions or trivia. How can I assist with your store records today?",
      toolsExecuted: [],
      source: 'Business Scope Policy Enforcer'
    };
  }

  // 2. Tier 1: Try Gemini Models Cascade
  if (CONFIG.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const geminiRes = await callGeminiWithTools(userId, userMessage, conversationHistory, model);
        if (geminiRes) {
          return {
            response: geminiRes.text,
            toolsExecuted: geminiRes.toolsExecuted,
            source: `Google Gemini (${model})`
          };
        }
      } catch (err) {
        console.warn(`[AI Service] Gemini (${model}) failed (${err.message}), trying next fallback...`);
      }
    }
  }

  // 3. Tier 2: Try Groq LLM
  if (CONFIG.GROQ_API_KEY) {
    try {
      const groqResponse = await callGroqWithTools(userId, userMessage, conversationHistory);
      if (groqResponse) {
        return {
          response: groqResponse.text,
          toolsExecuted: groqResponse.toolsExecuted,
          source: 'Groq LLM (openai/gpt-oss-120b)'
        };
      }
    } catch (err) {
      console.warn('[AI Service] Groq LLM call failed, engaging deterministic fail-safe engine:', err.message);
    }
  }

  // 4. Tier 3: Deterministic Grounded Engine (Fail-Safe Offline SQLite Fallback)
  return executeDeterministicFallback(userId, userMessage);
}

/**
 * Call Google Gemini API with Native Function Calling and Thought Signature Preservation
 */
async function callGeminiWithTools(userId, userMessage, conversationHistory = [], model = 'gemini-3.8-flash') {
  const tools = getGeminiToolsFormat();
  
  const historyParts = (conversationHistory || []).slice(-4).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '' }]
  }));

  const initialPayload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...historyParts,
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    tools
  };

  const initialRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialPayload)
  });

  if (!initialRes.ok) {
    const errData = await initialRes.json().catch(() => ({}));
    throw new Error(`Gemini status ${initialRes.status}: ${errData?.error?.message || 'Request failed'}`);
  }

  const initialData = await initialRes.json();
  const candidate = initialData.candidates?.[0];
  const modelParts = candidate?.content?.parts || [];

  if (modelParts.length === 0) return null;

  const toolCallPart = modelParts.find(p => p.functionCall);
  const toolsExecuted = [];

  // If no function call, return direct response text
  if (!toolCallPart) {
    const textPart = modelParts.find(p => p.text);
    return {
      text: textPart?.text || "I have analyzed your business records. How else can I assist with your store operations today?",
      toolsExecuted: []
    };
  }

  // Execute the requested backend tool
  const toolName = toolCallPart.functionCall.name;
  const toolArgs = toolCallPart.functionCall.args || {};
  const toolDef = toolRegistry[toolName];
  let toolResult = { error: `Tool ${toolName} not found` };

  if (toolDef) {
    toolResult = toolDef.execute(userId, toolArgs);
    toolsExecuted.push({ name: toolName, args: toolArgs, result: toolResult });
  }

  // Turn 2: Send function result back to Gemini (preserving exact modelParts with thoughtSignature)
  const followUpPayload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...historyParts,
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: modelParts },
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name: toolName,
            response: {
              output: toolResult
            }
          }
        }]
      }
    ]
  };

  const followUpRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(followUpPayload)
  });

  if (followUpRes.ok) {
    const followUpData = await followUpRes.json();
    const finalPart = followUpData.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (finalPart?.text) {
      return { text: finalPart.text, toolsExecuted };
    }
  }

  // If second turn fails, provide deterministic summary of tool output
  return {
    text: `I executed ${toolName} on your live records: ${JSON.stringify(toolResult)}`,
    toolsExecuted
  };
}

/**
 * Call Groq with Function Calling (Tools)
 */
async function callGroqWithTools(userId, userMessage, conversationHistory = []) {
  const tools = getOpenAiToolsFormat();
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-4),
    { role: 'user', content: userMessage }
  ];

  const initialRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2
    })
  });

  if (!initialRes.ok) {
    const errData = await initialRes.json().catch(() => ({}));
    throw new Error(`Groq API error ${initialRes.status}: ${JSON.stringify(errData)}`);
  }

  const initialData = await initialRes.json();
  const choice = initialData.choices?.[0];
  const responseMessage = choice?.message;

  if (!responseMessage) return null;

  const toolsExecuted = [];

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments);
      } catch {}

      const toolDef = toolRegistry[toolName];
      let toolResult = { error: `Tool ${toolName} not found` };

      if (toolDef) {
        toolResult = toolDef.execute(userId, toolArgs);
        toolsExecuted.push({ name: toolName, args: toolArgs, result: toolResult });
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolResult)
      });
    }

    const followUpRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        temperature: 0.2
      })
    });

    if (followUpRes.ok) {
      const followUpData = await followUpRes.json();
      const finalContent = followUpData.choices?.[0]?.message?.content;
      if (finalContent) {
        return { text: finalContent, toolsExecuted };
      }
    }
  }

  return {
    text: responseMessage.content || "I have analyzed your business records. How else can I assist with your store operations today?",
    toolsExecuted
  };
}

/**
 * Deterministic Intent & Grounded Fallback Engine
 * Invokes the exact same registered backend tools directly against SQLite.
 * Guarantees the presentation never crashes even if Wi-Fi or API quotas fail.
 */
function executeDeterministicFallback(userId, userMessage) {
  const text = userMessage.toLowerCase();
  const toolsExecuted = [];
  let reply = '';

  // Communications / Email Queries (Expanded keyword matching: 'mail', 'email', 'message', 'inbox')
  if (
    text.includes('mail') || text.includes('email') || text.includes('message') || 
    text.includes('communication') || text.includes('inbox') || text.includes('customer message')
  ) {
    const res = toolRegistry.search_communications.execute(userId, {});
    toolsExecuted.push({ name: 'search_communications', result: res });

    if (text.includes('last') || text.includes('latest') || text.includes('recent') || text.includes('new')) {
      const latest = res.messages[0];
      if (latest) {
        reply = `The most recent message is from **${latest.from}**:
• Subject: "${latest.subject}"
• Category: ${latest.category} (${latest.urgency} Priority)
• Received: ${latest.received}
• Approval Status: ${latest.requiresApproval ? 'Draft reply requires your sign-off' : 'Auto-routed'}

You can review and send the drafted reply on the Communications tab.`;
      } else {
        reply = 'You currently have no unread customer communications.';
      }
    } else {
      reply = `Found ${res.count} recent communication threads:
${res.messages.map(m => `• [${m.category} - ${m.urgency}] ${m.from}: "${m.subject}" ${m.requiresApproval ? '(Requires Owner Sign-off)' : ''}`).join('\n')}
You can review and authorize drafted replies directly on the Communications tab.`;
    }
  } else if (text.includes('attention') || text.includes('today') || text.includes('summary') || text.includes('priority')) {
    const res = toolRegistry.get_daily_operational_summary.execute(userId);
    toolsExecuted.push({ name: 'get_daily_operational_summary', result: res });
    const s = res.summary;
    reply = `Here is your Daily Operational Summary for today:
• Low-Stock Alerts: ${s.lowStockCount} product(s) below reorder levels (${s.criticalItems.join(', ')}).
• Orders with Deficits: ${s.ordersWithShortage.length > 0 ? s.ordersWithShortage.join(', ') : 'None'}.
• Pending Approvals: ${s.pendingApprovalsCount} consequential actions (${s.topApprovals.slice(0, 2).join('; ')}).
• Urgent Communications: ${s.urgentCommunicationsCount} message(s) requiring attention.
• Scheduled Tasks: ${s.openTasksCount} action item(s) on your daily checklist.`;
  } else if (text.includes('stock') || text.includes('inventory') || text.includes('shortage') || text.includes('replenish') || text.includes('deficit')) {
    const res = toolRegistry.get_inventory_status.execute(userId, { filter: 'low_stock' });
    toolsExecuted.push({ name: 'get_inventory_status', result: res });
    reply = `Currently, ${res.count} product(s) are below safety reorder thresholds:
${res.products.map(p => `• ${p.name}: ${p.currentStock} ${p.unit} in stock (Reorder threshold: ${p.minThreshold} ${p.unit}) - [${p.status}]`).join('\n')}
Would you like me to draft replenishment Purchase Orders to the assigned suppliers?`;
  } else if (text.includes('draft') || text.includes('po') || text.includes('purchase order') || text.includes('restock')) {
    const res = toolRegistry.create_replenishment_draft.execute(userId, {
      product_name: 'Basmati',
      quantity: 20,
      reason: 'Automated restock draft ahead of expected retail demand.'
    });
    toolsExecuted.push({ name: 'create_replenishment_draft', result: res });
    reply = `I have prepared a Purchase Order draft:
• Ref: ${res.poNumber} for ${res.quantity} bags of ${res.product}
• Estimated Total: ${res.estimatedCost}
• Status: Placed into the Pending Approvals queue. As per business governance rules, your explicit approval is required before issuing to the supplier.`;
  } else if (text.includes('order') || text.includes('delayed') || text.includes('feasibility')) {
    const res = toolRegistry.check_order_stock_feasibility.execute(userId, {});
    toolsExecuted.push({ name: 'check_order_stock_feasibility', result: res });
    reply = `Stock Feasibility Check for ${res.orderNumber}:
${res.recommendation}
Total Order Value: ₹${res.totalAmount}`;
  } else if (text.includes('approval') || text.includes('pending') || text.includes('sign-off')) {
    const res = toolRegistry.get_pending_approvals.execute(userId);
    toolsExecuted.push({ name: 'get_pending_approvals', result: res });
    reply = `You currently have ${res.count} action(s) awaiting your authorization:
${res.items.map(a => `• [${a.type}] ${a.title} - ${a.amount || 'Review'} (Urgency: ${a.urgency})`).join('\n')}
You can authorize these with 1-click in the Approvals Center.`;
  } else if (text.includes('task') || text.includes('checklist') || text.includes('todo')) {
    const res = toolRegistry.get_daily_operational_summary.execute(userId);
    toolsExecuted.push({ name: 'get_daily_operational_summary', result: res });
    reply = `You have ${res.summary.openTasksCount} operational tasks scheduled for today. Review your checklist in the Operations tab.`;
  } else {
    const res = toolRegistry.get_daily_operational_summary.execute(userId);
    toolsExecuted.push({ name: 'get_daily_operational_summary', result: res });
    reply = `I am grounded in your store's live database.
You currently have ${res.summary.lowStockCount} low-stock item(s), ${res.summary.pendingOrdersCount} active order(s), and ${res.summary.pendingApprovalsCount} pending approval(s).
You can ask me to:
1. "Check inventory shortages"
2. "Review pending customer communications"
3. "Draft a replenishment purchase order"
4. "What needs my attention today?"`;
  }

  return {
    response: reply,
    toolsExecuted,
    source: 'Deterministic Fail-Safe Fallback (Live SQLite Engine)'
  };
}
