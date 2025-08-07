import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VendorDiscovery from '../pages/VendorDiscovery';

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

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('VendorDiscovery Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Initial Render', () => {
    it('should render the vendor discovery page', () => {
      renderWithRouter(<VendorDiscovery />);
      expect(screen.getByText('Vendor Discovery')).toBeInTheDocument();
    });

    it('should display search functionality', () => {
      renderWithRouter(<VendorDiscovery />);
      expect(screen.getByPlaceholderText('Search vendors, locations, or services...')).toBeInTheDocument();
    });

    it('should display filter options', () => {
      renderWithRouter(<VendorDiscovery />);
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Budget Range')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
    });

    it('should display view mode toggle', () => {
      renderWithRouter(<VendorDiscovery />);
      expect(screen.getByText('Grid')).toBeInTheDocument();
      expect(screen.getByText('List')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input changes', () => {
      renderWithRouter(<VendorDiscovery />);
      const searchInput = screen.getByPlaceholderText('Search vendors, locations, or services...');
      fireEvent.change(searchInput, { target: { value: 'photographer' } });
      expect(searchInput).toHaveValue('photographer');
    });

    it('should perform search when search button is clicked', () => {
      renderWithRouter(<VendorDiscovery />);
      const searchInput = screen.getByPlaceholderText('Search vendors, locations, or services...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'venue' } });
      fireEvent.click(searchButton);
      
      // Should show loading state
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('should display search results', async () => {
      renderWithRouter(<VendorDiscovery />);
      const searchInput = screen.getByPlaceholderText('Search vendors, locations, or services...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'venue' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Elite Wedding Venues')).toBeInTheDocument();
        expect(screen.getByText('Heritage Palace Gardens')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should display category filter options', () => {
      renderWithRouter(<VendorDiscovery />);
      const categorySelect = screen.getByText('Category').closest('select');
      expect(categorySelect).toBeInTheDocument();
    });

    it('should display location filter options', () => {
      renderWithRouter(<VendorDiscovery />);
      const locationSelect = screen.getByText('Location').closest('select');
      expect(locationSelect).toBeInTheDocument();
    });

    it('should display budget range filter options', () => {
      renderWithRouter(<VendorDiscovery />);
      const budgetSelect = screen.getByText('Budget Range').closest('select');
      expect(budgetSelect).toBeInTheDocument();
    });

    it('should display rating filter options', () => {
      renderWithRouter(<VendorDiscovery />);
      const ratingSelect = screen.getByText('Rating').closest('select');
      expect(ratingSelect).toBeInTheDocument();
    });

    it('should apply filters when Apply Filters button is clicked', () => {
      renderWithRouter(<VendorDiscovery />);
      const applyFiltersButton = screen.getByText('Apply Filters');
      fireEvent.click(applyFiltersButton);
      
      // Should trigger filter application
      expect(applyFiltersButton).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch between grid and list view', () => {
      renderWithRouter(<VendorDiscovery />);
      const gridButton = screen.getByText('Grid');
      const listButton = screen.getByText('List');
      
      // Initially grid should be active
      expect(gridButton.closest('button')).toHaveClass('bg-pastel-lavender');
      
      // Click list button
      fireEvent.click(listButton);
      expect(listButton.closest('button')).toHaveClass('bg-pastel-lavender');
    });
  });

  describe('Vendor Cards', () => {
    it('should display vendor information correctly', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        expect(screen.getByText('Elite Wedding Venues')).toBeInTheDocument();
        expect(screen.getByText('Luxury wedding venue with modern amenities')).toBeInTheDocument();
        expect(screen.getByText('₹50,000 - ₹2,00,000')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
      });
    });

    it('should display vendor contact information', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
        expect(screen.getByText('elitevenues@email.com')).toBeInTheDocument();
      });
    });

    it('should display vendor specialties', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        expect(screen.getByText('Luxury Standards')).toBeInTheDocument();
        expect(screen.getByText('Natural Beauty')).toBeInTheDocument();
      });
    });

    it('should have contact action buttons', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact Now')).toBeInTheDocument();
        expect(screen.getByText('Get Quote via AI Agent')).toBeInTheDocument();
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
    });
  });

  describe('Contact Actions', () => {
    it('should handle phone call action', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        const contactButton = screen.getByText('Contact Now');
        fireEvent.click(contactButton);
        // Should trigger phone call or email action
        expect(contactButton).toBeInTheDocument();
      });
    });

    it('should handle AI agent quote request', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        const aiAgentButton = screen.getByText('Get Quote via AI Agent');
        fireEvent.click(aiAgentButton);
        expect(mockNavigate).toHaveBeenCalledWith('/chat');
      });
    });

    it('should handle share action', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        const shareButton = screen.getByText('Share');
        fireEvent.click(shareButton);
        // Should trigger share functionality
        expect(shareButton).toBeInTheDocument();
      });
    });
  });

  describe('Category Tabs', () => {
    it('should display all vendor categories', () => {
      renderWithRouter(<VendorDiscovery />);
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Venues')).toBeInTheDocument();
      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('Catering')).toBeInTheDocument();
      expect(screen.getByText('Decoration')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
      expect(screen.getByText('Beauty')).toBeInTheDocument();
      expect(screen.getByText('Planners')).toBeInTheDocument();
    });

    it('should filter vendors by category when tab is clicked', () => {
      renderWithRouter(<VendorDiscovery />);
      const venuesTab = screen.getByText('Venues');
      fireEvent.click(venuesTab);
      
      // Should show only venue vendors
      expect(venuesTab.closest('button')).toHaveClass('bg-salmon-pink');
    });

    it('should filter photographers when photography tab is clicked', () => {
      renderWithRouter(<VendorDiscovery />);
      const photographyTab = screen.getByText('Photography');
      fireEvent.click(photographyTab);
      
      // Should show only photography vendors
      expect(photographyTab.closest('button')).toHaveClass('bg-salmon-pink');
    });
  });

  describe('No Results State', () => {
    it('should display no results message when search yields no results', async () => {
      renderWithRouter(<VendorDiscovery />);
      const searchInput = screen.getByPlaceholderText('Search vendors, locations, or services...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('No vendors found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during search', () => {
      renderWithRouter(<VendorDiscovery />);
      const searchInput = screen.getByPlaceholderText('Search vendors, locations, or services...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'venue' } });
      fireEvent.click(searchButton);
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  describe('Theme and Styling', () => {
    it('should use solid pastel colors instead of gradients', () => {
      renderWithRouter(<VendorDiscovery />);
      const mainContainer = document.querySelector('.bg-soft-beige');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have correct search button styling', () => {
      renderWithRouter(<VendorDiscovery />);
      const searchButton = screen.getByText('Search');
      expect(searchButton.closest('button')).toHaveClass('bg-salmon-pink');
    });

    it('should have correct filter button styling', () => {
      renderWithRouter(<VendorDiscovery />);
      const applyFiltersButton = screen.getByText('Apply Filters');
      expect(applyFiltersButton.closest('button')).toHaveClass('bg-salmon-pink');
    });

    it('should have proper responsive layout', () => {
      renderWithRouter(<VendorDiscovery />);
      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to AI chat when AI agent button is clicked', async () => {
      renderWithRouter(<VendorDiscovery />);
      
      await waitFor(() => {
        const aiAgentButton = screen.getByText('Get Quote via AI Agent');
        fireEvent.click(aiAgentButton);
        expect(mockNavigate).toHaveBeenCalledWith('/chat');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<VendorDiscovery />);
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Budget Range')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithRouter(<VendorDiscovery />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
}); 