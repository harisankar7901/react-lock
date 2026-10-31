const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function dayKey(value) {
  const raw = String(value || '').trim();
  const match = /^(\d{1,2})-([a-z]{3})-(\d{2}|\d{4})$/i.exec(raw);
  if (!match) return raw;
  const month = months.indexOf(match[2].toLowerCase()) + 1;
  return `${match[3].length === 2 ? '20' : ''}${match[3]}-${String(month).padStart(2,'0')}-${match[1].padStart(2,'0')}`;
}
export function performanceHolidayDays(ranges, fromDate, toDate) {
  const result = new Map();
  for (const range of ranges) {
    const start = range.fromDate < fromDate ? fromDate : range.fromDate;
    const end = range.toDate > toDate ? toDate : range.toDate;
    const days = result.get(range.operatorId) || new Set();
    for (const date = new Date(start + 'T00:00:00Z'); date <= new Date(end + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate()+1)) {
      // Sundays are already excluded from expected days; their uploads still count.
      if (date.getUTCDay() !== 0) days.add(date.toISOString().slice(0,10));
    }
    result.set(range.operatorId, days);
  }
  return result;
}
export function withoutHolidayReports(records, dateField, holidays) {
  return records.filter(record => !holidays.get(String(record.operatorId || '').trim())?.has(dayKey(record[dateField])));
}
