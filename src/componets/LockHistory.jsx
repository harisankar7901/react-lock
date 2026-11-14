import React,{useEffect,useState} from 'react';
import api from '../api/api.js';
import './WeeklyMismatchRecords.css';
export default function LockHistory({onClose}){
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[source,setSource]=useState('all'),[reason,setReason]=useState(''),[search,setSearch]=useState('');
 const [rows,setRows]=useState([]),[reasons,setReasons]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();setRows([]);setError('');
 if(from&&to&&from>to){setError('From date must not be after To date.');setBusy(false);return()=>c.abort();}
 setBusy(true);api.get('devices/lock-history',{params:{fromDate:from||undefined,toDate:to||undefined,source,reason:reason||undefined},signal:c.signal}).then(({data})=>{if(!c.signal.aborted){setRows(data.data||[]);setReasons(data.reasons||[]);}}).catch(e=>{if(!c.signal.aborted)setError(e.response?.data?.message||'Unable to load lock history.');}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[from,to,source,reason]);
 const visible=rows.filter(r=>[r.operatorName,r.operatorId,r.laptopName,r.reason,r.performedBy].some(v=>String(v||'').toLowerCase().includes(search.trim().toLowerCase())));
 return <div className="weekly-mismatch-page" role="dialog" aria-modal="true" aria-labelledby="lock-history-title" style={{position:'fixed',inset:0,zIndex:200,background:'#fff',padding:20,boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="lock-history-title">Lock &amp; Unlock History</h2><button onClick={onClose}>Close</button></header>
 <p>Most recent 1,000 matching actions. Dates and times are in IST.</p>
 <form onSubmit={e=>e.preventDefault()} style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end',marginBottom:16}}>
 <label>From Date<input type="date" value={from} max={to||undefined} onChange={e=>{setFrom(e.target.value);setReason('');}}/></label>
 <label>To Date<input type="date" value={to} min={from||undefined} onChange={e=>{setTo(e.target.value);setReason('');}}/></label>
 <label>Performed By<select value={source} onChange={e=>{setSource(e.target.value);setReason('');}}><option value="all">All</option><option value="system">System</option></select></label>
 <label>Lock Reason<select style={{maxWidth:400}} value={reason} onChange={e=>setReason(e.target.value)}><option value="">All</option>{reasons.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
 <label>Search<input type="search" placeholder="Operator name, ID, laptop or reason" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 </form>
 {busy?<p role="status">Loading lock history...</p>:error?<p role="alert">{error}</p>:<div style={{flex:1,minHeight:0,overflow:'auto'}}><table className="device-table" style={{minWidth:950}}><thead><tr>{['Date & Time (IST)','Action','Laptop','Operator ID','Operator Name','Reason','Performed By','Role'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r._id}><td>{new Date(r.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td><td>{r.action==='locked'?'Locked':'Unlocked'}</td><td>{r.laptopName||'—'}</td><td>{r.operatorId||'—'}</td><td>{r.operatorName||'—'}</td><td style={{whiteSpace:'normal',minWidth:220}}>{r.reason||'—'}</td><td>{r.performedBy||'—'}</td><td>{r.performedByRole||'—'}</td></tr>)}</tbody></table>{!visible.length&&<p>No actions match the selected filters.</p>}</div>}
 </div>;
}
