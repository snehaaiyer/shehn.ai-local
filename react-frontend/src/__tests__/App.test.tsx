import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the store
jest.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    sidebarOpen: false,
    setSidebarOpen: jest.fn(),
    theme: 'light',
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    aside: 'aside',
    nav: 'nav',
  },
  AnimatePresence: ({ children }: any) => children,
}));

test('renders wedding planner app', () => {
  render(<App />);
  // The app should render without crashing
  expect(document.body).toBeInTheDocument();
});