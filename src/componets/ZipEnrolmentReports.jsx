import { useState } from 'react';
import MissingZipReports from './MissingZipReports.jsx';
import ZipEnrolmentSummary from './ZipEnrolmentSummary.jsx';
export default function ZipEnrolmentReports({ reports, loading, error, formatFileSize }) {
    const [tab, setTab] = useState('list');
    const [reportId, setReportId] = useState('');
    const [revision, setRevision] = useState(0);
    return <>
        <div aria-label="ZIP report views" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['list', 'ZIP List'], ['data', 'Extracted Data']].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}
                    style={{ padding: '9px 16px', border: '1px solid #dbe3ed', borderRadius: 6, cursor: 'pointer', background: tab === value ? '#2563eb' : '#fff', color: tab === value ? '#fff' : '#374151' }}>
                    {label}
                </button>
            ))}
            <MissingZipReports />
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
                    <select value={reportId} onChange={event => setReportId(event.target.value)} style={{ padding: 8, maxWidth: '65vw' }}>
                        <option value="">All ZIP reports</option>
                        {reports.map(report => <option key={report._id} value={report._id}>{report.fileName} — {new Date(report.createdAt).toLocaleString()}</option>)}
                    </select>
                </label>
                <button type="button" onClick={() => setRevision(value => value + 1)}>Refresh</button>
            </div>
            <ZipEnrolmentSummary reportId={reportId} refreshKey={revision} />
        </div>}
    </>;
}
