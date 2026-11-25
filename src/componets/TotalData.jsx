import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/api.js';
import './TotalData.css';

const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const number = value => Number(value) || 0;
const display = value => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function TotalData({ onClose }) {
  const [range, setRange] = useState(() => ({ fromDate: todayIST(), toDate: todayIST() }));
  const [query, setQuery] = useState(range);
  const [rows, setRows] = useState([]);
  const [manager, setManager] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRows([]);
    Promise.all([
      api.get('devices', { params: { reportView: true }, signal: controller.signal }),
      api.get('devices/reports/zip-enrolment-summary', { params: query, signal: controller.signal })
    ]).then(([devices, summary]) => {
      if (controller.signal.aborted) return;
      const operators = new Map();
      for (const device of devices.data?.data || []) {
        const id = String(device.operatorId || '').trim();
        if (!id || device.isActive === false || device.replacedByDeviceId || operators.has(id)) continue;
        operators.set(id, { id, name: device.operatorName || id, manager: device.distCoordinatorName || '—', newCount: 0, mandatoryFree: 0, biometric: 0, demography: 0, total: 0, collection: 0 });
      }
      for (const record of summary.data?.data || []) {
        const row = operators.get(String(record.operatorId || '').trim());
        if (!row) continue;
        row.newCount += number(record.newCount);
        row.mandatoryFree += number(record.mandatoryFree);
        row.biometric += number(record.biometric);
        row.demography += number(record.demography);
        row.total += number(record.totalData);
        row.collection += number(record.totalAmountCharged);
      }
      setRows([...operators.values()].sort((a, b) => a.manager.localeCompare(b.manager) || a.name.localeCompare(b.name)));
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.response?.data?.message || 'Unable to load Total Data. Please try again.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  const managers = useMemo(() => [...new Set(rows.map(row => row.manager))].sort((a, b) => a.localeCompare(b)), [rows]);
  const filteredRows = useMemo(() => {
    const term = operatorSearch.trim().toLowerCase();
    return rows.filter(row => (!manager || row.manager === manager) && (!term || row.name.toLowerCase().includes(term) || row.id.toLowerCase().includes(term)));
  }, [rows, manager, operatorSearch]);
  const totals = useMemo(() => filteredRows.reduce((sum, row) => ({ newCount: sum.newCount + row.newCount, mandatoryFree: sum.mandatoryFree + row.mandatoryFree, biometric: sum.biometric + row.biometric, demography: sum.demography + row.demography, total: sum.total + row.total, collection: sum.collection + row.collection }), { newCount: 0, mandatoryFree: 0, biometric: 0, demography: 0, total: 0, collection: 0 }), [filteredRows]);
  const downloadExcel = async () => {
    if (loading || downloading || error || !filteredRows.length) return;
    setDownloading(true); setExportError('');
    try {
      const { downloadOperatorTotalData } = await import('./operatorTotalDataExcelExport.js');
      await downloadOperatorTotalData(filteredRows, query, manager, operatorSearch.trim());
    } catch { setExportError('Unable to download Excel. Please try again.'); }
    finally { setDownloading(false); }
  };
  const search = event => {
    event.preventDefault();
    if (!range.fromDate || !range.toDate || range.fromDate > range.toDate) {
      setError('Choose a valid date range. From Date must be on or before To Date.'); return;
    }
    setQuery({ ...range });
  };
  return <section className="total-data-view" role="dialog" aria-modal="true" aria-labelledby="total-data-title">
    <header><div><h2 id="total-data-title">Operator Total Data</h2><p>EOD totals by report date · India Standard Time (IST)</p></div><button type="button" onClick={onClose}>Close</button></header>
    <form className="total-data-toolbar" onSubmit={search}>
      <label>From Date<input type="date" required value={range.fromDate} onChange={e => setRange({ ...range, fromDate: e.target.value })} /></label>
      <label>To Date<input type="date" required min={range.fromDate} value={range.toDate} onChange={e => setRange({ ...range, toDate: e.target.value })} /></label>
      <label>Dist Manager<select value={manager} onChange={e => setManager(e.target.value)}><option value="">All District Managers</option>{manager && !managers.includes(manager) && <option value={manager}>{manager}</option>}{managers.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>Operator<input type="search" placeholder="Operator name or ID" value={operatorSearch} onChange={e => setOperatorSearch(e.target.value)} /></label>
      <button type="submit">Search</button>
      <button type="button" onClick={() => { const next = { fromDate: todayIST(), toDate: todayIST() }; setRange(next); setQuery(next); }}>Today</button>
      <button type="button" onClick={downloadExcel} disabled={loading || downloading || !!error || !filteredRows.length}>{downloading ? 'Preparing Excel...' : 'Download Excel'}</button>
      <span>{query.fromDate} to {query.toDate}</span>
    </form>
    {error && <p role="alert" className="total-data-error">{error}</p>}
    {exportError && <p role="alert" className="total-data-error">{exportError}</p>}
    <div className="total-data-table" aria-busy={loading}>
      <table><thead><tr><th>Operator Name</th><th>Dist Manager Name</th><th>New</th><th>Mandatory Free</th><th>Biometric</th><th>Demography</th><th>Total Data (EOD)</th><th>Total Collection (₹)</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan="8">Loading…</td></tr> : filteredRows.length ? filteredRows.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.manager}</td><td>{display(row.newCount)}</td><td>{display(row.mandatoryFree)}</td><td>{display(row.biometric)}</td><td>{display(row.demography)}</td><td>{display(row.total)}</td><td>{display(row.collection)}</td></tr>) : <tr><td colSpan="8">{error ? 'Report unavailable.' : 'No operators match the selected filters.'}</td></tr>}</tbody>
        {!loading && !error && filteredRows.length > 0 && <tfoot><tr><th colSpan="2">Grand Total</th><td>{display(totals.newCount)}</td><td>{display(totals.mandatoryFree)}</td><td>{display(totals.biometric)}</td><td>{display(totals.demography)}</td><td>{display(totals.total)}</td><td>{display(totals.collection)}</td></tr></tfoot>}
      </table>
    </div>
  </section>;
}
