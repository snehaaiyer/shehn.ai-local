
import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const AIChatWidget: React.FC = () => {
  const { chatHistory, addChatMessage } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message
    addChatMessage({ role: 'user', content: userMessage });

    try {
      // Simulate AI response (replace with actual AI service call)
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-rose-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="mx-auto mb-2" size={32} />
            <p>Hi! I'm your AI wedding assistant.</p>
            <p className="text-sm">Ask me anything about your wedding planning!</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex space-x-2 justify-start">
            <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your wedding..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatWidget;
