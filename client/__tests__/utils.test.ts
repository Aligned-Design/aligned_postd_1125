import { describe, it, expect } from 'vitest';

// Utility function tests
describe('String Utilities', () => {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const truncate = (str: string, length: number) => str.length > length ? str.slice(0, length) + '...' : str;

  describe('capitalize', () => {
    it('should capitalize first character', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should not affect already capitalized string', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('should handle numbers in string', () => {
      expect(capitalize('123abc')).toBe('123abc');
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello @#$% World!')).toBe('hello--world');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('should preserve hyphens', () => {
      expect(slugify('hello-world')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('should truncate string longer than limit', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate string shorter than limit', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle zero length', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });
  });
});

describe('Number Utilities', () => {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  describe('formatCurrency', () => {
    it('should format positive numbers', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers', () => {
      expect(formatCurrency(-5.5)).toBe('$-5.50');
    });

    it('should format large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1000000.00');
    });
  });

  describe('formatPercent', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercent(0.5)).toBe('50.0%');
    });

    it('should format zero percent', () => {
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('should format 100 percent', () => {
      expect(formatPercent(1)).toBe('100.0%');
    });

    it('should format negative percentages', () => {
      expect(formatPercent(-0.25)).toBe('-25.0%');
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp value below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp value above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle floating point values', () => {
      expect(clamp(5.5, 0, 10)).toBe(5.5);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-15, -20, -10)).toBe(-15);
    });
  });
});

describe('Array Utilities', () => {
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const unique = <T,>(arr: T[]): T[] => [...new Set(arr)];
  const flatten = (arr: unknown[]): unknown[] => arr.reduce<unknown[]>((acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);

  describe('chunk', () => {
    it('should chunk array into specified size', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 2)).toEqual([]);
    });

    it('should handle chunk size larger than array', () => {
      expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    });

    it('should handle size of 1', () => {
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should handle no duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should work with strings', () => {
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      expect(flatten([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle empty array', () => {
      expect(flatten([])).toEqual([]);
    });

    it('should handle flat array', () => {
      expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle deeply nested arrays', () => {
      expect(flatten([[[1]], [[2]], [[3]]])).toEqual([1, 2, 3]);
    });
  });
});

describe('Object Utilities', () => {
  const pick = <T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> => {
    const result: Partial<T> = {};
    keys.forEach(key => {
      if (key in obj) result[key as keyof T] = obj[key as keyof T];
    });
    return result;
  };

  const omit = <T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> => {
    const result = { ...obj };
    keys.forEach(key => delete result[key as keyof T]);
    return result;
  };

  const merge = <T extends Record<string, unknown>, U extends Record<string, unknown>>(obj1: T, obj2: U): T & U => ({ ...obj1, ...obj2 });

  describe('pick', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle missing keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1 });
    });

    it('should handle empty keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, [])).toEqual({});
    });
  });

  describe('omit', () => {
    it('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(omit(obj, ['c'])).toEqual({ a: 1, b: 2 });
    });

    it('should handle empty omit array', () => {
      const obj = { a: 1, b: 2 };
      expect(omit(obj, [])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('merge', () => {
    it('should merge two objects', () => {
      expect(merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('should override values from first object', () => {
      expect(merge({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should handle empty objects', () => {
      expect(merge({}, { a: 1 })).toEqual({ a: 1 });
    });
  });
});

describe('Validation Utilities', () => {
  const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhone = (phone: string) => /^\d{3}-\d{3}-\d{4}$/.test(phone);
  const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

  describe('isEmail', () => {
    it('should validate correct email', () => {
      expect(isEmail('test@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(isEmail('testexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isEmail('test@')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isEmail('')).toBe(false);
    });
  });

  describe('isPhone', () => {
    it('should validate correct phone format', () => {
      expect(isPhone('123-456-7890')).toBe(true);
    });

    it('should reject phone without hyphens', () => {
      expect(isPhone('1234567890')).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(isPhone('123-45-6789')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should identify empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
    });

    it('should identify non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });
});
