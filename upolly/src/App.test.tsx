import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders UPolly app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/UPolly/i);
  expect(titleElement).toBeInTheDocument();
});
