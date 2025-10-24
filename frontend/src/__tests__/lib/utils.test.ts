import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'excluded');
    expect(result).toBe('base conditional');
  });

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // twMerge should keep only px-4 (the later value)
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles null and undefined', () => {
    const result = cn('valid', null, undefined, 'also-valid');
    expect(result).toBe('valid also-valid');
  });

  it('handles arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles objects with conditional classes', () => {
    const result = cn({
      base: true,
      active: true,
      disabled: false,
    });
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });

  it('handles duplicate classes', () => {
    const result = cn('duplicate', 'duplicate', 'unique');
    // clsx doesn't deduplicate by default, just combines
    expect(result).toContain('duplicate');
    expect(result).toContain('unique');
  });

  it('resolves conflicting Tailwind utilities', () => {
    const result = cn('text-red-500', 'text-blue-500');
    // Should only contain the last color class
    expect(result).toBe('text-blue-500');
  });
});
