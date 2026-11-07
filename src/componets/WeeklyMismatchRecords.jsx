import OperatorCombobox from './OperatorCombobox.jsx';
import React,{useEffect,useState} from 'react';
import api from '../api/api.js';
export default function WeeklyMismatchRecords({onClose}){
 const [operators,setOperators]=useState([]),[operator,setOperator]=useState(''),[weeks,setWeeks]=useState([]),[week,setWeek]=useState(''),[page,setPage]=useState(1),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
 const [fromDate,setFromDate]=useState(''),[toDate,setToDate]=useState(''),[range,setRange]=useState(null);
 useEffect(()=>{
  const c=new AbortController();setBusy(true);setError('');setResult(null);
  const params={};if(operator)params.operatorId=operator;
  if(range)Object.assign(params,{...range,rangeSearch:true,page});
  else if(week){const [fromDate,toDate]=week.split('_');Object.assign(params,{fromDate,toDate,page});}
  api.get('devices/reports/weekly-mismatches',{params,signal:c.signal}).then(({data})=>{
   if(c.signal.aborted)return;
   if(!operator)setOperators(data.operators);else if(!week&&!range)setWeeks(data.weeks);else setResult(data);
  }).catch(e=>{if(!c.signal.aborted)setError(e.response?.data?.message||'Unable to load weekly mismatch records.');}).finally(()=>{if(!c.signal.aborted)setBusy(false);});
  return()=>c.abort();
 },[operator,week,range,page,refresh]);
 const columns=[...new Set((result?.rows||[]).flatMap(row=>row.columns))];
 return <div style={{position:'fixed',inset:0,zIndex:220,background:'#f1f5f9',padding:24,display:'flex',flexDirection:'column',boxSizing:'border-box'}} role="dialog" aria-modal="true" aria-labelledby="weekly-mismatch-title">
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}><h2 id="weekly-mismatch-title">Weekly Mismatch Records</h2><button onClick={onClose}>Close</button></header>
  <p>Weekly EOD entries missing from daily EOD records, matched by Enrolment No. and Date. Date range searches include weekly reports overlapping the selected dates.</p>
  <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'end',marginBottom:16}}>
   <OperatorCombobox operators={operators} value={operator} onChange={value=>{setOperator(value);setRange(null);setWeek('');setWeeks([]);setPage(1);}}/>
   <label>Week / report range<select style={{display:'block',padding:10}} value={week} disabled={!operator||!weeks.length} onChange={e=>{setWeek(e.target.value);setRange(null);setPage(1);}}><option value="">Select week</option>{weeks.map(w=><option key={w.fromDate+'_'+w.toDate} value={w.fromDate+'_'+w.toDate}>{w.fromDate} to {w.toDate}</option>)}</select></label>
   <label>From Date<input type="date" style={{display:'block',padding:10}} value={fromDate} max={toDate||undefined} onChange={e=>setFromDate(e.target.value)}/></label>
   <label>To Date<input type="date" style={{display:'block',padding:10}} value={toDate} min={fromDate||undefined} onChange={e=>setToDate(e.target.value)}/></label>
   <button disabled={busy||!operator||!fromDate||!toDate||fromDate>toDate} onClick={()=>{setWeek('');setPage(1);setRange({fromDate,toDate});}}>Search Date Range</button>
   <button disabled={busy} onClick={()=>setRefresh(n=>n+1)}>Refresh</button>
  </div>
  {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
  {busy?<p role="status">Checking records...</p>:!error&&operator&&!weeks.length&&!week&&!range?<p>No weekly EOD reports found for this operator.</p>:null}
  {!busy&&result&&<><p><strong>{result.totalWeekly}</strong> weekly entries · <strong>{result.matched}</strong> matched · <strong>{result.total}</strong> extra weekly entries</p>
   {result.total===0?<p>No mismatches found for this operator and selected range.</p>:<><div style={{flex:1,minHeight:0,overflow:'auto',background:'#fff'}}><table className="device-table"><thead><tr><th>Weekly report range</th>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{result.rows.map(row=><tr key={row.enrolmentNoDate}><td style={{whiteSpace:"nowrap"}}>{row.fromDate} to {row.toDate}</td>{columns.map(c=><td key={c}>{row.values[row.columns.indexOf(c)]||'—'}</td>)}</tr>)}</tbody></table></div><div style={{display:'flex',gap:16,alignItems:'center',paddingTop:12}}><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {Math.ceil(result.total/result.pageSize)}</span><button disabled={page*result.pageSize>=result.total} onClick={()=>setPage(p=>p+1)}>Next</button></div></>}
  </>}
 </div>;
}
