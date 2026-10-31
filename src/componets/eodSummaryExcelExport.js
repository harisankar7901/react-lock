import ExcelJS from 'exceljs';

const numericFields = ['newCount', 'mandatoryFree', 'mandatoryPayable', 'biometric', 'demography', 'totalData', 'totalAmountCharged'];
export async function createEodSummaryWorkbook(rows, search = {}, matchFilter = 'all') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('EOD MIS Summary', { views: [{ state: 'frozen', ySplit: 4 }] });
    sheet.addRow(['EOD MIS Report summary']);
    sheet.mergeCells('A1:L1');
    sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF123B73' } };
    sheet.addRow([`Date range: ${search.fromDate || 'All'} to ${search.toDate || 'All'} | Match: ${matchFilter} | Records: ${rows.length}`]);
    sheet.mergeCells('A2:L2');
    sheet.addRow([]);
    sheet.addRow(['SL Number', 'DATE', 'OPERATOR_ID', 'Operator Name', 'NEW', 'MANDATORY FREE', 'MANDATORY PAYBLE', 'BIOMETRIC', 'DEMOGRAPHY', 'TOTAL DATA', 'TOTAL_AMOUNT_CHARGED', 'Match']);
    const totals = numericFields.map(() => 0);
    rows.forEach((row, index) => {
        const numbers = numericFields.map((field, i) => {
            const number = Number(row[field]);
            const value = Number.isFinite(number) ? number : 0;
            totals[i] += value;
            return value;
        });
        sheet.addRow([index + 1, String(row.date || '').split('-').reverse().join('/'), String(row.operatorId ?? ''), String(row.operatorName ?? ''), ...numbers, row.match === true ? 'Matched' : 'Unmatched']);
    });
    sheet.addRow(['Cumulative Total', '', '', '', ...totals, '']);
    sheet.mergeCells(`A${sheet.rowCount}:D${sheet.rowCount}`);
    sheet.columns.forEach((column, index) => { column.width = [12,16,20,30,12,20,22,16,18,16,28,16][index]; });
    for (let column = 5; column <= 11; column++) sheet.getColumn(column).numFmt = column === 11 ? '#,##0.00' : '#,##0';
    for (const number of [4, sheet.rowCount]) {
        const row = sheet.getRow(number);
        row.height = 32;
        row.font = { bold: true, color: { argb: number === 4 ? 'FFFFFFFF' : 'FF123B73' } };
        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: number === 4 ? 'FF123B73' : 'FFDCECFF' } };
            cell.alignment = { vertical: 'middle', wrapText: true };
        });
    }
    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: 12 } };
    const invalid = rows.reduce((sum, row) => sum + (Number(row.invalidAmountCount) || 0), 0);
    if (invalid) sheet.addRow([`${invalid} records have missing or invalid amounts; included in Total Data but excluded from amount totals.`]);
    return workbook.xlsx.writeBuffer();
}

export async function downloadEodSummary(rows, search, matchFilter) {
    const data = await createEodSummaryWorkbook(rows, search, matchFilter);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `EOD-MIS-Summary_${search?.fromDate || 'all'}_to_${search?.toDate || 'all'}_${matchFilter}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
