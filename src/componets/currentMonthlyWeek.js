export function currentMonthlyWeek(now = new Date()) {
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const start=Math.floor((Number(parts.day)-1)/7)*7+1;
 const last=new Date(Date.UTC(Number(parts.year),Number(parts.month),0)).getUTCDate();
 const prefix=parts.year+'-'+parts.month+'-';
 return {fromDate:prefix+String(start).padStart(2,'0'),toDate:prefix+String(Math.min(start+6,last)).padStart(2,'0')};
}
