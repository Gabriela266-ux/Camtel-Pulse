const { calculateSecurityStock } = require('../src/utils/business');

describe('Business rules', () => {
  test('calculateSecurityStock uses the reference formula', () => {
    const value = calculateSecurityStock(3000000, 31);

    expect(value).toBeCloseTo(290322.58, 2);
  });

  test('calculateSecurityStock returns 0 for non-positive or invalid inputs', () => {
    expect(calculateSecurityStock(0, 31)).toBe(0);
    expect(calculateSecurityStock(-5, 31)).toBe(0);
    expect(calculateSecurityStock(1000, 0)).toBe(0);
  });
});
