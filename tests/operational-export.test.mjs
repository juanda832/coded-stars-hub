import test from 'node:test'
import assert from 'node:assert/strict'
import {operationalExport,exportMeetings} from '../lib/operational-export.ts'
import {writeWorkbook} from '../lib/export-workbook.ts'
import {inflateRawSync,crc32} from 'node:zlib'
const now=Date.parse('2026-11-23T12:00:00Z')
const meeting=(id,days,extra={})=>({id,title:'JDP '+id,program:'Orlando',language:'Español',startsAt:new Date(now+days*86400000).toISOString(),status:'scheduled',host:'Equipo',hostId:'h',duration:60,joinUrl:'https://private.example/secret',...extra})
const data={user:{role:'admin',email:'private@example.com'},workspace:'review',meetings:[meeting('upcoming',1,{schoolName:'=2+2 & <CODED>'}),meeting('past',-2),meeting('later',8),meeting('cancelled',-1,{status:'cancelled'})],registrations:[{meetingId:'upcoming',userId:'s',status:'confirmed'},{meetingId:'past',userId:'s',status:'confirmed'}],assignedStars:[{userId:'s',name:'Star de prueba'}],reports:[{meetingId:'past',role:'star',meetingHeld:'unknown',starJoined:'yes',wasInvited:'yes',testimony:'yes',families:'yes',issues:[],comment:'PRIVATE_COMMENT',createdAt:new Date(now).toISOString()}],reportReviews:[]}
test('Periods filter the meeting cohort without counting cancelled future meetings',()=>{assert.deepEqual(exportMeetings(data.meetings,'7',now).map(m=>m.id),['upcoming']);assert.equal(exportMeetings(data.meetings,'30',now).length,2);assert.equal(exportMeetings(data.meetings,'history',now).length,2)})
test('Export keeps distinct report sources, local hours and numeric counts; excludes private fields',()=>{
 const sheets=operationalExport(data,'all','America/La_Paz',now)
 assert.deepEqual(sheets.map(s=>s.name),['Resumen','Agenda','Resultados'])
 const serialized=JSON.stringify(sheets)
 for(const value of ['private@example.com','private.example/secret','PRIVATE_COMMENT'])assert.ok(!serialized.includes(value))
 assert.equal(sheets[1].rows.find(r=>r[0]==='upcoming')[4],'2026-11-24 08:00')
 assert.equal(sheets[2].rows[0][2],'Star')
 assert.equal(sheets[0].rows.find(r=>r[0]==='Reuniones')[1],4)
})
test('Non-admin roles cannot generate the workbook data',()=>{for(const role of ['host','star'])assert.throws(()=>operationalExport({...data,user:{role}},'all','UTC',now))})
test('OOXML is a valid ZIP with three sheets, frozen headers, filters, literal formula-like strings',()=>{
 const buffer=writeWorkbook(operationalExport(data,'all','UTC',now))
 const files=new Map();let i=0
 while(buffer.readUInt32LE(i)===0x04034b50){
  const length=buffer.readUInt32LE(i+18),nameLength=buffer.readUInt16LE(i+26),start=i+30+nameLength
  const raw=inflateRawSync(buffer.subarray(start,start+length))
  assert.equal(crc32(raw),buffer.readUInt32LE(i+14))
  files.set(buffer.subarray(i+30,start).toString(),raw.toString());i=start+length
 }
 assert.equal(files.size,8);assert.equal(buffer.readUInt32LE(i),0x02014b50)
 const sheet=files.get('xl/worksheets/sheet2.xml')
 assert.match(sheet,/autoFilter ref="A1:O5"/);assert.match(sheet,/state="frozen"/)
 assert.match(sheet,/t="inlineStr"><is><t xml:space="preserve">=2\+2 &amp; &lt;CODED&gt;/)
 assert.ok(!sheet.includes('<f>'))
 assert.match(files.get('xl/workbook.xml'),/name="Resultados"/)
})
