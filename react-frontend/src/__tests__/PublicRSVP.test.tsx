import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicRSVP from '../pages/PublicRSVP';

jest.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (p: any) => <svg data-testid={`icon-${String(name).toLowerCase()}`} {...p} /> }));
jest.mock('framer-motion', () => ({ motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> } }));

jest.mock('../services/rsvp_service', () => ({
  RSVPService: { getPublicEventDetails: jest.fn(), submitRSVP: jest.fn() },
}));

import { RSVPService } from '../services/rsvp_service';
const mockGetDetails = RSVPService.getPublicEventDetails as jest.Mock;
const mockSubmitRSVP = RSVPService.submitRSVP as jest.Mock;

const sampleEvent = {
  id: 1,
  title: 'Mehendi Ceremony',
  event_date: '2026-12-13',
  event_time: '15:00',
  end_time: '19:00',
  venue_name: 'Grand Ballroom',
  venue_address: 'Mumbai',
  dress_code: 'Traditional',
  meal_included: true,
};

const renderPage = (code = 'ABCD1234') =>
  render(
    <MemoryRouter initialEntries={[`/rsvp/${code}`]}>
      <Routes>
        <Route path="/rsvp/:inviteCode" element={<PublicRSVP />} />
      </Routes>
    </MemoryRouter>
  );

describe('PublicRSVP Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDetails.mockResolvedValue({ success: true, data: sampleEvent });
    mockSubmitRSVP.mockResolvedValue({ success: true });
  });

  test('shows spinner while loading event details', () => {
    mockGetDetails.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('fetches event details with invite code from URL', async () => {
    renderPage('TESTCODE');
    await waitFor(() => expect(mockGetDetails).toHaveBeenCalledWith('TESTCODE'));
  });

  test('displays event title after loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Mehendi Ceremony')).toBeInTheDocument());
  });

  test('displays venue details', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Grand Ballroom/)).toBeInTheDocument());
  });

  test('displays dress code', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Traditional')).toBeInTheDocument());
  });

  test('RSVP form shows name input', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Your Name/)).toBeInTheDocument();
    });
  });

  test('RSVP form shows attendance options', async () => {
    renderPage();
    await waitFor(() => {
      // Radio buttons or select for yes/no/maybe
      expect(screen.getByText(/Yes/i) || screen.getByText(/Attending/i)).toBeTruthy();
    });
  });

  test('submitting RSVP calls submitRSVP service', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Mehendi Ceremony'));

    // Fill name — the input is the first text input in the form (label "Your Name *")
    const textInputs = screen.getAllByRole('textbox');
    const nameInput = textInputs[0];
    fireEvent.change(nameInput, { target: { value: 'Anika Sharma' } });

    // Click attending "Yes" if available
    const yesOption = screen.queryByText('Yes') || screen.queryByText('Attending');
    if (yesOption) fireEvent.click(yesOption);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /confirm rsvp/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(mockSubmitRSVP).toHaveBeenCalled());
  });

  test('shows error state for invalid invite code', async () => {
    mockGetDetails.mockResolvedValue({ success: false, error: 'Invalid invite code' });
    renderPage('BADCODE');
    await waitFor(() => {
      const errorText = screen.queryByText(/invalid/i) || screen.queryByText(/not found/i) || screen.queryByText(/expired/i);
      expect(errorText).toBeTruthy();
    });
  });

  test('shows success message after RSVP submission', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Mehendi Ceremony'));

    const textInputs = screen.getAllByRole('textbox');
    const nameInput = textInputs[0];
    fireEvent.change(nameInput, { target: { value: 'Anika' } });

    const submitBtn = screen.getByRole('button', { name: /confirm rsvp/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
  });
});
