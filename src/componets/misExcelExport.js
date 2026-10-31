import ExcelJS from 'exceljs';

export async function createMisWorkbook(headers, rows, totals, fromDate, toDate) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('OFF Govt MIS', { views: [{ state: 'frozen', ySplit: 4 }] });
  sheet.addRow(['OFF Govt. Portal MIS Report']);
  sheet.mergeCells('A1:P1');
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF123B73' } };
  sheet.addRow([`Date range: ${fromDate} to ${toDate} | Records: ${rows.length}`]);
  sheet.mergeCells('A2:P2');
  sheet.addRow([]);
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row.map((value, index) => {
    if (index >= 9) return value === '' || value === '-' || value == null ? null : Number.isFinite(Number(value)) ? Number(value) : String(value);
    return index === 0 ? value : String(value ?? '');
  }));
  sheet.addRow(totals);
  sheet.columns.forEach((column, index) => { column.width = [7,16,16,20,28,22,28,18,18,12,12,24,26,22,22,20][index]; });
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: 16 } };
  sheet.getRow(4).height = 32;
  for (const number of [4, sheet.rowCount]) {
    const row = sheet.getRow(number);
    row.font = { bold: true, color: { argb: number === 4 ? 'FFFFFFFF' : 'FF123B73' } };
    row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: number === 4 ? 'FF123B73' : 'FFDCECFF' } }; cell.alignment = { vertical: 'middle', wrapText: true }; });
  }
  for (let column = 10; column <= 16; column++) sheet.getColumn(column).numFmt = column === 16 ? '#,##0.00' : '#,##0';
  return workbook.xlsx.writeBuffer();
}

export async function downloadMisWorkbook(...args) {
  const buffer = await createMisWorkbook(...args);
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `MIS-Report_${args[3]}_to_${args[4]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
