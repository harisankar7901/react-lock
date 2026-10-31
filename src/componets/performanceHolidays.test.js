import test from 'node:test';
import assert from 'node:assert/strict';
import { performanceHolidayDays, withoutHolidayReports } from './performanceHolidays.js';

test('overlapping holiday and auto-disable dates are counted once and clipped to the filter', () => {
 const days = performanceHolidayDays([
  {operatorId:'OP1',fromDate:'2026-10-29',toDate:'2026-11-02'},
  {operatorId:'OP1',fromDate:'2026-10-30',toDate:'2026-10-30'}
 ],'2026-10-30','2026-11-01');
 assert.deepEqual([...days.get('OP1')], ['2026-10-30','2026-10-31']);
});
test('holiday reports do not inflate adjusted completion and Sunday uploads still count', () => {
 const days = performanceHolidayDays([{operatorId:'OP1',fromDate:'2026-10-30',toDate:'2026-11-01'}], '2026-10-01','2026-11-01');
 const rows = [
  {operatorId:'OP1',date:'30-Oct-2026'}, {operatorId:'OP1',date:'31-Oct-26'},
  {operatorId:'OP1',date:'2026-11-01'}, {operatorId:'OP2',date:'2026-10-30'}
 ];
 assert.deepEqual(withoutHolidayReports(rows,'date',days), rows.slice(2));
});
