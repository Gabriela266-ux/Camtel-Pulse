const { calculateSecurityStock, buildOrganizationTree } = require('../src/utils/business');

describe('Business rules', () => {
  test('calculateSecurityStock uses the reference formula', () => {
    const value = calculateSecurityStock(3000000, 31);

    expect(value).toBeCloseTo(290322.58, 2);
  });

  test('buildOrganizationTree groups Centre, DA, DSM and POS in a realistic hierarchy', () => {
    const tree = buildOrganizationTree();

    expect(tree.length).toBeGreaterThan(0);
    expect(tree[0].clients.length).toBe(2);
    expect(tree[0].clients[0].dsms.length).toBeGreaterThan(0);
    expect(tree[0].clients[0].dsms[0].pos.length).toBeGreaterThan(0);
  });
});
