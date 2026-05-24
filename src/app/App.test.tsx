import { render, screen } from '@testing-library/react';

import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders the game page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Emoji Title Game' }),
    ).toBeInTheDocument();
  });

  it('renders the translator page from the hash route', () => {
    window.history.replaceState(null, '', '/#translator');

    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Emoji Translator' }),
    ).toBeInTheDocument();
  });
});
