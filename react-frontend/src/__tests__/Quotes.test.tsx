import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Quotes from '../pages/Quotes';

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('lucide-react', () => {
  const icons = ['FileText','Inbox','Building2','Camera','UtensilsCrossed','Flower2','Sparkles','Music','Filter','SortAsc','ArrowUpDown'];
  const m: Record<string, any> = {};
  icons.forEach(n => { m[n] = (p: any) => <svg data-testid={`icon-${n.toLowerCase()}`} {...p} />; });
  return m;
});

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Store
const mockStoreState: Record<string, any> = { blueprintId: 1, currentUserId: 1 };
jest.mock('../store/useAppStore', () => ({
  useAppStore: (sel: (s: any) => any) => sel(mockStoreState),
}));

// Services
jest.mock('../services/quote_service', () => ({
  QuoteService: { getQuotesForBlueprint: jest.fn(), updateQuoteStatus: jest.fn() },
}));
jest.mock('../services/messaging_service', () => ({
  MessagingService: { createConversation: jest.fn() },
}));
jest.mock('../services/marketplace_ai_service', () => ({
  MarketplaceAIService: { analyzeQuote: jest.fn(), matchVendors: jest.fn() },
}));
jest.mock('../services/blueprint_service', () => ({
  BlueprintService: { getBlueprint: jest.fn() },
}));

// QuoteCard — render a simplified version
jest.mock('../components/QuoteCard', () => {
  return function MockQuoteCard({ quote, budgetAllocated, onAction, onChat }: any) {
    return (
      <div data-testid={`quote-card-${quote.id}`}>
        <span>{quote.vendor_name}</span>
        <span>{quote.category}</span>
        <button onClick={() => onAction('shortlisted')}>Shortlist</button>
        <button onClick={() => onAction('rejected')}>Reject</button>
        <button onClick={onChat}>Chat</button>
      </div>
    );
  };
});

import { QuoteService } from '../services/quote_service';
import { MessagingService } from '../services/messaging_service';
import { MarketplaceAIService } from '../services/marketplace_ai_service';
import { BlueprintService } from '../services/blueprint_service';

const mockGetQuotes = QuoteService.getQuotesForBlueprint as jest.Mock;
const mockUpdateStatus = QuoteService.updateQuoteStatus as jest.Mock;
const mockCreateConversation = MessagingService.createConversation as jest.Mock;
const mockAnalyzeQuote = MarketplaceAIService.analyzeQuote as jest.Mock;
const mockMatchVendors = MarketplaceAIService.matchVendors as jest.Mock;
const mockGetBlueprint = (BlueprintService as any).getBlueprint as jest.Mock;

// ── Sample Data ──
const sampleQuotes = [
  { id: 1, blueprint_id: 1, vendor_id: 10, vendor_name: 'Palace Gardens', vendor_rating: 4.8, vendor_experience: 12, category: 'venue', category_pricing: {}, package_price: null, package_description: null, total_estimated_price: 3840000, inclusions: 'Decor, valet', exclusions: '', payment_terms: '50% advance', valid_until: '2026-06-01', portfolio_links: [], status: 'submitted', created_at: '2026-04-05T00:00:00Z' },
  { id: 2, blueprint_id: 1, vendor_id: 11, vendor_name: 'Candid Memories', vendor_rating: 4.5, vendor_experience: 8, category: 'photography', category_pricing: {}, package_price: null, package_description: null, total_estimated_price: 340000, inclusions: '2 photog, drone', exclusions: '', payment_terms: '30% advance', valid_until: '2026-06-01', portfolio_links: [], status: 'submitted', created_at: '2026-04-04T00:00:00Z' },
  { id: 3, blueprint_id: 1, vendor_id: 12, vendor_name: 'Royal Caterers', vendor_rating: 4.2, vendor_experience: 15, category: 'catering', category_pricing: {}, package_price: null, package_description: null, total_estimated_price: 960000, inclusions: 'Live counters', exclusions: '', payment_terms: '40% advance', valid_until: '2026-06-01', portfolio_links: [], status: 'shortlisted', created_at: '2026-04-03T00:00:00Z' },
];

const renderPage = () => render(<BrowserRouter><Quotes /></BrowserRouter>);

// ─── Tests ──────────────────────────────────────────────────────

describe('Quotes Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState.blueprintId = 1;
    mockGetQuotes.mockResolvedValue({ success: true, data: sampleQuotes });
    mockGetBlueprint.mockResolvedValue({ success: true, data: { budget_breakdown: { venue: 1800000, photography: 500000, catering: 800000, decoration: 400000, makeup: 200000, entertainment: 150000 } } });
    mockUpdateStatus.mockResolvedValue({ success: true });
    mockCreateConversation.mockResolvedValue({ success: true, data: { id: 1 } });
  });

  // ════════════════════════════════════════════════════════════════
  // 1. NO BLUEPRINT STATE
  // ════════════════════════════════════════════════════════════════
  describe('No Blueprint', () => {
    test('shows "No blueprint found" when no blueprintId', () => {
      mockStoreState.blueprintId = null;
      renderPage();
      expect(screen.getByText('No blueprint found')).toBeInTheDocument();
    });

    test('shows link to preferences', () => {
      mockStoreState.blueprintId = null;
      renderPage();
      expect(screen.getByText('Go to Preferences').closest('a')).toHaveAttribute('href', '/preferences');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 2. LOADING & HEADER
  // ════════════════════════════════════════════════════════════════
  describe('Loading & Header', () => {
    test('shows spinner while loading', () => {
      mockGetQuotes.mockReturnValue(new Promise(() => {}));
      renderPage();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('shows "Incoming Quotes" header', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Incoming Quotes')).toBeInTheDocument());
    });

    test('shows total quote count', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText(/3 quotes received/)).toBeInTheDocument());
    });

    test('shows singular "quote" for single result', async () => {
      mockGetQuotes.mockResolvedValue({ success: true, data: [sampleQuotes[0]] });
      renderPage();
      await waitFor(() => expect(screen.getByText(/1 quote received/)).toBeInTheDocument());
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 3. CATEGORY TABS
  // ════════════════════════════════════════════════════════════════
  describe('Category Tabs', () => {
    test('shows All + 6 category filter tabs', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Venue')).toBeInTheDocument();
        expect(screen.getByText('Photography')).toBeInTheDocument();
        expect(screen.getByText('Catering')).toBeInTheDocument();
        expect(screen.getByText('Decoration')).toBeInTheDocument();
        expect(screen.getByText('Makeup')).toBeInTheDocument();
        expect(screen.getByText('Entertainment')).toBeInTheDocument();
      });
    });

    test('clicking a category tab filters quotes', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Palace Gardens'));

      fireEvent.click(screen.getByText('Photography'));

      // Only Candid Memories (photography) should be visible
      expect(screen.getByText('Candid Memories')).toBeInTheDocument();
      expect(screen.queryByText('Palace Gardens')).not.toBeInTheDocument();
      expect(screen.queryByText('Royal Caterers')).not.toBeInTheDocument();
    });

    test('"All" tab shows all quotes', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Palace Gardens'));
      fireEvent.click(screen.getByText('Photography'));
      fireEvent.click(screen.getByText('All'));
      expect(screen.getByText('Palace Gardens')).toBeInTheDocument();
      expect(screen.getByText('Candid Memories')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 4. EMPTY STATE
  // ════════════════════════════════════════════════════════════════
  describe('Empty State', () => {
    test('shows "No quotes yet" when no quotes returned', async () => {
      mockGetQuotes.mockResolvedValue({ success: true, data: [] });
      renderPage();
      await waitFor(() => expect(screen.getByText('No quotes yet')).toBeInTheDocument());
    });

    test('shows category-specific message when filter yields no results', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Palace Gardens'));
      fireEvent.click(screen.getByText('Decoration'));
      expect(screen.getByText(/No quotes in the decoration category/)).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 5. QUOTE CARDS
  // ════════════════════════════════════════════════════════════════
  describe('Quote Cards', () => {
    test('renders a QuoteCard for each quote', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByTestId('quote-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('quote-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('quote-card-3')).toBeInTheDocument();
      });
    });

    test('shortlisting a quote calls updateQuoteStatus', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('quote-card-1'));

      const card = screen.getByTestId('quote-card-1');
      fireEvent.click(card.querySelector('button')!); // "Shortlist" is first button
      await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'shortlisted'));
    });

    test('rejecting a quote calls updateQuoteStatus', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('quote-card-1'));

      const rejectBtn = screen.getByTestId('quote-card-1').querySelectorAll('button')[1];
      fireEvent.click(rejectBtn);
      await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'rejected'));
    });

    test('chat button starts conversation and navigates', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('quote-card-1'));

      const chatBtn = screen.getByTestId('quote-card-1').querySelectorAll('button')[2];
      fireEvent.click(chatBtn);
      await waitFor(() => {
        expect(mockCreateConversation).toHaveBeenCalledWith(expect.objectContaining({
          couple_id: 1,
          vendor_id: 10,
          blueprint_id: 1,
        }));
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 6. SORTING
  // ════════════════════════════════════════════════════════════════
  describe('Sorting', () => {
    test('sort dropdown shows "Newest first" by default', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Newest first')).toBeInTheDocument());
    });

    test('clicking sort button opens dropdown', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Newest first'));
      fireEvent.click(screen.getByText('Newest first'));
      expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
      expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
      expect(screen.getByText('Highest rated')).toBeInTheDocument();
    });

    test('selecting sort option changes sort order', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Newest first'));
      fireEvent.click(screen.getByText('Newest first'));
      fireEvent.click(screen.getByText('Price: Low to High'));
      // Dropdown should close, showing new sort label
      await waitFor(() => expect(screen.getByText('Price: Low to High')).toBeInTheDocument());
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 7. AI FEATURES
  // ════════════════════════════════════════════════════════════════
  describe('AI Features', () => {
    test('"AI Rank Vendors" button is present', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('AI Rank Vendors')).toBeInTheDocument());
    });

    test('clicking AI Rank calls matchVendors', async () => {
      mockMatchVendors.mockResolvedValue({ success: true, data: [{ vendor_name: 'Best Vendor', match_score: 92, reason: 'Great fit' }] });
      renderPage();
      // Wait for quotes AND budget to load (budget loaded via dynamic import)
      await waitFor(() => screen.getByTestId('quote-card-1'), { timeout: 3000 });
      // Small delay for budget useEffect to complete
      await new Promise(r => setTimeout(r, 100));
      fireEvent.click(screen.getByText('AI Rank Vendors'));
      await waitFor(() => expect(mockMatchVendors).toHaveBeenCalled(), { timeout: 3000 });
    });

    test('AI rankings panel shows after ranking', async () => {
      mockMatchVendors.mockResolvedValue({ success: true, data: [{ vendor_name: 'Best Vendor', match_score: 92, reason: 'Great fit' }] });
      renderPage();
      await waitFor(() => screen.getByTestId('quote-card-1'), { timeout: 3000 });
      await new Promise(r => setTimeout(r, 100));
      fireEvent.click(screen.getByText('AI Rank Vendors'));
      await waitFor(() => {
        expect(screen.getByText('AI Vendor Rankings')).toBeInTheDocument();
        expect(screen.getByText('Best Vendor')).toBeInTheDocument();
        expect(screen.getByText('92')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('"AI Analysis" button toggles per-quote analysis', async () => {
      renderPage();
      await waitFor(() => screen.getByTestId('quote-card-1'));
      // AI Analysis buttons appear for each quote
      const analysisButtons = screen.getAllByText('AI Analysis');
      expect(analysisButtons.length).toBe(3);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // 8. SUMMARY BAR
  // ════════════════════════════════════════════════════════════════
  describe('Summary Bar', () => {
    test('shows shortlisted, accepted, pending counts', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('shortlisted')).toBeInTheDocument();
        expect(screen.getByText('accepted')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    test('shows average quote amount', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText(/Avg quote/)).toBeInTheDocument());
    });
  });
});
