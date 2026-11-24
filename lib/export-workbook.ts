import {crc32,deflateRawSync} from 'node:zlib'
import type {ExportCell,ExportSheet} from './operational-export'

// Minimal OOXML writer: data cells are always literal strings or finite numbers.
// No formulas, macros, external relationships or hyperlinks are emitted.
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const pkg='http://schemas.openxmlformats.org/package/2006/relationships'
function xml(value:string){
 return value.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu,'').replace(/_x[0-9a-f]{4}_/gi,m=>'_x005F_'+m.slice(1)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!))
}
function column(index:number){let value=index+1,result='';while(value){value--;result=String.fromCharCode(65+value%26)+result;value=Math.floor(value/26)}return result}
function cell(value:ExportCell,reference:string,style:number){
 if(typeof value==='number'&&Number.isFinite(value))return '<c r="'+reference+'" s="'+style+'"><v>'+value+'</v></c>'
 return '<c r="'+reference+'" s="'+style+'" t="inlineStr"><is><t xml:space="preserve">'+xml(String(value).slice(0,32767))+'</t></is></c>'
}
function worksheet(sheet:ExportSheet){
 const rows=[sheet.headers,...sheet.rows]
 if(rows.length>1048576||sheet.headers.length>16384)throw Error('El informe supera el límite de Excel.')
 const columns=sheet.headers.map((_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.min(100,Math.max(10,sheet.widths[i]||20))+'" customWidth="1"/>').join('')
 const data=rows.map((row,i)=>'<row r="'+(i+1)+'"'+(i===0?' ht="30" customHeight="1"':sheet.name==='Resumen'&&String(row[1]).length>100?' ht="48" customHeight="1"':'')+'>'+row.map((value,j)=>cell(value,column(j)+(i+1),i===0?1:i%2===1?2:3)).join('')+'</row>').join('')
 return declaration+'<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>'+columns+'</cols><sheetData>'+data+'</sheetData>'+(sheet.name==='Resumen'?'':'<autoFilter ref="A1:'+column(sheet.headers.length-1)+rows.length+'"/>')+'</worksheet>'
}
const styles=declaration+'<styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF34007F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5F0FC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
function zip(files:Record<string,string>){
 const local:Buffer[]=[],central:Buffer[]=[];let offset=0
 for(const [name,contents] of Object.entries(files)){
  const path=Buffer.from(name),raw=Buffer.from(contents),compressed=deflateRawSync(raw,{level:6}),checksum=crc32(raw)
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(checksum,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(raw.length,22);header.writeUInt16LE(path.length,26)
  const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(8,10);entry.writeUInt16LE(33,14);entry.writeUInt32LE(checksum,16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(raw.length,24);entry.writeUInt16LE(path.length,28);entry.writeUInt32LE(offset,42)
  local.push(header,path,compressed);central.push(entry,path);offset+=header.length+path.length+compressed.length
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22)
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16)
 return Buffer.concat([...local,directory,end])
}
export function writeWorkbook(sheets:ExportSheet[]){
 const files:Record<string,string>={
 '[Content_Types].xml':declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>',
 '_rels/.rels':declaration+'<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+rel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':declaration+'<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><bookViews><workbookView/></bookViews><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>',
 'xl/_rels/workbook.xml.rels':declaration+'<Relationships xmlns="'+pkg+'">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="'+rel+'/styles" Target="styles.xml"/></Relationships>',
 'xl/styles.xml':styles
 }
 sheets.forEach((s,i)=>{files['xl/worksheets/sheet'+(i+1)+'.xml']=worksheet(s)})
 return zip(files)
}
