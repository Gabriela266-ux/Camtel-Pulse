function calculateSecurityStock(monthlyGoal, daysCount = 31) {
  if (!Number.isFinite(Number(monthlyGoal)) || Number(monthlyGoal) <= 0) {
    return 0;
  }

  if (!Number.isFinite(Number(daysCount)) || Number(daysCount) <= 0) {
    return 0;
  }

  return (Number(monthlyGoal) / Number(daysCount)) * 3;
}

module.exports = {
  calculateSecurityStock
};
