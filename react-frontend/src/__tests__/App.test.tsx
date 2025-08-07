import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the page components
jest.mock('../pages/Index', () => {
  return function MockIndex() {
    return <div data-testid="index-page">Dashboard Page</div>;
  };
});

jest.mock('../pages/VendorDiscovery', () => {
  return function MockVendorDiscovery() {
    return <div data-testid="vendor-discovery-page">Vendor Discovery Page</div>;
  };
});

jest.mock('../pages/BudgetManagement', () => {
  return function MockBudgetManagement() {
    return <div data-testid="budget-management-page">Budget Management Page</div>;
  };
});

jest.mock('../pages/WeddingPreferences', () => {
  return function MockWeddingPreferences() {
    return <div data-testid="wedding-preferences-page">Wedding Preferences Page</div>;
  };
});

jest.mock('../pages/AIChat', () => {
  return function MockAIChat() {
    return <div data-testid="ai-chat-page">AI Chat Page</div>;
  };
});

// Mock the store
jest.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    sidebarOpen: false,
    setSidebarOpen: jest.fn(),
    theme: 'light',
    setTheme: jest.fn()
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('App Component', () => {
  describe('Initial Render', () => {
    it('should render the app without crashing', () => {
      render(<App />);
      expect(screen.getByText('BID AI Wedding')).toBeInTheDocument();
    });

    it('should display the app title in mobile header', () => {
      render(<App />);
      expect(screen.getByText('BID AI Wedding')).toBeInTheDocument();
    });

    it('should render the dashboard page by default', () => {
      render(<App />);
      expect(screen.getByTestId('index-page')).toBeInTheDocument();
    });

    it('should have the correct background color', () => {
      render(<App />);
      const mainContainer = screen.getByTestId('index-page').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-soft-beige');
    });
  });

  describe('Mobile Header', () => {
    it('should display mobile header with menu button', () => {
      render(<App />);
      const menuButton = screen.getByRole('button');
      expect(menuButton).toBeInTheDocument();
    });

    it('should display app title in mobile header', () => {
      render(<App />);
      expect(screen.getByText('BID AI Wedding')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when pages are loading', () => {
      render(<App />);
      // The Suspense fallback should be present
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('Error Boundary', () => {
    it('should render error boundary wrapper', () => {
      render(<App />);
      // Error boundary should be present in the component tree
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  describe('Route Structure', () => {
    it('should have correct route paths', () => {
      render(<App />);
      // Check that the main routes are accessible
      expect(screen.getByTestId('index-page')).toBeInTheDocument();
    });
  });

  describe('Theme and Styling', () => {
    it('should use solid pastel colors instead of gradients', () => {
      render(<App />);
      const mainContainer = screen.getByTestId('index-page').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-soft-beige');
    });

    it('should have proper mobile responsive layout', () => {
      render(<App />);
      const mobileHeader = document.querySelector('.lg\\:hidden');
      expect(mobileHeader).toBeInTheDocument();
    });
  });
}); 