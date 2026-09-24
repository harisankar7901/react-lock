import { useEffect, useState } from 'react';
import api from '../api/api.js';

const amount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const dateLabel = value => value ? value.split('-').reverse().join('/') : '—';

export default function ZipEnrolmentSummary({ reportId, refreshKey, search }) {
    const [response, setResponse] = useState(null);
    const key = `${reportId}:${refreshKey}:${JSON.stringify(search || {})}`;
    const busy = response?.key !== key;
    const rows = busy ? [] : response?.rows || [];
    const unmatched = busy ? [] : response?.unmatched || [];
    const invalidAmounts = rows.reduce((total, row) => total + row.invalidAmountCount, 0);
    const cumulativeTotals = rows.reduce((total, row) => ({
        newCount: total.newCount + (Number(row.newCount) || 0),
        mandatoryFree: total.mandatoryFree + (Number(row.mandatoryFree) || 0),
        biometric: total.biometric + (Number(row.biometric) || 0),
        demography: total.demography + (Number(row.demography) || 0),
        totalData: total.totalData + (Number(row.totalData) || 0),
        totalAmountCharged: total.totalAmountCharged + (Number(row.totalAmountCharged) || 0),
    }), { newCount: 0, mandatoryFree: 0, biometric: 0, demography: 0, totalData: 0, totalAmountCharged: 0 });

    useEffect(() => {
        const controller = new AbortController();
        api.get('devices/reports/zip-enrolment-summary', { params: { ...search, reportId: reportId || undefined }, signal: controller.signal })
            .then(res => { if (!controller.signal.aborted) setResponse({ key, rows: res.data.data, unmatched: res.data.unmatched || [] }); })
            .catch(error => { if (!controller.signal.aborted) setResponse({ key, error: error.response?.data?.message || 'Unable to load the summary.' }); });
        return () => controller.abort();
    }, [reportId, key, search]);

    return <section aria-label="EOD MIS Report summary" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #dbe3ed' }}>
        <h3 style={{ margin: '0 0 8px' }}>EOD MIS Report summary</h3>
        <p style={{ margin: '0 0 12px', color: '#475569' }}>All matching records, grouped by date and operator.</p>
        {busy ? <p role="status">Loading summary...</p> : response?.error ? <p role="alert" style={{ color: '#d93025' }}>{response.error}</p> : !rows.length ? <p>No records to summarize.</p> : <>
            <div className="mis-report-table-scroll" style={{ overflow: 'auto', maxHeight: '40vh' }}>
                <table className="mis-report-table" style={{ whiteSpace: 'nowrap' }}>
                    <thead><tr><th>SL Number</th><th>DATE</th><th>OPERATOR_ID</th><th>Operator Name</th><th>NEW</th><th>MANDATORY FREE</th><th>BIOMETRIC</th><th>DEMOGRAPHY</th><th>TOTAL DATA</th><th>TOTAL_AMOUNT_CHARGED</th><th>Match</th></tr></thead>
                    <tbody>{rows.map((row, index) => <tr key={JSON.stringify([row.date, row.operatorId])}>
                        <td>{index + 1}</td><td>{dateLabel(row.date)}</td><td>{row.operatorId || '—'}</td><td>{row.operatorName || '—'}</td>
                        <td>{row.newCount}</td><td>{row.mandatoryFree}</td><td>{row.biometric}</td><td>{row.demography}</td><td>{row.totalData}</td><td>{amount.format(row.totalAmountCharged)}</td><td style={{ color: row.match === true ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: '18px', textAlign: 'center' }} title={row.match === true ? 'Matched' : 'Does not match'} aria-label={row.match === true ? 'Matched' : 'Does not match'}>{row.match === true ? '✓' : '✕'}</td>
                    </tr>)}</tbody>
                    <tfoot><tr><td colSpan="4">Cumulative Total</td><td>{cumulativeTotals.newCount}</td><td>{cumulativeTotals.mandatoryFree}</td><td>{cumulativeTotals.biometric}</td><td>{cumulativeTotals.demography}</td><td>{cumulativeTotals.totalData}</td><td>{amount.format(cumulativeTotals.totalAmountCharged)}</td><td></td></tr></tfoot>
                </table>
            </div>
            {invalidAmounts > 0 && <p>{invalidAmounts} records have a missing or invalid amount. These records are included in Total Data but excluded from the amount sum.</p>}
        </>}
        {!busy && !response?.error && <section aria-label="Validation Report : OFF MIS vs EOD MIS" style={{ marginTop: 24 }}>
            <h3>Validation Report : OFF MIS vs EOD MIS</h3>
            <p>Missing totals are blank. Zero means a submitted total of zero.</p>
            {!unmatched.length ? <p>No unmatched records.</p> : <div className="mis-report-table-scroll" style={{ overflow: 'auto', maxHeight: '40vh' }}>
                <table className="mis-report-table" style={{ whiteSpace: 'nowrap' }}>
                    <thead><tr><th>SL NO</th><th>Date</th><th>Operator ID</th><th>Operator Name</th><th>Dist_Cor_Name</th><th>OFF_Mis_Total</th><th>EOD TOTAL</th></tr></thead>
                    <tbody>{unmatched.map((row, index) => <tr key={JSON.stringify([row.date, row.operatorId, index])}>
                        <td>{index + 1}</td><td>{dateLabel(row.date)}</td><td>{row.operatorId}</td><td>{row.operatorName}</td><td>{row.distCorName}</td>
                        <td title={row.misNew == null ? 'No MIS New count' : 'MIS New: ' + row.misNew}>{row.misTotal ?? ''}</td>
                        <td title={row.summaryNew == null ? 'No ZIP New count' : 'Summary New: ' + row.summaryNew}>{row.summaryTotal ?? ''}</td>
                    </tr>)}</tbody>
                </table>
            </div>}
        </section>}
    </section>;
}
