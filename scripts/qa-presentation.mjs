// Presentation regression audit. Use only a disposable local demo and isolated Chrome profile.
import assert from 'node:assert/strict'
const origin=process.env.CODED_QA_ORIGIN||'http://127.0.0.1:3058'
const cdp=process.env.CODED_QA_CDP||'http://127.0.0.1:9359'
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

 await login('Administración')
 const check=async (label,expression)=>{await waitFor(expression);checked++;console.log('PASS',label)}
 await check('initial dashboard','!!document.querySelector(".sidebar")')
 await check('admin coordination queue','!!document.querySelector(".coordination-queue")')
 await check('staff welcome has a contextual next step','!!document.querySelector(".welcome-next-action")')
 await check('three navigation groups','document.querySelectorAll(".sidebar .nav-group").length===3')
 await run('document.querySelector(".welcome-secondary").click()')
 await check('welcome shortcut opens requests','!!document.querySelector(".application-manager")')
 await navigate('Inicio')
 await check('welcome restored','!!document.querySelector(".staff-welcome-premium")')
 await resize(375,800)
 await run('document.querySelector(".menu-btn").click()')
 await check('mobile navigation groups','document.querySelectorAll(".mobile-menu-dialog .nav-group").length===3')
 await run('document.querySelector(".mobile-menu-dialog .dialog-close").click()')
 await check('mobile menu closes','!document.querySelector(".mobile-menu-dialog")')
 for(const width of [320,375,768,1440]){
  await resize(width,800)
  await check('staff welcome fits '+width,'(()=>{const r=document.querySelector(".staff-welcome-premium").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()')
  await check('coordination queue fits '+width,'(()=>{const r=document.querySelector(".coordination-queue").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1})()')
 }
 await resize(1024,800)
 await run('document.querySelector(".hub-quick-find").focus();document.querySelector(".hub-quick-find").click()')
 await check('search input focused','document.activeElement?.matches("[data-dialog-initial-focus]")')
 await send('Input.insertText',{text:'estadisticas'})
 await check('accent-insensitive search','document.querySelector(".quick-find-results")?.textContent.includes("Estadísticas")')
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
 await check('search restores focus','!document.querySelector("dialog[open]")&&document.activeElement?.matches(".hub-quick-find")')
 await run('(()=>{const e=document.querySelector(".zone-select select");e.value="Europe/Madrid";e.dispatchEvent(new Event("change",{bubbles:true}));return true})()')
 await check('saved time zone','localStorage.getItem("coded-zone")==="Europe/Madrid"')
 await send('Page.reload',{ignoreCache:true})
 await check('restored time zone after reload','document.querySelector(".zone-select select")?.value==="Europe/Madrid"')
 for(const [name,selector] of [['Solicitudes','.application-manager'],['Seguimiento','.coordination-results'],['Estadísticas','.hub-insights'],['Cuentas','.managed-directory'],['Mi cuenta','.account-summary'],['Ayuda','.assistant-page']]){
  await navigate(name);await check('admin '+name,'!!document.querySelector('+JSON.stringify(selector)+')&&!document.querySelector(".section-loading")')
 }
 await navigate('Estadísticas')
 await check('Excel controls visible','!!document.querySelector(".operational-export")')
 await run('(()=>{const s=document.querySelector(".export-controls select");s.value="all";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()')
 await check('all meetings export selected','document.querySelector(".export-controls select").value==="all"')
 await run('document.querySelector(".export-controls .primary").click()')
 await check('download completed','document.querySelector(".export-result")?.textContent.includes("Archivo preparado")')
 for(const width of [320,375,768,1440]){
  await resize(width,800)
  await check('export fits '+width,'(()=>{const r=document.querySelector(".operational-export").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1})()')
 }
 await navigate('Ayuda')
 await check('automatic help is clearly labelled','document.querySelector(".assistant-compose-note")?.textContent.includes("Respuestas automáticas")')
 await check('no simulated typing controls','!document.querySelector(".assistant-pace,.assistant-reveal-controls")')
 await run('document.querySelector("#assistant-input").focus()')
 await send('Input.insertText',{text:'¿Qué reuniones hay?'})
 await check('question entered','document.querySelector("#assistant-input")?.value.includes("reuniones")')
 await run('document.querySelector(".assistant-composer>button").click()')
 await check('complete answer and actions visible','!!document.querySelector(".assistant-message.assistant .assistant-text p")?.textContent&&!!document.querySelector(".assistant-message.assistant .assistant-message-tools")&&!document.querySelector(".assistant-text-cursor")')
 await navigate('Solicitudes')
 await check('criteria editor available','!!document.querySelector(".criteria-editor textarea")')
 await run('(()=>{document.querySelector(".criteria-block").open=true;const e=document.querySelector(".criteria-editor textarea");e.focus();e.select();return true})()')
 await send('Input.insertText',{text:'Criterio ficticio para prueba aislada de doble envío.'})
 await check('criteria draft populated','document.querySelector(".criteria-editor textarea")?.value.includes("prueba aislada")')
 await run(`(()=>{const original=window.fetch;window.__qaActionPosts=0;window.fetch=function(input,init){if(input==='/api/action'&&init?.method==='POST')window.__qaActionPosts++;return original.apply(this,arguments)};const form=document.querySelector('.criteria-editor');for(let n=0;n<2;n++)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true})()`)
 await check('double submit sends a single request','window.__qaActionPosts===1&&!document.querySelector(".save-progress")&&document.querySelector(".toast")?.textContent.includes("guardados")')
 assert.equal(await run('window.__qaActionPosts'),1)
 await logout();await login('Coded Star')
 await check('star home has no staff welcome','!document.querySelector(".staff-welcome-premium")')
 await check('four-step guide visible','!!document.querySelector(".star-journey-guide")')
 await run('document.querySelector(".star-journey-guide summary").click()')
 await check('four-step guide opens','document.querySelector(".star-journey-guide").open&&document.querySelectorAll(".journey-guide-steps>div").length===4')
 await check('export hidden for Stars','!document.querySelector(".operational-export")')
 await check('queue hidden for Stars','!document.querySelector(".coordination-queue")')
 for(const [name,selector] of [['Mis solicitudes','.my-applications-v2'],['Preparación','.preparation-page'],['Ayuda','.assistant-page'],['Mi cuenta','.account-summary']]){
  await navigate(name);await check('star '+name,'!!document.querySelector('+JSON.stringify(selector)+')&&!document.querySelector(".section-loading")')
 }
 await logout();await login('Anfitrión')
 await check('host welcome is role specific','document.querySelector(".staff-welcome-kicker")?.textContent.includes("ANFITRIÓN")')
 await check('queue hidden for hosts','!document.querySelector(".coordination-queue")')
 await navigate('Participante');await check('host assigned stars','!!document.querySelector(".assigned-meetings")&&!document.querySelector(".section-loading")')
 await logout()
 console.log('PRESENTATION_BROWSER_CHECKS',checked)
}catch(error){
 console.error('PRESENTATION_QA_ERROR',error.message)
 process.exitCode=1
}finally{
 ws?.close()
 if(tab?.id)await fetch(cdp+'/json/close/'+tab.id).catch(()=>{})
}
