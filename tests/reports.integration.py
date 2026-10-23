"""Run against a separate, fresh demo database: python3 tests/reports.integration.py http://127.0.0.1:3001"""
import concurrent.futures, datetime, http.cookiejar, json, sys, urllib.error, urllib.request, uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3001'
passed=[]
def call(client,path,body=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
 try:
  with client.open(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def login(email=None):
 client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 if email:assert call(client,'/api/auth',{'email':email,'password':'Demo2026!'})[0]==200
 return client
def data(client):return call(client,'/api/data')[1]
def action(client,**body):return call(client,'/api/action',body)
def expect(name,actual,expected):
 assert actual==expected,(name,actual,expected)
 passed.append(name)
star,star2,other,host,admin,anon=[login(email) for email in ['star@demo.coded','star@demo.coded','valentina@demo.coded','host@demo.coded','admin@demo.coded',None]]
payload={'action':'report','meetingId':'m5','scenario':'no_turn','families':'no','issues':[],'comment':'Entré y estuve disponible, pero no recibí la palabra.'}
expect('Anonymous cannot report',call(anon,'/api/action',payload)[0],401)
expect('Only assigned Star can report',call(other,'/api/action',payload)[0],403)
expect('Admin cannot answer on behalf of a participant',call(admin,'/api/action',payload)[0],403)
expect('Reports rejected before meeting end',action(host,action='report',meetingId='m1',meetingHeld='yes',scenario='shared',families='yes',issues=[])[0],400)
expect('Unknown scenario rejected',call(star,'/api/action',{**payload,'scenario':'toString'})[0],400)
expect('Star must specify own participation',call(star,'/api/action',{**payload,'scenario':'unknown'})[0],400)
expect('Contradictory families rejected',call(star,'/api/action',{**payload,'families':'yes','issues':['no_families']})[0],400)
expect('Contradictory turn rejected',call(star,'/api/action',{**payload,'scenario':'shared','issues':['no_turn']})[0],400)
expect('Unknown issue rejected',call(star,'/api/action',{**payload,'issues':['anything']})[0],400)
expect('Comment bound enforced',call(star,'/api/action',{**payload,'comment':'a'*1001})[0],400)
expect('Star cannot claim not-applicable family attendance',call(star,'/api/action',{**payload,'families':'not_applicable'})[0],400)
expect('Invalid reports leave no records',len(data(admin)['reports']),0)
with concurrent.futures.ThreadPoolExecutor(2) as pool:
 futures=[pool.submit(call,client,'/api/action',{**payload,'role':'host','userId':'star-2'}) for client in [star,star2]]
expect('One concurrent report is accepted',sorted(f.result()[0] for f in futures),[200,409])
report=data(star)['reports'][0]
expect('Reporter identity comes from session',report['userId'],'star-1')
expect('Reporter role comes from session',report['role'],'star')
expect('Connection is recorded separately',report['starJoined'],'yes')
expect('Not speaking does not become absence',report['testimony'],'no')
expect('Lack of opportunity is explicit',report['wasInvited'],'no')
expect('Host cannot read Star private result',data(host)['reports'],[])
expect('Other Star cannot read result',data(other)['reports'],[])
expect('Coordination receives situation notice',any('seguimiento' in n['title'] for n in data(admin)['notifications']),True)
expect('Host cannot mark coordination review',action(host,action='review_report',meetingId='m5',note='Reviewed by host')[0],403)
expect('Star cannot mark coordination review',action(star,action='review_report',meetingId='m5',note='Reviewed by student')[0],403)
expect('Empty review is rejected',action(admin,action='review_report',meetingId='m5',note=' ')[0],400)
expect('Admin records first review',action(admin,action='review_report',meetingId='m5',note='Hablaremos con el host para entender lo ocurrido.')[0],200)
first_review=next(r for r in data(admin)['reportReviews'] if r['meetingId']=='m5')
expect('Review references the report that was read',first_review['reportIds'],[report['id']])
expect('Host may submit different account',action(host,action='report',meetingId='m5',meetingHeld='yes',scenario='shared',families='yes',issues=[],comment='El Star compartió su testimonio.')[0],200)
expect('Host duplicate is rejected',action(host,action='report',meetingId='m5',meetingHeld='yes',scenario='shared',families='yes',issues=[])[0],409)
expect('Star only sees own report',len(data(star)['reports']),1)
expect('Host only sees own report',len(data(host)['reports']),1)
expect('Coordination sees both reports',len(data(admin)['reports']),2)
expect('Coordination receives conflicting-response notice',any(n['title']=='Resultados por contrastar' for n in data(admin)['notifications']),True)
review=next(r for r in data(admin)['reportReviews'] if r['meetingId']=='m5')
expect('Previous review note remains intact',review['note'],first_review['note'])
expect('New response is not silently marked reviewed',len(review['reportIds']),1)
expect('Admin can record follow-up after both accounts',action(admin,action='review_report',meetingId='m5',note='Revisamos ambas versiones con el host y el Star; acordamos reservar un turno claro.')[0],200)
expect('Updated follow-up references both reports',len(next(r for r in data(admin)['reportReviews'] if r['meetingId']=='m5')['reportIds']),2)
expect('Review never changes original Star report',data(star)['reports'][0]['wasInvited'],'no')
expect('Private coordination notes not sent to Star',data(star)['reportReviews'],[])
expect('Private coordination notes not sent to host',data(host)['reportReviews'],[])
# A meeting explicitly closed by coordination does not itself imply attendance.
title='JDP · Cierre '+uuid.uuid4().hex[:8]
future=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=3)).isoformat()
expect('Create a fresh meeting',action(admin,action='create',hostId='host-1',title=title,program='Orlando',startsAt=future,language='Español')[0],200)
mid=next(m['id'] for m in data(admin)['meetings'] if m['title']==title)
action(star,action='request',meetingId=mid);action(admin,action='select',meetingId=mid,userId='star-1')
expect('Marking completed creates no report',action(admin,action='status',meetingId=mid,status='completed')[0],200)
expect('Closing never infers attendance',len([r for r in data(admin)['reports'] if r['meetingId']==mid]),0)
expect('Host may report meeting was not held',action(host,action='report',meetingId=mid,meetingHeld='no',families='yes',issues=['cancelled'])[0],200)
r=next(r for r in data(host)['reports'] if r['meetingId']==mid)
expect('No meeting does not label Star absent',r['starJoined'],'not_applicable')
expect('No meeting does not invent a testimony outcome',r['testimony'],'not_applicable')
expect('No meeting does not claim family absence',r['families'],'not_applicable')
print('Passed '+str(len(passed))+' report checks: privacy, concurrency, truthful outcomes, independent perspectives and coordination follow-up.')
