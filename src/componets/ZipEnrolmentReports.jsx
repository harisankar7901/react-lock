import { useEffect, useState } from 'react';
import api from '../api/api.js';
import ZipEnrolmentSummary from './ZipEnrolmentSummary.jsx';
import { deriveZipEnrolmentFields } from './deriveZipEnrolmentFields.js';

function DerivedEnrolmentCells({ record }) {
    const { date, stationId } = deriveZipEnrolmentFields(record.data?.ENROLMENT_NO_DATE ?? record.enrolmentNoDate);
    return <><td>{date || '—'}</td><td>{stationId || '—'}</td></>;
}

export default function ZipEnrolmentReports({ reports, loading, error, formatFileSize }) {
    const [tab, setTab] = useState('list');
    const [reportId, setReportId] = useState('');
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [response, setResponse] = useState(null);
    const queryKey = `${reportId}:${page}:${revision}`;
    const busy = response?.key !== queryKey;
    const result = busy ? null : response?.result;
    const failure = busy ? '' : response?.error;

    useEffect(() => {
        if (tab !== 'data') return;
        const controller = new AbortController();
        api.get('devices/reports/zip-enrolment-records', {
            params: { reportId: reportId || undefined, page }, signal: controller.signal
        }).then(res => {
            if (!controller.signal.aborted) setResponse({ key: queryKey, result: res.data });
        }).catch(err => {
            if (!controller.signal.aborted) setResponse({ key: queryKey, error: err.response?.data?.message || 'Unable to load ZIP records.' });
        });
        return () => controller.abort();
    }, [tab, reportId, page, queryKey]);

    return <>
        <div aria-label="ZIP report views" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['list', 'ZIP List'], ['data', 'Extracted Data']].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}
                    style={{ padding: '9px 16px', border: '1px solid #dbe3ed', borderRadius: 6, cursor: 'pointer', background: tab === value ? '#2563eb' : '#fff', color: tab === value ? '#fff' : '#374151' }}>
                    {label}
                </button>
            ))}
        </div>
        {tab === 'list' ? loading ? <p>Loading zip files...</p> : error ? <p role="alert" style={{ color: '#d93025' }}>{error}</p> : !reports.length ? <p>No uploaded zip files found.</p> : (
            <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
                <table>
                    <thead><tr><th>File Name</th><th>Size</th><th>Uploaded</th><th>Action</th></tr></thead>
                    <tbody>{reports.map(report => (
                        <tr key={report._id}><td>{report.fileName}</td><td>{formatFileSize(report.size)}</td><td>{new Date(report.createdAt).toLocaleString()}</td><td>{report.downloadUrl ? <a href={report.downloadUrl} target="_blank" rel="noreferrer">Download</a> : '—'}</td></tr>
                    ))}</tbody>
                </table>
            </div>
        ) : <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                <label>Uploaded ZIP{' '}
                    <select value={reportId} onChange={event => { setReportId(event.target.value); setPage(1); }} style={{ padding: 8, maxWidth: '65vw' }}>
                        <option value="">All ZIP reports</option>
                        {reports.map(report => <option key={report._id} value={report._id}>{report.fileName} — {new Date(report.createdAt).toLocaleString()}</option>)}
                    </select>
                </label>
                <button type="button" onClick={() => setRevision(value => value + 1)} disabled={busy}>Refresh</button>
            </div>
            {busy ? <p role="status">Loading saved records...</p> : failure ? <p role="alert" style={{ color: '#d93025' }}>{failure}</p> : !result?.data?.length ? (
                <p>No saved records{reportId ? ' for this ZIP' : ''}. Records are imported automatically when a new ZIP containing the enrolment CSV or XLSX is uploaded.</p>
            ) : <>
                <p style={{ margin: '0 0 12px' }}>{result.total.toLocaleString()} saved records</p>
                <div className="mis-report-table-scroll" style={{ overflow: 'auto', maxHeight: '45vh' }}>
                    <table className="mis-report-table" style={{ whiteSpace: 'nowrap' }}>
                        <thead><tr><th>DATE</th><th>Station ID</th><th>Source ZIP</th><th>Uploaded By Device ID</th><th>Operator Device ID</th>{result.columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
                        <tbody>{result.data.map(record => <tr key={record._id}>
                            <DerivedEnrolmentCells record={record} />
                            <td title={`${record.sourceFileName} · ${record.sheetName || ''}`}>{record.archiveName}</td>
                            <td>{record.uploadingDeviceId || '—'}</td>
                            <td>{record.operatorDevices?.length ? record.operatorDevices.map(device => (
                                <div key={device._id} title={device.laptopName || ''}>{device.deviceId}</div>
                            )) : 'No matching device'}</td>
                            {result.columns.map(column => <td key={column}>{Object.hasOwn(record.data || {}, column) ? String(record.data[column] ?? '') : ''}</td>)}
                        </tr>)}</tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 12 }}>
                    <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
                    <span>Page {page} of {Math.ceil(result.total / result.pageSize)}</span>
                    <button type="button" disabled={page * result.pageSize >= result.total} onClick={() => setPage(value => value + 1)}>Next</button>
                </div>
            </>}
            <ZipEnrolmentSummary reportId={reportId} refreshKey={revision} />
        </div>}
    </>;
}
