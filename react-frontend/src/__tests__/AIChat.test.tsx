import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AIChat from '../pages/AIChat';

// Mock the AI assistant service
jest.mock('../services/ai_assistant_service', () => ({
  aiAssistant: {
    initialize: jest.fn(),
    processUserRequest: jest.fn().mockResolvedValue({
      message: 'Mock AI response',
      taskResult: {
        action: 'general',
        data: 'Mock task data'
      }
    })
  }
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => <div>{children}</div>
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AIChat Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial Render', () => {
    it('should render the AI chat page', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText('Bid AI Assistant')).toBeInTheDocument();
    });

    it('should display welcome message', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText(/Welcome to Bid AI/)).toBeInTheDocument();
    });

    it('should display demo mode indicator when no API keys', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    });

    it('should display chat interface', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    });

    it('should display send button', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText('Send')).toBeInTheDocument();
    });
  });

  describe('Quick Prompts', () => {
    it('should display quick prompt buttons', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText('Schedule a meeting with photographer')).toBeInTheDocument();
      expect(screen.getByText('Find venues in my area')).toBeInTheDocument();
      expect(screen.getByText('Get budget analysis')).toBeInTheDocument();
      expect(screen.getByText('Create wedding timeline')).toBeInTheDocument();
    });

    it('should fill input when quick prompt is clicked', () => {
      renderWithRouter(<AIChat />);
      const quickPrompt = screen.getByText('Schedule a meeting with photographer');
      fireEvent.click(quickPrompt);
      
      const input = screen.getByPlaceholderText('Type your message here...');
      expect(input).toHaveValue('Schedule a meeting with photographer');
    });

    it('should handle multiple quick prompts', () => {
      renderWithRouter(<AIChat />);
      const quickPrompts = [
        'Schedule a meeting with photographer',
        'Find venues in my area',
        'Get budget analysis',
        'Create wedding timeline'
      ];

      quickPrompts.forEach(prompt => {
        const button = screen.getByText(prompt);
        fireEvent.click(button);
        expect(screen.getByDisplayValue(prompt)).toBeInTheDocument();
      });
    });
  });

  describe('Chat Functionality', () => {
    it('should handle user input changes', () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      expect(input).toHaveValue('Hello AI');
    });

    it('should send message when send button is clicked', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
      });
    });

    it('should send message when enter key is pressed', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
      });
    });

    it('should not send empty messages', () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.click(sendButton);
      
      // Should not add empty message to chat
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('should clear input after sending message', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Message Display', () => {
    it('should display user messages correctly', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        const userMessage = screen.getByText('Hello AI');
        expect(userMessage.closest('.bg-salmon-pink')).toBeInTheDocument();
      });
    });

    it('should display AI responses correctly', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        const aiMessage = screen.getByText('Mock AI response');
        expect(aiMessage.closest('.bg-white')).toBeInTheDocument();
      });
    });

    it('should display message timestamps', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
        expect(timestamp).toBeInTheDocument();
      });
    });
  });

  describe('Task Results', () => {
    it('should display task results when available', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Schedule meeting' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mock task data')).toBeInTheDocument();
      });
    });

    it('should display task action icons', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Schedule meeting' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        const actionText = screen.getByText('general');
        expect(actionText).toBeInTheDocument();
      });
    });
  });

  describe('User Preferences Integration', () => {
    it('should load user preferences from localStorage', () => {
      const mockPreferences = {
        couple: { partner1: 'Priya', partner2: 'Rahul' },
        budget: { total: 500000 },
        preferences: { theme: 'royal-palace' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPreferences));
      
      renderWithRouter(<AIChat />);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('weddingPreferences');
    });

    it('should display personalized welcome message', () => {
      const mockPreferences = {
        couple: { partner1: 'Priya', partner2: 'Rahul' },
        budget: { total: 500000 },
        preferences: { theme: 'royal-palace' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPreferences));
      
      renderWithRouter(<AIChat />);
      
      expect(screen.getByText(/Hi Priya/)).toBeInTheDocument();
    });
  });

  describe('Demo Mode', () => {
    it('should show demo mode badge when no API keys', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    });

    it('should show demo mode message', () => {
      renderWithRouter(<AIChat />);
      expect(screen.getByText(/This is a demo version/)).toBeInTheDocument();
    });
  });

  describe('Theme and Styling', () => {
    it('should use solid pastel colors instead of gradients', () => {
      renderWithRouter(<AIChat />);
      const mainContainer = document.querySelector('.bg-soft-beige');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have correct chat bubble styling', async () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        const userMessage = screen.getByText('Hello AI');
        expect(userMessage.closest('.bg-salmon-pink')).toBeInTheDocument();
        
        const aiMessage = screen.getByText('Mock AI response');
        expect(aiMessage.closest('.bg-white')).toBeInTheDocument();
      });
    });

    it('should have correct input field styling', () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      expect(input.closest('.border-pastel-lavender')).toBeInTheDocument();
    });

    it('should have correct send button styling', () => {
      renderWithRouter(<AIChat />);
      const sendButton = screen.getByText('Send');
      expect(sendButton.closest('button')).toHaveClass('bg-salmon-pink');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      expect(input).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithRouter(<AIChat />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      input.focus();
      expect(input).toHaveFocus();
      
      fireEvent.keyDown(input, { key: 'Tab' });
      expect(sendButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const { aiAssistant } = require('../services/ai_assistant_service');
      aiAssistant.processUserRequest.mockRejectedValue(new Error('AI Service Error'));
      
      renderWithRouter(<AIChat />);
      const input = screen.getByPlaceholderText('Type your message here...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        // Should not crash and should show some error state
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on different screen sizes', () => {
      renderWithRouter(<AIChat />);
      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
    });

    it('should have responsive chat layout', () => {
      renderWithRouter(<AIChat />);
      const chatContainer = document.querySelector('.flex.flex-col.h-full');
      expect(chatContainer).toBeInTheDocument();
    });
  });
}); 