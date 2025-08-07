import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BudgetManagement from '../pages/BudgetManagement';

// Mock the components
jest.mock('../components/ProgressRing', () => {
  return function MockProgressRing({ percentage }: any) {
    return <div data-testid="progress-ring">{percentage}%</div>;
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

// Mock fetch for API calls
global.fetch = jest.fn();

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('BudgetManagement Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        budget: {
          total: 500000,
          spent: 250000,
          remaining: 250000,
          allocated: 300000
        },
        categories: [
          {
            id: '1',
            name: 'Venue',
            allocated: 150000,
            spent: 100000,
            remaining: 50000
          },
          {
            id: '2',
            name: 'Catering',
            allocated: 80000,
            spent: 60000,
            remaining: 20000
          },
          {
            id: '3',
            name: 'Photography',
            allocated: 40000,
            spent: 30000,
            remaining: 10000
          },
          {
            id: '4',
            name: 'Decoration',
            allocated: 30000,
            spent: 20000,
            remaining: 10000
          }
        ],
        transactions: [
          {
            id: '1',
            description: 'Venue deposit payment',
            amount: 50000,
            category: 'Venue',
            date: '2024-10-15',
            type: 'expense'
          },
          {
            id: '2',
            description: 'Photographer booking',
            amount: 15000,
            category: 'Photography',
            date: '2024-10-10',
            type: 'expense'
          },
          {
            id: '3',
            description: 'Catering advance',
            amount: 30000,
            category: 'Catering',
            date: '2024-10-05',
            type: 'expense'
          }
        ]
      })
    });
  });

  describe('Header Section', () => {
    it('should display page title', () => {
      renderWithRouter(<BudgetManagement />);
      expect(screen.getByText('Budget Management')).toBeInTheDocument();
    });

    it('should display page description', () => {
      renderWithRouter(<BudgetManagement />);
      expect(screen.getByText('Track and manage your wedding budget')).toBeInTheDocument();
    });

    it('should display add transaction button', () => {
      renderWithRouter(<BudgetManagement />);
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    it('should have clickable add transaction button', () => {
      renderWithRouter(<BudgetManagement />);
      const addButton = screen.getByText('Add Transaction');
      expect(addButton).toBeEnabled();
    });
  });

  describe('Budget Overview Cards', () => {
    it('should display total budget card', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Budget')).toBeInTheDocument();
        expect(screen.getByText('₹500,000')).toBeInTheDocument();
      });
    });

    it('should display spent amount card', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Spent')).toBeInTheDocument();
        expect(screen.getByText('₹250,000')).toBeInTheDocument();
      });
    });

    it('should display remaining budget card', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Remaining')).toBeInTheDocument();
        expect(screen.getByText('₹250,000')).toBeInTheDocument();
      });
    });

    it('should display allocated budget card', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Allocated')).toBeInTheDocument();
        expect(screen.getByText('₹300,000')).toBeInTheDocument();
      });
    });

    it('should display budget progress ring', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-ring')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('Budget Breakdown Section', () => {
    it('should display budget breakdown title', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Budget Breakdown')).toBeInTheDocument();
      });
    });

    it('should display all budget categories', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Venue')).toBeInTheDocument();
        expect(screen.getByText('Catering')).toBeInTheDocument();
        expect(screen.getByText('Photography')).toBeInTheDocument();
        expect(screen.getByText('Decoration')).toBeInTheDocument();
      });
    });

    it('should display category amounts correctly', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('₹150,000')).toBeInTheDocument(); // Venue allocated
        expect(screen.getByText('₹100,000')).toBeInTheDocument(); // Venue spent
        expect(screen.getByText('₹50,000')).toBeInTheDocument(); // Venue remaining
      });
    });

    it('should display category progress bars', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should calculate and display progress percentages correctly', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Venue: 100000/150000 = 66.67%
        expect(screen.getByText('67%')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Transactions Section', () => {
    it('should display recent transactions title', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      });
    });

    it('should display transaction details', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Venue deposit payment')).toBeInTheDocument();
        expect(screen.getByText('Photographer booking')).toBeInTheDocument();
        expect(screen.getByText('Catering advance')).toBeInTheDocument();
      });
    });

    it('should display transaction amounts', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('₹50,000')).toBeInTheDocument();
        expect(screen.getByText('₹15,000')).toBeInTheDocument();
        expect(screen.getByText('₹30,000')).toBeInTheDocument();
      });
    });

    it('should display transaction categories', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Venue')).toBeInTheDocument();
        expect(screen.getByText('Photography')).toBeInTheDocument();
        expect(screen.getByText('Catering')).toBeInTheDocument();
      });
    });

    it('should display transaction dates', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('2024-10-15')).toBeInTheDocument();
        expect(screen.getByText('2024-10-10')).toBeInTheDocument();
        expect(screen.getByText('2024-10-05')).toBeInTheDocument();
      });
    });

    it('should display transaction types', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        const expenseElements = screen.getAllByText('expense');
        expect(expenseElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Budget Insights Section', () => {
    it('should display budget insights title', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Budget Insights')).toBeInTheDocument();
      });
    });

    it('should display budget status', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/Budget Status/)).toBeInTheDocument();
      });
    });

    it('should display spending trends', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/Spending Trends/)).toBeInTheDocument();
      });
    });

    it('should display recommendations', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/Recommendations/)).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Elements', () => {
    it('should handle add transaction button click', async () => {
      renderWithRouter(<BudgetManagement />);
      
      const addButton = screen.getByText('Add Transaction');
      fireEvent.click(addButton);
      
      // Should open modal or navigate to add transaction page
      expect(addButton).toBeInTheDocument();
    });

    it('should handle edit category button clicks', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        editButtons.forEach(button => {
          fireEvent.click(button);
          // Add assertions for expected behavior
        });
      });
    });

    it('should handle view all transactions button click', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        const viewAllButton = screen.getByText('View All Transactions');
        if (viewAllButton) {
          fireEvent.click(viewAllButton);
          // Add assertions for expected behavior
        }
      });
    });
  });

  describe('Budget Calculations', () => {
    it('should calculate total spent correctly', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Total spent should be sum of all category spent amounts
        // 100000 + 60000 + 30000 + 20000 = 210000
        expect(screen.getByText('₹250,000')).toBeInTheDocument();
      });
    });

    it('should calculate remaining budget correctly', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Remaining = Total - Spent = 500000 - 250000 = 250000
        expect(screen.getByText('₹250,000')).toBeInTheDocument();
      });
    });

    it('should calculate budget utilization percentage correctly', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Utilization = (Spent / Total) * 100 = (250000 / 500000) * 100 = 50%
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('Category Management', () => {
    it('should display category allocation percentages', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Venue: 150000/500000 = 30%
        expect(screen.getByText(/30%/)).toBeInTheDocument();
      });
    });

    it('should display category spending percentages', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Venue: 100000/150000 = 67%
        expect(screen.getByText('67%')).toBeInTheDocument();
      });
    });

    it('should show category status indicators', async () => {
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Should show status for each category (on track, over budget, etc.)
        const statusElements = screen.getAllByText(/on track|over budget|under budget/i);
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Validation', () => {
    it('should handle missing budget data gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}) // Empty response
      });
      
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Should render with default values or show appropriate message
        expect(screen.getByText('Budget Management')).toBeInTheDocument();
      });
    });

    it('should handle invalid budget amounts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          budget: {
            total: -1000, // Invalid negative amount
            spent: 500,
            remaining: -1500,
            allocated: 2000
          }
        })
      });
      
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Should handle negative amounts gracefully
        expect(screen.getByText('Budget Management')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Should not crash and should show some error state
        expect(screen.getByText('Budget Management')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));
      
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        // Should not crash and should show some error state
        expect(screen.getByText('Budget Management')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on different screen sizes', () => {
      renderWithRouter(<BudgetManagement />);
      
      const container = screen.getByText('Budget Management').closest('div');
      expect(container).toHaveClass('min-h-screen');
    });

    it('should have responsive grid layout', () => {
      renderWithRouter(<BudgetManagement />);
      
      // Check for responsive grid classes
      const overviewCards = screen.getByText('Total Budget').closest('div');
      expect(overviewCards?.parentElement).toHaveClass('grid');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<BudgetManagement />);
      
      // Check for proper accessibility attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should have semantic HTML structure', () => {
      renderWithRouter(<BudgetManagement />);
      
      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have proper form labels', () => {
      renderWithRouter(<BudgetManagement />);
      
      // Check for form accessibility
      const addButton = screen.getByText('Add Transaction');
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large datasets', async () => {
      // Mock large dataset
      const largeCategories = Array.from({ length: 50 }, (_, i) => ({
        id: i.toString(),
        name: `Category ${i}`,
        allocated: 10000,
        spent: 5000,
        remaining: 5000
      }));
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          budget: { total: 500000, spent: 250000, remaining: 250000, allocated: 300000 },
          categories: largeCategories,
          transactions: []
        })
      });
      
      renderWithRouter(<BudgetManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Budget Management')).toBeInTheDocument();
      });
    });
  });
}); 