import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../pages/Index';

// Mock the components and hooks
jest.mock('../components/StatsCard', () => {
  return function MockStatsCard({ title, value, icon }: any) {
    return <div data-testid="stats-card">{title}: {value}</div>;
  };
});

jest.mock('../components/SectionCard', () => {
  return function MockSectionCard({ title, children }: any) {
    return (
      <div data-testid="section-card">
        <h3>{title}</h3>
        {children}
      </div>
    );
  };
});

jest.mock('../components/ThemeCard', () => {
  return function MockThemeCard({ title, isSelected }: any) {
    return (
      <div data-testid="theme-card" className={isSelected ? 'selected' : ''}>
        {title}
      </div>
    );
  };
});

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

// Mock React.useEffect to set loading to false immediately
const originalUseEffect = React.useEffect;
beforeAll(() => {
  React.useEffect = jest.fn((effect, deps) => {
    if (typeof effect === 'function') {
      // Call the effect immediately and set loading to false
      effect();
    }
    return originalUseEffect(effect, deps);
  });
});

afterAll(() => {
  React.useEffect = originalUseEffect;
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Index (Dashboard) Screen', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Loading State', () => {
    it('should show loading screen initially', () => {
      renderWithRouter(<Index />);
      expect(screen.getByText('Loading your wedding dashboard...')).toBeInTheDocument();
    });

    it('should display loading spinner', () => {
      renderWithRouter(<Index />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have correct loading background color', () => {
      renderWithRouter(<Index />);
      const loadingContainer = screen.getByText('Loading your wedding dashboard...').closest('.min-h-screen');
      expect(loadingContainer).toHaveClass('bg-soft-beige');
    });
  });

  describe('Banner Section', () => {
    it('should display banner with background image', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const banner = document.querySelector('.relative.h-\\[400px\\]');
        expect(banner).toBeInTheDocument();
      });
    });

    it('should display welcome message with partner name', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Priya!/)).toBeInTheDocument();
      });
    });

    it('should display countdown message', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText(/Your dream wedding is just/)).toBeInTheDocument();
        expect(screen.getByText(/45 days/)).toBeInTheDocument();
      });
    });

    it('should display stats cards in banner', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument(); // Days Left
        expect(screen.getByText('₹320,000')).toBeInTheDocument(); // Spent
        expect(screen.getByText('3')).toBeInTheDocument(); // Vendors
      });
    });

    it('should have correct banner overlay colors', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const salmonOverlay = document.querySelector('.bg-salmon-pink\\/30');
        const blackOverlay = document.querySelector('.bg-black\\/20');
        expect(salmonOverlay).toBeInTheDocument();
        expect(blackOverlay).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions section', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should display all quick action buttons', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Vendors')).toBeInTheDocument();
        expect(screen.getByText('Bid AI')).toBeInTheDocument();
        expect(screen.getByText('Budget')).toBeInTheDocument();
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });
    });

    it('should navigate to vendor discovery when Find Vendors is clicked', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const findVendorsButton = screen.getByText('Find Vendors');
        fireEvent.click(findVendorsButton);
        expect(mockNavigate).toHaveBeenCalledWith('/vendors');
      });
    });

    it('should navigate to AI chat when Bid AI is clicked', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const bidAIButton = screen.getByText('Bid AI');
        fireEvent.click(bidAIButton);
        expect(mockNavigate).toHaveBeenCalledWith('/chat');
      });
    });

    it('should navigate to budget management when Budget is clicked', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const budgetButton = screen.getByText('Budget');
        fireEvent.click(budgetButton);
        expect(mockNavigate).toHaveBeenCalledWith('/budget');
      });
    });
  });

  describe('Vendor Progress', () => {
    it('should display vendor progress section', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Vendor Progress')).toBeInTheDocument();
      });
    });

    it('should display all vendor categories', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Venues')).toBeInTheDocument();
        expect(screen.getByText('Photography')).toBeInTheDocument();
        expect(screen.getByText('Catering')).toBeInTheDocument();
        expect(screen.getByText('Decoration')).toBeInTheDocument();
        expect(screen.getByText('Entertainment')).toBeInTheDocument();
        expect(screen.getByText('Beauty')).toBeInTheDocument();
      });
    });

    it('should display vendor counts correctly', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Venues
        expect(screen.getByText('2')).toBeInTheDocument(); // Photography
        expect(screen.getByText('1')).toBeInTheDocument(); // Catering
        expect(screen.getByText('0')).toBeInTheDocument(); // Decoration, Entertainment, Beauty
      });
    });

    it('should navigate to vendor discovery when empty vendor card is clicked', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const decorationCard = screen.getByText('Decoration').closest('.group');
        fireEvent.click(decorationCard!);
        expect(mockNavigate).toHaveBeenCalledWith('/vendors');
      });
    });
  });

  describe('Budget Overview', () => {
    it('should display budget overview section', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Budget Overview')).toBeInTheDocument();
      });
    });

    it('should display budget information', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('₹500,000')).toBeInTheDocument(); // Total budget
        expect(screen.getByText('₹320,000')).toBeInTheDocument(); // Spent
        expect(screen.getByText('₹180,000')).toBeInTheDocument(); // Remaining
      });
    });

    it('should display budget progress bar', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const progressBar = document.querySelector('.bg-salmon-pink');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('AI Insights', () => {
    it('should display AI insights section', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Insights')).toBeInTheDocument();
      });
    });

    it('should display insight messages', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText(/Your venue is 80% over budget/)).toBeInTheDocument();
        expect(screen.getByText(/Photography package needs review/)).toBeInTheDocument();
        expect(screen.getByText(/Consider adding live music/)).toBeInTheDocument();
      });
    });
  });

  describe('Wedding Vision', () => {
    it('should display wedding vision section', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Vision')).toBeInTheDocument();
      });
    });

    it('should display wedding details', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        expect(screen.getByText('December 25, 2025')).toBeInTheDocument();
        expect(screen.getByText('Bangalore, India')).toBeInTheDocument();
        expect(screen.getByText('Royal Palace')).toBeInTheDocument();
        expect(screen.getByText('Purple & Gold')).toBeInTheDocument();
      });
    });
  });

  describe('Theme and Styling', () => {
    it('should use solid pastel colors instead of gradients', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const mainContainer = document.querySelector('.bg-soft-beige');
        expect(mainContainer).toBeInTheDocument();
      });
    });

    it('should have correct color scheme for quick actions', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const salmonPinkButton = document.querySelector('.bg-salmon-pink');
        const mutedGreenButton = document.querySelector('.bg-muted-green');
        expect(salmonPinkButton).toBeInTheDocument();
        expect(mutedGreenButton).toBeInTheDocument();
      });
    });

    it('should have proper responsive layout', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        const gridContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
        expect(gridContainer).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should handle all navigation actions correctly', async () => {
      renderWithRouter(<Index />);
      
      await waitFor(() => {
        // Test all navigation buttons
        const buttons = [
          { text: 'Find Vendors', path: '/vendors' },
          { text: 'Bid AI', path: '/chat' },
          { text: 'Budget', path: '/budget' },
          { text: 'Timeline', path: '/wedding-timeline' },
          { text: 'Preferences', path: '/wedding-preferences' }
        ];

        buttons.forEach(({ text, path }) => {
          const button = screen.getByText(text);
          fireEvent.click(button);
          expect(mockNavigate).toHaveBeenCalledWith(path);
        });
      });
    });
  });
}); 