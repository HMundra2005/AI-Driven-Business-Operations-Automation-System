import React, { useState, useEffect } from 'react';
import { 
  MessageSquareText, 
  Mail, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  ShieldAlert, 
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { api } from '../../../api/client';

export default function CommunicationsView({ onNotify, onRefreshDashboard }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [customReply, setCustomReply] = useState('');

  // Simulator Modal State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState('preset'); // 'preset' | 'custom'
  const [customEmail, setCustomEmail] = useState({
    sender: '',
    senderName: '',
    subject: '',
    body: '',
    channel: 'Email'
  });

  // Summary State
  const [summaryData, setSummaryData] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.communications.getEmails();
      setEmails(res.emails || []);
      if (res.emails && res.emails.length > 0 && !selectedEmail) {
        setSelectedEmail(res.emails[0]);
        setCustomReply(res.emails[0].proposed_reply || '');
      }
    } catch (err) {
      onNotify('Error Loading Emails', err.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSelectEmail = (em) => {
    setSelectedEmail(em);
    setCustomReply(em.proposed_reply || '');
    if (!em.is_read) {
      api.communications.markRead(em.id).catch(() => {});
      setEmails(prev => prev.map(e => e.id === em.id ? { ...e, is_read: 1 } : e));
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail) return;
    try {
      const res = await api.communications.approveReply(selectedEmail.id, customReply);
      onNotify('Reply Authorized', res.message, 'success');
      fetchEmails();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Failed to Send Reply', err.message, 'warning');
    }
  };

  const handleSimulatePreset = async (presetType) => {
    let payload = {};
    if (presetType === 'delay') {
      payload = {
        sender: 'dispatch@sunrisefreight.in',
        senderName: 'Sunrise Logistics (Carrier)',
        subject: 'Transit Delay Notice - Consignment #SN-9012',
        body: 'Vehicle #RJ14-GA-9921 encountered severe traffic after toll bypass. Estimated delivery delayed by 2 hours. Revised ETA: 4:45 PM.',
        channel: 'Email'
      };
    } else if (presetType === 'credit') {
      payload = {
        sender: 'accounts@sharmatraders.net',
        senderName: 'Sharma Traders (Wholesale Client)',
        subject: 'Request for 20-Day Credit Extension for Invoice #INV-889',
        body: 'Respected Management, we request a 20-day credit period extension for our current outstanding balance of Rs. 78,500 due to banking clearance delays.',
        channel: 'Email'
      };
    } else if (presetType === 'complaint') {
      payload = {
        sender: 'purchase@citysupermarket.com',
        senderName: 'City Supermarket',
        subject: 'Complaint: Damaged packaging in morning shipment',
        body: '3 tins of Refined Sunflower Oil were received with dented caps and leakages. Please issue credit note of Rs. 4,950 or send immediate replacement tins.',
        channel: 'Email'
      };
    } else if (presetType === 'order') {
      payload = {
        sender: 'kunal@metrogrocers.in',
        senderName: 'Kunal Mehra (Metro Grocers)',
        subject: 'Urgent inquiry: Dispatch schedule for Basmati Rice Order ORD-4491',
        body: 'Could you confirm when vehicle will leave your godown? We need dispatch confirmation today before 2 PM.',
        channel: 'WhatsApp Business'
      };
    }

    try {
      const res = await api.communications.simulate(payload);
      onNotify('Simulated Email Received', `Parsed as [${res.email.category}] with urgency [${res.email.urgency}].`, 'success');
      setShowSimulator(false);
      fetchEmails();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Simulation Failed', err.message, 'warning');
    }
  };

  const handleSimulateCustom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.communications.simulate(customEmail);
      onNotify('Custom Message Received', `Classified as ${res.email.category}.`, 'success');
      setShowSimulator(false);
      setCustomEmail({ sender: '', senderName: '', subject: '', body: '', channel: 'Email' });
      fetchEmails();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Failed to Simulate', err.message, 'warning');
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const res = await api.communications.getSummary();
      setSummaryData(res);
      setShowSummaryModal(true);
    } catch (err) {
      onNotify('Summary Failed', err.message, 'warning');
    }
  };

  const filteredEmails = filterCategory === 'ALL'
    ? emails
    : emails.filter(e => e.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Email & Communication Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated incoming email detection, background entity extraction, and approval-governed responses.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Worker Status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Background Detector Active</span>
          </div>

          <button
            onClick={handleGenerateSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Generate Intelligence Summary</span>
          </button>

          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Simulate Incoming Email</span>
          </button>

          <button
            onClick={fetchEmails}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Refresh emails"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['ALL', 'Order Inquiry', 'Delivery/Logistics', 'Billing/Invoicing', 'Complaint', 'General'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap border ${
              filterCategory === cat
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat} {cat === 'ALL' ? `(${emails.length})` : `(${emails.filter(e => e.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Inbox List & Selected Email Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Email List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[600px]">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inbox ({filteredEmails.length})</span>
            <span className="text-[10px] text-slate-400">Auto-detected without opening</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No emails in this category.</div>
            ) : (
              filteredEmails.map(em => {
                const isSelected = selectedEmail?.id === em.id;
                const isHigh = em.urgency === 'High';
                return (
                  <div
                    key={em.id}
                    onClick={() => handleSelectEmail(em)}
                    className={`p-3.5 cursor-pointer transition flex flex-col gap-1 ${
                      isSelected ? 'bg-sky-50/70 border-l-4 border-l-sky-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs truncate ${!em.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {em.sender_name || em.sender}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {em.requires_approval === 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                            Approval Needed
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isHigh ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {em.urgency}
                        </span>
                      </div>
                    </div>

                    <p className={`text-xs truncate ${!em.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                      {em.subject}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{em.channel} • {em.category}</span>
                      <span>{em.reply_status === 'Sent' ? 'Replied' : 'Pending'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Email Detail & Proposed Action */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col h-[600px] overflow-y-auto">
          {selectedEmail ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Email Heading */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedEmail.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From: <span className="font-semibold text-slate-700">{selectedEmail.sender_name || selectedEmail.sender}</span> ({selectedEmail.sender})
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {selectedEmail.channel}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    Category: {selectedEmail.category}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedEmail.urgency === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Urgency: {selectedEmail.urgency}
                  </span>
                  {selectedEmail.requires_approval === 1 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-purple-600" />
                      <span>Owner Review Required</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Routine Inquiry</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-sans">
                {selectedEmail.body}
              </div>

              {/* AI Proposed Response Area */}
              <div className="mt-auto border-t border-slate-100 pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Bot className="w-4 h-4 text-sky-600" />
                    <span>AI-Generated Response Draft</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Owner must authorize before sending</span>
                </div>

                <textarea
                  rows={4}
                  value={customReply}
                  onChange={(e) => setCustomReply(e.target.value)}
                  placeholder="Review or edit proposed reply..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Status: <span className="font-semibold text-slate-700">{selectedEmail.reply_status}</span>
                  </span>

                  <button
                    onClick={handleSendReply}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize & Send Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Select an email from the left to view details and review responses.
            </div>
          )}
        </div>
      </div>

      {/* Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Simulate Incoming Business Email</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a preset business scenario or input raw email text. The background worker will immediately classify and extract records.
            </p>

            <div className="flex rounded-lg bg-slate-100 p-1 mb-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSimulatorMode('preset')}
                className={`flex-1 py-1.5 rounded-md transition ${simulatorMode === 'preset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                1-Click Presets
              </button>
              <button
                type="button"
                onClick={() => setSimulatorMode('custom')}
                className={`flex-1 py-1.5 rounded-md transition ${simulatorMode === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                Custom Email Form
              </button>
            </div>

            {simulatorMode === 'preset' ? (
              <div className="space-y-2.5">
                <button
                  onClick={() => handleSimulatePreset('delay')}
                  className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">🚚 Carrier Transit Delay</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">High Urgency</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sunrise Logistics: Tire failure delay near highway toll.</p>
                </button>

                <button
                  onClick={() => handleSimulatePreset('credit')}
                  className="w-full p-3 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-left transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">💰 20-Day Credit Extension Request</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Approval Required</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sharma Traders: Extension for Rs. 78,500 balance.</p>
                </button>

                <button
                  onClick={() => handleSimulatePreset('complaint')}
                  className="w-full p-3 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 text-left transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">⚠️ Damaged Goods & Credit Note Claim</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">High Severity</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">City Supermarket: Dented oil tins requiring Rs. 4,950 refund.</p>
                </button>

                <button
                  onClick={() => handleSimulatePreset('order')}
                  className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">📦 Order Dispatch Status Inquiry</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">Order Inquiry</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Metro Grocers: Asking for dispatch ETA for Basmati Rice order.</p>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSimulateCustom} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    placeholder="client@retailstore.com"
                    value={customEmail.sender}
                    onChange={(e) => setCustomEmail({ ...customEmail, sender: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent quotation for 50 bags Atta"
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Body Text</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Paste email content here..."
                    value={customEmail.body}
                    onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                >
                  Simulate & Process Email
                </button>
              </form>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowSimulator(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-slate-800">Operational Intelligence Summary</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans mb-4">
              {summaryData.summaryText}
            </div>

            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Recommended Actions:</h4>
            <div className="space-y-1.5 mb-5 max-h-48 overflow-y-auto">
              {summaryData.actionRecommendations.map((act, idx) => (
                <div key={idx} className="p-2 rounded bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium">
                  {act}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
