import ExcelJS from 'exceljs';
export async function downloadLockHistory(rows,filters){
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Lock History',{views:[{state:'frozen',ySplit:4}]});
 sheet.addRow(['Lock & Unlock History']);sheet.mergeCells('A1:H1');
 sheet.addRow(['Dates (IST): '+(filters.from||'Any')+' to '+(filters.to||'Any')+' | Performed By: '+filters.source+' | Reason: '+(filters.reason||'All')+' | Search: '+(filters.search||'All')+' | Rows: '+rows.length+' (latest 1,000 matching actions maximum)']);sheet.mergeCells('A2:H2');sheet.getRow(2).alignment={wrapText:true};sheet.getRow(2).height=42;
 sheet.addRow([]);sheet.addRow(['Date & Time (IST)','Action','Laptop','Operator ID','Operator Name','Reason','Performed By','Role']);
 for(const r of rows)sheet.addRow([new Date(r.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}),r.action==='locked'?'Locked':'Unlocked',String(r.laptopName||''),String(r.operatorId||''),String(r.operatorName||''),String(r.reason||''),String(r.performedBy||''),String(r.performedByRole||'')]);
 [26,14,28,20,30,65,30,22].forEach((width,i)=>{sheet.getColumn(i+1).width=width;});
 sheet.getRow(1).font={bold:true,size:16};sheet.getRow(4).eachCell(cell=>{cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1E4E8C'}};});
 sheet.getColumn(6).alignment={wrapText:true,vertical:'top'};sheet.autoFilter={from:{row:4,column:1},to:{row:4+rows.length,column:8}};
 const buffer=await workbook.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const link=document.createElement('a');link.href=url;link.download='Lock_Unlock_History_'+(filters.from||'all')+'_'+(filters.to||'dates')+'.xlsx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
