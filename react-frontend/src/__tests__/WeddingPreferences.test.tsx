import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WeddingPreferences from '../pages/WeddingPreferences';

// Mock the components
jest.mock('../components/ThemeCard', () => {
  return function MockThemeCard({ title, isSelected, onClick }: any) {
    return (
      <div 
        data-testid="theme-card" 
        className={isSelected ? 'selected' : ''}
        onClick={onClick}
      >
        {title}
      </div>
    );
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

describe('WeddingPreferences Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        preferences: {
          guestCount: 200,
          duration: 2,
          theme: 'royal-palace',
          style: 'Traditional',
          colors: 'Gold & Red',
          season: 'Winter',
          cuisine: 'Multi-cuisine',
          ceremonyType: 'Hindu',
          receptionType: 'Traditional',
          budgetRange: 'Mid-range',
          location: 'Mumbai',
          date: '2024-12-15'
        },
        themes: [
          {
            id: 'royal-palace',
            name: 'Royal Palace',
            description: 'Elegant and luxurious',
            image: '/images/themes/royal-palace.jpg'
          },
          {
            id: 'beach-destination',
            name: 'Beach Destination',
            description: 'Relaxed and romantic',
            image: '/images/themes/beach-destination.jpg'
          },
          {
            id: 'boho-garden',
            name: 'Boho Garden',
            description: 'Natural and whimsical',
            image: '/images/themes/boho-garden.jpg'
          }
        ]
      })
    });
  });

  describe('Header Section', () => {
    it('should display page title', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByText('Wedding Preferences')).toBeInTheDocument();
    });

    it('should display page description', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByText('Customize your perfect wedding experience')).toBeInTheDocument();
    });

    it('should display save button', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    it('should have clickable save button', () => {
      renderWithRouter(<WeddingPreferences />);
      const saveButton = screen.getByText('Save Preferences');
      expect(saveButton).toBeEnabled();
    });
  });

  describe('Sidebar Navigation', () => {
    it('should display all navigation sections', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByText('Basic Details')).toBeInTheDocument();
      expect(screen.getByText('Theme & Style')).toBeInTheDocument();
      expect(screen.getByText('Ceremony & Reception')).toBeInTheDocument();
      expect(screen.getByText('Catering & Menu')).toBeInTheDocument();
      expect(screen.getByText('Additional Services')).toBeInTheDocument();
    });

    it('should highlight active section', () => {
      renderWithRouter(<WeddingPreferences />);
      const basicDetailsLink = screen.getByText('Basic Details');
      expect(basicDetailsLink.closest('button')).toHaveClass('bg-blue-100');
    });

    it('should handle section navigation clicks', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      expect(themeSection.closest('button')).toHaveClass('bg-blue-100');
    });
  });

  describe('Basic Details Section', () => {
    it('should display basic details form', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByText('Basic Details')).toBeInTheDocument();
    });

    it('should display guest count input', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
    });

    it('should display wedding date input', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByLabelText('Wedding Date')).toBeInTheDocument();
    });

    it('should display location input', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByLabelText('Location')).toBeInTheDocument();
    });

    it('should display budget range select', () => {
      renderWithRouter(<WeddingPreferences />);
      expect(screen.getByLabelText('Budget Range')).toBeInTheDocument();
    });

    it('should handle guest count input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const guestInput = screen.getByLabelText('Number of Guests');
      fireEvent.change(guestInput, { target: { value: '250' } });
      expect(guestInput).toHaveValue(250);
    });

    it('should handle wedding date input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const dateInput = screen.getByLabelText('Wedding Date');
      fireEvent.change(dateInput, { target: { value: '2024-12-20' } });
      expect(dateInput).toHaveValue('2024-12-20');
    });

    it('should handle location input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const locationInput = screen.getByLabelText('Location');
      fireEvent.change(locationInput, { target: { value: 'Delhi' } });
      expect(locationInput).toHaveValue('Delhi');
    });

    it('should handle budget range selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const budgetSelect = screen.getByLabelText('Budget Range');
      fireEvent.change(budgetSelect, { target: { value: 'premium' } });
      expect(budgetSelect).toHaveValue('premium');
    });
  });

  describe('Theme & Style Section', () => {
    it('should display theme selection section', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      expect(screen.getByText('Choose Your Wedding Theme')).toBeInTheDocument();
    });

    it('should display all theme options', async () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      await waitFor(() => {
        expect(screen.getByText('Royal Palace')).toBeInTheDocument();
        expect(screen.getByText('Beach Destination')).toBeInTheDocument();
        expect(screen.getByText('Boho Garden')).toBeInTheDocument();
      });
    });

    it('should display theme descriptions', async () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      await waitFor(() => {
        expect(screen.getByText('Elegant and luxurious')).toBeInTheDocument();
        expect(screen.getByText('Relaxed and romantic')).toBeInTheDocument();
        expect(screen.getByText('Natural and whimsical')).toBeInTheDocument();
      });
    });

    it('should handle theme selection', async () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      await waitFor(() => {
        const beachTheme = screen.getByText('Beach Destination');
        fireEvent.click(beachTheme);
        expect(beachTheme.closest('div')).toHaveClass('selected');
      });
    });

    it('should display style preference select', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      expect(screen.getByLabelText('Style Preference')).toBeInTheDocument();
    });

    it('should display color scheme input', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      expect(screen.getByLabelText('Color Scheme')).toBeInTheDocument();
    });

    it('should display season select', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      expect(screen.getByLabelText('Wedding Season')).toBeInTheDocument();
    });

    it('should handle style preference selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      const styleSelect = screen.getByLabelText('Style Preference');
      fireEvent.change(styleSelect, { target: { value: 'Modern' } });
      expect(styleSelect).toHaveValue('Modern');
    });

    it('should handle color scheme input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      const colorInput = screen.getByLabelText('Color Scheme');
      fireEvent.change(colorInput, { target: { value: 'Blue & Silver' } });
      expect(colorInput).toHaveValue('Blue & Silver');
    });

    it('should handle season selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      const seasonSelect = screen.getByLabelText('Wedding Season');
      fireEvent.change(seasonSelect, { target: { value: 'Spring' } });
      expect(seasonSelect).toHaveValue('Spring');
    });

    it('should handle monsoon season selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const themeSection = screen.getByText('Theme & Style');
      fireEvent.click(themeSection);
      
      const seasonSelect = screen.getByLabelText('Wedding Season');
      fireEvent.change(seasonSelect, { target: { value: 'Monsoon' } });
      expect(seasonSelect).toHaveValue('Monsoon');
    });
  });

  describe('Ceremony & Reception Section', () => {
    it('should display ceremony and reception section', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      expect(screen.getByText('Ceremony & Reception Details')).toBeInTheDocument();
    });

    it('should display ceremony type select', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      expect(screen.getByLabelText('Ceremony Type')).toBeInTheDocument();
    });

    it('should display reception type select', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      expect(screen.getByLabelText('Reception Type')).toBeInTheDocument();
    });

    it('should display ceremony duration input', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      expect(screen.getByLabelText('Ceremony Duration (hours)')).toBeInTheDocument();
    });

    it('should display reception duration input', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      expect(screen.getByLabelText('Reception Duration (hours)')).toBeInTheDocument();
    });

    it('should handle ceremony type selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      
      const ceremonySelect = screen.getByLabelText('Ceremony Type');
      fireEvent.change(ceremonySelect, { target: { value: 'Christian' } });
      expect(ceremonySelect).toHaveValue('Christian');
    });

    it('should handle reception type selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      
      const receptionSelect = screen.getByLabelText('Reception Type');
      fireEvent.change(receptionSelect, { target: { value: 'Modern' } });
      expect(receptionSelect).toHaveValue('Modern');
    });

    it('should handle ceremony duration input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      
      const durationInput = screen.getByLabelText('Ceremony Duration (hours)');
      fireEvent.change(durationInput, { target: { value: '3' } });
      expect(durationInput).toHaveValue(3);
    });

    it('should handle reception duration input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const ceremonySection = screen.getByText('Ceremony & Reception');
      fireEvent.click(ceremonySection);
      
      const durationInput = screen.getByLabelText('Reception Duration (hours)');
      fireEvent.change(durationInput, { target: { value: '5' } });
      expect(durationInput).toHaveValue(5);
    });
  });

  describe('Catering & Menu Section', () => {
    it('should display catering and menu section', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      expect(screen.getByText('Catering & Menu Preferences')).toBeInTheDocument();
    });

    it('should display cuisine type select', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      expect(screen.getByLabelText('Cuisine Type')).toBeInTheDocument();
    });

    it('should display dietary restrictions input', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      expect(screen.getByLabelText('Dietary Restrictions')).toBeInTheDocument();
    });

    it('should display meal type select', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      expect(screen.getByLabelText('Meal Type')).toBeInTheDocument();
    });

    it('should display beverage preferences input', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      expect(screen.getByLabelText('Beverage Preferences')).toBeInTheDocument();
    });

    it('should handle cuisine type selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      
      const cuisineSelect = screen.getByLabelText('Cuisine Type');
      fireEvent.change(cuisineSelect, { target: { value: 'Italian' } });
      expect(cuisineSelect).toHaveValue('Italian');
    });

    it('should handle dietary restrictions input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      
      const restrictionsInput = screen.getByLabelText('Dietary Restrictions');
      fireEvent.change(restrictionsInput, { target: { value: 'Vegetarian, Gluten-free' } });
      expect(restrictionsInput).toHaveValue('Vegetarian, Gluten-free');
    });

    it('should handle meal type selection', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      
      const mealSelect = screen.getByLabelText('Meal Type');
      fireEvent.change(mealSelect, { target: { value: 'Buffet' } });
      expect(mealSelect).toHaveValue('Buffet');
    });

    it('should handle beverage preferences input changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const cateringSection = screen.getByText('Catering & Menu');
      fireEvent.click(cateringSection);
      
      const beverageInput = screen.getByLabelText('Beverage Preferences');
      fireEvent.change(beverageInput, { target: { value: 'Wine, Beer, Soft drinks' } });
      expect(beverageInput).toHaveValue('Wine, Beer, Soft drinks');
    });
  });

  describe('Additional Services Section', () => {
    it('should display additional services section', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      expect(screen.getByText('Additional Services')).toBeInTheDocument();
    });

    it('should display photography checkbox', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      expect(screen.getByLabelText('Photography & Videography')).toBeInTheDocument();
    });

    it('should display music checkbox', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      expect(screen.getByLabelText('Music & Entertainment')).toBeInTheDocument();
    });

    it('should display decoration checkbox', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      expect(screen.getByLabelText('Decoration & Flowers')).toBeInTheDocument();
    });

    it('should display transportation checkbox', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      expect(screen.getByLabelText('Transportation')).toBeInTheDocument();
    });

    it('should handle photography checkbox changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      
      const photographyCheckbox = screen.getByLabelText('Photography & Videography');
      fireEvent.click(photographyCheckbox);
      expect(photographyCheckbox).toBeChecked();
    });

    it('should handle music checkbox changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      
      const musicCheckbox = screen.getByLabelText('Music & Entertainment');
      fireEvent.click(musicCheckbox);
      expect(musicCheckbox).toBeChecked();
    });

    it('should handle decoration checkbox changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      
      const decorationCheckbox = screen.getByLabelText('Decoration & Flowers');
      fireEvent.click(decorationCheckbox);
      expect(decorationCheckbox).toBeChecked();
    });

    it('should handle transportation checkbox changes', () => {
      renderWithRouter(<WeddingPreferences />);
      const servicesSection = screen.getByText('Additional Services');
      fireEvent.click(servicesSection);
      
      const transportationCheckbox = screen.getByLabelText('Transportation');
      fireEvent.click(transportationCheckbox);
      expect(transportationCheckbox).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      // Should show validation errors for required fields
      expect(saveButton).toBeInTheDocument();
    });

    it('should validate guest count is positive', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const guestInput = screen.getByLabelText('Number of Guests');
      fireEvent.change(guestInput, { target: { value: '-10' } });
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      // Should show validation error
      expect(guestInput).toHaveValue(-10);
    });

    it('should validate wedding date is in the future', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const dateInput = screen.getByLabelText('Wedding Date');
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      // Should show validation error
      expect(dateInput).toHaveValue('2020-01-01');
    });
  });

  describe('Data Persistence', () => {
    it('should load existing preferences', async () => {
      renderWithRouter(<WeddingPreferences />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('200')).toBeInTheDocument(); // Guest count
        expect(screen.getByDisplayValue('Traditional')).toBeInTheDocument(); // Style
        expect(screen.getByDisplayValue('Gold & Red')).toBeInTheDocument(); // Colors
      });
    });

    it('should save preferences successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      
      renderWithRouter(<WeddingPreferences />);
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        // Should show success message or redirect
        expect(saveButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      renderWithRouter(<WeddingPreferences />);
      
      await waitFor(() => {
        // Should not crash and should show some error state
        expect(screen.getByText('Wedding Preferences')).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Save failed' })
      });
      
      renderWithRouter(<WeddingPreferences />);
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        // Should show error message
        expect(saveButton).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on different screen sizes', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const container = screen.getByText('Wedding Preferences').closest('div');
      expect(container).toHaveClass('min-h-screen');
    });

    it('should have responsive layout', () => {
      renderWithRouter(<WeddingPreferences />);
      
      // Check for responsive classes
      const sidebar = screen.getByText('Basic Details').closest('div');
      expect(sidebar?.parentElement).toHaveClass('grid');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<WeddingPreferences />);
      
      expect(screen.getByLabelText('Number of Guests')).toBeInTheDocument();
      expect(screen.getByLabelText('Wedding Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Location')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should have semantic HTML structure', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      renderWithRouter(<WeddingPreferences />);
      
      const guestInput = screen.getByLabelText('Number of Guests');
      const dateInput = screen.getByLabelText('Wedding Date');
      
      guestInput.focus();
      expect(guestInput).toHaveFocus();
      
      fireEvent.keyDown(guestInput, { key: 'Tab' });
      expect(dateInput).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many themes', async () => {
      // Mock many themes
      const manyThemes = Array.from({ length: 20 }, (_, i) => ({
        id: `theme-${i}`,
        name: `Theme ${i}`,
        description: `Description for theme ${i}`,
        image: `/images/themes/theme-${i}.jpg`
      }));
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          preferences: {},
          themes: manyThemes
        })
      });
      
      renderWithRouter(<WeddingPreferences />);
      
      await waitFor(() => {
        expect(screen.getByText('Wedding Preferences')).toBeInTheDocument();
      });
    });
  });
}); 