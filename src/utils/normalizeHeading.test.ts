import { normalizeHeading } from './normalizeHeading';

describe('normalizeHeading', () => {
  it('converts negative degrees to positive within 0-360', () => {
    expect(normalizeHeading(-10)).toBe(350);
  });

  it('wraps values greater than 360', () => {
    expect(normalizeHeading(370)).toBe(10);
  });
});
