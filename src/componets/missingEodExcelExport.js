import ExcelJS from 'exceljs';
export async function downloadMissingEod(result){
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Missing EOD',{views:[{state:'frozen',ySplit:1}]});
 sheet.columns=[{header:'SL NO',key:'number',width:10},{header:'Operator ID',key:'operatorId',width:22},{header:'Operator Name',key:'operatorName',width:30},{header:'District Manager Name',key:'managerName',width:30},{header:'Date Range',key:'range',width:28},{header:'Missing Dates',key:'missing',width:65}];
 result.data.forEach((r,i)=>sheet.addRow({number:i+1,operatorId:String(r.operatorId),operatorName:String(r.operatorName||''),managerName:String(r.managerName||''),range:result.fromDate+' to '+result.toDate,missing:(r.missingDates||[]).join(', ')}));
 sheet.getRow(1).font={bold:true};sheet.getColumn('missing').alignment={wrapText:true};sheet.autoFilter={from:{row:1,column:1},to:{row:result.data.length+1,column:6}};
 const data=await workbook.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download='Missing_EOD_'+result.fromDate+'_'+result.toDate+'.xlsx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
