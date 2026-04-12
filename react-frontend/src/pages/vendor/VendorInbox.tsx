import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import ConversationList from '../../components/ConversationList';
import MessageThread from '../../components/MessageThread';
import { MessagingService } from '../../services/messaging_service';
import { MarketplaceAIService } from '../../services/marketplace_ai_service';
import { useAppStore } from '../../store/useAppStore';
import { Conversation, Message } from '../../types/marketplace';

const VendorInbox: React.FC = () => {
  const { currentUserId, activeConversationId, setActiveConversation } = useAppStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiDraftText, setAiDraftText] = useState<string | null>(null);

  // Load conversations
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await MessagingService.getConversations({ vendor_id: currentUserId });
        if (res.success && res.data) setConversations(res.data);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    (async () => {
      setMessagesLoading(true);
      try {
        const res = await MessagingService.getConversation(activeConversationId);
        if (res.success && res.data) setMessages(res.data.messages);
      } catch { /* ignore */ } finally {
        setMessagesLoading(false);
      }
    })();
  }, [activeConversationId]);

  const handleSend = useCallback(async (content: string) => {
    if (!activeConversationId || !content.trim()) return;
    try {
      const res = await MessagingService.sendMessage(activeConversationId, {
        sender_role: 'vendor',
        sender_id: currentUserId,
        content,
        message_type: 'text',
      });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
      }
    } catch { /* ignore */ }
  }, [activeConversationId, currentUserId]);

  const handleBack = () => setActiveConversation(null);

  const handleAiDraft = async () => {
    if (!activeConversationId || aiDrafting) return;
    setAiDrafting(true);
    try {
      const activeConvo = conversations.find((c) => c.id === activeConversationId);
      const subject = (activeConvo as any)?.subject || 'Wedding vendor discussion';
      const history = messages.map((m) => ({ sender_role: m.sender_role, content: m.content }));
      const res = await MarketplaceAIService.suggestMessage('vendor', subject, history);
      if (res.success && res.data) {
        setAiDraftText(res.data.message);
      }
    } catch { /* ignore */ } finally {
      setAiDrafting(false);
    }
  };

  const handleExternalDraftApplied = useCallback(() => {
    setAiDraftText(null);
  }, []);

  // Responsive: show list or thread on mobile
  const showThreadOnMobile = activeConversationId !== null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-bold text-gray-900">Inbox</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list — hidden on mobile when thread is open */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 bg-white flex-shrink-0 overflow-y-auto ${showThreadOnMobile ? 'hidden md:block' : 'block'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-6 w-6 border-3 border-rose-400 border-t-transparent rounded-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={(id) => setActiveConversation(id)}
            />
          )}
        </div>

        {/* Message thread */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${!showThreadOnMobile ? 'hidden md:flex' : 'flex'}`}>
          {activeConversationId ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden px-3 py-2 border-b border-gray-100 bg-white">
                <button onClick={handleBack} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              {/* AI Draft button */}
              <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center justify-end">
                <button
                  onClick={handleAiDraft}
                  disabled={aiDrafting || messages.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {aiDrafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI Draft
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <MessageThread
                  messages={messages}
                  onSend={handleSend}
                  currentRole="vendor"
                  isLoading={messagesLoading}
                  externalDraft={aiDraftText}
                  onExternalDraftApplied={handleExternalDraftApplied}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Select a conversation to view messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorInbox;
