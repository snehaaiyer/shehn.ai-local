import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AIChat from '../pages/AIChat';

// ─── Mocks ──────────────────────────────────────────────────────

// Mock lucide-react icons — render as invisible SVGs so they don't add text content
jest.mock('lucide-react', () => ({
  Send: (props: any) => <svg data-testid="icon-send" {...props} />,
  Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
}));

// Track scrollIntoView calls
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// ─── Helpers ────────────────────────────────────────────────────

const mockFetch = global.fetch as jest.Mock;

const renderAIChat = () => {
  return render(
    <BrowserRouter>
      <AIChat />
    </BrowserRouter>
  );
};

const samplePreferences = {
  basicDetails: {
    weddingDate: '2026-12-15',
    location: 'Mumbai',
    budgetRange: '₹40-50 Lakhs',
    yourName: 'Priya',
    partnerName: 'Rahul',
    guestCount: '400',
  },
  theme: { selectedTheme: 'Royal Palace' },
};

/**
 * Helper: get the main chat Send button (not the "Send email to caterer" prompt).
 * During loading, the icon changes from Send SVG to a spinner, so we match
 * the button that either has the send icon OR the spinner + "Send" text,
 * and whose parent is the input area flex container.
 */
const getSendButton = (): HTMLElement => {
  const buttons = screen.getAllByRole('button');
  const sendBtn = buttons.find(btn => {
    const text = btn.textContent?.trim();
    // Match by: text is exactly "Send" and has either the send icon or the loading spinner
    const hasSendIcon = btn.querySelector('[data-testid="icon-send"]');
    const hasSpinner = btn.querySelector('.animate-spin');
    return text === 'Send' && (hasSendIcon || hasSpinner);
  });
  if (!sendBtn) throw new Error('Send button not found');
  return sendBtn;
};

const typeAndSend = async (message: string) => {
  const textarea = screen.getByPlaceholderText(/ask me anything/i);
  fireEvent.change(textarea, { target: { value: message } });
  fireEvent.click(getSendButton());
};

// ─── Test Suites ────────────────────────────────────────────────

describe('AIChat Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
    mockScrollIntoView.mockClear();
  });

  // ════════════════════════════════════════════════════════════════
  // 1. RENDERING & LAYOUT
  // ════════════════════════════════════════════════════════════════
  describe('Rendering & Layout', () => {
    test('renders the page header with title and subtitle', () => {
      renderAIChat();
      expect(screen.getByText('ShehnAI Chat')).toBeInTheDocument();
      expect(screen.getByText('Your wedding planning companion')).toBeInTheDocument();
    });

    test('renders the chat section header', () => {
      renderAIChat();
      expect(screen.getByText('Chat with ShehnAI Chat')).toBeInTheDocument();
    });

    test('renders the text input area', () => {
      renderAIChat();
      const textarea = screen.getByPlaceholderText(/ask me anything about your wedding planning/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    test('renders the Send button with icon', () => {
      renderAIChat();
      const sendBtn = getSendButton();
      expect(sendBtn).toBeInTheDocument();
      expect(sendBtn.querySelector('[data-testid="icon-send"]')).toBeInTheDocument();
    });

    test('renders the Quick Actions sidebar', () => {
      renderAIChat();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
      expect(screen.getByText('Find Vendors')).toBeInTheDocument();
      expect(screen.getByText('Budget Analysis')).toBeInTheDocument();
      expect(screen.getByText('Timeline Help')).toBeInTheDocument();
    });

    test('renders all 6 quick prompt buttons', () => {
      renderAIChat();
      const prompts = [
        'Schedule a meeting with photographer',
        'Find vendors in my area',
        'Create wedding timeline',
        'Analyze my budget',
        'Send email to caterer',
        'Get directions to venue',
      ];
      prompts.forEach(prompt => {
        expect(screen.getByText(prompt)).toBeInTheDocument();
      });
    });

    test('renders Shehn.AI logo with fallback support', () => {
      renderAIChat();
      const logoImg = screen.queryByAltText('Shehn.AI');
      // Logo is rendered either as img or as fallback div
      expect(logoImg || screen.queryByText('S')).toBeTruthy();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 2. WELCOME MESSAGE — WITH PREFERENCES
  // ════════════════════════════════════════════════════════════════
  describe('Welcome Message — with saved preferences', () => {
    beforeEach(() => {
      localStorage.setItem('weddingPreferences', JSON.stringify(samplePreferences));
    });

    test('shows personalized welcome with date, location, and budget', () => {
      renderAIChat();
      expect(screen.getByText(/Welcome to ShehnAI Chat/)).toBeInTheDocument();
      expect(screen.getByText(/₹40-50 Lakhs/)).toBeInTheDocument();
      expect(screen.getByText(/Mumbai/)).toBeInTheDocument();
      expect(screen.getByText(/2026-12-15/)).toBeInTheDocument();
    });

    test('welcome lists all capability areas', () => {
      renderAIChat();
      expect(screen.getByText(/Schedule meetings with vendors/)).toBeInTheDocument();
      expect(screen.getByText(/Find vendors based on your preferences/)).toBeInTheDocument();
      expect(screen.getByText(/Create wedding timelines/)).toBeInTheDocument();
      expect(screen.getByText(/Analyze your budget/)).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 3. WELCOME MESSAGE — WITHOUT PREFERENCES
  // ════════════════════════════════════════════════════════════════
  describe('Welcome Message — no preferences', () => {
    test('shows generic welcome when no preferences saved', () => {
      renderAIChat();
      expect(screen.getByText(/Please set up your wedding preferences first/)).toBeInTheDocument();
    });

    test('shows generic welcome when preferences are invalid JSON', () => {
      localStorage.setItem('weddingPreferences', 'not-valid-json');
      renderAIChat();
      expect(screen.getByText(/Please set up your wedding preferences first/)).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 4. DEMO MODE BADGE
  // ════════════════════════════════════════════════════════════════
  describe('Demo Mode indicator', () => {
    test('shows Demo Mode badge when API keys are not set', () => {
      // In test env, REACT_APP_GOOGLE_API_KEY and REACT_APP_GEMINI_API_KEY are undefined
      // isDemoMode = !process.env.REACT_APP_GOOGLE_API_KEY || !process.env.REACT_APP_GEMINI_API_KEY
      // → true || true → true → Demo Mode shown
      renderAIChat();
      // The component checks both keys; since neither is set in test env, demo mode is active
      const badge = screen.queryByText('Demo Mode');
      // If env vars happen to be set in CI, this is still valid
      if (!process.env.REACT_APP_GOOGLE_API_KEY || !process.env.REACT_APP_GEMINI_API_KEY) {
        expect(badge).toBeInTheDocument();
      }
    });

    test('demo mode subtitle shows appropriate text', () => {
      renderAIChat();
      if (!process.env.REACT_APP_GOOGLE_API_KEY || !process.env.REACT_APP_GEMINI_API_KEY) {
        expect(screen.getByText(/Demo mode - Try asking about wedding planning tasks/)).toBeInTheDocument();
      } else {
        expect(screen.getByText(/Ask me anything about your wedding planning/)).toBeInTheDocument();
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 5. SENDING MESSAGES — HAPPY PATH
  // ════════════════════════════════════════════════════════════════
  describe('Sending Messages — happy path', () => {
    test('user message appears in chat after sending', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Here are some venues in Mumbai.', data: {} }),
      });

      renderAIChat();
      await typeAndSend('Find me venues in Mumbai');

      expect(screen.getByText('Find me venues in Mumbai')).toBeInTheDocument();
    });

    test('AI response appears in chat after successful API call', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'I found 5 venues near you.', data: {} }),
      });

      renderAIChat();
      await typeAndSend('Find me venues in Mumbai');

      await waitFor(() => {
        expect(screen.getByText('I found 5 venues near you.')).toBeInTheDocument();
      });
    });

    test('fetch is called with correct endpoint, method, and body', async () => {
      localStorage.setItem('weddingPreferences', JSON.stringify(samplePreferences));
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Response', data: {} }),
      });

      renderAIChat();
      await typeAndSend('Analyze my budget');

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.message).toBe('Analyze my budget');
      expect(callBody.context).toEqual(samplePreferences);
    });

    test('input field is cleared after sending', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Done', data: {} }),
      });

      renderAIChat();
      const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(textarea.value).toBe('Hello');

      fireEvent.click(getSendButton());

      expect(textarea.value).toBe('');
    });

    test('task result data is displayed when present', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          response: 'Budget analysis complete.',
          data: { totalBudget: '₹45L', savings: '₹3L' },
        }),
      });

      renderAIChat();
      await typeAndSend('Analyze budget');

      await waitFor(() => {
        expect(screen.getByText(/Task Result/)).toBeInTheDocument();
        expect(screen.getByText(/totalBudget/)).toBeInTheDocument();
      });
    });

    test('Task Result box is NOT shown when data is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Here are some venues.', data: {} }),
      });

      renderAIChat();
      await typeAndSend('Find venues');

      await waitFor(() => {
        expect(screen.getByText(/Here are some venues/)).toBeInTheDocument();
      });
      expect(screen.queryByText(/Task Result/)).not.toBeInTheDocument();
    });

    test('Task Result box is NOT shown when data is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Hello!' }),
      });

      renderAIChat();
      await typeAndSend('Hi');

      await waitFor(() => {
        expect(screen.getByText(/Hello!/)).toBeInTheDocument();
      });
      expect(screen.queryByText(/Task Result/)).not.toBeInTheDocument();
    });

    test('response falls back to data.response if top-level response missing', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { response: 'Nested response text' },
        }),
      });

      renderAIChat();
      await typeAndSend('Test fallback');

      await waitFor(() => {
        expect(screen.getByText('Nested response text')).toBeInTheDocument();
      });
    });

    test('shows fallback text when neither response nor data.response exist', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

      renderAIChat();
      await typeAndSend('Empty response');

      await waitFor(() => {
        expect(screen.getByText('Sorry, I could not process that request.')).toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 6. SENDING MESSAGES — ERROR HANDLING
  // ════════════════════════════════════════════════════════════════
  describe('Sending Messages — error handling', () => {
    test('shows error message when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderAIChat();
      await typeAndSend('Test error');

      await waitFor(() => {
        expect(screen.getByText(/couldn't process your request/i)).toBeInTheDocument();
      });
    });

    test('shows error message when response JSON parse fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => { throw new Error('Invalid JSON'); },
      });

      renderAIChat();
      await typeAndSend('Bad response');

      await waitFor(() => {
        expect(screen.getByText(/couldn't process your request/i)).toBeInTheDocument();
      });
    });

    test('loading message is removed after error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server down'));

      renderAIChat();
      await typeAndSend('Fail');

      await waitFor(() => {
        expect(screen.getByText(/couldn't process your request/i)).toBeInTheDocument();
      });

      // The loading spinner should be gone (no messages with loading: true)
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 7. LOADING STATE
  // ════════════════════════════════════════════════════════════════
  describe('Loading State', () => {
    test('Send button is disabled while loading', async () => {
      // Never-resolving fetch to keep loading state
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      renderAIChat();
      await typeAndSend('Long request');

      const sendBtn = getSendButton();
      expect(sendBtn).toBeDisabled();
    });

    test('cannot send another message while loading', async () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      renderAIChat();
      await typeAndSend('First message');

      // Try to type and send again
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: 'Second message' } });
      fireEvent.click(getSendButton());

      // fetch should only be called once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('Send button re-enables after response (not stuck in loading)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Done' }),
      });

      renderAIChat();
      await typeAndSend('Quick question');

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      // After response, loading spinner should be gone (button shows Send icon, not spinner)
      const sendBtn = getSendButton();
      expect(sendBtn.querySelector('.animate-spin')).toBeNull();
      expect(sendBtn.querySelector('[data-testid="icon-send"]')).toBeInTheDocument();

      // Button is disabled because input is empty (expected), but NOT because of isLoading
      // Type something to confirm it re-enables
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: 'Follow up' } });
      expect(sendBtn).not.toBeDisabled();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 8. INPUT VALIDATION
  // ════════════════════════════════════════════════════════════════
  describe('Input Validation', () => {
    test('Send button is disabled when input is empty', () => {
      renderAIChat();
      const sendBtn = getSendButton();
      expect(sendBtn).toBeDisabled();
    });

    test('Send button is disabled for whitespace-only input', () => {
      renderAIChat();
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: '   ' } });
      const sendBtn = getSendButton();
      expect(sendBtn).toBeDisabled();
    });

    test('Send button enables when valid text is typed', () => {
      renderAIChat();
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      const sendBtn = getSendButton();
      expect(sendBtn).not.toBeDisabled();
    });

    test('does not call fetch if input is empty and Send is forced', () => {
      renderAIChat();
      fireEvent.click(getSendButton());
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 9. KEYBOARD INTERACTION
  // ════════════════════════════════════════════════════════════════
  describe('Keyboard Interaction', () => {
    test('pressing Enter sends the message', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, response: 'Reply' }),
      });

      renderAIChat();
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: 'Enter test' } });
      fireEvent.keyPress(textarea, { key: 'Enter', charCode: 13 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('Shift+Enter does NOT send (allows newline)', async () => {
      renderAIChat();
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: 'Line one' } });
      fireEvent.keyPress(textarea, { key: 'Enter', charCode: 13, shiftKey: true });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 10. QUICK PROMPTS
  // ════════════════════════════════════════════════════════════════
  describe('Quick Prompts', () => {
    test('clicking a quick prompt fills the input field', () => {
      renderAIChat();
      const promptButton = screen.getByText('Schedule a meeting with photographer');
      fireEvent.click(promptButton);

      const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Schedule a meeting with photographer');
    });

    test('clicking a quick prompt does NOT auto-send', () => {
      renderAIChat();
      fireEvent.click(screen.getByText('Analyze my budget'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('each quick prompt button populates the correct text', () => {
      renderAIChat();
      const prompts = [
        'Schedule a meeting with photographer',
        'Find vendors in my area',
        'Create wedding timeline',
        'Analyze my budget',
        'Send email to caterer',
        'Get directions to venue',
      ];

      prompts.forEach(prompt => {
        fireEvent.click(screen.getByText(prompt));
        const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
        expect(textarea.value).toBe(prompt);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 11. QUICK ACTION SIDEBAR BUTTONS
  // ════════════════════════════════════════════════════════════════
  describe('Quick Action Sidebar Buttons', () => {
    test('"Schedule Meeting" fills input with scheduling text', () => {
      renderAIChat();
      fireEvent.click(screen.getByText('Schedule Meeting'));
      const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Schedule a meeting with a vendor');
    });

    test('"Find Vendors" fills input with vendor search text', () => {
      renderAIChat();
      fireEvent.click(screen.getByText('Find Vendors'));
      const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Find vendors in my area');
    });

    test('"Budget Analysis" fills input with budget text', () => {
      renderAIChat();
      fireEvent.click(screen.getByText('Budget Analysis'));
      const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Analyze my wedding budget');
    });

    test('"Timeline Help" fills input with timeline text', () => {
      renderAIChat();
      fireEvent.click(screen.getByText('Timeline Help'));
      const textarea = screen.getByPlaceholderText(/ask me anything/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Create a wedding planning timeline');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 12. CONVERSATION FLOW — MULTI-TURN
  // ════════════════════════════════════════════════════════════════
  describe('Conversation Flow — multiple messages', () => {
    test('multiple user+AI messages stack in order', async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: async () => ({ success: true, response: 'Response 1' }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, response: 'Response 2' }),
        });

      renderAIChat();

      // First exchange
      await typeAndSend('Question 1');
      await waitFor(() => expect(screen.getByText('Response 1')).toBeInTheDocument());

      // Second exchange
      await typeAndSend('Question 2');
      await waitFor(() => expect(screen.getByText('Response 2')).toBeInTheDocument());

      // All 4 messages should be present (plus welcome message)
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Response 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('Response 2')).toBeInTheDocument();
    });

    test('context is sent from localStorage with each message', async () => {
      localStorage.setItem('weddingPreferences', JSON.stringify(samplePreferences));
      mockFetch
        .mockResolvedValueOnce({ json: async () => ({ response: 'R1' }) })
        .mockResolvedValueOnce({ json: async () => ({ response: 'R2' }) });

      renderAIChat();
      await typeAndSend('Msg 1');
      await waitFor(() => expect(screen.getByText('R1')).toBeInTheDocument());
      await typeAndSend('Msg 2');

      // Both calls should include context
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
      const body2 = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body1.context).toEqual(samplePreferences);
      expect(body2.context).toEqual(samplePreferences);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 13. AUTO-SCROLL BEHAVIOR
  // ════════════════════════════════════════════════════════════════
  describe('Auto-scroll', () => {
    test('scrollIntoView is called when messages update', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ response: 'Scroll test' }),
      });

      renderAIChat();
      mockScrollIntoView.mockClear(); // clear any calls from initial render
      await typeAndSend('Trigger scroll');

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalled();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 14. MESSAGE RENDERING STYLES
  // ════════════════════════════════════════════════════════════════
  describe('Message Rendering', () => {
    test('user messages are right-aligned', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ response: 'AI reply' }),
      });

      renderAIChat();
      await typeAndSend('User text');

      const userMessageContainer = screen.getByText('User text').closest('div[class*="justify-"]');
      expect(userMessageContainer?.className).toContain('justify-end');
    });

    test('AI messages are left-aligned', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ response: 'AI reply here' }),
      });

      renderAIChat();
      await typeAndSend('Ask something');

      await waitFor(() => {
        const aiMessageContainer = screen.getByText('AI reply here').closest('div[class*="justify-"]');
        expect(aiMessageContainer?.className).toContain('justify-start');
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 15. LOGO FALLBACK
  // ════════════════════════════════════════════════════════════════
  describe('Logo Fallback', () => {
    test('shows fallback "S" when logo image fails to load', () => {
      renderAIChat();
      const logoImg = screen.queryByAltText('Shehn.AI');
      if (logoImg) {
        fireEvent.error(logoImg);
        expect(screen.getByText('S')).toBeInTheDocument();
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 16. EDGE CASES
  // ════════════════════════════════════════════════════════════════
  describe('Edge Cases', () => {
    test('handles empty weddingPreferences object gracefully', () => {
      localStorage.setItem('weddingPreferences', JSON.stringify({}));
      renderAIChat();
      // Should still show a welcome — just without personalized details
      expect(screen.getByText(/Welcome to ShehnAI Chat/)).toBeInTheDocument();
    });

    test('context defaults to {} when localStorage parse fails', async () => {
      localStorage.setItem('weddingPreferences', '{broken-json');
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ response: 'Works' }),
      });

      renderAIChat();
      await typeAndSend('Send with bad context');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.context).toEqual({});
    });

    test('very long message is sent without truncation', async () => {
      const longMsg = 'x'.repeat(5000);
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ response: 'Got it' }),
      });

      renderAIChat();
      await typeAndSend(longMsg);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.message).toBe(longMsg);
    });

    test('special characters in message are preserved', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ response: 'OK' }),
      });

      renderAIChat();
      await typeAndSend('Budget: ₹45L — 50% venue & 20% catering <script>alert("xss")</script>');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.message).toContain('₹45L');
      expect(callBody.message).toContain('<script>');
    });

    test('rapid sequential sends are queued by loading state', async () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      renderAIChat();

      // Send first message
      const textarea = screen.getByPlaceholderText(/ask me anything/i);
      fireEvent.change(textarea, { target: { value: 'First' } });
      fireEvent.click(getSendButton());

      // Try to send second while first is still loading
      fireEvent.change(textarea, { target: { value: 'Second' } });
      fireEvent.click(getSendButton());

      // Only one fetch call should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
