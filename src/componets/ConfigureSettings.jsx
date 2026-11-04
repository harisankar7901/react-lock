import './ConfigureSettings.css';
import React, {useEffect,useState} from 'react';
import api from '../api/api.js';
const timeValue=(hour,minute)=>String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
export default function ConfigureSettings({onClose}) {
 const [settings,setSettings]=useState(null);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const [success,setSuccess]=useState('');
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setError('');
  api.get('devices/scheduler-settings',{signal:controller.signal}).then(({data})=>setSettings(data.data)).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.message || 'Unable to load settings.');});
  return ()=>controller.abort();
 },[reload]);
 const change=(key,value)=>{setSettings(previous=>({...previous,[key]:value}));setSuccess('');};
 const changeTime=(prefix,value)=>{
  const [hour,minute]=value.split(':').map(Number);
  setSettings(previous=>({...previous,[prefix+'Hour']:hour,[prefix+'Minute']:minute}));setSuccess('');
 };
 const save=async event=>{
  event.preventDefault();setSaving(true);setError('');setSuccess('');
  try {const {data}=await api.put('devices/scheduler-settings',settings);setSettings(data.data);setSuccess('Settings saved and activated. The scheduler uses them on its next warning/lock check.');}
  catch(e){setError(e.response?.data?.message || 'Unable to save settings.');}
  finally{setSaving(false);}
 };

 return <div className="configure-settings-page" role="dialog" aria-modal="true" aria-labelledby="settings-title">
  <div className="settings-shell">
   <header className="settings-header">
    <div><span className="settings-eyebrow">ADMINISTRATION</span><h2 id="settings-title">Configure Settings</h2><p>Set the daily schedule for report reminders and automatic locking.</p></div>
    <button className="settings-close" onClick={onClose} disabled={saving}>Close <span aria-hidden="true">×</span></button>
   </header>
   {error && <div role="alert" className="settings-alert settings-error">{error} {!settings && <button onClick={()=>setReload(n=>n+1)}>Retry</button>}</div>}
   {success && <div role="status" className="settings-alert settings-success">{success}</div>}
   {!settings ? !error && <div className="settings-card settings-loading">Loading settings...</div> : <form onSubmit={save}>
    <fieldset disabled={saving} className="settings-card">
     <div className="settings-card-heading"><div><h3>Daily report automation</h3><p>Manage when operators are reminded and given time to upload.</p></div><span className="settings-timezone">IST · India time</span></div>
     <label className="settings-toggle-row">
      <span><strong>Automatic report locking</strong><small>Lock devices when required reports remain missing after the grace period.</small></span>
      <span className="settings-toggle-control"><span className="settings-toggle-text">{settings.autoScheduledLock ? 'Enabled' : 'Disabled'}</span><input type="checkbox" role="switch" checked={settings.autoScheduledLock} onChange={e=>change('autoScheduledLock',e.target.checked)}/><span className="settings-switch" aria-hidden="true" /></span>
     </label>
     <div className="settings-fields">
      <label className="settings-field"><span>Daily reminder time</span><small>Send the first warning</small><input type="time" required value={timeValue(settings.reminderHour,settings.reminderMinute)} onChange={e=>changeTime('reminder',e.target.value)}/></label>
      <label className="settings-field"><span>Grace period</span><small>Time allowed to upload reports</small><div className="settings-number"><input type="number" aria-label="Grace period in minutes" min="1" max="1440" step="1" required value={settings.graceMinutes} onChange={e=>change('graceMinutes',e.target.value === '' ? '' : Number(e.target.value))}/><span>minutes</span></div></label>
      <label className="settings-field"><span>Stop automatic locks at</span><small>End of the daily lock window</small><input type="time" required value={timeValue(settings.endHour,settings.endMinute)} onChange={e=>changeTime('end',e.target.value)}/></label>
     </div>
     <div className="settings-preview"><span className="settings-preview-label">SCHEDULE AT A GLANCE</span><div><strong>{timeValue(settings.reminderHour,settings.reminderMinute)}</strong> reminder <span aria-hidden="true">→</span> <strong>{settings.graceMinutes || '—'} min</strong> grace <span aria-hidden="true">→</span> stop at <strong>{timeValue(settings.endHour,settings.endMinute)} IST</strong></div><small>{settings.autoScheduledLock ? 'Automatic report locking is enabled.' : 'Automatic report locking is disabled.'}</small></div>
     <aside className="settings-note"><strong>How this schedule works</strong><p>Stop time must be after reminder time. No automatic locks occur after the stop time or on Sunday. Disabling automatic locks does not unlock devices already locked. Existing warnings keep any longer grace period already promised.</p></aside>
     <footer className="settings-footer"><span>Changes take effect after you save.</span><button className="settings-save" type="submit">{saving ? 'Saving...' : 'Save Settings'}</button></footer>
    </fieldset>
   </form>}
  </div>
 </div>;
}
