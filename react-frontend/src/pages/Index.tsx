import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { 
  Calendar, Users, DollarSign, 
  CheckCircle, Clock, Star,
  Building2, Camera, Utensils, Palette,
  Search, MessageCircle
} from "lucide-react";

const Index: React.FC = () => {
  const { theme } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeddingData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error fetching wedding data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeddingData();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${theme === 'dark' ? 'border-green-500' : 'border-pink-500'}`}></div>
          <p className={`text-lg font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Loading your wedding dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const weddingData = {
    couple: {
      names: "Priya & Rahul",
      date: "December 25, 2025",
      daysUntil: 45,
      location: "Bangalore, India"
    },
    budget: {
      total: 500000,
      spent: 320000,
      remaining: 180000,
      percentage: 64
    },
    progress: {
      theme: { status: 'completed', name: 'Royal Palace' },
      venue: { status: 'completed', name: 'Heritage Palace' },
      catering: { status: 'in-progress', name: 'Multi-cuisine' },
      photography: { status: 'pending', name: 'Traditional + Modern' }
    }
  };

  const quickActions = [
    {
      title: "Wedding Preferences",
      description: "Set your theme, venue, and preferences",
      icon: <Palette className="w-6 h-6" />,
      style: { backgroundColor: '#2F4F4F' },
      href: "/wedding-preferences"
    },
    {
      title: "Budget Management",
      description: "Track your wedding budget",
      icon: <DollarSign className="w-6 h-6" />,
      style: { backgroundColor: '#2F4F4F' },
      href: "/budget-management"
    },
    {
      title: "Vendor Discovery",
      description: "Find and connect with vendors",
      icon: <Search className="w-6 h-6" />,
      style: { backgroundColor: '#2F4F4F' },
      href: "/vendor-discovery"
    },
    {
      title: "AI Chat Assistant",
      description: "Get personalized wedding advice",
      icon: <MessageCircle className="w-6 h-6" />,
      style: { backgroundColor: '#2F4F4F' },
      href: "/ai-chat"
    }
  ];

  const upcomingTasks = [
    { title: "Finalize catering menu", date: "Next week", priority: "high" },
    { title: "Book photographer", date: "In 2 weeks", priority: "high" },
    { title: "Send invitations", date: "In 3 weeks", priority: "medium" },
    { title: "Dress fittings", date: "In 1 month", priority: "medium" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <Star className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with Image Banner */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/images/pexels-minan1398-758898 3.jpg"
              alt="Beautiful Indian wedding celebration with bride and groom"
              className="w-full h-96 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">Wedding Dashboard</h1>
              <p className="text-lg opacity-90">Welcome back, {weddingData.couple.names}!</p>
            </div>
          </div>

          {/* Wedding Overview Card */}
                          <div className={`rounded-2xl p-8 border shadow-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white'}`} style={theme === 'dark' ? {} : { borderColor: '#FFB6C1' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#D29B9B' }}>
                    <Calendar className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{weddingData.couple.daysUntil}</h3>
                  <p className="text-sm text-gray-600">Days Until Wedding</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#D29B9B' }}>
                    <Users className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">250</h3>
                  <p className="text-sm text-gray-600">Expected Guests</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#D29B9B' }}>
                    <DollarSign className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">₹{weddingData.budget.remaining.toLocaleString()}</h3>
                  <p className="text-sm text-gray-600">Budget Remaining</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#D29B9B' }}>
                    <CheckCircle className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">2/4</h3>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#D29B9B' }}>Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(action.href)}
                  className="cursor-pointer h-full"
                >
                  <div className="rounded-xl p-6 text-white text-center hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between" style={action.style || { backgroundColor: '#2F4F4F' }}>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      {action.icon}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wedding Planning Progress */}
            <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#D29B9B' }}>Planning Progress</h2>
              <div className="space-y-4">
                {Object.entries(weddingData.progress).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                             <div className="flex items-center">
                           <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: '#D29B9B' }}>
                             {key === 'theme' && <Palette className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
                             {key === 'venue' && <Building2 className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
                             {key === 'catering' && <Utensils className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
                             {key === 'photography' && <Camera className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
                           </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 capitalize">{key}</h3>
                        <p className="text-sm text-gray-600">{item.name}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1 capitalize">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#D29B9B' }}>Upcoming Tasks</h2>
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.date}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{task.priority} priority</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#D29B9B' }}>
                View All Tasks
              </button>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#D29B9B' }}>Budget Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold" style={{ color: '#D29B9B' }}>₹{weddingData.budget.total.toLocaleString()}</h3>
                <p className="text-gray-600">Total Budget</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold" style={{ color: '#D29B9B' }}>₹{weddingData.budget.spent.toLocaleString()}</h3>
                <p className="text-gray-600">Spent</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold" style={{ color: '#D29B9B' }}>₹{weddingData.budget.remaining.toLocaleString()}</h3>
                <p className="text-gray-600">Remaining</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Budget Progress</span>
                <span>{weddingData.budget.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                                 <div 
                   className="h-3 rounded-full transition-all duration-300"
                   style={{ 
                     width: `${weddingData.budget.percentage}%`,
                     background: 'linear-gradient(90deg, #D29B9B 0%, #D29B9B 100%)'
                   }}
                 ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index; 