import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';

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

const AIChat: React.FC = () => {
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
            content: "Welcome to Bid AI! I'm your wedding planning assistant. Please set up your wedding preferences first to get personalized help.",
            sender: 'ai',
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          id: '1',
          content: "Welcome to Bid AI! I'm your wedding planning assistant. Please set up your wedding preferences first to get personalized help.",
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
    
    let welcome = "🎉 Welcome to Bid AI! I'm your intelligent wedding planning assistant.\n\n";
    
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
    
    // Check if in demo mode
    const isDemoMode = !process.env.REACT_APP_GOOGLE_API_KEY || !process.env.REACT_APP_GEMINI_API_KEY;
    if (isDemoMode) {
      welcome += "🔄 Demo Mode: I'm running in demo mode without API keys. Add your API keys for full functionality!\n\n";
    }
    
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
      // Use the AI assistant service
      // Demo response for now
    const result = { action: 'message', data: { response: 'This is a demo response. Add API keys for full functionality.' } };
      
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [...filtered, {
          id: Date.now().toString(),
          content: result.data.response,
          sender: 'ai',
          timestamp: new Date(),
          taskResult: {
            action: result.action,
            data: result.data
          }
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
    "Find venues in my area",
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2F4F4F' }}>
                  <Sparkles className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#2F4F4F' }}>Bid AI Assistant</h1>
                  <p className="text-gray-600">Your wedding planning companion</p>
                </div>
              </div>
              {isDemoMode && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: '#D29B9B', color: '#FFFFFF' }}>
                  Demo Mode
                </div>
              )}
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#2F4F4F' }}>
                  <Sparkles className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#000080' }}>Chat with Bid AI</h2>
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
                      <div className="px-4 py-3 rounded-2xl max-w-xs lg:max-w-md" style={{ backgroundColor: '#2F4F4F' }}>
                        <p className="text-sm" style={{ color: '#FFFFFF' }}>{message.content}</p>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-full" style={{ backgroundColor: '#20B2AA' }}>
                          <Sparkles className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-lg px-4 py-3 rounded-2xl max-w-xs lg:max-w-md">
                          <p className="text-sm text-gray-800">{message.content}</p>
                          {message.taskResult && (
                            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)' }}>
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
                  className="w-full p-4 border border-gray-200 rounded-xl transition-all duration-300 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  style={{ outline: 'none' }}
                  rows={3}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#EFAFAB', color: '#8B4513' }}
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
                    <div className="text-sm font-medium" style={{ color: '#8B4513' }}>{prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border shadow-lg" style={{ borderColor: '#EFAFAB' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#8B4513' }}>Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 rounded-lg transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#EFAFAB', color: '#8B4513' }}>
                  Schedule Meeting
                </button>
                <button className="w-full p-3 rounded-lg transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#F5EADB', color: '#8B4513' }}>
                  Find Vendors
                </button>
                <button className="w-full p-3 rounded-lg transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#FF7F50', color: '#8B4513' }}>
                  Budget Analysis
                </button>
                <button className="w-full p-3 rounded-lg transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#2F4F4F', color: '#FFFFFF' }}>
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