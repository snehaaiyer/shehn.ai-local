
import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I couldn\'t process your request.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-pink-500 text-white p-3 rounded-full shadow-lg hover:bg-pink-600"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
          <div className="flex items-center justify-between p-3 bg-pink-500 text-white rounded-t-lg">
            <h3 className="font-medium">AI Wedding Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            {messages.map(message => (
              <div
                key={message.id}
                className={`mb-2 p-2 rounded ${
                  message.sender === 'user'
                    ? 'bg-pink-100 ml-auto max-w-[80%]'
                    : 'bg-gray-100 mr-auto max-w-[80%]'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 p-2 rounded mr-auto max-w-[80%]">
                <p className="text-sm">AI is thinking...</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your wedding..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
