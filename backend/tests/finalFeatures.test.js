const { generateMonthCalendar, computeSecurityStock, applyCarryOver, computePerformanceSummary } = require('../src/services/advancedBusinessService');
const { authorize } = require('../src/middlewares/rbacMiddleware');

describe('Advanced business features', () => {
  test('generateMonthCalendar creates one row for each day of the month', () => {
    const rows = generateMonthCalendar({ entityType: 'pos', entityId: 'pos-1', objectiveMensuel: 600000, year: 2026, month: 8 });

    expect(rows).toHaveLength(31);
    // Verify date is in August 2026 (handle timezone offsets)
    const firstDate = new Date(rows[0].date);
    expect(firstDate.getUTCDate()).toBe(1);
    expect(firstDate.getUTCMonth()).toBe(7); // August = 7 (0-indexed)
    expect(firstDate.getUTCFullYear()).toBe(2026);
    expect(rows[0].stock_securite).toBeCloseTo((600000 / 31) * 3, 2);
  });

  test('computeSecurityStock and carryOver operate on the correct formula', () => {
    const stock = computeSecurityStock(600000, 31);
    const carried = applyCarryOver({ previousBalance: 5000, currentStock: stock });

    expect(stock).toBeCloseTo(58064.51612903226, 2);
    expect(carried).toBeGreaterThan(stock);
  });

  test('computePerformanceSummary returns forecast, realization and followUp totals', async () => {
    const summary = await computePerformanceSummary();

    expect(summary).toBeDefined();
    expect(summary.totalForecast).toBeDefined();
    expect(summary.totalRealization).toBeDefined();
    expect(summary.totalFollowUp).toBeDefined();
  });

  test('authorize denies access to unauthorized roles', () => {
    const req = { user: { role: 'manager' } };
    const res = {
      status: (code) => ({ json: () => ({ code }) })
    };
    const next = jest.fn();

    authorize('admin', 'chef_operationnel')(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
