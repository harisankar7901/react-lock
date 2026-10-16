import { useEffect, useState } from 'react';
import api from '../api/api.js';

const labels = {
  authorized_uninstall: 'Authorized Uninstall',
  unauthorized_uninstall: 'Unauthorized Uninstall',
  service_stopped: 'Service Stopped',
  service_recovered: 'Service Recovered'
};
const cellStyle = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' };

export default function UninstallList() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('devices/uninstall-audits', { params: { page, status: status || undefined }, signal: controller.signal })
      .then(({ data }) => { setResult(data); setError(''); })
      .catch(error => {
        if (!controller.signal.aborted) setError(error.response?.data?.message || 'Could not load uninstall history.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, refresh]);

  return <section>
    <h1>Uninstall List</h1>
    <p>Removal and service events reported by devices. A stopped service or an offline device alone does not confirm an uninstall.</p>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      <label>Status <select value={status} onChange={event => { setLoading(true); setStatus(event.target.value); setPage(1); }}>
        <option value="">All events</option>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <button disabled={loading} onClick={() => { setLoading(true); setRefresh(value => value + 1); }}>Refresh</button>
      <span>{result.total} recorded events</span>
    </div>
    {loading ? <p role="status">Loading uninstall history...</p> : error ? <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>
      : !result.data.length ? <p>No uninstall events recorded. Devices need the watchdog update before automatic reporting is available.</p>
      : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Device / Computer', 'Operator', 'Status', 'Observed (local time)', 'Received (local time)', 'Key issued by', 'Reason'].map(label => <th key={label} scope="col" style={cellStyle}>{label}</th>)}</tr></thead>
        <tbody>{result.data.map(record => <tr key={record._id}>
          <td style={cellStyle}>{record.laptopName || 'Unknown'}<br /><small>{record.deviceId}</small></td>
          <td style={cellStyle}>{record.operatorName || '—'}<br /><small>{record.operatorId}</small></td>
          <td style={{ ...cellStyle, color: record.status === 'unauthorized_uninstall' ? '#b91c1c' : '#111827', fontWeight: 600 }}>{labels[record.status] || record.status}</td>
          <td style={cellStyle}>{new Date(record.observedAt).toLocaleString()}</td>
          <td style={cellStyle}>{new Date(record.receivedAt).toLocaleString()}</td>
          <td style={cellStyle}>{record.authorizedBy || '—'}</td>
          <td style={cellStyle}>{record.reason}</td>
        </tr>)}</tbody>
      </table></div>}
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
      <button disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage(value => value - 1); }}>Previous</button>
      <span>Page {page}</span>
      <button disabled={loading || page * 50 >= result.total} onClick={() => { setLoading(true); setPage(value => value + 1); }}>Next</button>
    </div>
  </section>;
}
