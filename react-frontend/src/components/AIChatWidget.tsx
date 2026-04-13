import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLocation } from 'react-router-dom';

const AIChatWidget: React.FC = () => {
  const { chatHistory, addChatMessage, theme } = useAppStore();
  const isDark = theme === 'dark';
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide the floating widget on the AI Planner page to avoid overlap
  const isOnPlannerPage = location.pathname === '/plan';

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    addChatMessage({ role: 'user', content: userMessage });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiResponse = `I understand you're asking about "${userMessage}". Let me help you with your wedding planning needs!`;
      addChatMessage({ role: 'assistant', content: aiResponse });
    } catch (error) {
      console.error('Error sending message:', error);
      addChatMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Don't show the FAB on the planner page (it has its own full chat)
  if (isOnPlannerPage && !isOpen) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-2xl shadow-elevated flex items-center justify-center z-50 transition-all duration-300 hover:scale-105 active:scale-95 ${
          isDark
            ? 'bg-rose-600 text-white hover:bg-rose-500'
            : 'bg-rose-500 text-white hover:bg-rose-600'
        }`}
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 w-[calc(100vw-2rem)] sm:w-80 flex flex-col shadow-elevated rounded-2xl border overflow-hidden transition-all duration-300 ${
      isOnPlannerPage
        ? 'top-4 right-4 h-[min(420px,80vh)]'
        : 'bottom-4 sm:bottom-6 right-4 sm:right-6 h-[min(420px,80vh)]'
    } ${
      isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <span className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>AI Assistant</span>
            <span className="block text-[10px] text-gray-400 -mt-0.5">Quick help</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50/50'}`}>
        {chatHistory.length === 0 ? (
          <div className={`text-center mt-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Bot size={24} className={isDark ? 'text-gray-500' : 'text-gray-300'} />
            </div>
            <p className="text-sm font-medium">Hi! I'm your AI assistant.</p>
            <p className="text-xs mt-1">Ask me anything about your wedding!</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[220px] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-rose-500 text-white rounded-br-md'
                    : isDark
                      ? 'bg-gray-700 text-gray-200 rounded-bl-md'
                      : 'bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-soft'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <User size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-white" />
            </div>
            <div className={`px-3 py-2.5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-100'}`}>
              <div className="flex gap-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`} style={{ animationDelay: '0.15s' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`} style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`px-3 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your wedding..."
            className={`flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-300 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
            }`}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-3 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatWidget;
