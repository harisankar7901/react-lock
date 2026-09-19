import { useState } from 'react';
import MissingZipReports from './MissingZipReports.jsx';
import ZipEnrolmentSummary from './ZipEnrolmentSummary.jsx';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
const inputStyle = { display: 'block', marginTop: 5, padding: 8 };

export default function ZipEnrolmentReports({ error, coordinators = [], isDistrictCoordinator = false, coordinatorEmail = '', coordinatorName = '', role = '' }) {
    const [revision, setRevision] = useState(0);
    const [draft, setDraft] = useState(() => ({ fromDate: today(), toDate: today(), operatorId: '', operatorName: '', coordinatorEmail: isDistrictCoordinator ? coordinatorEmail : '' }));
    const [search, setSearch] = useState(draft);
    const update = event => setDraft(previous => ({ ...previous, [event.target.name]: event.target.value }));
    const submit = event => {
        event.preventDefault();
        setSearch({ ...draft, coordinatorEmail: isDistrictCoordinator ? coordinatorEmail : draft.coordinatorEmail });
        setRevision(value => value + 1);
    };
    return <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap', marginBottom: 14 }}>
            <label>From date<input type="date" name="fromDate" required value={draft.fromDate} max={draft.toDate || undefined} onChange={update} style={inputStyle} /></label>
            <label>To date<input type="date" name="toDate" required value={draft.toDate} min={draft.fromDate || undefined} onChange={update} style={inputStyle} /></label>
            <label>Operator ID<input type="text" name="operatorId" value={draft.operatorId} placeholder="Search operator ID" onChange={update} style={inputStyle} /></label>
            <label>Operator Name<input type="text" name="operatorName" value={draft.operatorName} placeholder="Search operator name" onChange={update} style={inputStyle} /></label>
            <label>Dist. Coordinator
                <select name="coordinatorEmail" value={draft.coordinatorEmail} disabled={isDistrictCoordinator} onChange={update} style={{ ...inputStyle, minWidth: 190, background: isDistrictCoordinator ? '#f3f4f6' : '#fff' }}>
                    {!isDistrictCoordinator && <option value="">All District Coordinators</option>}
                    {isDistrictCoordinator && !coordinators.some(coordinator => coordinator.email === coordinatorEmail) && <option value={coordinatorEmail}>{coordinatorName || coordinatorEmail}</option>}
                    {coordinators.map(coordinator => <option key={coordinator._id || coordinator.email} value={coordinator.email}>{coordinator.name || coordinator.email}</option>)}
                </select>
            </label>
            <button type="submit" style={{ padding: '9px 16px' }}>Search</button>
        </form>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <MissingZipReports canManage={role === 'admin' || role === 'superAdmin'} />
        </div>
        {error && <p role="alert" style={{ color: '#d93025' }}>{error}</p>}
        <ZipEnrolmentSummary reportId="" refreshKey={revision} search={search} />
    </div>;
}
