import ExcelJS from 'exceljs';

export async function createManagementWorkbook({ title, subtitle, columns, rows, totals }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Report', { views: [{ state: 'frozen', ySplit: 4 }] });
  sheet.addRow([title]);
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF123B73' } };
  sheet.addRow([subtitle]);
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.addRow([]);
  sheet.addRow(columns.map(column => column.title));
  rows.forEach(row => sheet.addRow(row));
  if (totals) sheet.addRow(totals);
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width || 22;
    if (column.format) sheet.getColumn(index + 1).numFmt = column.format;
  });
  for (const rowNumber of totals ? [4, sheet.rowCount] : [4]) {
    const row = sheet.getRow(rowNumber);
    row.height = 32;
    row.font = { bold: true, color: { argb: rowNumber === 4 ? 'FFFFFFFF' : 'FF123B73' } };
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowNumber === 4 ? 'FF123B73' : 'FFDCECFF' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  }
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: columns.length } };
  return workbook.xlsx.writeBuffer();
}

export function performanceExportOptions(rows, totals, fromDate, toDate) {
  const values = row => [String(row.name || '-').toUpperCase(), row.totalOperators, row.dataCollected, row.totalCollection, row.offGovtMisCount, row.eodMisCount, row.holidayDays, row.expectedDays ? row.eligibleReports / (2 * row.expectedDays) : 'N/A'];
  return {
    title: 'District Manager Performance Report', subtitle: `Date range: ${fromDate} to ${toDate} | Managers: ${rows.length}`,
    columns: [
      { title: 'Dist Manager Name', width: 32 }, { title: 'Total Operator' }, { title: 'Total Data' },
      { title: 'Total Collection', format: '#,##0.00' }, { title: 'OFF Govt. Portal MIS', width: 26 },
      { title: 'EOD MIS Report' }, { title: 'Holiday Days' }, { title: '% of Compliance', format: '0.00%' }
 ], rows: rows.map(values), totals: values({ ...totals, name: 'Grand Total' })
  };
}

export function autoLockExportOptions(rows, reportDate, search) {
  return {
    title: 'Manage Auto Lock', subtitle: `Report date: ${reportDate} | Operator search: ${search || 'All'} | Devices: ${rows.length}`,
    columns: [{title:'Sl#',width:8},{title:'Laptop Name',width:28},{title:'Operator ID'},{title:'Operator Name',width:30},{title:'Dist. Manager Name',width:30},{title:'Missing Report',width:26},{title:'Auto Lock',width:26}],
    rows: rows.map((row,index) => [index+1, String(row.laptopName || '-'), String(row.operatorId ?? ''), String(row.operatorName || '-'), String(row.distCoordinatorName || '-'), row.missingOffGovtMis && row.missingEodMis ? 'OFF MIS and EOD MIS' : row.missingOffGovtMis ? 'OFF MIS' : 'EOD MIS', row.isAutoLockDisabled ? 'Disabled for this date' : 'Enabled'])
  };
}

export async function downloadManagementWorkbook(options, filename) {
  const data = await createManagementWorkbook(options);
  const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
