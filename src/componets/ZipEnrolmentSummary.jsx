import { useEffect, useState } from 'react';
import api from '../api/api.js';

const amount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const dateLabel = value => value ? value.split('-').reverse().join('/') : '—';

export default function ZipEnrolmentSummary({ reportId, refreshKey }) {
    const [response, setResponse] = useState(null);
    const key = `${reportId}:${refreshKey}`;
    const busy = response?.key !== key;
    const rows = busy ? [] : response?.rows || [];
    const unmatched = busy ? [] : response?.unmatched || [];
    const invalidAmounts = rows.reduce((total, row) => total + row.invalidAmountCount, 0);

    useEffect(() => {
        const controller = new AbortController();
        api.get('devices/reports/zip-enrolment-summary', { params: { reportId: reportId || undefined }, signal: controller.signal })
            .then(res => { if (!controller.signal.aborted) setResponse({ key, rows: res.data.data, unmatched: res.data.unmatched || [] }); })
            .catch(error => { if (!controller.signal.aborted) setResponse({ key, error: error.response?.data?.message || 'Unable to load the summary.' }); });
        return () => controller.abort();
    }, [reportId, key]);

    return <section aria-label="Extracted data summary" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #dbe3ed' }}>
        <h3 style={{ margin: '0 0 8px' }}>Summary</h3>
        <p style={{ margin: '0 0 12px', color: '#475569' }}>All matching records, grouped by date and operator.</p>
        {busy ? <p role="status">Loading summary...</p> : response?.error ? <p role="alert" style={{ color: '#d93025' }}>{response.error}</p> : !rows.length ? <p>No records to summarize.</p> : <>
            <div className="mis-report-table-scroll" style={{ overflow: 'auto', maxHeight: '40vh' }}>
                <table className="mis-report-table" style={{ whiteSpace: 'nowrap' }}>
                    <thead><tr><th>SL Number</th><th>DATE</th><th>OPERATOR_ID</th><th>Operator Name</th><th>NEW</th><th>MANDATORY FREE</th><th>BIOMETRIC</th><th>DEMOGRAPHY</th><th>TOTAL DATA</th><th>TOTAL_AMOUNT_CHARGED</th><th>Match</th></tr></thead>
                    <tbody>{rows.map((row, index) => <tr key={JSON.stringify([row.date, row.operatorId])}>
                        <td>{index + 1}</td><td>{dateLabel(row.date)}</td><td>{row.operatorId || '—'}</td><td>{row.operatorName || '—'}</td>
                        <td>{row.newCount}</td><td>{row.mandatoryFree}</td><td>{row.biometric}</td><td>{row.demography}</td><td>{row.totalData}</td><td>{amount.format(row.totalAmountCharged)}</td><td style={{ color: row.match === true ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{row.match === true ? 'true' : 'false'}</td>
                    </tr>)}</tbody>
                </table>
            </div>
            {invalidAmounts > 0 && <p>{invalidAmounts} records have a missing or invalid amount. These records are included in Total Data but excluded from the amount sum.</p>}
        </>}
        {!busy && !response?.error && <section aria-label="Unmatched records" style={{ marginTop: 24 }}>
            <h3>Unmatched Records</h3>
            <p>Missing totals are blank. Zero means a submitted total of zero.</p>
            {!unmatched.length ? <p>No unmatched records.</p> : <div className="mis-report-table-scroll" style={{ overflow: 'auto', maxHeight: '40vh' }}>
                <table className="mis-report-table" style={{ whiteSpace: 'nowrap' }}>
                    <thead><tr><th>SL NO</th><th>Date</th><th>Operator ID</th><th>DIST_COORDI</th><th>Operator Name</th><th>Dist_Cor_Name</th><th>MIS_Total</th><th>summary_Total</th></tr></thead>
                    <tbody>{unmatched.map((row, index) => <tr key={JSON.stringify([row.date, row.operatorId, index])}>
                        <td>{index + 1}</td><td>{dateLabel(row.date)}</td><td>{row.operatorId}</td><td>{row.distCoordi}</td><td>{row.operatorName}</td><td>{row.distCorName}</td>
                        <td title={row.misNew == null ? 'No MIS New count' : 'MIS New: ' + row.misNew}>{row.misTotal ?? ''}</td>
                        <td title={row.summaryNew == null ? 'No ZIP New count' : 'Summary New: ' + row.summaryNew}>{row.summaryTotal ?? ''}</td>
                    </tr>)}</tbody>
                </table>
            </div>}
        </section>}
    </section>;
}
