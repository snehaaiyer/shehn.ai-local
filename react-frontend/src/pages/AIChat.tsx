import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { API_BASE } from '../config/api_config';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  loading?: boolean;
  taskResult?: {
    action: string;
    data?: any;
    nextSteps?: string[];
  };
}

// Logo component with proper React fallback
const LogoWithFallback: React.FC<{ size?: string }> = ({ size = "w-8 h-8" }) => {
  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return (
      <div className={`${size} mr-2 bg-salmon-pink rounded-full flex items-center justify-center text-white font-bold text-xs`}>
        S
      </div>
    );
  }

  return (
    <img
      src="/shehnai-logo.png"
      alt="Shehn.AI"
      className={`${size} mr-2`}
      onError={() => setImageError(true)}
    />
  );
};

const AIChat: React.FC = () => {
  const { blueprintId } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDemoMode = !process.env.REACT_APP_GOOGLE_API_KEY || !process.env.REACT_APP_GEMINI_API_KEY;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user preferences and initialize AI assistant
  useEffect(() => {
    const loadUserPreferences = () => {
      const savedPreferences = localStorage.getItem('weddingPreferences');
      if (savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences);

          // Add welcome message with user context
          const welcomeMessage = generateWelcomeMessage(preferences);
          setMessages([{
            id: '1',
            content: welcomeMessage,
            sender: 'ai',
            timestamp: new Date()
          }]);
        } catch (error) {
          console.error('Error loading preferences:', error);
          setMessages([{
            id: '1',
            content: "Welcome to ShehnAI Chat! I'm your wedding planning assistant. Please set up your wedding preferences first to get personalized help.",
            sender: 'ai',
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          id: '1',
          content: "Welcome to ShehnAI Chat! I'm your wedding planning assistant. Please set up your wedding preferences first to get personalized help.",
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
    };

    loadUserPreferences();
  }, []);

  const generateWelcomeMessage = (preferences: any) => {
    const weddingDate = preferences.basicDetails?.weddingDate;
    const location = preferences.basicDetails?.location;
    const budget = preferences.basicDetails?.budgetRange;

    let welcome = "🎉 Welcome to ShehnAI Chat! I'm your intelligent wedding planning assistant.\n\n";

    if (blueprintId) {
      welcome += "I have your wedding blueprint loaded — ask me anything about your plan!\n\n";
    }

    if (weddingDate && location && budget) {
      welcome += `I can see you're planning a ${budget} wedding in ${location} on ${weddingDate}.\n\n`;
    }

    welcome += "I can help you with:\n";
    welcome += "📅 Schedule meetings with vendors\n";
    welcome += "🔍 Find vendors based on your preferences\n";
    welcome += "📧 Send emails to vendors\n";
    welcome += "🗺️ Get directions to venues\n";
    welcome += "📋 Create wedding timelines\n";
    welcome += "💰 Analyze your budget\n";
    welcome += "💬 Communicate with vendors\n\n";

    welcome += "Just tell me what you need help with!";

    return welcome;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      loading: true
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call backend AI chat endpoint (CrewAI + Ollama GLM4)
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage, blueprintId: blueprintId || undefined, context: (() => { try { return JSON.parse(localStorage.getItem('weddingPreferences') || '{}'); } catch { return {}; } })() })
      });
      const result = await res.json();
      const aiResponse = result.response || result.data?.response || 'Sorry, I could not process that request.';

      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [...filtered, {
          id: Date.now().toString(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          taskResult: result.data && Object.keys(result.data).length > 0 ? {
            action: 'message',
            data: result.data
          } : undefined
        }];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [...filtered, {
          id: Date.now().toString(),
          content: "I'm sorry, I couldn't process your request. Please try again.",
          sender: 'ai',
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };



  const quickPrompts = [
    "Schedule a meeting with photographer",
    "Find vendors in my area",
    "Create wedding timeline",
    "Analyze my budget",
    "Send email to caterer",
    "Get directions to venue"
  ];



  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3D5A3D' }}>
                  <LogoWithFallback size="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#3D5A3D' }}>ShehnAI Chat</h1>
                  <p className="text-gray-600">Your wedding planning companion</p>
                </div>
              </div>
              {isDemoMode && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: '#df8e8e', color: '#FFFFFF' }}>
                  Demo Mode
                </div>
              )}
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3D5A3D' }}>
                  <Sparkles className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#3D5A3D' }}>Chat with ShehnAI Chat</h2>
                  <p className="text-sm text-gray-600">
                    {isDemoMode
                      ? "Demo mode - Try asking about wedding planning tasks"
                      : "Ask me anything about your wedding planning!"
                    }
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'user' ? (
                      <div className="px-4 py-3 rounded-2xl max-w-xs lg:max-w-md" style={{ backgroundColor: '#3D5A3D' }}>
                        <p className="text-sm" style={{ color: '#FFFFFF' }}>{message.content}</p>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-full" style={{ backgroundColor: '#df8e8e' }}>
                          <Sparkles className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-lg px-4 py-3 rounded-2xl max-w-xs lg:max-w-md">
                          <p className="text-sm text-gray-800">{message.content}</p>
                          {message.taskResult && (
                            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(234, 142, 142, 0.1)' }}>
                              <p className="text-xs text-gray-600 font-medium mb-1">Task Result:</p>
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                {typeof message.taskResult.data === 'object'
                                  ? JSON.stringify(message.taskResult.data, null, 2)
                                  : message.taskResult.data}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                                      placeholder="Ask me anything about your wedding planning..."
                  className="w-full p-4 border border-gray-200 rounded-xl transition-all duration-300 resize-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  style={{ outline: 'none' }}
                  rows={3}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#df8e8e', color: '#FFFFFF' }}
              >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Send
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="p-3 rounded-xl text-left transition-all duration-300 border hover:opacity-80"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div className="text-sm font-medium" style={{ color: '#3D5A3D' }}>{prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#3D5A3D' }}>Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => { setInputMessage('Schedule a meeting with a vendor'); }} className="w-full p-3 rounded-lg transition-all duration-300 bg-rose-500 text-white hover:bg-rose-600">
                  Schedule Meeting
                </button>
                <button onClick={() => { setInputMessage('Find vendors in my area'); }} className="w-full p-3 rounded-lg transition-all duration-300 bg-rose-100 text-rose-800 hover:bg-rose-200">
                  Find Vendors
                </button>
                <button onClick={() => { setInputMessage('Analyze my wedding budget'); }} className="w-full p-3 rounded-lg transition-all duration-300 bg-rose-500 text-white hover:bg-rose-600">
                  Budget Analysis
                </button>
                <button onClick={() => { setInputMessage('Create a wedding planning timeline'); }} className="w-full p-3 rounded-lg transition-all duration-300 text-white hover:opacity-90" style={{ backgroundColor: '#3D5A3D' }}>
                  Timeline Help
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;