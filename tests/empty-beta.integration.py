"""Run only with CODED_SEED_EXAMPLES=false on a fresh, disposable local database."""
import http.cookiejar,json,os,sys,urllib.error,urllib.parse,urllib.request,uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3006'
assert urllib.parse.urlsplit(BASE).hostname=='127.0.0.1'
assert os.environ.get('CODED_SEED_EXAMPLES')=='false'
checks=[]
def call(client,path,body=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
 try:
  with client.open(req) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as error:return error.code,json.load(error)
def expect(name,value,expected):
 assert value==expected,(name,value,expected)
 checks.append(name)
def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def login(name):
 result=client();status,body=call(result,'/api/auth',{'email':name+'@example.com','password':'Demo2026!'})
 expect(name+' can enter',status,200);expect(name+' remains admin',body['user']['role'],'admin')
 return result
def data(person):
 status,body=call(person,'/api/data');expect('Data remains available',status,200)
 return body
isa,ela=login('isa'),login('ela')
empty_fields=['meetings','registrations','publications','notifications','questions','reports','reportReviews','feedback','candidates','assignedStars','hosts','accounts','betaContributions']
for person in [isa,ela]:
 first=data(person)
 for field in empty_fields:expect('Empty '+field,first[field],[])
 expect('Only staff administration remains',{item['id'] for item in first['team']},{'admin-isa','admin-ela'})
 expect('Statistics start at zero',set(first['stats'].values()),{0})
 expect('Empty beta is not a production activation',first['workspace'],'beta')
 expect('Real-account registration stays disabled',first['accountPolicy']['allowReal'],False)
for name in ['admin','star','valentina','host','diego']:
 expect('Sample identity cannot enter: '+name,call(client(),'/api/auth',{'email':name+'@example.com','password':'Demo2026!'})[0],401)
for person,name in [(isa,'Isa'),(ela,'Ela')]:
 draft={'action':'create','schoolName':'Colegio ficticio '+name+' '+uuid.uuid4().hex[:6],'date':'2030-07-20','time':'18:00','joinUrl':'https://example.com/sala'}
 expect(name+' creates a JDP',call(person,'/api/action',draft)[0],200)
 expect(name+' creates a publication',call(person,'/api/action',{'action':'publication_save','title':'Novedad ficticia '+name,'body':'Contenido de prueba para verificar la colaboración del equipo.','audience':'all','status':'published'})[0],200)
for person in [isa,ela]:
 saved=data(person)
 expect('Both see both new meetings',len(saved['meetings']),2)
 expect('Both see both new publications',len(saved['publications']),2)
 expect('No samples reappear during saves',saved['candidates'],[])
 expect('No automatic applications',saved['registrations'],[])
 expect('No invented optional programme',all(meeting['program']=='' for meeting in saved['meetings']),True)
expect('Anonymous cannot add data',call(client(),'/api/action',{'action':'create'})[0],401)
print(f'{len(checks)} empty-beta checks passed: zero records, preserved administrators, shared additions, no sample login and no real-account activation.')
