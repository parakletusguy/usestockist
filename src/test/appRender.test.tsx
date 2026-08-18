import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';

describe('App Root Render QA', () => {
  it('renders App root without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
