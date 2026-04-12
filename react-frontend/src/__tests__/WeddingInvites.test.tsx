import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WeddingInvites from '../pages/WeddingInvites';

jest.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (p: any) => <svg data-testid={`icon-${String(name).toLowerCase()}`} {...p} /> }));
jest.mock('framer-motion', () => ({ motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div>, form: ({ children, onSubmit, className, ...p }: any) => <form onSubmit={onSubmit} className={className}>{children}</form> }, AnimatePresence: ({ children }: any) => <div>{children}</div> }));

const mockStoreState: any = { currentUserId: 1 };
jest.mock('../store/useAppStore', () => ({ useAppStore: (s: any) => s(mockStoreState) }));
jest.mock('../services/rsvp_service', () => ({ RSVPService: { getEvents: jest.fn(), createEvent: jest.fn(), generateInviteLink: jest.fn(), getRSVPResponses: jest.fn() } }));

import { RSVPService } from '../services/rsvp_service';
const mockGetEvents = RSVPService.getEvents as jest.Mock;
const mockCreateEvent = RSVPService.createEvent as jest.Mock;
const mockGenerateInvite = RSVPService.generateInviteLink as jest.Mock;
const mockGetResponses = RSVPService.getRSVPResponses as jest.Mock;

const sampleEvents = [
  { id: 1, couple_id: 1, title: 'Mehendi Ceremony', event_date: '2026-12-13', event_time: '15:00', end_time: '19:00', venue_name: 'Grand Ballroom', venue_address: 'Mumbai', dress_code: 'Traditional', meal_included: true },
];

const renderPage = () => render(<BrowserRouter><WeddingInvites /></BrowserRouter>);

describe('WeddingInvites Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEvents.mockResolvedValue({ success: true, data: sampleEvents });
    mockGetResponses.mockResolvedValue({ success: true, data: { responses: [], stats: { total: 0, yes: 0, no: 0, maybe: 0 } } });
  });

  test('shows spinner while loading', () => {
    mockGetEvents.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders three tabs: Events, Invite Links, RSVP Tracker', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Invite Links')).toBeInTheDocument();
      expect(screen.getByText('RSVP Tracker')).toBeInTheDocument();
    });
  });

  test('shows event cards after loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Mehendi Ceremony')).toBeInTheDocument());
  });

  test('shows venue info on event card', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Grand Ballroom/)).toBeInTheDocument());
  });

  test('"Create Event" button opens form', async () => {
    renderPage();
    await waitFor(() => screen.getByText(/Create Event/));
    fireEvent.click(screen.getByText(/Create Event/));
    expect(screen.getByPlaceholderText('Event title')).toBeInTheDocument();
  });

  test('submitting new event calls RSVPService.createEvent', async () => {
    mockCreateEvent.mockResolvedValue({ success: true, data: { id: 2, title: 'Reception' } });
    renderPage();
    await waitFor(() => screen.getByText(/Create Event/));
    fireEvent.click(screen.getByText(/Create Event/));

    // Fill required form fields
    fireEvent.change(screen.getByPlaceholderText('Event title'), { target: { value: 'Reception' } });
    fireEvent.change(screen.getByPlaceholderText('Venue name'), { target: { value: 'Beach Resort' } });

    // Fill date and time inputs (type=date and type=time)
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2026-12-20' } });
    if (timeInput) fireEvent.change(timeInput, { target: { value: '18:00' } });

    // Click Save Event
    fireEvent.click(screen.getByText('Save Event'));

    await waitFor(() => expect(mockCreateEvent).toHaveBeenCalled());
  });

  test('switching to Invite Links tab shows invites section', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Invite Links'));
    fireEvent.click(screen.getByText('Invite Links'));
    await waitFor(() => expect(screen.getByText(/Generate/i) || screen.getByText(/invite/i)).toBeTruthy());
  });

  test('switching to RSVP Tracker tab shows response stats', async () => {
    renderPage();
    await waitFor(() => screen.getByText('RSVP Tracker'));
    fireEvent.click(screen.getByText('RSVP Tracker'));
    await waitFor(() => expect(mockGetResponses).toHaveBeenCalled());
  });
});
