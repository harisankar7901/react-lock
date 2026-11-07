import React,{useId,useState} from 'react';
export default function OperatorCombobox({operators,value,onChange}) {
 const id=useId();
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0);
 const label=o=>o ? (o.operatorName || o.operatorId)+' — '+o.operatorId : '';
 const selected=operators.find(o=>o.operatorId===value);
 const matches=operators.filter(o=>[o.operatorName,o.operatorId].some(v=>String(v||'').toLowerCase().includes(query.trim().toLowerCase())));
 const choose=o=>{onChange(o.operatorId);setOpen(false);setQuery('');};
 return <div style={{position:'relative',width:320,maxWidth:'100%'}}>
  <label htmlFor={id}>Operator</label>
  <div style={{position:'relative'}}>
   <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id+'-list'} aria-activedescendant={open&&matches[active]?id+'-option-'+active:undefined} autoComplete="off" placeholder="Select or type operator name / ID" value={open?query:label(selected)}
    onFocus={()=>{setQuery('');setActive(0);setOpen(true);}}
    onClick={()=>{if(!open){setQuery('');setActive(0);setOpen(true);}}}
    onChange={e=>{setQuery(e.target.value);setActive(0);setOpen(true);}}
    onBlur={()=>{setOpen(false);setQuery('');}}
    onKeyDown={e=>{
     if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(n=>Math.max(0,Math.min(matches.length-1,n+(e.key==='ArrowDown'?1:-1))));}
     if(e.key==='Enter'&&open){e.preventDefault();if(matches[active])choose(matches[active]);}
     if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);setQuery('');}
    }} style={{display:'block',width:'100%',boxSizing:'border-box',padding:'11px 32px 11px 12px',border:'1px solid #cbd5e1',borderRadius:6,background:'#fff'}}/>
   <span aria-hidden="true" style={{position:'absolute',right:12,top:10,pointerEvents:'none',color:'#64748b'}}>▾</span>
  </div>
  {open&&<div id={id+'-list'} role="listbox" aria-label="Operators" style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,maxHeight:280,overflowY:'auto',background:'#fff',border:'1px solid #cbd5e1',borderRadius:6,boxShadow:'0 8px 24px #0f172a22'}}>
   {!matches.length?<div role="status" style={{padding:12,color:'#64748b'}}>No matching operators</div>:matches.map((o,index)=><div id={id+'-option-'+index} key={o.operatorId} role="option" aria-selected={o.operatorId===value} ref={node=>{if(node&&index===active)node.scrollIntoView({block:'nearest'});}} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(o)} onMouseEnter={()=>setActive(index)} style={{padding:'10px 12px',cursor:'pointer',background:index===active?'#eff6ff':'#fff',color:'#1e293b',fontSize:13}}>{label(o)}</div>)}
  </div>}
 </div>;
}
