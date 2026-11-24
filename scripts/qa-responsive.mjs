// Browser layout audit of the disposable local demo. Never points at production.
import assert from 'node:assert/strict'
const origin=process.env.CODED_QA_ORIGIN||'http://127.0.0.1:3055'
const cdp=process.env.CODED_QA_CDP||'http://127.0.0.1:9355'
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname))
assert.equal(new URL(origin).protocol,'http:')
assert.ok(['127.0.0.1','localhost'].includes(new URL(cdp).hostname))
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
let tab,ws
let seq=0
const promises=new Map()
const failures=[]
let checked=0

function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++seq
  promises.set(id,{resolve,reject})
  ws.send(JSON.stringify({id,method,params}))
 })
}
async function run(expression){
 const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text)
 return result.result?.value
}
async function waitFor(expression,attempts=60){
 for(let n=0;n<attempts;n++){
  if(await run(expression))return true
  await delay(120)
 }
 throw Error('Expected UI state did not appear: '+expression)
}
async function resize(width,height){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=760})
 await delay(90)
}
const measureExpression=String.raw`(()=>{
 const measure=selector=>{
  const item=document.querySelector(selector)
  if(!item)return null
  const rect=item.getBoundingClientRect()
  return {
   x:rect.x,right:rect.right,top:rect.top,bottom:rect.bottom,
   h:rect.height,w:rect.width,display:getComputedStyle(item).display,
   scrollHeight:item.scrollHeight,clientHeight:item.clientHeight,
   scrollWidth:item.scrollWidth,clientWidth:item.clientWidth,
   overflowY:getComputedStyle(item).overflowY
  }
 }
 const nav=measure('.mobile-bottom-nav')
 const composer=measure('.assistant-compose-area')
 const inner=measure('.assistant-content')
 const main=measure('.main')
 const content=measure('.professional-content')
 const starters=Array.from(document.querySelectorAll('.assistant-starters>button')).map(x=>{
  const r=x.getBoundingClientRect();return {left:r.left,right:r.right}
 })
 const root=document.documentElement
 const overlap=nav&&nav.display!=='none'&&composer&&composer.bottom>nav.top-2
 return {
  width:window.innerWidth,height:window.innerHeight,
  documentWidth:root.scrollWidth,clientWidth:root.clientWidth,
  nav,composer,inner,main,content,starters,overlap,
  hasAssistant:!!document.querySelector('.assistant-page')
 }
})()`
async function inspect(label,width,height){
 await resize(width,height)
 let data=await run(measureExpression)
 const errors=[]
 if(data.documentWidth>data.clientWidth+2)errors.push('horizontal-document-overflow')
 if(data.main&&(data.main.x< -2||data.main.right>width+2))errors.push('main-container-outside-screen')
 if(data.content&&(data.content.x< -2||data.content.right>width+2))errors.push('page-content-outside-screen')
 if(data.hasAssistant){
  if(data.starters.some(b=>b.left< -2||b.right>width+2))errors.push('starter-outside-screen')
  if(data.inner&&data.inner.scrollWidth>data.inner.clientWidth+2)errors.push('assistant-panel-horizontal-overflow')
  if(data.overlap){
   if(!label.includes('/actual-response')&&!label.includes('/expanded-composer')&&data.inner&&data.inner.overflowY!=='visible'&&data.inner.scrollHeight>data.inner.clientHeight){
    await run('document.querySelector(".assistant-content").scrollTop=99999')
    data=await run(measureExpression)
   }
   if(data.overlap)errors.push('composer-covered-by-mobile-navigation')
  }
  const entry=await run('!!document.querySelector("#assistant-input")')
  if(!entry)errors.push('assistant-input-missing')
 }
 checked++
 if(errors.length)failures.push({label,width,height,errors,details:{nav:data.nav?.top,composer:data.composer?.bottom,inner:data.inner?.h}})
 if(errors.length)console.log('FAIL',label,width+'x'+height,errors.join(','))
}
async function navigate(label){
 await resize(1024,768)
 const ok=await run('(()=>{const buttons=Array.from(document.querySelectorAll(".sidebar .nav-item"));const target=buttons.find(b=>b.textContent.trim().includes('+JSON.stringify(label)+'));if(!target)return false;target.click();return true})()')
 if(!ok)throw Error('Navigation missing: '+label)
 await delay(170)
}
async function login(role){
 await resize(1024,800)
 await waitFor('!!document.querySelector(".access-roles")',85)
 const selected=await run('(()=>{const b=Array.from(document.querySelectorAll(".access-roles button")).find(x=>x.textContent.includes('+JSON.stringify(role)+'));if(!b)return false;b.click();return true})()')
 if(!selected)throw Error('Demo role selector missing: '+role)
 await run('document.querySelector(".access-card .primary.full").click()')
 await waitFor('!!document.querySelector(".sidebar .nav-item")',85)
}
async function logout(){
 await resize(1024,800)
 await run('(()=>{const b=document.querySelector(".sidebar .side-bottom button[aria-label=\'Cerrar sesión\']");if(!b)throw Error("Sign out button missing");b.click();return true})()')
 await waitFor('!!document.querySelector(".access-roles")',85)
}
const variants=[[320,460],[320,568],[320,740],[375,667],[390,844],[430,932],[600,850],[667,375],[700,500],[730,820],[760,800],[768,800],[1024,768],[1440,900]]
try{
 tab=await(await fetch(cdp+'/json/new?'+origin+'/',{method:'PUT'})).json()
 ws=new WebSocket(tab.webSocketDebuggerUrl)
 ws.onmessage=event=>{
  const msg=JSON.parse(event.data)
  if(msg.id&&promises.has(msg.id)){
   const p=promises.get(msg.id);promises.delete(msg.id)
   msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result)
  }
 }
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject})
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable')
 // Reset only this disposable Chrome profile: each suite must start logged out.
 await send('Network.clearBrowserCookies')
 await send('Page.navigate',{url:origin+'/'})
 console.log('QA_STAGE: admin login')
 await login('Administración')
 const pages=['Inicio','Reuniones','Solicitudes','Mensajes','Publicaciones','Ayuda','Revisión beta','Cuentas','Mi cuenta']
 for(const page of pages){
  console.log('QA_ADMIN_PAGE',page)
  await navigate(page)
  if(page==='Ayuda')await waitFor('!!document.querySelector(".assistant-page")')
  for(const [width,height] of variants)await inspect('admin/'+page,width,height)
  if(page==='Ayuda'){
   // Stress the actual assistant message layout with an unbroken URL-like token.
   // Only changes this browser tab's DOM; it does not write any Hub records.
   await run(`(()=>{
     const host=document.querySelector('.assistant-scroll')
     const item=document.createElement('article')
     item.className='assistant-message assistant'
     item.dataset.qaLayoutOnly='1'
     const body=document.createElement('div')
     body.className='assistant-message-body'
     const text=document.createElement('div')
     text.className='assistant-text'
     const paragraph=document.createElement('p')
     paragraph.textContent='https://example.com/'+ 'a'.repeat(1800)
     text.append(paragraph)
     body.append(text)
     item.append(body)
     host.append(item)
     return true
   })()`)
   for(const [width,height] of [[320,568],[320,740],[375,667],[430,932],[600,850],[700,500],[730,820],[760,800],[1024,768]])await inspect('admin/Ayuda/long-response',width,height)
   await run('document.querySelectorAll("[data-qa-layout-only]").forEach(node=>node.remove())')
   await run('document.querySelector("#assistant-input").style.height="130px"')
   for(const [width,height] of [[320,568],[375,667],[667,375],[730,820],[760,800]])await inspect('admin/Ayuda/expanded-composer',width,height)
   await resize(375,667)
   await waitFor('!!document.querySelector("#assistant-input") && !document.querySelector("#assistant-input").disabled')
   await run('(()=>{const textarea=document.querySelector("#assistant-input");textarea.style.height="auto";textarea.focus();return true})()')
   await send('Input.insertText',{text:'¿Qué reuniones hay?'})
   await waitFor('document.querySelector("#assistant-input").value.length>=10')
   await waitFor('document.querySelector(".assistant-composer>button").disabled===false')
   const previous=await run('document.querySelectorAll(".assistant-message.assistant").length')
   await run('document.querySelector(".assistant-composer>button").click()')
   await waitFor('document.querySelectorAll(".assistant-message.assistant").length>'+previous,140)
   await waitFor('!document.querySelector("#assistant-input").disabled',140)
   for(const [width,height] of [[320,568],[375,667],[667,375],[730,820],[760,800],[1024,768]])await inspect('admin/Ayuda/actual-response',width,height)
  }
 }
 console.log('QA_STAGE: admin logout');await logout()
 console.log('QA_STAGE: star login');await login('Coded Star')
 for(const page of ['Inicio','Reuniones','Mensajes','Ayuda','Mi cuenta']){
  await navigate(page)
  for(const [width,height] of variants)await inspect('star/'+page,width,height)
 }
 console.log('QA_STAGE: star logout');await logout()
 console.log('QA_STAGE: host login');await login('Anfitrión')
 for(const page of ['Inicio','Reuniones','Mensajes','Ayuda','Mi cuenta']){
  await navigate(page)
  for(const [width,height] of variants)await inspect('host/'+page,width,height)
 }
 console.log('RESPONSIVE_AUDIT_CHECKS',checked,'FAILURES',failures.length)
 if(failures.length){console.log('FAILURE_DETAILS',JSON.stringify(failures.slice(0,20)));process.exitCode=1}
}catch(error){
 console.error('RESPONSIVE_AUDIT_ERROR',error.message)
 process.exitCode=1
}finally{
 ws?.close()
 if(tab?.id)await fetch(cdp+'/json/close/'+tab.id).catch(()=>{})
}
