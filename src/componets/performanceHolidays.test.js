import {zeroDataDays} from './performanceHolidays.js';
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

test('zero data deduplicates operator days and includes disabled Sundays only within range',()=>{
 const days=zeroDataDays([{operatorId:'OP1',reportDate:'2026-11-08'},{operatorId:'OP1',reportDate:'2026-11-08'},{operatorId:'OP1',reportDate:'2026-11-09'},{operatorId:'OP2',reportDate:'2026-11-07'}],'2026-11-08','2026-11-14');
 assert.equal(days.get('OP1').size,2);assert.equal(days.has('OP2'),false);
});

test('Leaves includes only marked holiday dates while compliance excludes their union with zero data',()=>{
 const leaves=[{operatorId:'OP1',fromDate:'2026-11-08',toDate:'2026-11-09'}];
 const zero=[{operatorId:'OP1',fromDate:'2026-11-09',toDate:'2026-11-10'}];
 assert.deepEqual([...performanceHolidayDays(leaves,'2026-11-08','2026-11-14',true).get('OP1')],['2026-11-08','2026-11-09']);
 assert.deepEqual([...performanceHolidayDays([...leaves,...zero],'2026-11-08','2026-11-14').get('OP1')],['2026-11-09','2026-11-10']);
});
