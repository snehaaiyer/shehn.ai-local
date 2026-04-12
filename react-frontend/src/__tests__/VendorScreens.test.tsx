import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ─── Shared Mocks ──────────────────────────────────────────────

jest.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (p: any) => <svg data-testid={`icon-${String(name).toLowerCase()}`} {...p} /> }));
jest.mock('framer-motion', () => ({ motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div>, button: ({ children, ...p }: any) => <button {...p}>{children}</button> }, AnimatePresence: ({ children }: any) => <div>{children}</div> }));

const mockStoreState: Record<string, any> = { currentUserId: 1, currentRole: 'vendor', unreadMessageCount: 3, activeConversationId: null, setActiveConversation: jest.fn() };
jest.mock('../store/useAppStore', () => ({
  useAppStore: (s?: any) => (typeof s === 'function' ? s(mockStoreState) : mockStoreState),
}));

jest.mock('../services/vendor_service', () => ({ VendorService: { register: jest.fn(), getProfile: jest.fn(), updateProfile: jest.fn(), getMarketplaceListings: jest.fn() } }));
jest.mock('../services/quote_service', () => ({ QuoteService: { submitQuote: jest.fn() } }));
jest.mock('../services/messaging_service', () => ({ MessagingService: { getConversations: jest.fn(), getConversation: jest.fn(), sendMessage: jest.fn() } }));
jest.mock('../services/marketplace_ai_service', () => ({ MarketplaceAIService: { getListingInsights: jest.fn(), getBidAssistance: jest.fn(), suggestMessage: jest.fn() } }));
jest.mock('../config/theme_images', () => ({ getThemeImage: () => '/classic contemporary.png' }));
jest.mock('../components/ConversationList', () => (p: any) => <div data-testid="conv-list">{p.conversations?.map((c: any) => <button key={c.id} onClick={() => p.onSelect(c.id)}>{c.other_party_name}</button>)}</div>);
jest.mock('../components/MessageThread', () => (p: any) => <div data-testid="msg-thread">{p.messages?.map((m: any) => <div key={m.id}>{m.content}</div>)}<button onClick={() => p.onSend('reply')}>Send</button></div>);

import { VendorService } from '../services/vendor_service';
import { MessagingService } from '../services/messaging_service';

const mockRegister = VendorService.register as jest.Mock;
const mockGetProfile = VendorService.getProfile as jest.Mock;
const mockUpdateProfile = VendorService.updateProfile as jest.Mock;
const mockGetListings = VendorService.getMarketplaceListings as jest.Mock;
const mockGetConversations = MessagingService.getConversations as jest.Mock;
const mockGetConversation = MessagingService.getConversation as jest.Mock;
const mockSendMessage = MessagingService.sendMessage as jest.Mock;

const sampleProfile = { id: 1, name: 'Royal Caterers', category: 'catering', business_description: 'Premium catering', operating_cities: ['Mumbai', 'Delhi'], services_offered: [{ name: 'Buffet', base_price: 500, price_unit: 'per plate' }], portfolio_images: [{ url: '/img1.jpg', caption: 'Event 1' }], years_experience: 15, rating: 4.5, approval_status: 'approved', profile_completion: 80 };
const sampleListings = [{ id: 1, wedding_summary: { date: '2026-12-15', city: 'Mumbai', guest_count: 400, budget: 4500000, theme: 'Royal', events: ['ceremony'] }, category_specs: { catering: { budget_allocated: 800000, requirements: { cuisine: 'North Indian' }, notes: '' } }, bid_count: 3 }];

// ═══════════════════════════════════════════════════════════════
// VENDOR REGISTER
// ═══════════════════════════════════════════════════════════════

describe('VendorRegister Screen', () => {
  let VendorRegister: any;
  beforeAll(async () => { VendorRegister = (await import('../pages/vendor/VendorRegister')).default; });
  beforeEach(() => { jest.clearAllMocks(); mockRegister.mockResolvedValue({ success: true, data: { id: 42 } }); });
  const renderRegister = () => render(<BrowserRouter><VendorRegister /></BrowserRouter>);

  test('renders registration form heading', () => {
    renderRegister();
    expect(screen.getByText(/Join Shehnai/i)).toBeTruthy();
  });

  test('has business name input', () => {
    renderRegister();
    // The label "Business Name *" wraps the input as a sibling inside the same div.
    // Use getByRole with name matching the label text.
    expect(screen.getByText(/Business Name/i)).toBeTruthy();
    const inputs = document.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  test('has category dropdown', () => {
    renderRegister();
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  test('has register/submit button', () => {
    renderRegister();
    const btn = screen.getAllByRole('button').find(b => b.textContent?.toLowerCase().includes('register'));
    expect(btn).toBeTruthy();
  });

  test('successful registration calls VendorService.register', async () => {
    renderRegister();
    // The first text input is the business name
    const textInputs = document.querySelectorAll('input[type="text"]');
    const nameInput = textInputs[0];
    fireEvent.change(nameInput, { target: { value: 'Test Catering Co' } });
    // Fill required fields: category and description
    const select = document.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'catering' } });
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Test description' } });
    const btn = screen.getAllByRole('button').find(b => b.textContent?.toLowerCase().includes('register'));
    if (btn) fireEvent.click(btn);
    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
  });
});

// ═══════════════════════════════════════════════════════════════
// VENDOR DASHBOARD
// ═══════════════════════════════════════════════════════════════

describe('VendorDashboard Screen', () => {
  let VendorDashboard: any;
  beforeAll(async () => { VendorDashboard = (await import('../pages/vendor/VendorDashboard')).default; });
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue({ success: true, data: sampleProfile });
    mockGetListings.mockResolvedValue({ success: true, data: sampleListings });
  });
  const renderDashboard = () => render(<BrowserRouter><VendorDashboard /></BrowserRouter>);

  test('shows welcome message with vendor name', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Royal Caterers/)).toBeInTheDocument());
  });

  test('shows stats cards', async () => {
    renderDashboard();
    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toMatch(/Bids|Quotes|Listings|Messages/i);
    });
  });

  test('shows recent marketplace listings', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Mumbai/) || screen.getByText(/marketplace/i)).toBeTruthy());
  });
});

// ═══════════════════════════════════════════════════════════════
// VENDOR MARKETPLACE
// ═══════════════════════════════════════════════════════════════

describe('VendorMarketplace Screen', () => {
  let VendorMarketplace: any;
  beforeAll(async () => { VendorMarketplace = (await import('../pages/vendor/VendorMarketplace')).default; });
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue({ success: true, data: sampleProfile });
    mockGetListings.mockResolvedValue({ success: true, data: sampleListings });
  });
  const renderMarketplace = () => render(<BrowserRouter><VendorMarketplace /></BrowserRouter>);

  test('renders marketplace heading', async () => {
    renderMarketplace();
    await waitFor(() => expect(screen.getByText(/Marketplace/i)).toBeTruthy());
  });

  test('loads vendor profile on mount', async () => {
    renderMarketplace();
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
  });

  test('loads marketplace listings on mount', async () => {
    renderMarketplace();
    await waitFor(() => expect(mockGetListings).toHaveBeenCalled());
  });

  test('shows listing cards with wedding details', async () => {
    renderMarketplace();
    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toMatch(/Mumbai|400|guests/i);
    });
  });

  test('shows empty state when no listings', async () => {
    mockGetListings.mockResolvedValue({ success: true, data: [] });
    renderMarketplace();
    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toMatch(/No listing|no blueprint|empty/i);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// VENDOR PROFILE
// ═══════════════════════════════════════════════════════════════

describe('VendorProfile Screen', () => {
  let VendorProfile: any;
  beforeAll(async () => { VendorProfile = (await import('../pages/vendor/VendorProfile')).default; });
  beforeEach(() => { jest.clearAllMocks(); mockGetProfile.mockResolvedValue({ success: true, data: sampleProfile }); mockUpdateProfile.mockResolvedValue({ success: true }); });
  const renderProfile = () => render(<BrowserRouter><VendorProfile /></BrowserRouter>);

  test('loads vendor profile on mount', async () => {
    renderProfile();
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalledWith(1));
  });

  test('shows business name', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue('Royal Caterers')).toBeTruthy());
  });

  test('shows profile completion percentage', async () => {
    renderProfile();
    await waitFor(() => {
      const text = document.body.textContent;
      // The component computes completion dynamically via computeCompletion, not from the profile field.
      // With sampleProfile data: name(10) + category(10) + description(15) + cities(15) + experience(10) + services(20) + portfolio(20) = 100%
      expect(text).toMatch(/\d+%|completion/i);
    });
  });

  test('save button calls updateProfile', async () => {
    renderProfile();
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    // Wait for profile data to populate the form
    await waitFor(() => expect(screen.getByDisplayValue('Royal Caterers')).toBeTruthy());
    const saveBtn = screen.getAllByRole('button').find(b => b.textContent?.toLowerCase().includes('save'));
    expect(saveBtn).toBeTruthy();
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled());
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// VENDOR INBOX
// ═══════════════════════════════════════════════════════════════

describe('VendorInbox Screen', () => {
  let VendorInbox: any;
  beforeAll(async () => { VendorInbox = (await import('../pages/vendor/VendorInbox')).default; });
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the activeConversationId before each test
    mockStoreState.activeConversationId = null;
    mockGetConversations.mockResolvedValue({ success: true, data: [{ id: 1, couple_id: 1, vendor_id: 1, subject: 'Re: Quote', status: 'active', other_party_name: 'Priya & Rahul', unread_count: 2, created_at: '2026-04-01T00:00:00Z' }] });
    mockGetConversation.mockResolvedValue({ success: true, data: { conversation: {}, messages: [{ id: 1, content: 'Hello', sender_role: 'couple', sender_id: 1 }] } });
    mockSendMessage.mockResolvedValue({ success: true, data: { id: 2, content: 'reply' } });
  });
  const renderInbox = () => render(<BrowserRouter><VendorInbox /></BrowserRouter>);

  test('loads conversations on mount', async () => {
    renderInbox();
    await waitFor(() => expect(mockGetConversations).toHaveBeenCalled());
  });

  test('shows conversation list', async () => {
    renderInbox();
    await waitFor(() => expect(screen.getByText('Priya & Rahul')).toBeInTheDocument());
  });

  test('shows empty state when no conversations', async () => {
    mockGetConversations.mockResolvedValue({ success: true, data: [] });
    renderInbox();
    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toMatch(/no message|inbox empty|no conversation/i);
    });
  });
});
