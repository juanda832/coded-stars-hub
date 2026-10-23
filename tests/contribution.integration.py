"""Roles, shared editing, publication delivery and self-service profile privacy.
Run only against an isolated test database, after the existing integration suites.
"""
import datetime, http.cookiejar, json, sys, urllib.error, urllib.request, uuid
BASE = sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3001'
passed=[]
def call(client,path,body=None):
    req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
    try:
        with client.open(req) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.load(error)
def expect(name,value,expected):
    assert value==expected,(name,value,expected)
    passed.append(name)
def login(email,role):
    client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    code,result=call(client,'/api/auth',{'email':email+'@demo.coded','password':'Demo2026!'})
    expect(email+' can enter',code,200)
    expect(email+' has intended role',result['user']['role'],role)
    return client
def data(client):return call(client,'/api/data')[1]
def action(client,**body):return call(client,'/api/action',body)
isa,ela,marina=[login(email,'admin') for email in ['isa','ela','admin']]
host,diego=[login(email,'host') for email in ['host','diego']]
star,other=[login(email,'star') for email in ['star','valentina']]
login('nicolas','star');login('camila','star')
anonymous=urllib.request.build_opener()
expect('Anonymous cannot write',action(anonymous,action='profile_update')[0],401)
expect('Admin team lists Isa and Ela',{'admin-isa','admin-ela'}.issubset({u['id'] for u in data(isa)['team']}),True)
expect('Star has no staff directory',data(star)['team'],[])
expect('Host has no staff directory',data(host)['team'],[])
expect('Self profile excludes internal notes','internalNotes' in data(star)['profile'],False)
before_other=data(other)['profile']
profile={'action':'profile_update','languages':['Español','English'],'programs':['Tokyo'],'availability':'Miércoles después de las 17:00, hora de La Paz.','experience':'Ejemplo ficticio: me gustaría contar mi experiencia académica.','userId':'star-2','role':'admin','internalNotes':'forged','history':[]}
expect('Star updates own profile',call(star,'/api/action',profile)[0],200)
expect('Forged identity does not change another Star',data(other)['profile'],before_other)
expect('Profile cannot change role',data(star)['user']['role'],'star')
candidate=next(p for p in data(ela)['candidates'] if p['userId']=='star-1')
expect('Coordination sees updated availability',candidate['availability'],profile['availability'])
expect('Private internal notes preserved',candidate['internalNotes']=='forged',False)
expect('Host cannot edit Star profile',call(host,'/api/action',profile)[0],403)
for field,value in [('languages',[]),('languages',['Español','Español']),('languages',['Invalid']),('programs',['Invalid']),('programs','Tokyo'),('availability','x'),('experience','x'*401)]:
    expect('Profile rejects invalid '+field,call(star,'/api/action',{**profile,field:value})[0],400)
future=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=9)).isoformat()
draft={'action':'create','title':'JDP · Equipo '+uuid.uuid4().hex[:7],'description':'Una oportunidad ficticia para comprobar el trabajo del equipo.','program':'Tokyo','language':'English','startsAt':future,'duration':45,'hostId':'host-2','joinUrl':'https://example.com/team-private','hostNote':'Tendrás tu turno después de la presentación.'}
expect('Isa creates with chosen host',call(isa,'/api/action',draft)[0],200)
meeting=next(m for m in data(isa)['meetings'] if m['title']==draft['title']);mid=meeting['id']
expect('Chosen host is saved',meeting['hostId'],'host-2')
expect('Old host cannot read meeting',any(m['id']==mid for m in data(host)['meetings']),False)
expect('Chosen host gets meeting notice',any(n['meetingId']==mid and n['title']=='Tienes una nueva JDP' for n in data(diego)['notifications']),True)
expect('Invalid host rejected',call(ela,'/api/action',{**draft,'hostId':'admin-isa'})[0],400)
expect('Star sends request',action(star,action='request',meetingId=mid)[0],200)
for name,client in [('Isa',isa),('Ela',ela),('Marina',marina)]:
    expect(name+' receives application notice',any(n['meetingId']==mid and n['title']=='Nueva solicitud por revisar' for n in data(client)['notifications']),True)
expect('Assigned host can add indications',action(diego,action='meeting_update',meetingId=mid,hostNote='Te presentaré al terminar la primera parte.',joinUrl=draft['joinUrl'])[0],200)
expect('Unassigned host cannot edit',action(host,action='meeting_update',meetingId=mid,hostNote='No permitido',joinUrl='')[0],403)
expect('Star can ask assigned team',action(star,action='ask',meetingId=mid,text='¿Cuándo será mi turno de hablar?')[0],200)
q=next(q for q in data(diego)['questions'] if q['meetingId']==mid)
expect('Unassigned host cannot read question',any(q['meetingId']==mid for q in data(host)['questions']),False)
expect('Ela can respond',action(ela,action='reply',questionId=q['id'],reply='El host acordará el turno contigo.')[0],200)
reply=next(item for item in data(star)['questions'] if item['id']==q['id'])
expect('Actual administrator credited',reply['replyAuthor'],'Ela · Demo')
expect('No automatic selection',data(isa)['confirmedCounts'][mid],0)
expect('Isa manually selects',action(isa,action='select',meetingId=mid,userId='star-1')[0],200)
assigned=next(p for p in data(diego)['assignedStars'] if p['userId']=='star-1')
expect('Assigned host sees updated programs',assigned['programs'],['Tokyo'])
expect('Ela changes host',call(ela,'/api/action',{**draft,'action':'meeting_edit','meetingId':mid,'hostId':'host-1'})[0],200)
expect('Previous host loses meeting access',any(m['id']==mid for m in data(diego)['meetings']),False)
expect('Previous host loses write access',action(diego,action='meeting_update',meetingId=mid,hostNote='No permitido',joinUrl='')[0],403)
expect('New host receives access',any(m['id']==mid for m in data(host)['meetings']),True)
expect('Host reassignment preserves chosen Star',data(isa)['confirmedCounts'][mid],1)
expect('Confirmed Star can cancel',action(star,action='cancel',meetingId=mid)[0],200)
for name,client in [('Isa',isa),('Ela',ela)]:
    expect(name+' receives replacement alert',any(n['meetingId']==mid and n['title']=='Hace falta reasignar un Star' for n in data(client)['notifications']),True)
post={'action':'publication_save','title':'Ejemplo de invitación '+uuid.uuid4().hex[:7],'body':'Una publicación ficticia para animar a los Stars a preparar su historia.','audience':'star','status':'draft','authorId':'forged'}
for name,client in [('Star',star),('host',host)]:expect(name+' cannot publish',call(client,'/api/action',post)[0],403)
expect('Isa saves a draft',call(isa,'/api/action',post)[0],200)
saved=next(p for p in data(isa)['publications'] if p['title']==post['title']);pid=saved['id']
expect('Server records authenticated author',saved['authorId'],'admin-isa')
expect('Draft visible to Ela',any(p['id']==pid for p in data(ela)['publications']),True)
expect('Draft hidden from Star',any(p['id']==pid for p in data(star)['publications']),False)
expect('Draft sends no notice',any(n['meetingId']=='post:'+pid for n in data(star)['notifications']),False)
for field,value in [('title','x'),('body','x'),('audience','admin'),('status','invalid')]:
    expect('Publication rejects '+field,call(isa,'/api/action',{**post,field:value})[0],400)
publish={**post,'publicationId':pid,'version':saved['version'],'status':'published'}
expect('Ela publishes shared draft',call(ela,'/api/action',publish)[0],200)
current=next(p for p in data(star)['publications'] if p['id']==pid)
expect('Original author preserved',current['authorName'],'Isa · Demo')
expect('Editor recorded',current['updatedByName'],'Ela · Demo')
expect('Wrong audience cannot read post',any(p['id']==pid for p in data(host)['publications']),False)
expect('Wrong audience receives no notice',any(n['meetingId']=='post:'+pid for n in data(host)['notifications']),False)
expect('Target audience receives notice',any(n['meetingId']=='post:'+pid for n in data(star)['notifications']),True)
expect('Stale editor cannot overwrite',call(isa,'/api/action',{**publish,'body':'An outdated update that must not overwrite the saved publication.'})[0],409)
expect('Stale update preserved saved body',next(p for p in data(ela)['publications'] if p['id']==pid)['body'],post['body'])
expect('Host cannot archive',call(host,'/api/action',{**publish,'version':current['version'],'status':'archived'})[0],403)
expect('Isa broadens audience',call(isa,'/api/action',{**publish,'version':current['version'],'audience':'all'})[0],200)
current=next(p for p in data(host)['publications'] if p['id']==pid)
expect('Host now sees chosen publication',current['audience'],'all')
expect('Ela can archive',call(ela,'/api/action',{**publish,'version':current['version'],'status':'archived','audience':'all'})[0],200)
expect('Archived content hidden from Star',any(p['id']==pid for p in data(star)['publications']),False)
expect('Archived content remains recoverable',next(p for p in data(isa)['publications'] if p['id']==pid)['status'],'archived')
print(f'Passed {len(passed)} contribution checks: accounts, profiles, permissions, delivery, shared editing and host assignment.')
