import { useEffect, useRef, useState } from 'react';
import api from '../api/api.js';
import SelectedOperatorActions from './SelectedOperatorActions.jsx';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

export default function MissingZipReports({ canManage = false }) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(today);
    const [toDate,setToDate]=useState(today);
    const [exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [selectedOperatorIds, setSelectedOperatorIds] = useState([]);
    const controller = useRef(null);
    const closeButton = useRef(null);
    const trigger = useRef(null);
    useEffect(() => () => controller.current?.abort(), []);
    useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);

    const load = async (requestedDate,requestedTo=requestedDate) => {
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        setOpen(true); setDate(requestedDate); setToDate(requestedTo); setExportError(''); setBusy(true); setResult(null); setError(''); setSelectedOperatorIds([]);
        try {
            const response = await api.get('devices/reports/missing-zip-reports', { params: { fromDate: requestedDate, toDate: requestedTo }, signal: request.signal });
            if (!request.signal.aborted) setResult(response.data);
        } catch (err) {
            if (!request.signal.aborted) setError(err.response?.data?.message || 'Unable to load missing EOD reports.');
        } finally { if (!request.signal.aborted) setBusy(false); }
    };
    const close = () => { controller.current?.abort(); setBusy(false); setOpen(false); trigger.current?.focus(); };

    return <>
        <button ref={trigger} type="button" onClick={() => load(today())} style={{ padding: '9px 16px', marginLeft: 'auto', background: '#b45309', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Missing Today’s EOD Reports</button>
        {open && <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div role="dialog" aria-modal="true" aria-labelledby="missing-zip-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
                if (event.key === 'Escape') close();
                if (event.key === 'Tab') {
                    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
                    const first = controls[0], last = controls[controls.length - 1];
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                }
            }} style={{ background: '#fff', borderRadius: 0, padding: 24, width: '100%', height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><h2 id="missing-zip-title" style={{ margin: 0 }}>Operators without EOD Report</h2><button ref={closeButton} type="button" onClick={close}>Close</button></div>
                <div style={{ display: 'flex', alignItems: 'end', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                    <label>From Date<input type="date" value={date} max={toDate||today()} disabled={busy} onChange={event => { setDate(event.target.value); setResult(null); setError(''); }} style={{ display: 'block', marginTop: 5, padding: 8 }} /></label>
                    <label>To Date<input type="date" value={toDate} min={date} max={today()} disabled={busy} onChange={event=>{setToDate(event.target.value);setResult(null);setError('');}} style={{display:'block',marginTop:5,padding:8}}/></label>
                    <button type="button" disabled={!date || !toDate || date>toDate || busy} onClick={() => load(date,toDate)} style={{ padding: '9px 16px' }}>{busy ? 'Loading...' : 'Search'}</button>
                    <button type="button" disabled={busy||exporting||!result?.data?.length} onClick={async()=>{setExporting(true);setExportError('');try{const {downloadMissingEod}=await import('./missingEodExcelExport.js');await downloadMissingEod(result);}catch{setExportError('Unable to download Excel. Please try again.');}finally{setExporting(false);}}}>{exporting?'Preparing Excel...':'Download Excel'}</button>
                </div>
                {exportError&&<p role="alert">{exportError}</p>}
                {busy ? <p role="status">Loading missing EOD reports...</p> : error ? <p role="alert" style={{ color: '#d93025' }}>{error}</p> : result ? result.data.length === 0 ? <p>No required EOD reports are missing for {result.fromDate} to {result.toDate}.</p> : <>
                    <p>{result.data.length} operators missing EOD reports on at least one required date from {result.fromDate} to {result.toDate}.</p>
                    <p>Leave/holiday dates and dates with Auto Lock disabled are excluded.</p>
                    <SelectedOperatorActions selectedOperators={result.data.filter(operator => selectedOperatorIds.includes(operator.operatorId))} onClearSelection={() => setSelectedOperatorIds([])} canManage={canManage} />
                    <div style={{flex:1,minHeight:0,overflow:'auto',marginTop:16}}><table className="device-table"><thead><tr><th><input type="checkbox" checked={result.data.length > 0 && result.data.every(operator => selectedOperatorIds.includes(operator.operatorId))} onChange={() => setSelectedOperatorIds(selected => selected.length === result.data.length ? [] : result.data.map(operator => operator.operatorId))} aria-label="Select all operators" /></th><th>SL NO</th><th>Operator ID</th><th>Operator Name</th><th>District Manager Name</th><th>Date Range</th><th>Missing Dates</th></tr></thead><tbody>{result.data.map((operator, index) => <tr key={operator.operatorId}><td><input type="checkbox" checked={selectedOperatorIds.includes(operator.operatorId)} onChange={() => setSelectedOperatorIds(selected => selected.includes(operator.operatorId) ? selected.filter(id => id !== operator.operatorId) : [...selected, operator.operatorId])} aria-label={`Select ${operator.operatorId}`} /></td><td>{index + 1}</td><td>{operator.operatorId}</td><td>{operator.operatorName || '—'}</td><td>{operator.managerName || '—'}</td><td>{result.fromDate} to {result.toDate}</td><td style={{whiteSpace:'normal',minWidth:220}}>{operator.missingDates?.join(', ')}</td></tr>)}</tbody></table></div>
                </> : <p>Select a date range and click Search.</p>}
            </div>
        </div>}
    </>;
}
