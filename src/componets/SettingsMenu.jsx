import ReportSettings from './ReportSettings.jsx';
import React,{useEffect,useState} from 'react';
import ConfigureSettings from './ConfigureSettings.jsx';
import api from '../api/api.js';
import './ConfigureSettings.css';
export default function SettingsMenu({onClose}){
 const [view,setView]=useState('menu');
 if(view==='reports')return <ReportSettings onClose={()=>setView('menu')}/>;
 if(view==='autolock')return <ConfigureSettings onClose={()=>setView('menu')}/>;
 return <div className="configure-settings-page" role="dialog" aria-modal="true" aria-label="Configure Settings"><div className="settings-shell">
 <header className="settings-header"><div><span className="settings-eyebrow">ADMINISTRATION</span><h2>{view==='assign'?'Assign Device':'Configure Settings'}</h2></div><button className="settings-close" onClick={onClose}>Close ×</button></header>
 {view==='menu'?<div className="settings-card" style={{display:'flex',gap:16,flexWrap:'wrap'}}><button className="settings-close" onClick={()=>setView('autolock')}>Autolock Settings</button><button className="settings-close" onClick={()=>setView('assign')}>Assign Device</button><button className="settings-close" onClick={()=>setView('reports')}>Report Settings</button></div>:<AssignDevice onBack={()=>setView('menu')}/>}
 </div></div>;
}
function AssignDevice({onBack}){
 const [managers,setManagers]=useState([]),[email,setEmail]=useState(''),[limit,setLimit]=useState(''),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[reload,setReload]=useState(0);
 useEffect(()=>{const controller=new AbortController();setBusy(true);setError('');api.get('devices/manager-device-limits',{signal:controller.signal}).then(({data})=>setManagers(data.data)).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.message||'Unable to load managers.');}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();},[reload]);
 const selected=managers.find(m=>m.email===email);
 const save=async e=>{e.preventDefault();setError('');setSuccess('');setSaving(true);try{const {data}=await api.put('devices/manager-device-limits',{email,maxDevices:Number(limit)});setManagers(items=>items.map(m=>m.email===email?{...m,...data.data}:m));setSuccess('Assignment limit saved.');}catch(e){setError(e.response?.data?.message||'Unable to save limit.');}finally{setSaving(false);}};
 return <form onSubmit={save}><fieldset className="settings-card" disabled={busy||saving} style={{display:'grid',gap:18}}><label>District Manager<select required value={email} onChange={e=>{setEmail(e.target.value);setLimit(managers.find(m=>m.email===e.target.value)?.maxDevices??'');setSuccess('');}} style={{display:'block',width:'100%',padding:10,marginTop:8}}><option value="">Select District Manager</option>{managers.map(m=><option key={m.email} value={m.email}>{m.name} ({m.email})</option>)}</select></label>
 <label>Maximum assigned devices<input required type="number" min="0" step="1" value={limit} onChange={e=>{setLimit(e.target.value);setSuccess('');}} style={{display:'block',padding:10,marginTop:8}}/></label>
 {selected&&<p>Currently assigned: <strong>{selected.assignedCount}</strong>. Saved limit: <strong>{selected.maxDevices??'Unlimited'}</strong>.</p>}
 <p>Includes active and inactive assigned devices. Saving a limit does not assign or remove existing devices.</p>
 <div style={{display:'flex',gap:12}}><button type="button" className="settings-close" onClick={onBack}>Back</button><button type="submit" className="settings-close" disabled={!email||limit===''}>{saving?'Saving…':'Save'}</button></div></fieldset>
 {busy&&<p>Loading managers…</p>}{error&&<div role="alert" className="settings-alert settings-error">{error}<button type="button" disabled={saving||busy} onClick={()=>setReload(n=>n+1)}>Reload</button></div>}{success&&<p role="status" className="settings-alert settings-success">{success}</p>}</form>;
}
