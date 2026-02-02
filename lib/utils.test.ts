import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
  it('merges multiple class names', () => {
    const result = cn('class-1', 'class-2', 'class-3');
    expect(result).toContain('class-1');
    expect(result).toContain('class-2');
    expect(result).toContain('class-3');
  });

  it('handles conditional classes', () => {
    const result = cn('always', true && 'conditional', false && 'excluded');
    expect(result).toContain('always');
    expect(result).toContain('conditional');
    expect(result).not.toContain('excluded');
  });

  it('merges tailwind classes correctly', () => {
    // When conflicting Tailwind classes are provided, the last one should win
    const result = cn('p-4', 'p-8');
    expect(result).toContain('p-8');
    expect(result).not.toContain('p-4');
  });

  it('handles arrays of classes', () => {
    const result = cn(['class-1', 'class-2']);
    expect(result).toContain('class-1');
    expect(result).toContain('class-2');
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles undefined and null values', () => {
    const result = cn('valid', undefined, null, 'also-valid');
    expect(result).toContain('valid');
    expect(result).toContain('also-valid');
  });

  it('handles complex Tailwind class conflicts', () => {
    const result = cn('text-red-500', 'text-blue-600');
    expect(result).toContain('text-blue-600');
    expect(result).not.toContain('text-red-500');
  });
});
