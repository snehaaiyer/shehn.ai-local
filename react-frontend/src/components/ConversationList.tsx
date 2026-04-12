import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Camera, UtensilsCrossed, Flower2, Sparkles, Music } from 'lucide-react';
import { Conversation, VendorCategory } from '../types/marketplace';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

const categoryIcons: Record<VendorCategory, React.ElementType> = {
  venue: Building2,
  photography: Camera,
  catering: UtensilsCrossed,
  decoration: Flower2,
  makeup: Sparkles,
  entertainment: Music,
};

const categoryColors: Record<VendorCategory, string> = {
  venue: 'bg-gray-100 text-gray-700',
  photography: 'bg-rose-100 text-rose-700',
  catering: 'bg-sage-100 text-sage-700',
  decoration: 'bg-rose-100 text-rose-700',
  makeup: 'bg-rose-100 text-rose-700',
  entertainment: 'bg-gray-100 text-gray-700',
};

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1d ago' : `${days}d ago`;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeId, onSelect }) => {
  return (
    <div className="overflow-y-auto h-full divide-y divide-gray-100">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const Icon = conv.other_party_category ? categoryIcons[conv.other_party_category] : Building2;
        const colorCls = conv.other_party_category ? categoryColors[conv.other_party_category] : 'bg-gray-100 text-gray-700';
        const truncated = conv.last_message && conv.last_message.length > 60
          ? conv.last_message.slice(0, 60) + '...'
          : conv.last_message;

        return (
          <motion.button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
              isActive ? 'bg-rose-50 border-l-4 border-rose-400' : 'hover:bg-gray-50 border-l-4 border-transparent'
            }`}
          >
            <div className="mt-1 shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-gray-900 truncate">{conv.other_party_name}</span>
                <span className="text-xs text-gray-400 shrink-0">{relativeTime(conv.last_message_at)}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {conv.other_party_category && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colorCls}`}>
                    {conv.other_party_category}
                  </span>
                )}
              </div>
              {truncated && <p className="text-xs text-gray-500 mt-1 truncate">{truncated}</p>}
            </div>
            {conv.unread_count > 0 && (
              <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {conv.unread_count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ConversationList;
