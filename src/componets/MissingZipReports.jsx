import { useEffect, useRef, useState } from 'react';
import api from '../api/api.js';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

export default function MissingZipReports() {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(today);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const controller = useRef(null);
    const closeButton = useRef(null);
    const trigger = useRef(null);
    useEffect(() => () => controller.current?.abort(), []);
    useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);

    const load = async requestedDate => {
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        setOpen(true); setDate(requestedDate); setBusy(true); setResult(null); setError('');
        try {
            const response = await api.get('devices/reports/missing-zip-reports', { params: { date: requestedDate }, signal: request.signal });
            if (!request.signal.aborted) setResult(response.data);
        } catch (err) {
            if (!request.signal.aborted) setError(err.response?.data?.message || 'Unable to load missing ZIP reports.');
        } finally { if (!request.signal.aborted) setBusy(false); }
    };
    const close = () => { controller.current?.abort(); setBusy(false); setOpen(false); trigger.current?.focus(); };

    return <>
        <button ref={trigger} type="button" onClick={() => load(today())} style={{ padding: '9px 16px', marginLeft: 'auto', background: '#b45309', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Missing Today’s ZIP Reports</button>
        {open && <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div role="dialog" aria-modal="true" aria-labelledby="missing-zip-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
                if (event.key === 'Escape') close();
                if (event.key === 'Tab') {
                    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
                    const first = controls[0], last = controls[controls.length - 1];
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                }
            }} style={{ background: '#fff', borderRadius: 8, padding: 24, width: 620, maxWidth: '90%', maxHeight: '80vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><h2 id="missing-zip-title" style={{ margin: 0 }}>Operators without ZIP Report</h2><button ref={closeButton} type="button" onClick={close}>Close</button></div>
                <div style={{ display: 'flex', alignItems: 'end', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                    <label>Report date<input type="date" value={date} max={today()} disabled={busy} onChange={event => { setDate(event.target.value); setResult(null); setError(''); }} style={{ display: 'block', marginTop: 5, padding: 8 }} /></label>
                    <button type="button" disabled={!date || busy} onClick={() => load(date)} style={{ padding: '9px 16px' }}>{busy ? 'Loading...' : 'Show Operators'}</button>
                </div>
                {busy ? <p role="status">Loading missing ZIP reports...</p> : error ? <p role="alert" style={{ color: '#d93025' }}>{error}</p> : result ? result.data.length === 0 ? <p>All assigned operators have uploaded a ZIP report for {result.date}.</p> : <>
                    <p>{result.data.length} operators without a ZIP report for {result.date}.</p>
                    <table><thead><tr><th>SL NO</th><th>Operator ID</th><th>Operator Name</th></tr></thead><tbody>{result.data.map((operator, index) => <tr key={operator.operatorId}><td>{index + 1}</td><td>{operator.operatorId}</td><td>{operator.operatorName || '—'}</td></tr>)}</tbody></table>
                </> : <p>Select a date and click Show Operators.</p>}
            </div>
        </div>}
    </>;
}
