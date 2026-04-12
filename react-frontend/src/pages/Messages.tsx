import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, Search, Sparkles, Send, ChevronDown, ChevronUp, IndianRupee, Check } from 'lucide-react';
import { MessagingService } from '../services/messaging_service';
import { MarketplaceAIService } from '../services/marketplace_ai_service';
import { Conversation, Message } from '../types/marketplace';
import ConversationList from '../components/ConversationList';
import MessageThread from '../components/MessageThread';
import { useAppStore } from '../store/useAppStore';

const POLL_INTERVAL = 10_000; // 10 seconds

const Messages: React.FC = () => {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const storeActiveConversation = useAppStore((s) => s.activeConversationId);
  const setStoreActiveConversation = useAppStore((s) => s.setActiveConversation);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(storeActiveConversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Draft vendor messages from Smart Planner
  const storeDrafts = useAppStore((s) => s.draftVendorMessages);
  const [sentDraftIds, setSentDraftIds] = useState<Set<number>>(new Set());
  const [draftsCollapsed, setDraftsCollapsed] = useState(false);

  // Load drafts from store or localStorage fallback
  const draftMessages: any[] = storeDrafts.length > 0
    ? storeDrafts
    : (() => {
        try {
          const stored = localStorage.getItem('draftVendorMessages');
          return stored ? JSON.parse(stored) : [];
        } catch { return []; }
      })();

  const handleMarkSent = (index: number) => {
    setSentDraftIds((prev) => new Set(prev).add(index));
  };

  // AI draft state
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiDraftLabel, setAiDraftLabel] = useState(false);

  // Track the active conversation for polling
  const activeConvRef = useRef(activeConversation);
  activeConvRef.current = activeConversation;

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    try {
      const res = await MessagingService.getConversations({ couple_id: String(currentUserId) as any });
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch {
      // silently handle
    }
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadConversations();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadConversations]);

  // ── Load messages for active conversation ──
  const loadMessages = useCallback(async (convId: number) => {
    try {
      const res = await MessagingService.getConversation(convId);
      if (res.success && res.data) {
        setMessages(res.data.messages);
      }
    } catch {
      // silently handle
    }
  }, []);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      await loadMessages(activeConversation);
      if (!cancelled) setMessagesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeConversation, loadMessages]);

  // ── Poll for new messages ──
  useEffect(() => {
    const interval = setInterval(() => {
      const convId = activeConvRef.current;
      if (convId) loadMessages(convId);
      loadConversations();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [loadMessages, loadConversations]);

  // ── Select conversation ──
  const handleSelect = useCallback((id: number) => {
    setActiveConversation(id);
    setStoreActiveConversation(id);
  }, [setStoreActiveConversation]);

  // ── Back (mobile) ──
  const handleBack = useCallback(() => {
    setActiveConversation(null);
    setStoreActiveConversation(null);
  }, [setStoreActiveConversation]);

  // ── Send message ──
  const handleSend = useCallback(async (content: string) => {
    if (!activeConversation) return;
    try {
      const res = await MessagingService.sendMessage(activeConversation, {
        sender_role: 'couple',
        sender_id: currentUserId,
        content,
      });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
        // Update conversation list preview
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation
              ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
              : c
          )
        );
      }
    } catch {
      // silently handle
    }
  }, [activeConversation, currentUserId]);

  // ── Filter conversations by search ──
  const filteredConversations = searchQuery.trim()
    ? conversations.filter(
        (c) =>
          c.other_party_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // ── Active conversation metadata ──
  const activeConvData = conversations.find((c) => c.id === activeConversation);

  // ── AI Draft ──
  const handleAiDraft = useCallback(async (): Promise<string | null> => {
    if (!activeConvData) return null;
    setAiDrafting(true);
    try {
      const lastMessages = messages.slice(-5).map((m) => ({
        sender_role: m.sender_role,
        content: m.content,
      }));
      const res = await MarketplaceAIService.suggestMessage(
        'couple',
        activeConvData.subject,
        lastMessages,
        {}
      );
      if (res.success && res.data) {
        setAiDraftLabel(true);
        setTimeout(() => setAiDraftLabel(false), 3000);
        setAiDrafting(false);
        return res.data.message;
      }
    } catch {
      // silently handle
    }
    setAiDrafting(false);
    return null;
  }, [activeConvData, messages]);

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  // No conversations at all
  if (conversations.length === 0 && draftMessages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No messages yet</h2>
          <p className="text-sm text-gray-500">
            Start a conversation from the{' '}
            <a href="/quotes" className="text-rose-500 hover:text-rose-600 font-medium">
              Quotes
            </a>{' '}
            page.
          </p>
        </div>
      </div>
    );
  }

  // Show drafts section when there are draft messages (full page if no conversations, collapsed banner if conversations exist)
  const showDraftsSection = draftMessages.length > 0;
  const draftsFullPage = showDraftsSection && conversations.length === 0;

  if (draftsFullPage) {
    const formatCurrency = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Draft Messages from Smart Planner</h2>
            <p className="text-sm text-gray-500">Review and send these vendor inquiry drafts</p>
          </div>
        </div>
        <div className="space-y-4">
          {draftMessages.map((msg: any, i: number) => {
            const isSent = sentDraftIds.has(i);
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 uppercase tracking-wide">
                    {msg.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span className="font-medium">{formatCurrency(msg.budget_allocated)}</span>
                  </div>
                </div>
                {msg.subject && (
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">{msg.subject}</h4>
                )}
                <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
                  {msg.message.length > 280 ? msg.message.slice(0, 280) + '...' : msg.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isSent ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isSent ? 'Sent' : 'Draft'}
                  </span>
                  <button
                    onClick={() => handleMarkSent(i)}
                    disabled={isSent}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isSent
                        ? 'bg-green-50 text-green-600 cursor-default'
                        : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check className="w-4 h-4" />
                        Sent
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to Vendor
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      {/* ── Left Panel: Conversation List ── */}
      <div
        className={`w-full lg:w-1/3 lg:max-w-sm border-r border-gray-200 bg-white flex flex-col ${
          activeConversation ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Collapsed drafts banner (when conversations exist) */}
        {showDraftsSection && (
          <div className="border-b border-gray-100">
            <button
              onClick={() => setDraftsCollapsed(!draftsCollapsed)}
              className="w-full px-4 py-2.5 flex items-center justify-between bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-700">
                  {draftMessages.length} draft{draftMessages.length !== 1 ? 's' : ''} from Smart Planner
                </span>
              </div>
              {draftsCollapsed ? <ChevronDown className="w-4 h-4 text-rose-400" /> : <ChevronUp className="w-4 h-4 text-rose-400" />}
            </button>
            {!draftsCollapsed && (
              <div className="px-3 py-2 max-h-48 overflow-y-auto space-y-2 bg-rose-50/50">
                {draftMessages.map((msg: any, i: number) => {
                  const isSent = sentDraftIds.has(i);
                  return (
                    <div key={i} className="bg-white rounded-lg p-2.5 border border-gray-100 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-rose-600 uppercase">{msg.category}</span>
                          {msg.subject && <span className="text-[10px] text-gray-400 truncate">- {msg.subject}</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkSent(i); }}
                        disabled={isSent}
                        className={`shrink-0 text-xs px-2 py-1 rounded-md font-medium ${
                          isSent ? 'bg-green-50 text-green-600' : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}
                      >
                        {isSent ? 'Sent' : 'Send'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Search header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
            />
          </div>
        </div>
        <ConversationList
          conversations={filteredConversations}
          activeId={activeConversation}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Right Panel: Messages ── */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          activeConversation ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {activeConversation && activeConvData ? (
          <>
            {/* Conversation header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
              <button
                onClick={handleBack}
                className="lg:hidden shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{activeConvData.other_party_name}</h3>
                <p className="text-xs text-gray-400 truncate">{activeConvData.subject}</p>
              </div>
              {activeConvData.other_party_category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 capitalize">
                  {activeConvData.other_party_category}
                </span>
              )}
            </div>

            {/* Messages */}
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-3 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : (
              <MessageThread
                messages={messages}
                onSend={handleSend}
                currentRole="couple"
                onAiDraft={handleAiDraft}
                aiDrafting={aiDrafting}
                aiDraftLabel={aiDraftLabel}
              />
            )}
          </>
        ) : (
          /* Desktop empty state */
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-400">Choose a vendor to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
