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
 return <div className="modal-overlay" style={{position:'fixed',inset:0,zIndex:220,background:'#fff',overflow:'auto'}}>
  <div style={{padding:24,maxWidth:760,margin:'0 auto'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2>Configure Settings</h2><button onClick={onClose} disabled={saving}>Close</button></div>
   <p>Daily report reminders and automatic device locking. All times are India Standard Time (IST).</p>
   {error && <p role="alert" style={{color:'#b91c1c'}}>{error} {!settings && <button onClick={()=>setReload(n=>n+1)}>Retry</button>}</p>}
   {success && <p role="status" style={{color:'#15803d'}}>{success}</p>}
   {!settings ? !error && <p>Loading settings...</p> : <form onSubmit={save}>
    <fieldset disabled={saving} style={{display:'grid',gap:24,border:'1px solid #cbd5e1',padding:24}}>
     <label><input type="checkbox" checked={settings.autoScheduledLock} onChange={e=>change('autoScheduledLock',e.target.checked)}/> Enable automatic report locking</label>
     <label>Grace period after warning (minutes)<input style={{display:'block',padding:8,marginTop:6}} type="number" min="1" max="1440" step="1" required value={settings.graceMinutes} onChange={e=>change('graceMinutes',e.target.value === '' ? '' : Number(e.target.value))}/></label>
     <label>Daily reminder time (IST)<input style={{display:'block',padding:8,marginTop:6}} type="time" required value={timeValue(settings.reminderHour,settings.reminderMinute)} onChange={e=>changeTime('reminder',e.target.value)}/></label>
     <label>Stop automatic locks at (IST)<input style={{display:'block',padding:8,marginTop:6}} type="time" required value={timeValue(settings.endHour,settings.endMinute)} onChange={e=>changeTime('end',e.target.value)}/></label>
     <p style={{margin:0}}>Stop time must be after reminder time. No automatic locks occur after the stop time or on Sunday. Disabling automatic locks does not unlock devices already locked. Existing warnings keep any longer grace period already promised.</p>
     <button type="submit">{saving ? 'Saving...' : 'Save Settings'}</button>
    </fieldset>
   </form>}
  </div>
 </div>;
}
