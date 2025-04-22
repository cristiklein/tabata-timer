import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Start button', () => {
  render(<App />);
  const linkElement = screen.getByText(/Start/);
  expect(linkElement).toBeInTheDocument();
});
