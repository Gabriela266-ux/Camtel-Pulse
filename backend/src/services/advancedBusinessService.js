const { salesRecords, pos } = require('../data/seedData');

function computeSecurityStock(objectifMensuel, daysCount = 31) {
  if (!objectifMensuel || Number(objectifMensuel) <= 0) return 0;
  return (Number(objectifMensuel) / Number(daysCount || 31)) * 3;
}

function generateMonthCalendar({ entityType = 'pos', entityId, objectiveMensuel = 0, year = new Date().getFullYear(), month = new Date().getMonth() + 1 }) {
  const monthIndex = Number(month) - 1;
  const daysInMonth = new Date(Number(year), Number(monthIndex) + 1, 0).getDate();
  const stockBase = computeSecurityStock(objectiveMensuel, 31);

  const rows = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Number(year), monthIndex, day);
    rows.push({
      entityType,
      entityId,
      date: date.toISOString().slice(0, 10),
      jour: day,
      objectif_mensuel: Number(objectiveMensuel || 0),
      stock_securite: stockBase,
      vente_jour: 0,
      ecart_jour: 0,
      ecart_cumule: 0,
      statut: 'NORMAL'
    });
  }

  return rows;
}

function applyCarryOver({ previousBalance = 0, currentStock = 0 }) {
  return Number(previousBalance || 0) + Number(currentStock || 0);
}

function computePerformanceSummary() {
  const totalForecast = salesRecords.reduce((sum, record) => sum + Number(record.forecast || 0), 0);
  const totalRealization = salesRecords.reduce((sum, record) => sum + Number(record.realization || 0), 0);
  const totalFollowUp = salesRecords.reduce((sum, record) => sum + Number(record.followUp || 0), 0);

  return {
    totalForecast,
    totalRealization,
    totalFollowUp,
    averageCoverage: totalRealization > 0 ? (totalFollowUp / totalRealization) * 100 : 0,
    countPos: pos.length
  };
}

module.exports = {
  computeSecurityStock,
  generateMonthCalendar,
  applyCarryOver,
  computePerformanceSummary
};
