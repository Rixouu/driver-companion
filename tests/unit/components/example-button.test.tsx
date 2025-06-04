import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Placeholder component - replace with a real one
function ExampleButton({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>;
}

describe('ExampleButton', () => {
  it('renders correctly', () => {
    render(<ExampleButton>Click Me</ExampleButton>);
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
  });
}); 