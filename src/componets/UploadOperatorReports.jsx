import React,{useState} from 'react';
import api from '../api/api.js';
export default function UploadOperatorReports({device,onClose}){
 const [kind,setKind]=useState('weekly'),[file,setFile]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const upload=async event=>{
  event.preventDefault();if(!file)return;
  if(file.size>100*1024*1024){setError('Maximum file size is 100 MiB.');return;}
  setBusy(true);setError('');setSuccess('');
  try{const body=new FormData();body.append('file',file);const {data}=await api.post('devices/'+encodeURIComponent(device.deviceId)+'/reports-on-behalf/'+kind,body,{timeout:300000});setSuccess('Report uploaded successfully. '+(data.data?.importedRows??0)+' rows imported.');setFile(null);}
  catch(e){setError(e.response?.data?.message||'Upload failed. Please try again.');}finally{setBusy(false);}
 };
 return <div role="dialog" aria-modal="true" aria-labelledby="upload-report-title" style={{position:'fixed',inset:0,zIndex:230,background:'#0f172a88',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
  <form onSubmit={upload} style={{width:600,maxWidth:'100%',maxHeight:'95vh',overflow:'auto',background:'#fff',borderRadius:14,padding:24,boxSizing:'border-box'}}>
   <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="upload-report-title">Upload Reports</h2><button type="button" onClick={onClose} disabled={busy}>Close</button></header>
   <p><strong>{device.operatorName||device.operatorId}</strong> · {device.operatorId}<br/>{device.laptopName}</p>
   <fieldset disabled={busy} style={{border:'1px solid #dbe3ef',borderRadius:8,padding:16}}><legend>Report type</legend><div style={{display:'flex',gap:16,flexWrap:'wrap'}}>{[['weekly','Weekly EOD'],['eod','EOD'],['offgov','OFF Govt. MIS']].map(([value,label])=><label key={value}><input type="radio" name="reportType" value={value} checked={kind===value} onChange={()=>{setKind(value);setFile(null);setError('');setSuccess('');}}/> {label}</label>)}</div></fieldset>
   <p>{kind==='weekly'?'Upload the weekly ZIP containing its HTML report.':kind==='eod'?'Upload the EOD ZIP containing its CSV or XLSX report.':'Upload the OFF Govt. MIS Excel (.xlsx) report.'} The file must contain only this operator’s records.</p>
   <input key={kind+success} type="file" aria-label="Report file" accept={kind==='offgov'?'.xlsx':'.zip'} required disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setError('');}}/>
   {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}{success&&<p role="status" style={{color:'#15803d'}}>{success}</p>}
   <footer style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:24}}><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" disabled={busy||!file} style={{background:'#2563eb',color:'#fff',border:0,borderRadius:6,padding:'10px 18px'}}>{busy?'Uploading...':'Upload Report'}</button></footer>
  </form>
 </div>;
}
