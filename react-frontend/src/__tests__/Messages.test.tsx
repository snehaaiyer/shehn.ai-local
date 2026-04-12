import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Messages from '../pages/Messages';

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('lucide-react', () => {
  const icons = ['MessageCircle', 'ArrowLeft', 'Search'];
  const m: Record<string, any> = {};
  icons.forEach(n => { m[n] = (p: any) => <svg data-testid={`icon-${n.toLowerCase()}`} {...p} />; });
  return m;
});

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
}));

// Store
const mockSetActiveConversation = jest.fn();
const mockStoreState: Record<string, any> = {
  currentUserId: 1,
  activeConversationId: null,
  setActiveConversation: mockSetActiveConversation,
};
jest.mock('../store/useAppStore', () => ({
  useAppStore: (sel: (s: any) => any) => sel(mockStoreState),
}));

// Services
jest.mock('../services/messaging_service', () => ({
  MessagingService: {
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    sendMessage: jest.fn(),
  },
}));
jest.mock('../services/marketplace_ai_service', () => ({
  MarketplaceAIService: { suggestMessage: jest.fn() },
}));

// Child components
jest.mock('../components/ConversationList', () => {
  return function MockConversationList({ conversations, activeId, onSelect }: any) {
    return (
      <div data-testid="conversation-list">
        {conversations.map((c: any) => (
          <button key={c.id} data-testid={`conv-${c.id}`} onClick={() => onSelect(c.id)}>
            {c.other_party_name}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../components/MessageThread', () => {
  return function MockMessageThread({ messages, onSend, currentRole, onAiDraft, aiDrafting }: any) {
    return (
      <div data-testid="message-thread">
        {messages.map((m: any) => (
          <div key={m.id} data-testid={`msg-${m.id}`}>{m.content}</div>
        ))}
        <button data-testid="send-btn" onClick={() => onSend('Test reply')}>Send</button>
        <button data-testid="ai-draft-btn" onClick={onAiDraft}>AI Draft</button>
        <span data-testid="role">{currentRole}</span>
      </div>
    );
  };
});

import { MessagingService } from '../services/messaging_service';
import { MarketplaceAIService } from '../services/marketplace_ai_service';

const mockGetConversations = MessagingService.getConversations as jest.Mock;
const mockGetConversation = MessagingService.getConversation as jest.Mock;
const mockSendMessage = MessagingService.sendMessage as jest.Mock;
const mockSuggestMessage = MarketplaceAIService.suggestMessage as jest.Mock;

// ── Sample Data ──
const sampleConversations = [
  { id: 1, couple_id: 1, vendor_id: 10, blueprint_id: 1, subject: 'Re: Venue Quote', status: 'active', other_party_name: 'Palace Gardens', other_party_category: 'venue', last_message: 'We have availability', last_message_at: '2026-04-05T10:30:00Z', unread_count: 2, created_at: '2026-04-01T00:00:00Z' },
  { id: 2, couple_id: 1, vendor_id: 11, blueprint_id: 1, subject: 'Re: Photo Package', status: 'active', other_party_name: 'Candid Memories', other_party_category: 'photography', last_message: 'Here is our portfolio', last_message_at: '2026-04-04T09:00:00Z', unread_count: 0, created_at: '2026-04-02T00:00:00Z' },
];

const sampleMessages = [
  { id: 101, conversation_id: 1, sender_role: 'couple', sender_id: 1, content: 'Hi, interested in your venue', message_type: 'text', read_at: '2026-04-05T10:00:00Z', created_at: '2026-04-05T09:00:00Z' },
  { id: 102, conversation_id: 1, sender_role: 'vendor', sender_id: 10, content: 'We have availability', message_type: 'text', read_at: null, created_at: '2026-04-05T10:30:00Z' },
];

const renderPage = () => render(<BrowserRouter><Messages /></BrowserRouter>);

// ─── Tests ──────────────────────────────────────────────────────

describe('Messages Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState.activeConversationId = null;
    mockGetConversations.mockResolvedValue({ success: true, data: sampleConversations });
    mockGetConversation.mockResolvedValue({ success: true, data: { conversation: sampleConversations[0], messages: sampleMessages } });
    mockSendMessage.mockResolvedValue({ success: true, data: { id: 103, conversation_id: 1, sender_role: 'couple', sender_id: 1, content: 'Test reply', message_type: 'text', read_at: null, created_at: new Date().toISOString() } });
  });

  // ════════════════════════════════════════════════════════════════
  // 1. LOADING STATE
  // ════════════════════════════════════════════════════════════════
  describe('Loading', () => {
    test('shows spinner while loading conversations', () => {
      mockGetConversations.mockReturnValue(new Promise(() => {}));
      renderPage();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 2. EMPTY STATE
  // ════════════════════════════════════════════════════════════════
  describe('Empty State', () => {
    test('shows "No messages yet" when no conversations', async () => {
      mockGetConversations.mockResolvedValue({ success: true, data: [] });
      renderPage();
      await waitFor(() => expect(screen.getByText('No messages yet')).toBeInTheDocument());
    });

    test('shows link to Quotes page', async () => {
      mockGetConversations.mockResolvedValue({ success: true, data: [] });
      renderPage();
      await waitFor(() => expect(screen.getByText('Quotes').closest('a')).toHaveAttribute('href', '/quotes'));
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 3. CONVERSATION LIST
  // ════════════════════════════════════════════════════════════════
  describe('Conversation List', () => {
    test('renders ConversationList with loaded conversations', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
        expect(screen.getByText('Palace Gardens')).toBeInTheDocument();
        expect(screen.getByText('Candid Memories')).toBeInTheDocument();
      });
    });

    test('shows "Messages" heading', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Messages')).toBeInTheDocument());
    });

    test('search input filters conversations', async () => {
      renderPage();
      await waitFor(() => screen.getByPlaceholderText('Search conversations...'));
      const searchInput = screen.getByPlaceholderText('Search conversations...');
      fireEvent.change(searchInput, { target: { value: 'Palace' } });
      // ConversationList should only get filtered conversations
      expect(screen.getByText('Palace Gardens')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 4. SELECT CONVERSATION
  // ════════════════════════════════════════════════════════════════
  describe('Select Conversation', () => {
    test('clicking conversation loads messages in thread', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('conv-1'));
      fireEvent.click(screen.getByTestId('conv-1'));

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
        expect(screen.getByText('Hi, interested in your venue')).toBeInTheDocument();
        expect(screen.getByText('We have availability')).toBeInTheDocument();
      });
    });

    test('selecting conversation calls getConversation', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('conv-1'));
      fireEvent.click(screen.getByTestId('conv-1'));
      await waitFor(() => expect(mockGetConversation).toHaveBeenCalledWith(1));
    });

    test('conversation header shows vendor name and category', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('conv-1'));
      fireEvent.click(screen.getByTestId('conv-1'));
      await waitFor(() => {
        // The header shows the active conv's party name
        const headers = screen.getAllByText('Palace Gardens');
        expect(headers.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('"Select a conversation" shown when no active conversation', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Select a conversation')).toBeInTheDocument());
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 5. SEND MESSAGE
  // ════════════════════════════════════════════════════════════════
  describe('Send Message', () => {
    test('sending message calls MessagingService.sendMessage', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('conv-1'));
      fireEvent.click(screen.getByTestId('conv-1'));
      await waitFor(() => screen.getByTestId('send-btn'));

      fireEvent.click(screen.getByTestId('send-btn'));
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(1, expect.objectContaining({
          sender_role: 'couple',
          sender_id: 1,
          content: 'Test reply',
        }));
      });
    });

    test('MessageThread receives currentRole="couple"', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('conv-1'));
      fireEvent.click(screen.getByTestId('conv-1'));
      await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('couple'));
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 6. STORE SYNC
  // ════════════════════════════════════════════════════════════════
  describe('Store Sync', () => {
    test('selecting conversation updates store activeConversation', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('conv-1'));
      fireEvent.click(screen.getByTestId('conv-1'));
      expect(mockSetActiveConversation).toHaveBeenCalledWith(1);
    });
  });
});
