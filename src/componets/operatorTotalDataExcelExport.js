import ExcelJS from 'exceljs';
const fields = ['newCount', 'mandatoryFree', 'biometric', 'demography', 'total', 'collection'];
export async function createOperatorTotalDataWorkbook(rows, range, manager = '', search = '') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Operator Total Data', { views: [{ state: 'frozen', ySplit: 4 }] });
  sheet.addRow(['Operator Total Data']); sheet.mergeCells('A1:H1');
  sheet.addRow(['Report dates: ' + range.fromDate + ' to ' + range.toDate + ' (IST)']); sheet.mergeCells('A2:H2');
  sheet.addRow(['District Manager: ' + (manager || 'All') + ' | Operator search: ' + (search || 'All')]); sheet.mergeCells('A3:H3');
  sheet.addRow(['Operator Name', 'Dist Manager Name', 'New', 'Mandatory Free', 'Biometric', 'Demography', 'Total Data (EOD)', 'Total Collection (INR)']);
  const totals = fields.map(() => 0);
  for (const row of rows) {
    const values = fields.map((field, index) => {
      const value = Number(row[field]); const safe = Number.isFinite(value) ? value : 0;
      totals[index] += safe; return safe;
    });
    sheet.addRow([String(row.name || ''), String(row.manager || ''), ...values]);
  }
  sheet.addRow(['Grand Total', '', ...totals]); sheet.mergeCells('A' + sheet.rowCount + ':B' + sheet.rowCount);
  sheet.columns.forEach((column, index) => { column.width = [32, 32, 12, 18, 16, 16, 20, 24][index]; });
  for (let index = 3; index <= 8; index++) sheet.getColumn(index).numFmt = index === 8 ? '#,##0.00' : '#,##0';
  for (const index of [1, 4, sheet.rowCount]) {
    const row = sheet.getRow(index); row.height = 30;
    row.font = { bold: true, color: { argb: index === 4 ? 'FFFFFFFF' : 'FF183653' } };
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index === 4 ? 'FF224F7D' : 'FFDFEBF6' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  }
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: 8 } };
  return workbook.xlsx.writeBuffer();
}
export async function downloadOperatorTotalData(rows, range, manager, search) {
  const buffer = await createOperatorTotalDataWorkbook(rows, range, manager, search);
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a'); link.href = url;
  link.download = 'Operator-Total-Data_' + range.fromDate + '_to_' + range.toDate + '.xlsx';
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
