"""Run only on a disposable local database with a fictitious owner@example.com."""
import http.cookiejar,json,os,sys,urllib.error,urllib.parse,urllib.request,uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3006'
assert urllib.parse.urlsplit(BASE).hostname=='127.0.0.1'
assert os.environ.get('CODED_OWNER_EMAIL')=='owner@example.com'
assert os.environ.get('CODED_SEED_EXAMPLES')=='false'
checks=[]
def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(person,path,body=None,headers=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json',**(headers or {})},method='POST' if body is not None else 'GET')
 try:
  with person.open(req) as response:return response.status,json.load(response),response.headers
 except urllib.error.HTTPError as error:return error.code,json.load(error),error.headers
def expect(name,value,expected):
 assert value==expected,(name,value,expected)
 checks.append(name)
def login(name):
 person=client();expect('Login '+name,call(person,'/api/auth',{'email':name+'@example.com','password':'Demo2026!'})[0],200);return person
def data(person):
 status,body,_=call(person,'/api/data');expect('Read data',status,200);return body
def act(person,**body):return call(person,'/api/action',body)
def switch(person,role):return call(person,'/api/account-role',{'role':role})
def feed(connection):
 with urllib.request.urlopen(connection['url']) as response:return response.read().decode()
owner,isa,ela=login('owner'),login('isa'),login('ela')
initial=data(owner)
expect('Owner starts as administrator',initial['user']['role'],'admin')
expect('Owner keeps both assignments',initial['user']['roles'],['admin','star'])
expect('Only the owner gets dual roles',[(u['id'],u.get('roles')) for u in initial['team'] if u.get('roles')],[('admin-owner',['admin','star'])])
expect('No sample identity is copied',[p['userId'] for p in initial['candidates']],['admin-owner'])
for person,name in [(isa,'Isa'),(ela,'Ela')]:
 draft={'action':'create','schoolName':'Colegio ficticio '+name,'date':'2030-07-20','time':'18:00','joinUrl':'https://example.com/sala-privada'}
 expect(name+' adds meeting',act(person,**draft)[0],200)
 expect(name+' adds private draft',act(person,action='publication_save',title='Borrador ficticio '+name,body='Contenido ficticio para revisar entre las administradoras.',audience='all',status='draft')[0],200)
shared=data(owner);mid=shared['meetings'][0]['id'];other_mid=shared['meetings'][1]['id']
expect('Owner sees all shared meetings',len(shared['meetings']),2)
expect('Owner sees drafts from both administrators',len(shared['publications']),2)
expect('Owner sees administrative directory',len(shared['team']),3)
expect('Owner can manage shared internal criteria',act(owner,action='criteria',meetingId=mid,text='Criterio ficticio del equipo')[0],200)
admin_calendar=call(owner,'/api/calendar/connection',{'action':'create'})[1]
expect('Admin feed includes both meetings',all(m['schoolName'] in feed(admin_calendar) for m in shared['meetings']),True)
expect('Anonymous cannot switch',switch(client(),'admin')[0],401)
expect('Owner cannot add host role',switch(owner,'host')[0],403)
expect('Foreign origin cannot switch',call(owner,'/api/account-role',{'role':'star'},{'Origin':'https://unrelated.example'})[0],403)
expect('Another admin cannot enable Star mode',call(isa,'/api/account-role',{'role':'star','id':'admin-owner','roles':['admin','star']})[0],403)
status,member,_=call(isa,'/api/accounts',{'action':'create','name':'Persona ficticia QA','email':'member@example.com','role':'star','roles':['admin','star'],'requestId':str(uuid.uuid4())})
expect('Create a fictitious ordinary Star',status,200)
ordinary=login('member')
expect('Account form cannot grant dual roles',data(ordinary)['user'].get('roles'),None)
expect('Ordinary Star cannot become admin',switch(ordinary,'admin')[0],403)
expect('Forged identity cannot change assigned role',call(ordinary,'/api/account-role',{'role':'admin','id':'admin-owner','roles':['admin','star']})[0],403)
status,_,headers=switch(owner,'star');expect('Owner switches to Star',status,200)
expect('Role cookie is HttpOnly','HttpOnly' in headers.get('Set-Cookie',''),True)
expect('Role cookie is SameSite Strict','SameSite=strict' in headers.get('Set-Cookie',''),True)
star=data(owner)
expect('Star identity stays the owner',star['user']['id'],'admin-owner')
expect('Own Star mode is not a review','reviewer' in star['user'],False)
expect('Effective Star role',star['user']['role'],'star')
expect('Own profile starts empty',star['profile'],{'languages':[],'programs':[],'availability':'','experience':''})
expect('Star does not render administrative directory',star['team'],[])
expect('Star mode hides private criteria',star['criteria'],{})
expect('Star mode hides admin drafts',star['publications'],[])
expect('Star mode hides unconfirmed links',all(m.get('joinUrl') is None for m in star['meetings']),True)
expect('Star mode cannot create meetings',act(owner,action='create',schoolName='No permitido',date='2030-07-20',time='18:00')[0],403)
expect('Star mode cannot publish',act(owner,action='publication_save',title='No permitido',body='No debe publicarse en modo Star.',audience='all',status='published')[0],403)
expect('Owner saves own Star profile',act(owner,action='profile_update',languages=['Español'],programs=['Orlando'],availability='Disponibilidad ficticia de prueba.',experience='')[0],200)
expect('Owner sends own application',act(owner,action='request',meetingId=mid)[0],200)
expect('Another Star can also request',act(ordinary,action='request',meetingId=mid)[0],200)
expect('Application uses owner ID',[r['userId'] for r in data(owner)['registrations']],['admin-owner'])
expect('Star cannot confirm own application',act(owner,action='select',meetingId=mid,userId='admin-owner')[0],403)
expect('Selection remains manual',data(ela)['confirmedCounts'][mid],0)
expect('Ela sees owner profile',[p['languages'] for p in data(ela)['candidates'] if p['userId']=='admin-owner'],[['Español']])
star_calendar=call(owner,'/api/calendar/connection',{'action':'create'})[1]
expect('Calendars are separate by active role',star_calendar['id']==admin_calendar['id'],False)
expect('Star feed excludes unconfirmed meeting',shared['meetings'][0]['schoolName'] in feed(star_calendar),False)
expect('Ela can manually confirm the owner',act(ela,action='select',meetingId=mid,userId='admin-owner')[0],200)
expect('A second Star cannot be confirmed',act(isa,action='select',meetingId=mid,userId=member['account']['id'])[0],409)
confirmed=data(owner)
expect('Owner receives meeting access',next(m for m in confirmed['meetings'] if m['id']==mid)['joinUrl'],'https://example.com/sala-privada')
expect('Star calendar only includes selected meeting',shared['meetings'][0]['schoolName'] in feed(star_calendar),True)
expect('Star calendar hides unrelated meeting',shared['meetings'][1]['schoolName'] in feed(star_calendar),False)
expect('Star cannot revoke admin calendar',call(owner,'/api/calendar/connection',{'action':'revoke','id':admin_calendar['id'],'version':admin_calendar['version']})[0],409)
expect('Owner returns to administration',switch(owner,'admin')[0],200)
restored=data(owner)
expect('Administrative access restored',restored['user']['role'],'admin')
expect('Shared drafts remain available',len(restored['publications']),2)
expect('Own application remains saved',restored['confirmedCounts'][mid],1)
expect('Original admin calendar remains',call(owner,'/api/calendar/connection')[1]['id'],admin_calendar['id'])
expect('Admin can return to Star mode',switch(owner,'star')[0],200)
expect('Own saved profile survives role switches',data(owner)['profile']['availability'],'Disponibilidad ficticia de prueba.')
print(f'{len(checks)} owner-role checks passed: shared administration, same-identity participation, guarded switching, manual selection, profile retention and separate calendar permissions.')
