"""Exercise lost-update protection on an isolated local demonstration database."""
import concurrent.futures,http.cookiejar,json,sys,urllib.error,urllib.parse,urllib.request
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3006'
assert urllib.parse.urlsplit(BASE).hostname=='127.0.0.1'
checks=[]
def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(person,body):
 req=urllib.request.Request(BASE+'/api/action',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'},method='POST')
 try:
  with person.open(req) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as error:return error.code,json.load(error)
def login(name):
 person=client();req=urllib.request.Request(BASE+'/api/auth',data=json.dumps({'email':name+'@example.com','password':'Demo2026!'}).encode(),headers={'Content-Type':'application/json'})
 with person.open(req) as response:assert response.status==200
 return person
def data(person):
 with person.open(BASE+'/api/data') as response:return json.load(response)
def expect(name,value,expected):
 assert value==expected,(name,value,expected)
 checks.append(name)
isa,ela,host,other_host,star=[login(name) for name in ['isa','ela','host','diego','star']]
draft={'action':'create','schoolName':'Colegio ficticio · Colaboración','date':'2030-07-20','time':'18:00','hostId':'host-1','joinUrl':'https://example.com/sala','editVersion':9999}
expect('Isa creates a meeting',call(isa,draft)[0],200)
meeting=next(m for m in data(ela)['meetings'] if m.get('schoolName')==draft['schoolName']);mid=meeting['id']
expect('The server assigns the initial revision',meeting['editVersion'],1)
def current():return next(m for m in data(isa)['meetings'] if m['id']==mid)
edit={**draft,'action':'meeting_edit','meetingId':mid,'expectedVersion':1,'program':'Orlando'}
expect('Ela saves the first revision',call(ela,edit)[0],200)
expect('Saved revision increases',current()['editVersion'],2)
notices=len(data(host)['notifications'])
expect('Isa cannot overwrite Ela with an old form',call(isa,{**edit,'program':'Tokio'})[0],409)
expect('Ela programme remains saved',current()['program'],'Orlando')
expect('Rejected edit sends no notification',len(data(host)['notifications']),notices)
expect('Assigned host saves against the current version',call(host,{'action':'meeting_update','meetingId':mid,'expectedVersion':2,'hostNote':'Indicaciones ficticias actualizadas.','joinUrl':'https://example.com/nueva-sala'})[0],200)
expect('Host changes also advance the revision',current()['editVersion'],3)
expect('Old admin form cannot erase host instructions',call(ela,{**edit,'expectedVersion':2,'hostNote':'Texto anterior'})[0],409)
expect('Host instructions survive',current()['hostNote'],'Indicaciones ficticias actualizadas.')
expect('Host link survives',current()['joinUrl'],'https://example.com/nueva-sala')
for action in ['meeting_edit','meeting_update','status']:
 body={**edit,'action':action,'hostNote':'Texto ficticio de prueba.','joinUrl':'https://example.com/sala','status':'live'};body.pop('expectedVersion')
 expect('Missing version rejected for '+action,call(isa,body)[0],409)
 for value in ['3',None,-1,1.5]:expect('Malformed revision rejected for '+action,call(isa,{**body,'expectedVersion':value})[0],400)
expect('Invalid requests do not change revision',current()['editVersion'],3)
expect('An old status decision cannot change state',call(isa,{'action':'status','meetingId':mid,'status':'live','expectedVersion':2})[0],409)
expect('Fresh status change accepted',call(isa,{'action':'status','meetingId':mid,'status':'live','expectedVersion':3})[0],200)
expect('State change advances version',current()['editVersion'],4)
expect('Old host edit cannot overwrite a newer status',call(host,{'action':'meeting_update','meetingId':mid,'expectedVersion':3,'hostNote':'Texto antiguo','joinUrl':'https://example.com/viejo'})[0],409)
expect('New meeting state remains live',current()['status'],'live')
expect('Restore scheduled with latest version',call(ela,{'action':'status','meetingId':mid,'status':'scheduled','expectedVersion':4})[0],200)
expect('No-op status accepted',call(isa,{'action':'status','meetingId':mid,'status':'scheduled','expectedVersion':5})[0],200)
expect('No-op status does not change version',current()['editVersion'],5)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 futures=[pool.submit(call,person,{**edit,'expectedVersion':5,'program':programme}) for person,programme in [(isa,'Orlando'),(ela,'Tokio')]]
 results=[future.result()[0] for future in futures]
expect('Concurrent writers produce one save and one conflict',sorted(results),[200,409])
expect('Only one racing edit was recorded',current()['editVersion'],6)
expect('Losing writer emits no duplicate notification',len(data(host)['notifications']),notices+3)
for person,label in [(star,'Star'),(other_host,'unassigned host')]:
 for action in ['meeting_edit','meeting_update','status']:
  expect(label+' cannot bypass permissions with a matching version',call(person,{**edit,'action':action,'expectedVersion':6,'status':'cancelled','hostNote':'No permitido'})[0],403)
expect('Meeting count and applications remain unaffected',data(isa)['confirmedCounts'][mid],0)
legacy=next(m for m in data(isa)['meetings'] if m['id']=='m1')
expect('Legacy meeting begins without version metadata',legacy.get('editVersion',0),0)
expect('Legacy meeting can be edited safely with version zero',call(isa,{**edit,'meetingId':'m1','expectedVersion':0,'schoolName':'Colegio ficticio · Legado'})[0],200)
expect('Legacy meeting now has a version',next(m for m in data(isa)['meetings'] if m['id']=='m1')['editVersion'],1)
print(f'{len(checks)} collaboration checks passed: no lost updates, concurrent writes, host changes, state transitions, permissions, legacy meetings and notification rollback.')
