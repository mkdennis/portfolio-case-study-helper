import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders text input by default', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    
    expect(input).toBeInTheDocument();
  });

  it('handles onChange events', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays value correctly', () => {
    render(<Input value="test value" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    expect(input.value).toBe('test value');
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = document.querySelector('input[type="password"]')!;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveClass('custom-input');
  });

  it('has data-slot attribute', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('handles aria-invalid attribute', () => {
    render(<Input aria-invalid="true" />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
