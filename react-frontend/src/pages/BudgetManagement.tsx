import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Eye, BarChart3 } from "lucide-react";
import { SectionCard } from '../components/SectionCard';

interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  icon: React.ReactNode;
}

interface Transaction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

const BudgetManagement: React.FC = () => {
  const [categories] = useState<BudgetCategory[]>([
    {
      id: '1',
      name: 'Venue',
      allocated: 15000,
      spent: 12000,
      color: '#2F4F4F',
      icon: <Eye className="h-4 w-4" style={{ color: '#FFFFFF' }} />
    },
    {
      id: '2',
      name: 'Catering',
      allocated: 12000,
      spent: 8000,
      color: '#D29B9B',
      icon: <Eye className="h-4 w-4" style={{ color: '#FFFFFF' }} />
    },
    {
      id: '3',
      name: 'Photography',
      allocated: 8000,
      spent: 6000,
      color: '#2F4F4F',
      icon: <Eye className="h-4 w-4" style={{ color: '#FFFFFF' }} />
    },
    {
      id: '4',
      name: 'Decoration',
      allocated: 6000,
      spent: 4500,
      color: '#D29B9B',
      icon: <Eye className="h-4 w-4" style={{ color: '#FFFFFF' }} />
    },
    {
      id: '5',
      name: 'Entertainment',
      allocated: 4000,
      spent: 3000,
      color: '#2F4F4F',
      icon: <Eye className="h-4 w-4" style={{ color: '#FFFFFF' }} />
    },
    {
      id: '6',
      name: 'Attire',
      allocated: 5000,
      spent: 3500,
      color: '#D29B9B',
      icon: <Eye className="h-4 w-4" style={{ color: '#FFFFFF' }} />
    }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      category: 'Venue',
      description: 'Deposit for Palace Gardens',
      amount: 5000,
      date: '2025-01-15',
      type: 'expense'
    },
    {
      id: '2',
      category: 'Catering',
      description: 'Menu tasting session',
      amount: 200,
      date: '2025-01-20',
      type: 'expense'
    },
    {
      id: '3',
      category: 'Photography',
      description: 'Engagement shoot',
      amount: 1500,
      date: '2025-01-25',
      type: 'expense'
    }
  ]);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'date'>>({
    category: '',
    description: '',
    amount: 0,
    type: 'expense'
  });

  const totalBudget = 50000;
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = (totalSpent / totalBudget) * 100;

  const addTransaction = () => {
    if (newTransaction.category && newTransaction.description && newTransaction.amount > 0) {
      const transaction: Transaction = {
        ...newTransaction,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0]
      };
      setTransactions([transaction, ...transactions]);
      setNewTransaction({ category: '', description: '', amount: 0, type: 'expense' });
      setShowAddTransaction(false);
    }
  };

  const getCategoryProgress = (category: BudgetCategory) => {
    return (category.spent / category.allocated) * 100;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2F4F4F' }}>
                  <BarChart3 className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#2F4F4F' }}>Budget Management</h1>
                  <p className="text-gray-600">Track and manage your wedding expenses</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddTransaction(true)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#2F4F4F', color: '#FFFFFF' }}
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </button>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Budget Card */}
            <div className="bg-white rounded-2xl shadow-lg border p-6" style={{ borderColor: '#FFB6C1' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#2F4F4F' }}>
                    <DollarSign className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Total Budget</h3>
                    <p className="text-sm text-gray-600">Your wedding budget</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: '#2F4F4F' }}>
                ₹{totalBudget.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                <span>Set for your wedding date</span>
              </div>
            </div>

            {/* Spent Amount Card */}
            <div className="bg-white rounded-2xl shadow-lg border p-6" style={{ borderColor: '#FFB6C1' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#2F4F4F' }}>
                    <TrendingDown className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Total Spent</h3>
                    <p className="text-sm text-gray-600">Amount spent so far</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: '#2F4F4F' }}>
                ₹{totalSpent.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2F4F4F' }}></div>
                <span>{budgetUtilization.toFixed(1)}% of budget used</span>
              </div>
            </div>

            {/* Remaining Budget Card */}
            <div className="bg-white rounded-2xl shadow-lg border p-6" style={{ borderColor: '#FFB6C1' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#2F4F4F' }}>
                    <TrendingUp className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Remaining</h3>
                    <p className="text-sm text-gray-600">Available budget</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: '#2F4F4F' }}>
                ₹{remainingBudget.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2F4F4F' }}></div>
                <span>{(100 - budgetUtilization).toFixed(1)}% remaining</span>
              </div>
            </div>
          </div>

          {/* Budget Progress */}
          <SectionCard 
            title="Budget Categories" 
            icon={<BarChart3 className="h-5 w-5" />}
          >
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color }}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">
                          ₹{category.spent.toLocaleString()} / ₹{category.allocated.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {getCategoryProgress(category).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(getCategoryProgress(category), 100)}%`,
                        backgroundColor: category.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Transactions */}
          <SectionCard 
            title="Recent Transactions" 
            icon={<DollarSign className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: transaction.type === 'expense' ? '#2F4F4F' : '#D29B9B' }}>
                      {transaction.type === 'expense' ? (
                        <TrendingDown className="h-5 w-5 text-white" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                      <p className="text-sm text-gray-600">{transaction.category} • {transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Add Transaction Modal */}
          {showAddTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Transaction</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      placeholder="Enter transaction description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'expense' | 'income'})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTransaction}
                    className="flex-1 px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300"
                    style={{ backgroundColor: '#2F4F4F', color: '#FFFFFF' }}
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetManagement; 