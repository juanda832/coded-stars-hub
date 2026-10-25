"""Conversation corrections and drafts, without an external model or automatic writes."""
import datetime, http.cookiejar, json, sys, urllib.error, urllib.request, uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3001'
passed=[]
def call(client,path,body=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
 try:
  with client.open(req) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as error:return error.code,json.load(error)
def login(name):
 client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 assert call(client,'/api/auth',{'email':name+'@example.com','password':'Demo2026!'})[0]==200
 return client
def expect(name,actual,expected=True):
 assert actual==expected,(name,actual,expected)
 passed.append(name)
def data(client):return call(client,'/api/data')[1]
def ask(client,text,conversation=None):
 code,result=call(client,'/api/assistant',{'message':text,'requestId':str(uuid.uuid4()),'conversationId':conversation['id'] if conversation else None,'version':conversation['version'] if conversation else None,'zone':'America/La_Paz'})
 assert code==200,(text,code,result)
 c=result['conversation'];return c,c['messages'][-1]['answer']
admin,star,camila=[login(name) for name in ['ela','nicolas','camila']]
future=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=2)).isoformat()
def create(program,language):
 title='JDP · Conversación '+program+' '+uuid.uuid4().hex[:8]
 assert call(admin,'/api/action',{'action':'create','title':title,'description':'Encuentro ficticio para comprobar el contexto del asistente.','program':program,'language':language,'hostId':'host-1','startsAt':future,'duration':45})[0]==200
 return next(m for m in data(admin)['meetings'] if m['title']==title)
english,spanish,london=[create(p,l) for p,l in [('Tokyo','English'),('Tokyo','Español'),('London','English')]]
for m in [english,spanish,london]:assert call(star,'/api/action',{'action':'request','meetingId':m['id']})[0]==200
assert call(admin,'/api/action',{'action':'select','meetingId':english['id'],'userId':'star-3'})[0]==200
for m in [spanish,london]:assert call(camila,'/api/action',{'action':'request','meetingId':m['id']})[0]==200
before=data(star);posts=len(data(admin)['publications'])
c,a=ask(star,'Mis solicitudes de Tokyo')
expect('A short program query keeps the application task',a['state']['goal'],'applications')
expect('Own Tokyo request appears',english['id'] in a['state']['offeredIds'])
expect('Other program is excluded',london['id'] not in a['state']['offeredIds'])
c,a=ask(star,'Solo las confirmadas',c)
expect('Confirmation status is explicit',a['state']['applicationStatus'],'confirmed')
expect('Pending request is excluded',spanish['id'] not in a['state']['offeredIds'])
c,a=ask(star,'Y London',c)
expect('Changing program keeps the application task',a['state']['goal'],'applications')
expect('Changing program retains requested status',a['state']['applicationStatus'],'confirmed')
expect('An unconfirmed request is not presented as confirmed',a['state']['offeredIds'],[])
c,a=ask(star,'Todos los estados',c)
expect('Status restriction can be removed',a['state'].get('applicationStatus'),None)
expect('The existing London application appears again',london['id'] in a['state']['offeredIds'])
c,a=ask(star,'¿Qué reuniones de Tokyo hay hoy?',c)
c,a=ask(star,'Quita todos los filtros',c)
expect('Program filter is removed',a['state'].get('program'),None)
expect('Date filter is removed',a['state'].get('period'),None)
expect('Language filter is removed',a['state'].get('language'),None)
second=a['state']['offeredIds'][1]
c,a=ask(star,'Pregunta al host de la segunda por el idioma',c)
expect('An ordinal reference does not erase the requested task',a['state']['goal'],'questions')
question=next(x for x in a['actions'] if x['kind']=='question')
expect('Question uses the second offered meeting',question['meetingId'],second)
expect('Question uses the requested subject','idioma' in question['text'])
previous_length=len(question['text'])
c,a=ask(star,'Hazlo más corto',c)
question=next(x for x in a['actions'] if x['kind']=='question')
expect('A shorter question keeps the subject','idioma' in question['text'])
expect('The question is actually shorter',len(question['text'])<previous_length)
expect('The question still targets the same meeting',question['meetingId'],second)
c,a=ask(camila,'Quiero preguntar al host por el idioma')
expect('Ambiguous meeting prompts for a choice',a['state'].get('awaiting'),'meeting')
expect('No ambiguous draft is silently targeted',any(x['kind']=='question' for x in a['actions']),False)
second=a['state']['offeredIds'][1]
c,a=ask(camila,'La segunda',c)
expect('Clarification continues preparing the question',a['state']['goal'],'questions')
expect('The clarification keeps the requested question subject','idioma' in next(x for x in a['actions'] if x['kind']=='question')['text'])
expect('Clarification chooses exactly the selected reference',next(x for x in a['actions'] if x['kind']=='question')['meetingId'],second)
c,a=ask(camila,english['title'])
c,a=ask(camila,'La tercera',c)
expect('An out-of-range ordinal never falls back to a different meeting',a['state'].get('meetingId'),None)
expect('An out-of-range ordinal asks for clarification',a['state'].get('awaiting'),'meeting')
c,a=ask(camila,'Haz mi testimonio de 1 minuto de Tokyo')
expect('A duration is not mistaken for the first meeting',a['state']['goal'],'prepare')
expect('A one minute draft uses short style',a['state']['responseStyle'],'short')
c,a=ask(camila,'Me da miedo, es la primera vez')
expect('First time nerves are not an ordinal meeting selection',a['state']['goal'],'motivation')
c,a=ask(star,'No pude dar mi testimonio')
expect('A participation problem routes to reporting',a['state']['goal'],'reports')
c,a=ask(star,'Quiero personalizar mi historia de Tokyo')
expect('Guided story starts by asking for a real memory',a['state'].get('awaiting'),'memory')
memory='En el ejemplo ficticio de Tokyo construí un robot azul con mi equipo.'
c,a=ask(star,memory,c)
expect('The supplied memory is retained exactly',a['state']['story']['memory'],memory)
expect('The next question asks about learning',a['state'].get('awaiting'),'learning')
c,a=ask(star,'No sé qué aprendí',c)
expect('Uncertainty is not saved as an invented learning',a['state']['story'].get('learning'),None)
expect('Uncertainty keeps the guided step available',a['state'].get('awaiting'),'learning')
learning='Aprendí a escuchar las ideas de mi equipo antes de decidir.'
c,a=ask(star,learning,c)
expect('The supplied learning is retained exactly',a['state']['story']['learning'],learning)
expect('The draft uses the real memory',memory in a['state']['draft']['text'])
expect('Missing personal advice stays a placeholder','[tu consejo personal]' in a['state']['draft']['text'])
c,a=ask(star,'Hazlo más corto',c)
expect('Shortening keeps the supplied memory',memory in a['state']['draft']['text'])
expect('Shortening keeps the supplied learning',learning in a['state']['draft']['text'])
expect('Short version removes the optional advice section','[tu consejo personal]' not in a['state']['draft']['text'])
c,a=ask(star,'No, de London',c)
expect('A program correction keeps the preparation task',a['state']['goal'],'prepare')
expect('A correction changes the program',a['state']['program'],'London')
expect('Tokyo memories are not reassigned to London',memory not in a['text'])
c,a=ask(star,'Nuevo tema',c)
expect('New topic clears program context',a['state'].get('program'),None)
expect('New topic clears draft context',a['state'].get('draft'),None)
c,a=ask(star,'Cancela mi solicitud de Tokyo')
expect('Cancellation explains the manual action','elige retirar' in a['text'])
expect('The bot never cancels a request',data(star)['registrations'],before['registrations'])
c,a=ask(admin,'Escribe una invitación para Stars de Tokyo')
full=a['state']['draft']['text']
c,a=ask(admin,'Hazlo más corto',c)
expect('Publication shortening keeps its program',a['state']['program'],'Tokyo')
expect('Publication is actually shorter',len(a['state']['draft']['text'])<len(full))
expect('Publication is still only an editable draft',any(x['kind']=='publication' for x in a['actions']))
c,a=ask(admin,'Hazlo más detallado',c)
expect('Longer publication restores its detail',a['state']['draft']['text'],full)
expect('No generated publication is saved automatically',len(data(admin)['publications']),posts)
c,a=ask(admin,'Solo abiertas de Tokyo')
expect('Admin open search includes unassigned meetings',spanish['id'] in a['state']['offeredIds'])
expect('Admin open search excludes a confirmed meeting',english['id'] not in a['state']['offeredIds'])
expect('Conversation never sends a question',data(star)['questions'],before['questions'])
print(f'Passed {len(passed)} contextual assistant checks: corrections, clarification, real memories, editable revisions and manual decisions.')
