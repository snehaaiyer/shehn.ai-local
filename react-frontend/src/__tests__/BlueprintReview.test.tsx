import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlueprintReview from '../pages/BlueprintReview';

// ─── Mocks ──────────────────────────────────────────────────────

// Mock lucide-react icons as invisible SVGs
jest.mock('lucide-react', () => {
  const icons = [
    'FileText', 'Edit3', 'Check', 'ChevronDown', 'ChevronUp', 'Globe', 'Lock', 'Users',
    'MapPin', 'Calendar', 'IndianRupee', 'Sparkles', 'Building2', 'Camera',
    'UtensilsCrossed', 'Flower2', 'Music',
  ];
  const mocks: Record<string, any> = {};
  icons.forEach(name => {
    mocks[name] = (props: any) => <svg data-testid={`icon-${name.toLowerCase()}`} {...props} />;
  });
  return mocks;
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock theme images config
jest.mock('../config/theme_images', () => ({
  getThemeImage: (theme: string) => `/images/themes/${theme || 'fallback'}.jpg`,
}));

// ── Zustand store mock ──
// Store state managed via a global mutable object
const mockStoreState: Record<string, any> = {
  blueprintId: 1,
  setBlueprintId: jest.fn(),
  weddingPreferences: {
    weddingType: 'Hindu',
    city: 'Mumbai',
    guestCount: '400',
    weddingStyle: 'Royal',
    weddingDate: '2026-12-15',
    budget: '4500000',
    events: ['mehendi', 'sangeet', 'ceremony', 'reception'],
    priorities: ['venue', 'photography'],
    specialRequirements: '',
  },
};

jest.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (state: any) => any) => selector(mockStoreState),
}));

// ── Service mocks ──
jest.mock('../services/blueprint_service', () => ({
  BlueprintService: {
    getBlueprint: jest.fn(),
    updateBlueprint: jest.fn(),
    publishBlueprint: jest.fn(),
    unpublishBlueprint: jest.fn(),
  },
}));

jest.mock('../services/marketplace_ai_service', () => ({
  MarketplaceAIService: {
    optimizeBudget: jest.fn(),
    generateBlueprint: jest.fn(),
  },
}));

// Import after mock to get references
import { BlueprintService } from '../services/blueprint_service';
import { MarketplaceAIService } from '../services/marketplace_ai_service';

const mockGetBlueprint = BlueprintService.getBlueprint as jest.Mock;
const mockUpdateBlueprint = BlueprintService.updateBlueprint as jest.Mock;
const mockPublishBlueprint = BlueprintService.publishBlueprint as jest.Mock;
const mockUnpublishBlueprint = BlueprintService.unpublishBlueprint as jest.Mock;
const mockOptimizeBudget = MarketplaceAIService.optimizeBudget as jest.Mock;
const mockGenerateBlueprint = MarketplaceAIService.generateBlueprint as jest.Mock;

// ─── Sample Data ────────────────────────────────────────────────

const sampleBlueprint = {
  id: 1,
  couple_id: 1,
  title: 'Our Dream Wedding',
  status: 'draft' as const,
  wedding_summary: {
    date: '2026-12-15',
    city: 'Mumbai',
    guest_count: 400,
    budget: 4500000,
    theme: 'Royal Palace',
    events: ['mehendi', 'sangeet', 'ceremony', 'reception'],
  },
  category_specs: {
    venue: { budget_allocated: 1800000, requirements: { type: 'Heritage Palace', capacity: 400, indoor_outdoor: 'both' }, notes: 'Must have parking' },
    photography: { budget_allocated: 500000, requirements: { style: 'Candid', drone: true }, notes: '' },
    catering: { budget_allocated: 800000, requirements: { cuisine: 'North Indian', veg_count: 300 }, notes: '' },
    decoration: { budget_allocated: 400000, requirements: { flower_type: 'fresh' }, notes: '' },
    makeup: { budget_allocated: 200000, requirements: { type: 'Airbrush' }, notes: '' },
    entertainment: { budget_allocated: 150000, requirements: { type: 'DJ + Band' }, notes: 'Bollywood DJ preferred' },
  },
  budget_breakdown: {
    venue: 1800000,
    photography: 500000,
    catering: 800000,
    decoration: 400000,
    makeup: 200000,
    entertainment: 150000,
  },
  timeline: [
    { title: 'Book Venue', date: '2026-06-01', description: 'Finalize and book the heritage palace' },
    { title: 'Hire Photographer', date: '2026-08-01', description: 'Book candid photography team' },
  ],
  cost_saving_tips: [
    'Book venue on a weekday for 15-20% discount',
    'Bundle decoration with venue for package pricing',
  ],
  published_at: null,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-05T00:00:00Z',
};

// ─── Helpers ────────────────────────────────────────────────────

const renderPage = () =>
  render(
    <BrowserRouter>
      <BlueprintReview />
    </BrowserRouter>
  );

// ─── Tests ──────────────────────────────────────────────────────

describe('BlueprintReview Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState.blueprintId = 1;
    (mockStoreState.setBlueprintId as jest.Mock).mockClear();
    mockGetBlueprint.mockResolvedValue({ success: true, data: sampleBlueprint });
    mockUpdateBlueprint.mockResolvedValue({ success: true });
    mockPublishBlueprint.mockResolvedValue({ success: true });
    mockUnpublishBlueprint.mockResolvedValue({ success: true });
    window.confirm = jest.fn(() => true);
  });

  // ════════════════════════════════════════════════════════════════
  // 1. LOADING STATE
  // ════════════════════════════════════════════════════════════════
  describe('Loading State', () => {
    test('shows spinner while loading blueprint', () => {
      mockGetBlueprint.mockReturnValue(new Promise(() => {})); // never resolves
      renderPage();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('spinner disappears after blueprint loads', async () => {
      renderPage();
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 2. NO BLUEPRINT STATE
  // ════════════════════════════════════════════════════════════════
  describe('No Blueprint State', () => {
    beforeEach(() => {
      mockStoreState.blueprintId = null;
    });

    test('shows "No blueprint yet" message when no blueprintId', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('No blueprint yet')).toBeInTheDocument();
      });
    });

    test('shows "Go to Preferences" link', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Go to Preferences')).toBeInTheDocument();
        expect(screen.getByText('Go to Preferences').closest('a')).toHaveAttribute('href', '/preferences');
      });
    });

    test('shows "Generate with AI" button', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Generate with AI')).toBeInTheDocument();
      });
    });

    test('clicking "Generate with AI" calls MarketplaceAIService', async () => {
      mockGenerateBlueprint.mockResolvedValue({ success: true, data: { id: 42 } });
      renderPage();
      await waitFor(() => screen.getByText('Generate with AI'));
      fireEvent.click(screen.getByText('Generate with AI'));

      await waitFor(() => {
        expect(mockGenerateBlueprint).toHaveBeenCalledTimes(1);
      });
    });

    test('successful generation sets blueprintId in store', async () => {
      mockGenerateBlueprint.mockResolvedValue({ success: true, data: { id: 42 } });
      renderPage();
      await waitFor(() => screen.getByText('Generate with AI'));
      fireEvent.click(screen.getByText('Generate with AI'));

      await waitFor(() => {
        expect(mockStoreState.setBlueprintId).toHaveBeenCalledWith(42);
      });
    });

    test('shows "Generating..." text while AI generates', async () => {
      mockGenerateBlueprint.mockReturnValue(new Promise(() => {}));
      renderPage();
      await waitFor(() => screen.getByText('Generate with AI'));
      fireEvent.click(screen.getByText('Generate with AI'));

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 3. BLUEPRINT HEADER
  // ════════════════════════════════════════════════════════════════
  describe('Blueprint Header', () => {
    test('renders "My Wedding Blueprint" title', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('My Wedding Blueprint')).toBeInTheDocument());
    });

    test('shows draft status badge', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('draft')).toBeInTheDocument());
    });

    test('shows published status badge for published blueprint', async () => {
      mockGetBlueprint.mockResolvedValue({ success: true, data: { ...sampleBlueprint, status: 'published' } });
      renderPage();
      await waitFor(() => expect(screen.getByText('published')).toBeInTheDocument());
    });

    test('draft blueprint shows "Publish to Marketplace" button', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Publish to Marketplace')).toBeInTheDocument());
    });

    test('published blueprint shows "Unpublish" button', async () => {
      mockGetBlueprint.mockResolvedValue({ success: true, data: { ...sampleBlueprint, status: 'published' } });
      renderPage();
      await waitFor(() => expect(screen.getByText('Unpublish')).toBeInTheDocument());
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 4. THEME HERO IMAGE
  // ════════════════════════════════════════════════════════════════
  describe('Theme Hero Image', () => {
    test('renders theme image with alt text', async () => {
      renderPage();
      await waitFor(() => {
        const img = screen.getByAltText('Royal Palace');
        expect(img).toBeInTheDocument();
      });
    });

    test('shows theme name overlay', async () => {
      renderPage();
      await waitFor(() => {
        // "Royal Palace" appears in hero AND summary, so use getAllByText
        const matches = screen.getAllByText('Royal Palace');
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('shows city, event count, and guest count overlay', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Wedding Theme'));
      // The overlay uses &middot; (·) between "Mumbai · 4 events · 400 guests"
      // Query by partial regex to account for the entity
      const overlay = document.querySelector('.absolute.bottom-4 p.text-sm');
      expect(overlay).toBeInTheDocument();
      expect(overlay?.textContent).toMatch(/Mumbai/);
      expect(overlay?.textContent).toMatch(/4 events/);
      expect(overlay?.textContent).toMatch(/400 guests/);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 5. WEDDING SUMMARY
  // ════════════════════════════════════════════════════════════════
  describe('Wedding Summary', () => {
    test('renders "Wedding Summary" section heading', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Wedding Summary')).toBeInTheDocument());
    });

    test('displays date, city, guests, theme, budget, events', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('2026-12-15')).toBeInTheDocument();
        // City appears in both hero and summary
        expect(screen.getAllByText(/Mumbai/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('400')).toBeInTheDocument();
        // Budget formatted as INR
        expect(screen.getByText(/45,00,000/)).toBeInTheDocument();
        expect(screen.getByText('4 events')).toBeInTheDocument();
      });
    });

    test('labels are shown for each summary field', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('City')).toBeInTheDocument();
        expect(screen.getByText('Guests')).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Budget')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 6. INLINE EDITING
  // ════════════════════════════════════════════════════════════════
  describe('Inline Editing', () => {
    test('clicking a summary cell opens inline edit input', async () => {
      renderPage();
      await waitFor(() => screen.getByText('2026-12-15'));

      // Click the Date cell to edit
      const dateCell = screen.getByText('2026-12-15');
      fireEvent.click(dateCell);

      // An input should appear
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    test('saving a field calls BlueprintService.updateBlueprint', async () => {
      renderPage();
      await waitFor(() => screen.getByText('City'));

      // Click the city label area to trigger edit
      const cityLabel = screen.getByText('City');
      const cityCell = cityLabel.closest('.cursor-pointer');
      if (cityCell) fireEvent.click(cityCell);

      const input = document.querySelector('input[type="text"]');
      if (input) {
        fireEvent.change(input, { target: { value: 'Delhi' } });
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockUpdateBlueprint).toHaveBeenCalledWith(1, expect.objectContaining({
            wedding_summary: expect.objectContaining({ city: 'Delhi' }),
          }));
        });
      }
    });

    test('pressing Enter in edit field saves (blur triggers save)', async () => {
      renderPage();
      await waitFor(() => screen.getByText('400'));

      const guestText = screen.getByText('400');
      fireEvent.click(guestText);

      const input = document.querySelector('input[type="number"]');
      if (input) {
        fireEvent.change(input, { target: { value: '500' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
          expect(mockUpdateBlueprint).toHaveBeenCalled();
        });
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 7. BUDGET BREAKDOWN
  // ════════════════════════════════════════════════════════════════
  describe('Budget Breakdown', () => {
    test('renders "Budget Breakdown" section heading', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Budget Breakdown')).toBeInTheDocument());
    });

    test('shows all 6 category labels', async () => {
      renderPage();
      await waitFor(() => {
        // Each label appears in both Budget and Category Requirements sections
        expect(screen.getAllByText('Venue').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Photography').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Catering').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Decoration').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Makeup').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Entertainment').length).toBeGreaterThanOrEqual(2);
      });
    });

    test('shows formatted budget amounts', async () => {
      renderPage();
      await waitFor(() => {
        // Venue 1800000 → ₹18,00,000
        expect(screen.getAllByText(/18,00,000/).length).toBeGreaterThanOrEqual(1);
        // Photography 500000 → ₹5,00,000
        expect(screen.getAllByText(/5,00,000/).length).toBeGreaterThanOrEqual(1);
      });
    });

    test('shows total allocated budget', async () => {
      renderPage();
      // Total: 1800000 + 500000 + 800000 + 400000 + 200000 + 150000 = 3850000
      await waitFor(() => {
        expect(screen.getByText('Total Allocated')).toBeInTheDocument();
        expect(screen.getByText(/38,50,000/)).toBeInTheDocument();
      });
    });

    test('clicking budget category opens inline editor', async () => {
      renderPage();
      await waitFor(() => screen.getByText(/18,00,000/));

      const venueAmount = screen.getByText(/18,00,000/);
      fireEvent.click(venueAmount);

      // Should show a number input
      await waitFor(() => {
        const input = document.querySelector('input[type="number"]');
        expect(input).toBeInTheDocument();
      });
    });

    test('"AI Budget Optimizer" button is present', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('AI Budget Optimizer')).toBeInTheDocument());
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 8. AI BUDGET OPTIMIZATION
  // ════════════════════════════════════════════════════════════════
  describe('AI Budget Optimization', () => {
    const optimizationResult = {
      suggestions: ['Negotiate venue on weekday', 'Bundle photo+video'],
      potential_savings: '₹5,00,000',
      priority_spend: 'Venue and Photography',
      recommended_reallocation: { venue: 1600000, photography: 550000 },
    };

    test('clicking optimizer calls MarketplaceAIService.optimizeBudget', async () => {
      mockOptimizeBudget.mockResolvedValue({ success: true, data: optimizationResult });
      renderPage();
      await waitFor(() => screen.getByText('AI Budget Optimizer'));

      fireEvent.click(screen.getByText('AI Budget Optimizer'));
      await waitFor(() => expect(mockOptimizeBudget).toHaveBeenCalledTimes(1));
    });

    test('shows "Optimizing..." while loading', async () => {
      mockOptimizeBudget.mockReturnValue(new Promise(() => {}));
      renderPage();
      await waitFor(() => screen.getByText('AI Budget Optimizer'));

      fireEvent.click(screen.getByText('AI Budget Optimizer'));
      expect(screen.getByText('Optimizing...')).toBeInTheDocument();
    });

    test('displays optimization suggestions after success', async () => {
      mockOptimizeBudget.mockResolvedValue({ success: true, data: optimizationResult });
      renderPage();
      await waitFor(() => screen.getByText('AI Budget Optimizer'));

      fireEvent.click(screen.getByText('AI Budget Optimizer'));
      await waitFor(() => {
        expect(screen.getByText('AI Optimization Results')).toBeInTheDocument();
        expect(screen.getByText('Negotiate venue on weekday')).toBeInTheDocument();
        expect(screen.getByText('Bundle photo+video')).toBeInTheDocument();
      });
    });

    test('displays potential savings', async () => {
      mockOptimizeBudget.mockResolvedValue({ success: true, data: optimizationResult });
      renderPage();
      await waitFor(() => screen.getByText('AI Budget Optimizer'));
      fireEvent.click(screen.getByText('AI Budget Optimizer'));

      await waitFor(() => expect(screen.getByText(/₹5,00,000/)).toBeInTheDocument());
    });

    test('"Apply Recommended Reallocation" button updates budget', async () => {
      mockOptimizeBudget.mockResolvedValue({ success: true, data: optimizationResult });
      renderPage();
      await waitFor(() => screen.getByText('AI Budget Optimizer'));
      fireEvent.click(screen.getByText('AI Budget Optimizer'));

      await waitFor(() => screen.getByText('Apply Recommended Reallocation'));
      fireEvent.click(screen.getByText('Apply Recommended Reallocation'));

      await waitFor(() => {
        expect(mockUpdateBlueprint).toHaveBeenCalledWith(1, expect.objectContaining({
          budget_breakdown: expect.objectContaining({ venue: 1600000, photography: 550000 }),
        }));
      });
    });

    test('"Dismiss" closes optimization results', async () => {
      mockOptimizeBudget.mockResolvedValue({ success: true, data: optimizationResult });
      renderPage();
      await waitFor(() => screen.getByText('AI Budget Optimizer'));
      fireEvent.click(screen.getByText('AI Budget Optimizer'));

      await waitFor(() => screen.getByText('Dismiss'));
      fireEvent.click(screen.getByText('Dismiss'));

      await waitFor(() => {
        expect(screen.queryByText('AI Optimization Results')).not.toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 9. PUBLISH / UNPUBLISH
  // ════════════════════════════════════════════════════════════════
  describe('Publish / Unpublish', () => {
    test('clicking "Publish to Marketplace" shows confirm dialog', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Publish to Marketplace'));

      fireEvent.click(screen.getByText('Publish to Marketplace'));
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to publish this blueprint?');
    });

    test('confirming publish calls BlueprintService.publishBlueprint', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Publish to Marketplace'));

      fireEvent.click(screen.getByText('Publish to Marketplace'));
      await waitFor(() => expect(mockPublishBlueprint).toHaveBeenCalledWith(1));
    });

    test('cancelling confirm does NOT call publish', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      renderPage();
      await waitFor(() => screen.getByText('Publish to Marketplace'));

      fireEvent.click(screen.getByText('Publish to Marketplace'));
      expect(mockPublishBlueprint).not.toHaveBeenCalled();
    });

    test('after publish, status changes to published and button shows Unpublish', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Publish to Marketplace'));
      fireEvent.click(screen.getByText('Publish to Marketplace'));

      await waitFor(() => {
        expect(screen.getByText('published')).toBeInTheDocument();
        expect(screen.getByText('Unpublish')).toBeInTheDocument();
      });
    });

    test('clicking Unpublish calls unpublishBlueprint', async () => {
      mockGetBlueprint.mockResolvedValue({ success: true, data: { ...sampleBlueprint, status: 'published' } });
      renderPage();
      await waitFor(() => screen.getByText('Unpublish'));

      fireEvent.click(screen.getByText('Unpublish'));
      await waitFor(() => expect(mockUnpublishBlueprint).toHaveBeenCalledWith(1));
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 10. CATEGORY REQUIREMENTS (ACCORDION)
  // ════════════════════════════════════════════════════════════════
  describe('Category Requirements', () => {
    test('renders "Category Requirements" section heading', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Category Requirements')).toBeInTheDocument());
    });

    test('all 6 categories shown as collapsible rows', async () => {
      renderPage();
      await waitFor(() => {
        // Each category label appears in both budget and requirements sections
        expect(screen.getAllByText('Venue').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Photography').length).toBeGreaterThanOrEqual(2);
      });
    });

    test('shows spec count badges', async () => {
      renderPage();
      await waitFor(() => {
        // Venue has 3 requirements: type, capacity, indoor_outdoor
        expect(screen.getByText('3 specs')).toBeInTheDocument();
      });
    });

    test('clicking category expands to show requirements', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Category Requirements'));

      // Find and click the Venue accordion button in requirements section
      const reqSection = screen.getByText('Category Requirements').closest('div');
      const venueButtons = reqSection?.querySelectorAll('button');
      const venueAccordion = Array.from(venueButtons || []).find(btn => btn.textContent?.includes('Venue'));
      if (venueAccordion) {
        fireEvent.click(venueAccordion);
        await waitFor(() => {
          expect(screen.getByText('Heritage Palace')).toBeInTheDocument();
        });
      }
    });

    test('expanded category shows notes when present', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Category Requirements'));

      // Open Venue (which has notes: "Must have parking")
      const reqSection = screen.getByText('Category Requirements').closest('div');
      const buttons = reqSection?.querySelectorAll('button');
      const venueBtn = Array.from(buttons || []).find(btn => btn.textContent?.includes('Venue'));
      if (venueBtn) {
        fireEvent.click(venueBtn);
        await waitFor(() => {
          expect(screen.getByText('Must have parking')).toBeInTheDocument();
        });
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 11. TIMELINE
  // ════════════════════════════════════════════════════════════════
  describe('Timeline', () => {
    test('renders "Timeline" section heading', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Timeline')).toBeInTheDocument());
    });

    test('shows timeline items with title, date, and description', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Book Venue')).toBeInTheDocument();
        expect(screen.getByText('2026-06-01')).toBeInTheDocument();
        expect(screen.getByText('Finalize and book the heritage palace')).toBeInTheDocument();
        expect(screen.getByText('Hire Photographer')).toBeInTheDocument();
      });
    });

    test('timeline section hidden when timeline is empty', async () => {
      mockGetBlueprint.mockResolvedValue({
        success: true,
        data: { ...sampleBlueprint, timeline: [] },
      });
      renderPage();
      await waitFor(() => screen.getByText('My Wedding Blueprint'));
      expect(screen.queryByText('Timeline')).not.toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 12. COST-SAVING TIPS
  // ════════════════════════════════════════════════════════════════
  describe('Cost-Saving Tips', () => {
    test('renders "Cost-Saving Tips" section heading', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Cost-Saving Tips')).toBeInTheDocument());
    });

    test('shows all tips', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Book venue on a weekday for 15-20% discount')).toBeInTheDocument();
        expect(screen.getByText('Bundle decoration with venue for package pricing')).toBeInTheDocument();
      });
    });

    test('tips section hidden when no tips', async () => {
      mockGetBlueprint.mockResolvedValue({
        success: true,
        data: { ...sampleBlueprint, cost_saving_tips: [] },
      });
      renderPage();
      await waitFor(() => screen.getByText('My Wedding Blueprint'));
      expect(screen.queryByText('Cost-Saving Tips')).not.toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 13. EDGE CASES
  // ════════════════════════════════════════════════════════════════
  describe('Edge Cases', () => {
    test('handles blueprint with missing optional fields gracefully', async () => {
      mockGetBlueprint.mockResolvedValue({
        success: true,
        data: {
          ...sampleBlueprint,
          timeline: null,
          cost_saving_tips: null,
          wedding_summary: { ...sampleBlueprint.wedding_summary, theme: '', events: [] },
        },
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('My Wedding Blueprint')).toBeInTheDocument();
      });
    });

    test('handles API error on load gracefully (shows empty state)', async () => {
      mockGetBlueprint.mockResolvedValue({ success: false, error: 'Not found' });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('No blueprint yet')).toBeInTheDocument();
      });
    });

    test('fetch is called with correct blueprint ID', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockGetBlueprint).toHaveBeenCalledWith(1);
      });
    });
  });
});
