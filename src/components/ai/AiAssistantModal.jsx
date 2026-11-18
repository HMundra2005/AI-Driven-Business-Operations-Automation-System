import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, AlertCircle, RefreshCw, CheckCircle2, Wrench, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';

export default function AiAssistantModal({ isOpen, onToggle, onNavigateTo }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your AI Business Operations Assistant. I am grounded in your live store database and can check inventory shortages, inspect incoming customer emails, draft purchase orders for owner approval, and coordinate daily priorities. What would you like to review?",
      timestamp: 'Active Agent',
      isSystemIntro: true,
      source: 'Gemini 3.8 + Groq LLM Cascading Engine'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.ai.chat(userMsg.text, history);

      const aiReply = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.response,
        toolsExecuted: res.toolsExecuted || [],
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      const errorReply = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `Unable to process request: ${err.message}. Please verify the server is running on localhost:5000.`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: "Conversation reset. Live database tools ready. How can I assist with your business today?",
        timestamp: 'System',
        isSystemIntro: true,
        source: 'Live Store Assistant'
      }
    ]);
  };

  const promptSuggestions = [
    "What needs my attention today?",
    "Check critical low-stock items",
    "Check order stock feasibility",
    "Are there any urgent emails?",
    "Draft restock PO for Basmati Rice",
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-0.5 active:translate-y-0 border border-slate-700/80 group"
          aria-label="Toggle AI Business Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide">
            AI Assistant
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>

      {/* Floating Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] bg-white rounded-2xl border border-slate-300 shadow-2xl z-50 overflow-hidden flex flex-col h-[560px] max-h-[85vh] animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Panel Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">AI Operations Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-slate-300 font-medium">Gemini 3.8 + Groq LLM + Live SQLite</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Reset conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Intelligence Notice Strip */}
          <div className="bg-sky-50 px-3 py-1.5 border-b border-sky-100 flex items-center justify-between text-[11px] text-sky-900 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Grounded in live database records</span>
            </span>
            <span className="text-[10px] text-sky-700 font-mono">
              9 Backend Tools Active
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-xs shadow-xs font-medium'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  {/* Tool execution pills if any */}
                  {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                    <div className="mb-2 pb-1.5 border-b border-slate-100 flex flex-wrap gap-1">
                      {msg.toolsExecuted.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          <Wrench className="w-2.5 h-2.5 text-sky-600" />
                          <span>{t.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Source indicator */}
                  {msg.source && (
                    <div className="mt-1.5 pt-1 border-t border-slate-100 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Source: {msg.source}</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white rounded-2xl px-3.5 py-2.5 text-xs border border-slate-200 shadow-2xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  <span>Consulting live database tools & drafting response...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] text-slate-400 whitespace-nowrap">Try:</span>
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSend(prompt)}
                className="text-[10px] bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-200/60 font-medium disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              disabled={isLoading}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask stock, check orders, draft POs..."
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 focus:bg-white transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white transition shadow-xs flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
