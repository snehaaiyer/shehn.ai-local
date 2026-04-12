import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, CheckCheck, Sparkles } from 'lucide-react';
import { Message } from '../types/marketplace';

interface MessageThreadProps {
  messages: Message[];
  onSend: (content: string) => void;
  currentRole: 'couple' | 'vendor';
  isLoading?: boolean;
  /** When set externally, replaces the current draft text (e.g. AI-generated suggestion). */
  externalDraft?: string | null;
  /** Called after the external draft has been applied, so the parent can clear it. */
  onExternalDraftApplied?: () => void;
  /** Callback to request an AI-drafted message. Returns the draft text or null. */
  onAiDraft?: () => Promise<string | null>;
  /** Whether the AI draft request is in progress. */
  aiDrafting?: boolean;
  /** Whether to show the "AI suggested" label. */
  aiDraftLabel?: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const MessageThread: React.FC<MessageThreadProps> = ({ messages, onSend, currentRole, isLoading = false, externalDraft, onExternalDraftApplied, onAiDraft, aiDrafting = false, aiDraftLabel = false }) => {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Apply external draft when provided (e.g. from AI suggestion)
  useEffect(() => {
    if (externalDraft != null && externalDraft !== '') {
      setDraft(externalDraft);
      onExternalDraftApplied?.();
      textareaRef.current?.focus();
    }
  }, [externalDraft, onExternalDraftApplied]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  }, [draft]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => {
          if (msg.message_type === 'system') {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <span className="bg-gray-50 text-gray-700 text-sm px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </motion.div>
            );
          }

          const isOwn = msg.sender_role === currentRole;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 ${
                  isOwn
                    ? 'bg-rose-500 text-white rounded-2xl rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[10px] ${isOwn ? 'text-rose-200' : 'text-gray-400'}`}>
                    {formatTime(msg.created_at)}
                  </span>
                  {isOwn && (
                    msg.read_at
                      ? <CheckCheck className={`w-3 h-3 ${isOwn ? 'text-rose-200' : 'text-gray-400'}`} />
                      : <Check className={`w-3 h-3 ${isOwn ? 'text-rose-200' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white space-y-1">
        {aiDraftLabel && (
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-[10px] text-rose-400 font-medium"
          >
            AI suggested
          </motion.span>
        )}
        <div className="flex items-end gap-2">
          {onAiDraft && (
            <button
              onClick={async () => {
                const result = await onAiDraft();
                if (result) setDraft(result);
              }}
              disabled={aiDrafting}
              title="AI Draft"
              className="shrink-0 w-9 h-9 rounded-full border border-rose-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-colors disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isLoading}
            className="shrink-0 w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
