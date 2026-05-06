import { describe, it, expect } from 'vitest';
import { normalizeRow } from './products';

describe('normalizeRow — tags', () => {
  it('splits comma-separated tags string into array', () => {
    const row = { title: 'Test', brand: 'Osprey', tags: 'backpacking,lightweight,hiking' };
    expect(normalizeRow(row).tags).toEqual(['backpacking', 'lightweight', 'hiking']);
  });

  it('handles already-array tags, converting elements to strings', () => {
    const row = { title: 'Test', brand: 'Osprey', tags: ['a', 'b'] };
    expect(normalizeRow(row).tags).toEqual(['a', 'b']);
  });

  it('handles numeric array elements by stringifying', () => {
    const row = { title: 'Test', brand: 'Osprey', tags: [1, 2, 3] };
    expect(normalizeRow(row).tags).toEqual(['1', '2', '3']);
  });

  it('handles null tag in array', () => {
    const row = { title: 'Test', brand: 'Osprey', tags: ['a', null, 'b'] };
    expect(normalizeRow(row).tags).toEqual(['a', 'b']);
  });

  it('handles missing tags', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey' }).tags).toEqual([]);
  });

  it('handles empty string tags', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', tags: '' }).tags).toEqual([]);
  });

  it('handles whitespace-only tags', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', tags: '  ,  ,  ' }).tags).toEqual([]);
  });

  it('trims whitespace around tag values', () => {
    const row = { title: 'Test', brand: 'Osprey', tags: '  hiking , camping  ' };
    expect(normalizeRow(row).tags).toEqual(['hiking', 'camping']);
  });

  it('handles non-string non-array tags gracefully', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', tags: 123 }).tags).toEqual([]);
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', tags: true }).tags).toEqual([]);
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', tags: null }).tags).toEqual([]);
  });
});

describe('normalizeRow — price', () => {
  it('converts price number to string', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: 269.95 }).price).toBe('269.95');
  });

  it('converts price integer to string', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: 100 }).price).toBe('100');
  });

  it('handles price as string', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: '269.95' }).price).toBe('269.95');
  });

  it('handles price zero', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: 0 }).price).toBe('0');
  });

  it('returns null for object price (invalid)', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: { foo: 'bar' } }).price).toBeNull();
  });

  it('returns null for null price', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: null }).price).toBeNull();
  });

  it('returns null for undefined price', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey' }).price).toBeNull();
  });
});

describe('normalizeRow — originalPrice', () => {
  it('uses originalPrice when provided', () => {
    const r = normalizeRow({ title: 'Test', brand: 'Osprey', price: 200, originalPrice: 340 });
    expect(r.originalPrice).toBe('340');
    expect(r.price).toBe('200');
  });

  it('falls back to price when originalPrice missing', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: 200 }).originalPrice).toBe('200');
  });

  it('is null when both missing', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey' }).originalPrice).toBeNull();
  });

  it('handles zero originalPrice', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', price: 100, originalPrice: 0 }).originalPrice).toBe('0');
  });
});

describe('normalizeRow — URLs', () => {
  it('accepts https URL', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', sourceUrl: 'https://example.com' }).sourceUrl)
      .toBe('https://example.com');
  });

  it('accepts http URL', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', imageUrl: 'http://example.com/img.jpg' }).imageUrl)
      .toBe('http://example.com/img.jpg');
  });

  it('rejects javascript: URL', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', sourceUrl: 'javascript:alert(1)' }).sourceUrl)
      .toBeNull();
  });

  it('rejects arbitrary string as URL', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', imageUrl: 'not-a-url' }).imageUrl)
      .toBeNull();
  });

  it('rejects empty URL string', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', sourceUrl: '' }).sourceUrl).toBeNull();
  });
});

describe('normalizeRow — status', () => {
  it('defaults to active', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey' }).status).toBe('active');
  });

  it('accepts inactive', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', status: 'inactive' }).status).toBe('inactive');
  });

  it('rejects invalid status, defaults to active', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', status: 'deleted' }).status).toBe('active');
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', status: '' }).status).toBe('active');
  });
});

describe('normalizeRow — defaults', () => {
  it('defaults currency to CNY', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey' }).currency).toBe('CNY');
  });

  it('preserves provided currency', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', currency: 'USD' }).currency).toBe('USD');
  });

  it('defaults empty currency string to CNY', () => {
    expect(normalizeRow({ title: 'Test', brand: 'Osprey', currency: '' }).currency).toBe('CNY');
  });

  it('nullifies empty string for category/spec/country/source', () => {
    const r = normalizeRow({ title: 'Test', brand: 'Osprey', category: '', spec: '', country: '', source: '' });
    expect(r.category).toBeNull();
    expect(r.spec).toBeNull();
    expect(r.country).toBeNull();
    expect(r.source).toBeNull();
  });
});

describe('normalizeRow — immutability', () => {
  it('does not mutate the input row', () => {
    const row = { title: 'Test', brand: 'Osprey', tags: 'a,b', price: 100 };
    const frozen = { ...row };
    normalizeRow(row);
    expect(row).toEqual(frozen);
  });
});

describe('normalizeRow — full Excel row', () => {
  it('handles a complete row with all fields', () => {
    const row = {
      title: 'Osprey Atmos AG 65',
      brand: 'Osprey',
      category: 'Backpack',
      spec: '65L',
      price: 269.95,
      originalPrice: 340,
      currency: 'USD',
      source: 'REI',
      sourceUrl: 'https://www.rei.com/example',
      imageUrl: 'https://example.com/img.jpg',
      country: 'US',
      tags: 'backpacking,lightweight',
      status: 'active',
    };
    expect(normalizeRow(row)).toEqual({
      title: 'Osprey Atmos AG 65',
      brand: 'Osprey',
      category: 'Backpack',
      spec: '65L',
      price: '269.95',
      originalPrice: '340',
      currency: 'USD',
      source: 'REI',
      sourceUrl: 'https://www.rei.com/example',
      imageUrl: 'https://example.com/img.jpg',
      country: 'US',
      tags: ['backpacking', 'lightweight'],
      status: 'active',
    });
  });

  it('handles row with invalid URLs', () => {
    const r = normalizeRow({
      title: 'Test',
      brand: 'Test',
      sourceUrl: 'javascript:void(0)',
      imageUrl: 'evil',
      tags: '',
    });
    expect(r.sourceUrl).toBeNull();
    expect(r.imageUrl).toBeNull();
    expect(r.tags).toEqual([]);
  });
});
