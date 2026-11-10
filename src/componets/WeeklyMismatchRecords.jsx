import './WeeklyMismatchRecords.css';
import MissingWeeklyReports from './MissingWeeklyReports.jsx';
import React,{useEffect,useState} from 'react';
import api from '../api/api.js';
import {currentMonthlyWeek} from './currentMonthlyWeek.js';
export default function WeeklyMismatchRecords({onClose}){
 const [manager,setManager]=useState('');
 const [showMissingWeekly,setShowMissingWeekly]=useState(false);
 const [range,setRange]=useState(currentMonthlyWeek),[fromDate,setFromDate]=useState(()=>currentMonthlyWeek().fromDate),[toDate,setToDate]=useState(()=>currentMonthlyWeek().toDate),[rows,setRows]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();setBusy(true);setError('');setRows([]);
 api.get('devices/reports/weekly-mismatches',{params:{summary:true,...range},signal:c.signal}).then(({data})=>{if(!c.signal.aborted)setRows(data.rows||[]);}).catch(e=>{if(!c.signal.aborted)setError(e.response?.data?.message||'Unable to load mismatches.');}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[range]);
 const managers=[...new Map(rows.map(r=>[r.managerId,r.managerName])).entries()];
 const visibleRows=rows.filter(r=>!manager||r.managerName.toLowerCase().includes(manager.toLowerCase())||r.managerId.toLowerCase().includes(manager.toLowerCase()));
 return <div className="weekly-mismatch-page" role="dialog" aria-modal="true" aria-labelledby="weekly-title" style={{position:'fixed',inset:0,zIndex:220,background:'#f1f5f9',padding:24,display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
 {showMissingWeekly && <MissingWeeklyReports onClose={()=>setShowMissingWeekly(false)}/>}
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="weekly-title">Weekly Mismatch Records</h2><button onClick={onClose}>Close</button></header>
 <p>Weekly EOD mismatches and their sync status in daily EOD. Includes weekly reports overlapping the selected dates.</p>
 <form onSubmit={e=>{e.preventDefault();setRange({fromDate,toDate});}} style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'end',marginBottom:20}}>
 <label>From Date<input style={{display:'block',padding:10}} type="date" required value={fromDate} max={toDate} onChange={e=>setFromDate(e.target.value)}/></label>
 <label>To Date<input style={{display:'block',padding:10}} type="date" required value={toDate} min={fromDate} onChange={e=>setToDate(e.target.value)}/></label>
 <label>District Manager<input type="search" list="weekly-manager-options" placeholder="All managers / type to search" value={manager} onChange={e=>setManager(e.target.value)}/><datalist id="weekly-manager-options">{managers.map(([id,name])=><option key={id} value={name}>{id}</option>)}</datalist></label>
 <button type="button" onClick={()=>setShowMissingWeekly(true)} style={{padding:"10px 14px",background:"#b45309",color:"#fff",border:0,borderRadius:6}}>Missing Weekly Report</button><button disabled={busy}>Search</button><button type="button" disabled={busy} onClick={()=>{const r=currentMonthlyWeek();setFromDate(r.fromDate);setToDate(r.toDate);setRange(r);}}>Current Week</button>
 </form>
 {busy?<p role="status">Checking all operators...</p>:error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:!visibleRows.length?<p>No mismatches found for the selected range.</p>:<div style={{flex:1,minHeight:0,overflow:'auto',background:'#fff'}}><table className="device-table"><thead><tr><th>Operator Name</th><th>Operator ID</th><th>Week / Report Range</th><th>Total EOD Records</th><th>Mismatch Records</th><th>Data Sync</th></tr></thead><tbody>{visibleRows.map(row=><tr key={row.operatorId+'_'+row.fromDate+'_'+row.toDate}><td>{row.operatorName||'—'}</td><td>{row.operatorId}</td><td>{row.fromDate} to {row.toDate}</td><td>{row.totalEodRecords??0}</td><td>{row.mismatchCount}</td><td style={{color:row.dataSynced?"#15803d":"#b91c1c",fontWeight:700}} title={row.dataSynced?"All mismatch records synced":"Sync pending or incomplete"}>{row.dataSynced?"✓":"✗"}</td></tr>)}</tbody></table></div>}
 </div>;
}
