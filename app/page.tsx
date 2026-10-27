'use client'
import { useEffect, useState } from 'react'
import {useClerk,useUser} from '@clerk/nextjs'
import {personalAccessEnabled} from '@/lib/auth-mode'
import PersonalAccess from './components/PersonalAccess'
import {useHubSnapshot} from './components/useHubSnapshot'
import {ConnectionNotice,HubLoadFailure,HubLoading} from './components/HubConnection'
import { ArrowRight, Bell, BookOpen, CalendarDays, Check, ClipboardCheck, Globe2, LayoutDashboard, LogOut, Menu, MessageCircle, HelpCircle, BarChart3, Users, UserRound, Megaphone, X } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { isActiveMeeting } from '@/lib/meeting-utils'
import { zoneChoices } from '@/lib/time-zones'
import { readRoute, routeHash, isHubHashRoute } from '@/lib/navigation'
import { StarHome, FriendlyMeetingCard, BookingDialog } from './components/StarExperience'
import AccessScreen from './components/AccessScreen'
import MeetingDetails from './components/MeetingDetails'
import MeetingWorkspace from './components/MeetingWorkspace'
import MeetingEditor from './components/MeetingEditor'
import Messages from './components/Messages'
import Dialog from './components/Dialog'
import ApplicationManager from './components/ApplicationManager'
import AssignedStars from './components/AssignedStars'
import Brand from './components/Brand'
import MeetingExplorer from './components/MeetingExplorer'
import MyApplications from './components/MyApplications'
import ReportDialog from './components/ReportDialog'
import ReportInbox from './components/ReportInbox'
import CoordinationResults from './components/CoordinationResults'
import PreparationGuide from './components/PreparationGuide'
import StaffHome from './components/StaffHome'
import StaffMeetingCard from './components/StaffMeetingCard'
import HubInsights from './components/HubInsights'
import AccountSpace from './components/AccountSpace'
import AccountManager from './components/AccountManager'
import BetaReview,{ReviewBanner} from './components/BetaReview'
import Publications from './components/Publications'
import HubAssistant from './components/HubAssistant'
import type { AssistantAction, AssistantDraft } from '@/lib/assistant-types'

type NavItem = {label:string;icon:typeof LayoutDashboard;badge?:number}
export default function Home(){return personalAccessEnabled()?<PersonalHome/>:<HubHome/>}
function PersonalHome(){
 const {isLoaded,isSignedIn,user}=useUser(),{signOut}=useClerk()
 if(!isLoaded)return <HubLoading/>
 if(!isSignedIn||!user)return <PersonalEntry/>
 return <HubHome key={user.id} signOut={()=>signOut({redirectUrl:'/'})}/>
}
function PersonalEntry(){
 useEffect(()=>{
  const destination=window.location.hash
  if(isHubHashRoute(destination)){try{sessionStorage.setItem('coded-auth-destination',destination)}catch{}}
  window.location.replace('/sign-in')
 },[])
 return <HubLoading/>
}
function HubHome({signOut}:{signOut?:()=>Promise<unknown>}) {
 const {data,phase,issue,refreshing,refresh,reset}=useHubSnapshot()
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('')
 const [messagesMeetingId,setMessagesMeetingId]=useState('')
 const [preparationProgram,setPreparationProgram]=useState<string|undefined>(undefined)
 const [preparationMeetingId,setPreparationMeetingId]=useState<string|undefined>(undefined)
 const [assistantDraft,setAssistantDraft]=useState<AssistantDraft|null>(null)
 const [zone,setZone]=useState('America/La_Paz'),[section,setSection]=useState('Inicio'),[mobile,setMobile]=useState(false)
 const [selectedId,setSelectedId]=useState<string|null>(null),[reportFor,setReportFor]=useState<Meeting|null>(null),[editor,setEditor]=useState<Meeting|'new'|null>(null),[booked,setBooked]=useState<Meeting|null>(null),[reviewMeetingId,setReviewMeetingId]=useState(''),[messagesTab,setMessagesTab]=useState(''),[applicationsTab,setApplicationsTab]=useState('Todas')
 useEffect(()=>{try{const saved=localStorage.getItem('coded-zone');if(saved&&zoneChoices.some(([value])=>value===saved))setZone(saved)}catch{}},[])
 useEffect(()=>{try{localStorage.setItem('coded-zone',zone)}catch{}},[zone])
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer)},[toast])
 useEffect(()=>{document.title=`${section==='Asistente'?'Ayuda':section} · CODED Stars Hub`},[section,data?.user.id])
 useEffect(()=>{if(!data?.user.id)return;const role=data.user.role;function syncRoute(){let destination=window.location.hash;try{const remembered=sessionStorage.getItem('coded-auth-destination');sessionStorage.removeItem('coded-auth-destination');if(!destination&&remembered)destination=remembered}catch{}const restored=readRoute(destination,role);const route=data?.user.reviewer&&restored.section==='Cuentas'?{section:'Inicio',view:''}:restored;setSection(route.section);setMessagesTab(route.section==='Mensajes'?route.view:'');setApplicationsTab(route.section==='Mis solicitudes'?(route.view||'Todas'):'Todas');setMobile(false);setSelectedId(null);setReportFor(null);setEditor(null);setBooked(null);setError('');window.history.replaceState(null,'',routeHash(route.section,route.view));window.scrollTo({top:0,behavior:'instant'})}syncRoute();window.addEventListener('hashchange',syncRoute);return()=>window.removeEventListener('hashchange',syncRoute)},[data?.user.id,data?.user.role])
 function navigate(next:string,view=''){if(next!=='Mensajes')setMessagesMeetingId('');if(next==='Mensajes')setMessagesTab(view);if(next==='Mis solicitudes')setApplicationsTab(view||'Todas');const hash=routeHash(next,view);if(window.location.hash!==hash)window.history.pushState(null,'',hash);setSection(next);setMobile(false);setError('');window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>document.getElementById('main-content')?.focus({preventScroll:true}))}
 async function login(email:string,password:string){setBusy(true);setError('');try{const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const result=await response.json();if(!response.ok)throw new Error(result.error);await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function logout(){try{if(data?.user.reviewer)await fetch('/api/review-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'exit'})});reset();if(signOut){await signOut();return}const response=await fetch('/api/auth',{method:'DELETE'});if(!response.ok)throw new Error('No pudimos cerrar la sesión. Intenta de nuevo.');setPreparationProgram(undefined);setPreparationMeetingId(undefined);setAssistantDraft(null);setSelectedId(null);setReportFor(null);setEditor(null);navigate('Inicio')}catch{setError('No pudimos cerrar la sesión. Intenta de nuevo.')}}
 async function action(body:Record<string,unknown>,message:string){if(!navigator.onLine){setError('Necesitas conexión para guardar. Tu borrador sigue aquí.');return false}if(issue){setError('Actualiza la información antes de guardar cambios. Tu borrador sigue aquí.');void refresh();return false}setBusy(true);setError('');try{const accountAction=typeof body.action==='string'&&body.action.startsWith('account_');const payload=accountAction?{...body,action:String(body.action).slice(8)}:body;const response=await fetch(accountAction?'/api/accounts':'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok){if(response.status===409||(accountAction&&response.status===503))await refresh();if(response.status===401)reset();throw new Error(result.error)}await refresh();setToast(message);if(body.action==='report')setReportFor(null);return true}catch(e){setError(e instanceof TypeError||e instanceof SyntaxError?'No pudimos confirmar el guardado. Revisa tu conexión y actualiza antes de volver a enviar.':(e as Error).message);return false}finally{setBusy(false)}}
 function handleAssistantAction(item:AssistantAction){
  if(item.kind==='navigate'){navigate(item.section,item.view);return}
  if(item.kind==='meeting'){const meeting=data?.meetings.find(m=>m.id===item.meetingId);if(meeting)openMeeting(meeting);return}
  if(item.kind==='question'&&data?.user.role==='star'){setAssistantDraft({key:crypto.randomUUID(),kind:'question',text:item.text,meetingId:item.meetingId});navigate('Mensajes','Preguntas')}
  if(item.kind==='publication'&&data?.user.role==='admin'){setAssistantDraft({key:crypto.randomUUID(),kind:'publication',text:item.body,title:item.title});navigate('Publicaciones')}
 }
 function askAboutMeeting(meeting:Meeting){setSelectedId(null);setMessagesMeetingId(meeting.id);setAssistantDraft({key:crypto.randomUUID(),kind:'question',text:'',meetingId:meeting.id});navigate('Mensajes','Preguntas')}
 function prepareMeeting(meeting:Meeting){setPreparationProgram(meeting.program);setPreparationMeetingId(meeting.id);navigate('Preparación')}
 function openMeeting(meeting:Meeting){setError('');setSelectedId(meeting.id)}
 async function register(meeting:Meeting){if(await action({action:'request',meetingId:meeting.id},'Solicitud enviada. El equipo la revisará.')){setSelectedId(null);setBooked(meeting)}}
 function reviewMeeting(meeting:Meeting){setReviewMeetingId(meeting.id);setSelectedId(null);navigate('Solicitudes')}
 function reportMeeting(meeting:Meeting){setSelectedId(null);setError('');setReportFor(meeting)}
 if(phase==='loading'&&!data)return <HubLoading/>
 if(phase==='unavailable'&&!data)return <HubLoadFailure issue={issue} onRetry={()=>void refresh()} onLogout={()=>void logout()}/>
 if(!data)return personalAccessEnabled()?<PersonalAccess onRetry={()=>void refresh()}/>:<AccessScreen busy={busy} error={error} onLogin={login}/>
 const role=data.user.role,star=role==='star',admin=role==='admin',unread=data.notifications.filter(n=>!n.readAt).length
 const pending=data.registrations.filter(r=>r.status==='pending'&&data.meetings.some(m=>m.id===r.meetingId&&isActiveMeeting(m))).length
 const nav:NavItem[]=[{label:'Inicio',icon:LayoutDashboard},{label:'Reuniones',icon:CalendarDays},...(star?[{label:'Mis solicitudes',icon:Check,badge:pending},{label:'Preparación',icon:BookOpen}]:admin?[{label:'Solicitudes',icon:Users,badge:pending},{label:'Seguimiento',icon:ClipboardCheck},{label:'Estadísticas',icon:BarChart3},...(!data.user.reviewer?[{label:'Cuentas',icon:UserRound}]:[])]:[{label:'Participante',icon:Users},{label:'Resultados',icon:ClipboardCheck}]),{label:'Mensajes',icon:MessageCircle,badge:unread},{label:'Publicaciones',icon:Megaphone},...(star?[{label:'Mi experiencia',icon:ClipboardCheck}]:[]),{label:'Mi cuenta',icon:UserRound},{label:'Revisión beta',icon:ClipboardCheck},{label:'Asistente',icon:HelpCircle}]
 const quickLabels=star?['Inicio','Reuniones','Mis solicitudes','Preparación','Mensajes']:admin?['Inicio','Reuniones','Solicitudes','Publicaciones','Mensajes']:['Inicio','Reuniones','Participante','Resultados','Mensajes']
 const selected=data.meetings.find(m=>m.id===selectedId)
 const navButtons=()=>nav.map(({label,icon:Icon,badge})=><button key={label} className={'nav-item '+(section===label?'active':'')} aria-current={section===label?'page':undefined} onClick={()=>navigate(label)}><Icon size={19}/><span>{label==='Asistente'?'Ayuda':label}</span>{!!badge&&<b className="sidebar-badge">{badge}</b>}</button>)
 function renderMeeting(meeting:Meeting){return star?<FriendlyMeetingCard key={meeting.id} meeting={meeting} registration={data!.registrations.find(r=>r.meetingId===meeting.id)} full={!!data!.confirmedCounts[meeting.id]} zone={zone} busy={busy} onDetails={openMeeting} onRegister={register} onQuestion={askAboutMeeting}/>:<StaffMeetingCard key={meeting.id} meeting={meeting} data={data!} zone={zone} onOpen={openMeeting}/>}
 return <div className="shell review-presentation"><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus()}}>Ir al contenido</a><aside className="sidebar"><Brand/><nav aria-label="Menú principal">{navButtons()}</nav><div className="side-bottom"><div className="side-user"><span className="avatar">{data.user.initials}</span><div><b>{data.user.name.replace(/ · Demo$/,'')}</b><small>{star?'Coded Star':admin?'Administración':'Anfitrión'}</small></div><button className="icon-button" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={logout}><LogOut size={17}/></button></div></div></aside><div className="main"><header className="topbar"><button className="menu-btn" onClick={()=>setMobile(true)} aria-label="Abrir menú" aria-expanded={mobile}><Menu size={22}/></button><div className="header-brand"><Brand compact onClick={()=>navigate('Inicio')}/></div><span className="breadcrumb"><b>{section==='Asistente'?'Ayuda':section}</b></span><div className="top-actions"><span className="demo-pill" title="Versión de revisión con datos de ejemplo"><span/> Vista previa</span><label className="zone-select"><Globe2 size={15}/><select value={zone} onChange={e=>setZone(e.target.value)} aria-label="Zona horaria">{zoneChoices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="header-inbox" aria-label={`Ver mensajes${unread?`, ${unread} ${unread===1?'novedad':'novedades'} sin leer`:''}`} onClick={()=>navigate('Mensajes','Novedades')}><Bell size={20}/>{unread>0&&<span>{unread}</span>}</button></div>{busy&&<div className="save-progress" role="progressbar" aria-label="Guardando cambios"/>}</header><main id="main-content" tabIndex={-1} aria-busy={busy} className={'content professional-content '+(star?'star-content':'')+(section==='Asistente'?' assistant-content':'')}>
 <ReviewBanner data={data}/>
 <ConnectionNotice issue={issue} refreshing={refreshing} onRetry={()=>void refresh()}/>
 {section==='Inicio'&&(star?<StarHome onQuestion={askAboutMeeting} onNavigate={navigate} data={data} zone={zone} busy={busy} onExplore={()=>navigate('Reuniones')} onDetails={openMeeting} onRegister={register} onMessages={tab=>navigate('Mensajes',tab)} onFeedback={()=>navigate('Mi experiencia')} onPreparation={program=>{setPreparationProgram(program);setPreparationMeetingId(undefined);navigate('Preparación')}} onApplications={tab=>navigate('Mis solicitudes',tab)} action={action}/>:<StaffHome onReview={reviewMeeting} data={data} zone={zone} onNavigate={navigate} onMeeting={openMeeting} onCreate={()=>setEditor('new')}/>)}
 {section==='Asistente'&&<HubAssistant key={data.user.id} data={data} zone={zone} onAction={handleAssistantAction}/>}
 {section==='Publicaciones'&&<Publications initialDraft={assistantDraft?.kind==='publication'?assistantDraft:undefined} onDraftDone={()=>setAssistantDraft(null)} data={data} busy={busy} error={error} action={action} onClearError={()=>setError('')}/>}
 {section==='Revisión beta'&&<BetaReview data={data} busy={busy} error={error} action={action} onNavigate={navigate}/>}
 {section==='Cuentas'&&admin&&!data.user.reviewer&&<AccountManager data={data} busy={busy} error={error} action={action} onClearError={()=>setError('')}/>}
 {section==='Mi cuenta'&&<AccountSpace data={data} busy={busy} error={error} action={action} onNavigate={navigate}/>}
 {section==='Reuniones'&&<MeetingExplorer key={data.user.id} data={data} zone={zone} renderMeeting={renderMeeting} onCreate={()=>{setError('');setEditor('new')}}/>}
 {section==='Mensajes'&&<Messages initialMeetingId={messagesMeetingId} zone={zone} initialQuestion={assistantDraft?.kind==='question'?assistantDraft:undefined} onQuestionSent={meetingId=>{setMessagesMeetingId(meetingId);setAssistantDraft(null)}} key={data.user.id+(assistantDraft?.kind==='question'?assistantDraft.key:'')} initialTab={messagesTab} onViewChange={view=>navigate('Mensajes',view)} data={data} busy={busy} action={action} onDetails={openMeeting} onExplore={()=>navigate('Reuniones')} onPublications={()=>navigate('Publicaciones')}/>}
 {section==='Mis solicitudes'&&star&&<MyApplications key={applicationsTab} initialTab={applicationsTab} onViewChange={view=>navigate('Mis solicitudes',view)} data={data} zone={zone} onDetails={openMeeting} onPreparation={prepareMeeting} onQuestion={askAboutMeeting} onReport={reportMeeting} onExplore={()=>navigate('Reuniones')}/>}
 {section==='Preparación'&&star&&<PreparationGuide key={data.user.id} data={data} zone={zone} initialProgram={preparationProgram} initialMeetingId={preparationMeetingId} onExplore={()=>navigate('Reuniones')} onMessages={()=>navigate('Mensajes','Preguntas')} onDetails={openMeeting} onQuestion={askAboutMeeting}/>}
 {section==='Mi experiencia'&&star&&<ReportInbox data={data} zone={zone} onReport={reportMeeting}/>}
 {section==='Participante'&&role==='host'&&<><div className="page-heading"><div><h1>Participantes</h1><p>Stars confirmados para tus reuniones.</p></div></div><AssignedStars data={data} zone={zone} onMeeting={openMeeting}/></>}
 {section==='Solicitudes'&&admin&&<><div className="page-heading"><div><h1>Solicitudes</h1><p>Elige un participante por reunión.</p></div></div><ApplicationManager key={reviewMeetingId} initialMeetingId={reviewMeetingId} data={data} zone={zone} busy={busy} error={error} action={action}/></>}
 {section==='Resultados'&&role==='host'&&<ReportInbox data={data} zone={zone} onReport={reportMeeting}/>}
 {section==='Seguimiento'&&admin&&<CoordinationResults data={data} zone={zone} busy={busy} error={error} action={action}/>}
 {section==='Estadísticas'&&admin&&<HubInsights data={data} onFollowUp={()=>navigate('Seguimiento')}/>}
 </main><footer className="hub-footer"><span>CODED Stars Hub</span><button className="footer-help" onClick={()=>navigate('Asistente')}>Ayuda</button><a href="/photo-credits.html" target="_blank" rel="noopener noreferrer">Créditos de imágenes</a><small>Versión de revisión · Datos de ejemplo</small></footer></div>
 <nav className="mobile-bottom-nav" aria-label="Navegación principal">{quickLabels.map(label=>{const item=nav.find(n=>n.label===label)!;const Icon=item.icon;return <button key={label} aria-current={section===label?'page':undefined} className={section===label?'active':''} onClick={()=>navigate(label)}><span className="nav-icon-wrap"><Icon size={21}/>{label==='Mensajes'&&unread>0&&<b className="nav-unread">{unread}</b>}</span><span>{label==='Mis solicitudes'?'Solicitudes':label==='Participante'?'Mi Star':label}</span></button>})}</nav>
 {mobile&&<Dialog title="Tu espacio" onClose={()=>setMobile(false)} className="mobile-menu-dialog"><Brand/><nav aria-label="Menú completo">{navButtons()}</nav><div className="mobile-menu-user"><span className="avatar">{data.user.initials}</span><span><b>{data.user.name.replace(/ · Demo$/,'')}</b><small>{star?'Coded Star':admin?'Administración':'Anfitrión'}</small></span><button className="icon-button" aria-label="Cerrar sesión" onClick={logout}><LogOut size={19}/></button></div></Dialog>}
 {selected&&(star?<MeetingDetails key={selected.id} meeting={selected} data={data} zone={zone} busy={busy} error={error} action={action} onClose={()=>{setSelectedId(null);setError('')}} onRegister={register} onFeedback={reportMeeting} onQuestion={askAboutMeeting}/>:<MeetingWorkspace onQuestions={()=>{setSelectedId(null);setMessagesMeetingId(selected.id);navigate('Mensajes','Preguntas')}} key={selected.id} meeting={selected} data={data} zone={zone} busy={busy} error={error} action={action} onClose={()=>{setSelectedId(null);setError('')}} onEdit={()=>{setSelectedId(null);setEditor(selected)}} onReview={()=>reviewMeeting(selected)} onReport={()=>reportMeeting(selected)} onResults={()=>{setSelectedId(null);navigate(admin?'Seguimiento':'Resultados')}}/>)}
 {booked&&<BookingDialog meeting={booked} zone={zone} onClose={()=>setBooked(null)} onDetails={()=>{setSelectedId(booked.id);setBooked(null)}}/>}
 {reportFor&&<ReportDialog key={reportFor.id} meeting={reportFor} data={data} busy={busy} error={error} action={action} onClose={()=>{setReportFor(null);setError('')}}/>}
 {editor&&<MeetingEditor userId={data.user.id} hosts={data.hosts} key={editor==='new'?'new':editor.id} meeting={editor==='new'?undefined:editor} zone={zone} busy={busy} error={error} action={action} onClose={()=>{setEditor(null);setError('')}}/>}
 {toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}{error&&!selected&&!reportFor&&!editor&&section!=='Publicaciones'&&section!=='Mi cuenta'&&section!=='Cuentas'&&section!=='Revisión beta'&&<div className="error-toast" role="alert"><span>{error}</span><button aria-label="Cerrar aviso" onClick={()=>setError('')}><X size={17}/></button></div>}
 </div>
}
