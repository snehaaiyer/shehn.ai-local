import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Shield, Store } from 'lucide-react';
import { AdminService } from '../../services/admin_service';

const roleConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  couple: { icon: <User className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700' },
  vendor: { icon: <Store className="w-4 h-4" />, color: 'bg-rose-100 text-rose-700' },
  superadmin: { icon: <Shield className="w-4 h-4" />, color: 'bg-rose-100 text-rose-700' },
  admin: { icon: <Shield className="w-4 h-4" />, color: 'bg-rose-100 text-rose-700' },
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await AdminService.getUsers();
        if (res.success && res.data) {
          setUsers(res.data);
        }
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-gray-400"
          >
            No users found.
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const role = roleConfig[user.role] || roleConfig.couple;
                  return (
                    <tr
                      key={user.id ?? idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                          {role.icon}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.is_active !== false
                              ? 'bg-sage-100 text-sage-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {user.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserList;
