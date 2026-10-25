"""Run only on an isolated demo database."""
import http.cookiejar,json,sys,urllib.error,urllib.request,uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3001'
assert '127.0.0.1:3001' in BASE,'Use the isolated local test server.'
checks=[]
def call(c,path,body=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
 try:
  with c.open(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def login(email):
 c=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 assert call(c,'/api/auth',{'email':email+'@example.com','password':'Demo2026!'})[0]==200
 return c
def data(c):return call(c,'/api/data')[1]
def action(c,**body):return call(c,'/api/action',body)
def expect(name,value,expected):
 assert value==expected,(name,value,expected)
 checks.append(name)
isa,ela,host,otherhost,alex,valentina=[login(n) for n in ['isa','ela','host','diego','star','valentina']]
school='Tokyo School · Ejemplo '+uuid.uuid4().hex[:6]
base={'action':'create','schoolName':school,'date':'2027-01-15','time':'18:00','sourceTimeZone':'America/New_York','joinUrl':'https://example.com/jdp-reservada'}
expect('Register only the calendar fields',call(isa,'/api/action',base)[0],200)
m=next(m for m in data(ela)['meetings'] if m.get('schoolName')==school);mid=m['id']
for key,value in [('title',school),('startsAt','2027-01-15T23:00:00.000Z'),('sourceTimeZone','America/New_York'),('program',''),('language',''),('description',''),('duration',None),('hostId',''),('host','')]:expect('Saved '+key,m[key],value)
expect('No default host access',any(x['id']==mid for x in data(host)['meetings']),False)
expect('Unassigned host cannot write',action(host,action='meeting_update',meetingId=mid,hostNote='No permitido',joinUrl='')[0],403)
for c in [alex,valentina]:
 expect('Star finds school',next(x for x in data(c)['meetings'] if x['id']==mid)['schoolName'],school)
 expect('Link private before selection',next(x for x in data(c)['meetings'] if x['id']==mid).get('joinUrl'),None)
 expect('Request with no programme or language',action(c,action='request',meetingId=mid)[0],200)
expect('Two applications',len([r for r in data(isa)['registrations'] if r['meetingId']==mid]),2)
expect('Never automatically select',data(isa)['confirmedCounts'][mid],0)
expect('No duplicate requests',action(alex,action='request',meetingId=mid)[0],409)
for c in [alex,host]:expect('Only admin selects',action(c,action='select',meetingId=mid,userId='star-1')[0],403)
edit={**base,'action':'meeting_edit','meetingId':mid,'hostId':'host-1','language':'English'}
expect('Configure host and language later',call(ela,'/api/action',edit)[0],200)
expect('Programme stays absent',next(x for x in data(isa)['meetings'] if x['id']==mid)['program'],'')
expect('Configured language',next(x for x in data(host)['meetings'] if x['id']==mid)['language'],'English')
expect('Other host excluded',any(x['id']==mid for x in data(otherhost)['meetings']),False)
expect('Pending applicants private from host',[r for r in data(host)['registrations'] if r['meetingId']==mid],[])
expect('Manual confirmation',action(isa,action='select',meetingId=mid,userId='star-1')[0],200)
expect('Exactly one confirmed',data(isa)['confirmedCounts'][mid],1)
expect('Second confirmation rejected',action(ela,action='select',meetingId=mid,userId='star-2')[0],409)
expect('Host sees selected Star only',[r['userId'] for r in data(host)['registrations'] if r['meetingId']==mid],['star-1'])
expect('Host sees no criteria',data(host)['criteria'],{})
expect('Confirmed participant gets link',next(x for x in data(alex)['meetings'] if x['id']==mid)['joinUrl'],base['joinUrl'])
expect('Other applicant has no link',next(x for x in data(valentina)['meetings'] if x['id']==mid).get('joinUrl'),None)
expect('School name unchanged in notices',any(school in n['body'] for n in data(alex)['notifications'] if n['meetingId']==mid),True)
expect('Selected participant cancels',action(alex,action='cancel',meetingId=mid)[0],200)
expect('Cancellation never auto-promotes',data(ela)['confirmedCounts'][mid],0)
expect('Other application returns to review',next(r for r in data(ela)['registrations'] if r['meetingId']==mid and r['userId']=='star-2')['status'],'pending')
expect('Manual reassignment',action(ela,action='select',meetingId=mid,userId='star-2')[0],200)
expect('Host sees reassigned participant',[r['userId'] for r in data(host)['registrations'] if r['meetingId']==mid],['star-2'])
report={'action':'report','meetingId':mid,'scenario':'no_turn','families':'yes','issues':['connection'],'comment':'Ejemplo ficticio: entré, pero no tuve oportunidad de hablar.'}
expect('No reporting before closure',call(valentina,'/api/action',report)[0],400)
expect('Explicit completion without guessed duration',action(host,action='status',meetingId=mid,status='completed')[0],200)
expect('Closure implies no attendance',[r for r in data(ela)['reports'] if r['meetingId']==mid],[])
expect('Student reports actual outcome',call(valentina,'/api/action',report)[0],200)
r=next(r for r in data(ela)['reports'] if r['meetingId']==mid)
for key,value in [('starJoined','yes'),('wasInvited','no'),('testimony','no'),('families','yes'),('issues',['connection'])]:expect('Reported '+key,r[key],value)
expect('Former participant cannot report',call(alex,'/api/action',report)[0],403)
expect('No duplicate report',call(valentina,'/api/action',report)[0],409)
expect('Student report private from host',[r for r in data(host)['reports'] if r['meetingId']==mid],[])
expect('Coordination reviews',action(ela,action='review_report',meetingId=mid,note='Revisaremos con el anfitrión lo ocurrido en esta prueba.')[0],200)
summer={**base,'schoolName':school+' verano','date':'2027-07-15'}
expect('Summer registration',call(isa,'/api/action',summer)[0],200)
expect('Summer offset',next(x for x in data(isa)['meetings'] if x.get('schoolName')==summer['schoolName'])['startsAt'],'2027-07-15T22:00:00.000Z')
for changes in [{'date':'2027-03-14','time':'02:30'},{'date':'2027-11-07','time':'01:30'},{'sourceTimeZone':'UTC'},{'schoolName':''},{'schoolName':{}},{'joinUrl':'http://example.com/'},{'program':[]}]:expect('Invalid calendar fields rejected '+str(changes),call(isa,'/api/action',{**base,**changes})[0],400)
expect('Star cannot create',call(alex,'/api/action',base)[0],403)
print(f'{len(checks)} comprobaciones correctas: Orlando, datos opcionales, selección, reasignación, permisos y seguimiento.')
