import './WeeklyMismatchRecords.css';
import React,{useEffect,useState} from 'react';
import api from '../api/api.js';
import {currentMonthlyWeek} from './currentMonthlyWeek.js';
export default function MissingWeeklyReports({onClose}){
 const [manager,setManager]=useState('');
 const [range,setRange]=useState(currentMonthlyWeek),[from,setFrom]=useState(()=>currentMonthlyWeek().fromDate),[to,setTo]=useState(()=>currentMonthlyWeek().toDate),[data,setData]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 useEffect(()=>{const c=new AbortController();setBusy(true);setError('');setData([]);api.get('devices/reports/weekly-mismatches',{params:{missing:true,...range},signal:c.signal}).then(({data})=>{if(!c.signal.aborted)setData(data.data||[]);}).catch(e=>{if(!c.signal.aborted)setError(e.response?.data?.message||'Unable to load missing weekly reports.');}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[range]);
 const sorted=[...data].sort((a,b)=>String(a.managerName||'Unassigned').localeCompare(String(b.managerName||'Unassigned'))||String(a.managerId||'').localeCompare(String(b.managerId||''))||String(a.operatorName||'').localeCompare(String(b.operatorName||''))||a.operatorId.localeCompare(b.operatorId));
 const managers=[...new Map(sorted.map(o=>[o.managerId||'unassigned',o.managerName||'Unassigned'])).entries()];
 const visible=sorted.filter(o=>(!manager||[o.managerName||'Unassigned',o.managerId].some(v=>String(v||'').toLowerCase().includes(manager.trim().toLowerCase())))&&[o.operatorName,o.operatorId].some(v=>String(v||'').toLowerCase().includes(search.trim().toLowerCase())));

 return <div className="weekly-mismatch-page" role="dialog" aria-modal="true" aria-labelledby="missing-weekly-title" style={{position:'fixed',inset:0,zIndex:230,background:'#f1f5f9',padding:24,boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="missing-weekly-title">Missing Weekly Report</h2><button onClick={onClose}>Close</button></header>
 <p>Active operators whose uploaded weekly reports do not cover the full selected range. The current week may still be in progress.</p>
 <form onSubmit={e=>{e.preventDefault();setRange({fromDate:from,toDate:to});}} style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end',marginBottom:16}}>
 <label>From Date<input type="date" required value={from} max={to} onChange={e=>setFrom(e.target.value)} style={{display:'block',padding:10}}/></label><label>To Date<input type="date" required value={to} min={from} onChange={e=>setTo(e.target.value)} style={{display:'block',padding:10}}/></label><button disabled={busy}>Search</button><button type="button" disabled={busy} onClick={()=>{const r=currentMonthlyWeek();setFrom(r.fromDate);setTo(r.toDate);setRange(r);}}>Current Week</button>
 <label>District Manager<input type="search" list="missing-weekly-manager-options" placeholder="All managers / type to search" value={manager} onChange={e=>setManager(e.target.value)}/><datalist id="missing-weekly-manager-options">{managers.map(([id,name])=><option key={id} value={name}>{id}</option>)}</datalist></label>
 <input type="search" aria-label="Search missing operators" placeholder="Operator name or ID" value={search} onChange={e=>setSearch(e.target.value)} style={{padding:10}}/>
 </form>
 {busy?<p role="status">Loading...</p>:error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:<><p>{data.length} operators missing weekly reports · {visible.length} shown</p><div style={{flex:1,minHeight:0,overflow:'auto',background:'#fff'}}><table className="device-table"><thead><tr><th>Operator Name</th><th>Operator ID</th><th>District Manager Name</th><th>Week / Date Range</th></tr></thead><tbody>{visible.map(o=><tr key={o.operatorId}><td>{o.operatorName||'—'}</td><td>{o.operatorId}</td><td>{o.managerName||'Unassigned'}</td><td>{range.fromDate} to {range.toDate}</td></tr>)}</tbody></table>{!visible.length&&<p>{data.length?'No operators match your search.':'All active operators have weekly reports covering this range.'}</p>}</div></>}
 </div>;
}
